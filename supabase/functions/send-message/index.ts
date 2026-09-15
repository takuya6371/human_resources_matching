// ============================================================
// supabase/functions/send-message/index.ts
//
// The only way a chat message reaches the database. The client never
// inserts into `messages` directly (RLS revokes it) so that tier-1
// moderation cannot be bypassed from the browser console — see
// docs/bridge-migration-plan.md "5 詳細設計".
//
// screen() is imported from src/lib/moderation.ts verbatim — the same
// code the client runs for instant feedback before sending. Do not
// fork it into two copies.
//
// Deploy:
//   supabase secrets set GEMINI_API_KEY=...   (shared with parse-cv)
//   supabase functions deploy send-message
// ============================================================

import { createClient } from "jsr:@supabase/supabase-js@2";
import { screen } from "../../../src/lib/moderation.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = Deno.env.get("GEMINI_MODERATION_MODEL") ?? "gemini-3.6-flash";

const MODERATION_PROMPT = `You moderate messages between a job candidate and a recruiter on a hiring platform called AfriTalent.

Flag a message only when it shares or requests contact details of any kind, or proposes continuing the conversation away from AfriTalent, however indirectly ("somewhere easier", "you know where to find me").

Do not flag ordinary recruiting talk: salaries, dates, times, headcounts, technologies, company locations, visa questions, or arranging an interview. Numbers that are years, money, versions or quantities are not contact details.

The obvious cases are caught before you see them. You are here for wording that slips past a pattern match. Judge intent, not vocabulary.

Reply with JSON only: {"flag": boolean, "category": "contact"|"offplatform"|"none", "confidence": 0-1, "reason": "one short sentence"}`;

// 保留時の通知文言。HANDOVER.mdの指示どおり、message-platform/app.jsの
// 文言をそのまま使う(「もっとも作り直しで失われやすい部分」のため)。
const HOLD_NOTICE_EN =
  "This conversation has been put on hold. A message looked like an attempt to move the " +
  "conversation off AfriTalent, which the platform does not allow — it is how people lose " +
  "the protection they signed up for. Trust & Safety have been notified and will review it.";
const HOLD_NOTICE_JA =
  "このやり取りは一時的に保留されました。プラットフォーム外へ移行しようとする内容が含まれていたためです。" +
  "運営チームが確認いたします。";

const isJa = (s: string) => /[぀-ヿ一-龯]/.test(s);

const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

interface ModelVerdict {
  verdict: "block" | "clear";
  categories: string[];
  reason: string;
}

// tier2。ルールが判断しきれなかった(needsModel)場合のみ呼ぶ。
// 温度0固定ではないため同一文言でも判定が変わりうるが、tier1で
// クリアした上での二段目のセーフティネットなので許容する。
async function callModerate(text: string): Promise<ModelVerdict> {
  if (!GEMINI_API_KEY) return { verdict: "clear", categories: [], reason: "" };
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GEMINI_API_KEY}` },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        temperature: 0,
        max_completion_tokens: 400,
        reasoning_effort: "low",
        messages: [
          { role: "system", content: MODERATION_PROMPT },
          { role: "user", content: String(text).slice(0, 1200) },
        ],
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const out = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    return {
      verdict: out.flag ? "block" : "clear",
      categories: out.flag ? [out.category === "contact" ? "contact" : "intent"] : [],
      reason: out.reason || "",
    };
  } catch {
    // フェイルオープン: tier1は既にクリアしている。モデル呼び出しの
    // タイムアウトでメッセージを失う方が実害が大きい。
    return { verdict: "clear", categories: [], reason: "" };
  }
}

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

  const body = await req.json().catch(() => ({}));
  const threadId = String(body.threadId || "");
  const text = String(body.text || "").trim();
  if (!threadId || !text) return json({ error: "bad_request" }, 400);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: thread, error: threadErr } = await admin.from("threads").select("*").eq("id", threadId).single();
  if (threadErr) return json({ error: "thread_lookup_failed", detail: threadErr.message }, 500);
  if (!thread) return json({ error: "thread_not_found" }, 404);
  if (thread.talent_id !== user.id && thread.company_id !== user.id) {
    return json({ error: "forbidden" }, 403);
  }
  if (thread.status === "flagged") return json({ error: "thread_flagged" }, 403);

  // このスレッドでの送信者本人の直近4件(古い順)。分割送信された
  // 電話番号の検知に使う。
  const { data: recentRows } = await admin
    .from("messages")
    .select("text")
    .eq("thread_id", threadId)
    .eq("from_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(4);
  const recent = (recentRows ?? []).map(r => r.text as string).reverse();

  const result = screen(text, { recent });

  if (result.verdict === "block") {
    const strikeCount = (thread.strike_count ?? 0) + 1;
    await admin.from("thread_flags").insert({
      thread_id: threadId, verdict: "block", categories: result.categories, reason: result.reason,
    });
    if (strikeCount >= 3) {
      await admin.from("threads").update({
        status: "flagged",
        strike_count: strikeCount,
        flagged_by: "rules",
        flagged_category: result.categories[0] ?? null,
        flagged_quote: text,
        flagged_reason: result.reason,
        flagged_at: new Date().toISOString(),
      }).eq("id", threadId);
      await admin.from("messages").insert({
        thread_id: threadId, from_user_id: null, kind: "held", text: HOLD_NOTICE_EN, translation: HOLD_NOTICE_JA,
      });
    } else {
      await admin.from("threads").update({ strike_count: strikeCount }).eq("id", threadId);
    }
    return json({ error: "blocked", reason: result.reason, strikeCount }, 400);
  }

  const { data: inserted, error: insertErr } = await admin
    .from("messages")
    .insert({ thread_id: threadId, from_user_id: user.id, kind: "chat", text })
    .select()
    .single();
  if (insertErr || !inserted) return json({ error: "insert_failed" }, 500);

  // 配信を優先し、翻訳とtier2判定はレスポンスを返したあとに続ける
  // (bridgeの元実装と同じく「まず届ける」設計を踏襲)。
  const finishInBackground = async () => {
    try {
      const target = isJa(text) ? "en" : "ja";
      const tRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ texts: [text], target }),
      });
      const tJson = await tRes.json().catch(() => null);
      const translated = tJson?.translations?.[0];
      if (translated) {
        await admin.from("messages").update({ translation: translated }).eq("id", inserted.id);
      }
    } catch {
      // 翻訳は付加価値なので、失敗しても配信済みメッセージはそのまま残す
    }

    if (result.needsModel) {
      const modelVerdict = await callModerate(text);
      if (modelVerdict.verdict === "block") {
        await admin.from("thread_flags").insert({
          thread_id: threadId, verdict: "review", categories: modelVerdict.categories, reason: modelVerdict.reason,
        });
        await admin.from("threads").update({
          status: "flagged",
          flagged_by: "model",
          flagged_category: modelVerdict.categories[0] ?? "intent",
          flagged_quote: text,
          flagged_reason: modelVerdict.reason || "Proposes moving the conversation off AfriTalent.",
          flagged_at: new Date().toISOString(),
        }).eq("id", threadId);
        await admin.from("messages").insert({
          thread_id: threadId, from_user_id: null, kind: "held", text: HOLD_NOTICE_EN, translation: HOLD_NOTICE_JA,
        });
      }
    }
  };

  // @ts-ignore -- EdgeRuntime is provided by the Supabase Deno runtime, not by the Deno standard lib types
  if (typeof EdgeRuntime !== "undefined") {
    // @ts-ignore
    EdgeRuntime.waitUntil(finishInBackground());
  } else {
    await finishInBackground();
  }

  return json({ message: inserted });
});
