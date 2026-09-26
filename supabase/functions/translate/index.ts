// Gemini を使って翻訳を行うEdge Function（旧: Azure Translator）。
//
// フロントの「保存時に日本語欄が空なら英語から自動翻訳して埋める」機能と、
// メッセージング機能の「メッセージ単位の翻訳表示」から呼ばれる。
// APIキーをクライアントに渡さないよう、実際のGemini呼び出しはこの関数の中でのみ行う。
//
// 必須のSupabase Secrets:
//   GEMINI_API_KEY   parse-cv / send-message と共有
//
// verify_jwt はデフォルトで有効（config.tomlで個別設定していない場合）。
// ログイン済みユーザー（またはsend-messageからのservice role呼び出し）のみが
// 呼び出せる状態を維持し、無料枠を第三者に消費されるのを防ぐ。

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const MODEL = Deno.env.get("GEMINI_TRANSLATE_MODEL") ?? "gemini-3.6-flash";

const MAX_TEXTS = 20;
const MAX_TEXT_LENGTH = 5000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LANG_NAMES: Record<string, string> = {
  ja: "Japanese",
  en: "English",
  fr: "French",
};

interface RequestBody {
  texts: string[];
  target?: string; // デフォルト 'ja'
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!GEMINI_API_KEY) return json({ error: "missing_gemini_key" }, 500);

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }

  const texts = (body.texts ?? []).filter(t => typeof t === "string" && t.trim().length > 0);
  const target = body.target ?? "ja";

  if (texts.length === 0) return json({ translations: [] });
  if (texts.length > MAX_TEXTS || texts.some(t => t.length > MAX_TEXT_LENGTH)) {
    return json({ error: "テキストが長すぎるか件数が多すぎます" }, 400);
  }

  const targetName = LANG_NAMES[target] ?? target;

  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GEMINI_API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              `You are a translation engine. You receive a JSON array of texts in mixed, ` +
              `auto-detected languages. Translate each one into ${targetName}. If a text is ` +
              `already in ${targetName}, return it unchanged. Preserve line breaks and formatting. ` +
              `Return exactly one translation per input text, in the same order. Do not add ` +
              `commentary, quotes, or explanations.`,
          },
          { role: "user", content: JSON.stringify(texts) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "translations",
            strict: true,
            schema: {
              type: "object",
              properties: { translations: { type: "array", items: { type: "string" } } },
              required: ["translations"],
              additionalProperties: false,
            },
          },
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return json({ error: `Gemini error: ${detail}` }, 502);
    }

    const data = await res.json();
    const parsed = JSON.parse(data.choices[0].message.content) as { translations?: string[] };
    const translations = parsed.translations ?? [];
    if (translations.length !== texts.length) {
      return json({ error: "translation_count_mismatch" }, 502);
    }

    return json({ translations });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
