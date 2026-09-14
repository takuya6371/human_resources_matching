// ============================================================
// supabase/functions/verification-status/index.ts
//
// What the browser polls after the candidate finishes the Didit flow.
//
// The SDK's onComplete and the callback redirect both say "the user got to the
// end", which is not the same as "the user passed" — a declined check also
// reaches the end. So the browser asks here, and here asks the database, which
// only the webhook can write.
//
// If the webhook has not landed yet (it usually beats the redirect, but not
// always) this falls back to reading the session from Didit directly, so the
// interface is never stuck on "checking" because of a race.
//
//   supabase functions deploy verification-status
// ============================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

const DIDIT_API_KEY = Deno.env.get("DIDIT_API_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const MAPPED: Record<string, string> = {
  "Approved": "verified", "Declined": "failed",
  "Kyc Expired": "unverified", "Expired": "unverified", "Abandoned": "unverified",
  "Not Started": "pending", "In Progress": "pending", "Awaiting User": "pending",
  "In Review": "pending", "Resubmitted": "pending",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return json({ error: "unauthorized" }, 401);

  // The webhook is the source of truth, so try the database first.
  const { data: profile } = await supabase
    .from("profiles")
    .select("verification_status, verification_detail, verified_at, verification_ref")
    .eq("id", user.id).single();

  if (profile && profile.verification_status !== "pending") {
    return json({
      status: profile.verification_status,
      detail: profile.verification_detail,
      at: profile.verified_at,
      by: "webhook",
    });
  }

  // Still pending. Ask Didit directly rather than leaving the page spinning —
  // this is a read, and the webhook remains what actually writes the profile.
  const sessionId = profile?.verification_ref;
  if (sessionId && DIDIT_API_KEY) {
    const r = await fetch(`https://verification.didit.me/v3/session/${sessionId}/decision/`, {
      headers: { "x-api-key": DIDIT_API_KEY },
    });
    if (r.ok) {
      const decision = await r.json();
      const live = String(decision.status ?? "");
      return json({ status: MAPPED[live] ?? "pending", detail: live, by: "poll" });
    }
  }

  return json({ status: "pending", detail: profile?.verification_detail ?? null, by: "db" });
});
