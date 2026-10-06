// ============================================================
// supabase/functions/start-verification/index.ts
//
// Opens a Didit KYC session and hands the browser a URL to send the
// candidate to. The API key stays here; the ID document never touches
// NeBonga Link at all.
//
// Deploy:
//   supabase secrets set DIDIT_API_KEY=...
//   supabase functions deploy start-verification
//
// The workflow id is NOT a secret and NOT an env var — it is per-session
// configuration, so it lives in code where you can see which workflow a
// session was created against.
// ============================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

const DIDIT_API_KEY = Deno.env.get("DIDIT_API_KEY")!;
const DIDIT_URL = "https://verification.didit.me/v3/session/";

// "Free KYC" — document OCR, liveness, face match.
const WORKFLOW_ID = Deno.env.get("DIDIT_WORKFLOW_ID") ?? "b298bbe5-267f-4af3-9107-11025cebb290";

// Where Didit returns the candidate after the flow. The redirect is a UI
// convenience only — the webhook decides whether they are verified.
const CALLBACK_URL = Deno.env.get("VERIFY_CALLBACK_URL") ?? "";

const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!DIDIT_API_KEY) return json({ error: "missing_didit_key" }, 500);

  // vendor_data must be OUR id for this person, taken from the session — never
  // from the request body, or anyone could start a session against someone
  // else's profile and have the webhook mark them verified.
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return json({ error: "unauthorized" }, 401);

  const body = await req.json().catch(() => ({}));

  const res = await fetch(DIDIT_URL, {
    method: "POST",
    headers: { "x-api-key": DIDIT_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      workflow_id: WORKFLOW_ID,
      vendor_data: user.id,
      ...(CALLBACK_URL ? { callback: CALLBACK_URL } : {}),
      ...(body.language ? { language: body.language } : {}),
      metadata: { surface: "nebonga-link-profile" },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    // 403 means the key is missing, wrong or revoked — there is no finer
    // discriminator, so say that plainly rather than guessing.
    return json({
      error: res.status === 403 ? "didit_key_rejected" : "session_create_failed",
      detail: detail.slice(0, 500),
    }, 502);
  }

  const session = await res.json();

  // Mark it in flight. The trigger blocks the client from writing this, so it
  // goes through the service role.
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  // verification_status is on `profiles` (companies may see that a candidate is
  // verified). The provider name and the session id identify a person to an
  // outside service, so 20260924000000 moved them to `profile_private`, which
  // only the candidate and admins can read.
  await admin.from("profiles").update({
    verification_status: "pending",
  }).eq("id", user.id);
  await admin.from("profile_private").update({
    verification_provider: "didit",
    verification_ref: session.session_id,
  }).eq("id", user.id);

  // Only what the browser needs. session_token is for native SDKs and is not
  // sent here.
  return json({ url: session.url, session_id: session.session_id });
});
