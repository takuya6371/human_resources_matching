// ============================================================
// supabase/functions/moderate-thread/index.ts
//
// Admin actions on a flagged thread: release (with or without a
// warning) and wipe (delete all messages, keep the thread open).
// Both need to write to `messages`/`threads` columns that clients
// cannot touch directly (service role only, see 20260915000000 /
// 20260916000000 migrations), so they go through this function
// rather than the client SDK even though the caller is an admin.
//
// docs/handover/HANDOVER.md flags these as "not built yet" — no
// prior implementation to port, designed fresh for this migration.
//
// Deploy:
//   supabase functions deploy moderate-thread
// ============================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const RELEASE_NOTICE = {
  plain: {
    en: "Trust & Safety have reviewed this conversation and reopened it. No further action needed.",
    ja: "運営チームの確認により、このやり取りを再開しました。対応は不要です。",
  },
  warning: {
    en: "Trust & Safety have reviewed this conversation and reopened it. Please keep everything about this role on AfriTalent — a second flag will pause the account, not just the thread.",
    ja: "運営チームの確認により、このやり取りを再開しました。今後もすべてのやり取りはプラットフォーム内でお願いいたします。",
  },
};

type Action = "release" | "release_warning" | "wipe";

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

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return json({ error: "forbidden" }, 403);

  const body = await req.json().catch(() => ({}));
  const threadId = String(body.threadId || "");
  const action = body.action as Action;
  if (!threadId || !["release", "release_warning", "wipe"].includes(action)) {
    return json({ error: "bad_request" }, 400);
  }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const clearFlags = {
    status: "open",
    strike_count: 0,
    flagged_by: null,
    flagged_category: null,
    flagged_quote: null,
    flagged_reason: null,
    flagged_at: null,
  };

  if (action === "wipe") {
    await admin.from("messages").delete().eq("thread_id", threadId);
    const { error } = await admin.from("threads").update(clearFlags).eq("id", threadId);
    if (error) return json({ error: "update_failed", detail: error.message }, 500);
    return json({ ok: true });
  }

  const notice = action === "release_warning" ? RELEASE_NOTICE.warning : RELEASE_NOTICE.plain;
  const { error: updateErr } = await admin.from("threads").update(clearFlags).eq("id", threadId);
  if (updateErr) return json({ error: "update_failed", detail: updateErr.message }, 500);
  await admin.from("messages").insert({
    thread_id: threadId, from_user_id: null, kind: "released", text: notice.en, translation: notice.ja,
  });
  return json({ ok: true });
});
