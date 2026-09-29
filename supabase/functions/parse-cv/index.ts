// ============================================================
// supabase/functions/parse-cv/index.ts
//
// CV -> structured JSON via Gemini structured outputs.
// Follows the same shape as the existing `translate` function.
//
// Deploy:
//   supabase secrets set GEMINI_API_KEY=AIza...
//   supabase functions deploy parse-cv
//
// Call (from the React app, with the user's session):
//   const { data, error } = await supabase.functions.invoke('parse-cv', {
//     body: { storage_path: 'cvs/<uid>/<file>.pdf' }   // or { text: '...' }
//   })
//
// Notes
//  - Structured outputs cannot stream, so this returns a single JSON response.
//    Gemini Flash is quick, so a full CV is a couple of seconds.
//    Show staged progress in the UI rather than a spinner.
//  - The models are text-only. Scanned PDFs with no text layer are rejected
//    with needs_ocr:true so the client can route them to an OCR pass.
// ============================================================

import { createClient } from "jsr:@supabase/supabase-js@2";
import { extractText, getDocumentProxy } from "npm:unpdf@0.12.1";
import { encodeBase64 } from "jsr:@std/encoding@1/base64";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

// Gemini Flash: fast, long context, and takes json_schema with null unions.
// 2.5-flash is retired for new keys; 3.7-flash thinks far longer for no
// better extraction. 3.6-flash is what the API recommends in its place.
const MODEL = Deno.env.get("GEMINI_CV_MODEL") ?? "gemini-3.6-flash";

const MAX_BYTES = 8 * 1024 * 1024;   // 8 MB upload ceiling

// The tokens-per-minute limit counts the WHOLE request: prompt tokens PLUS
// whatever you reserve in max_completion_tokens. Only used to size requests so
// a long CV never reserves more than the account allows; your real limits are
// visible in AI Studio.
const TPM_LIMIT = Number(Deno.env.get("GEMINI_TPM_LIMIT") ?? 250000);
const TOK = (s: string) => Math.ceil(s.length / 3.7);   // ~3.7 chars/token, conservative
const OVERHEAD = 120;
// A full extraction of a dense CV is ~2,800 tokens of JSON before the model has
// reasoned about anything. Reserving less than MIN_OUT guarantees an object that
// stops partway and is rejected by the schema validation.
const MIN_OUT = 3000;
const MAX_OUT = 8000;
const SAFETY = 250;

// gpt-oss models reason before they answer, and those reasoning tokens come out
// of max_completion_tokens along with the JSON. At the default (medium) effort a
// large schema starves the output and the response ends mid-object. Extraction
// is transcription, not deduction, so low effort costs nothing here.
const REASONING_EFFORT = Deno.env.get("GEMINI_REASONING_EFFORT") ?? "low";

const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ------------------------------------------------------------
// Schema — strict mode requires every property listed in `required`
// and additionalProperties:false at every level. Optional values are
// type unions with "null".
// ------------------------------------------------------------
// Descriptions are accepted for readability but deliberately NOT sent: every
// schema token is charged against the TPM budget, and the system prompt already
// carries the extraction rules. This keeps the demo and production identical.
const S = (_d = "") => ({ type: "string" });
const SN = (_d = "") => ({ type: ["string", "null"] });
const IN_ = (_d = "") => ({ type: ["integer", "null"] });
const NN = (_d = "") => ({ type: ["number", "null"] });
const BN = (_d = "") => ({ type: ["boolean", "null"] });
const ARR = (items: unknown, _d = "") => ({ type: "array", items });
const obj = (properties: Record<string, unknown>) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

const CV_SCHEMA = obj({
  candidate: obj({
    full_name: S("Name exactly as written"),
    headline: SN("One-line professional identity. Compose one if absent."),
    summary: SN("2-3 sentence summary. Compose from the CV if absent."),
    email: SN(), phone: SN("E.164 if determinable"), links: ARR(S("Full URL")),
    city: SN(), country: SN("Country of residence"), country_code: SN("ISO 3166-1 alpha-2"),
    date_of_birth: SN("YYYY-MM-DD, only if the CV states it"),
    gender: { type: ["string", "null"], enum: ["male", "female", "other", null] },
    nationality: SN(), nationality_code: SN("ISO 3166-1 alpha-2 of the nationality"),
    address_line: SN("Street address as written"), postal_code: SN(),
  }),
  languages: ARR(obj({
    language: S("English name of the language"),
    cefr: { type: ["string", "null"], enum: ["A1", "A2", "B1", "B2", "C1", "C2", null] },
    jlpt: { type: ["string", "null"], enum: ["N1", "N2", "N3", "N4", "N5", null] },
    is_native: BN(),
  })),
  education: ARR(obj({
    institution: S(), degree: SN(), field_of_study: SN(),
    start_year: IN_(), end_year: IN_("null if ongoing"), is_ongoing: BN(),
  }), "Most recent first"),
  experience: ARR(obj({
    employer: S(), title: S(),
    employment_type: { type: "string", enum: ["full_time","part_time","contract","freelance","internship","volunteer","other"] },
    start_date: SN("YYYY-MM"), end_date: SN("YYYY-MM or null if current"), is_current: BN(),
    summary: SN(), achievements: ARR(S("One concrete accomplishment")),
    scale_note: SN("Users, volume, revenue, throughput"),
  }), "Most recent first"),
  skills: ARR(obj({
    name: S("As written"),
    canonical: S("Normalised: ReactJS and React.js both become React"),
  }), "Deduplicated under the canonical name"),
  certifications: ARR(obj({ name: S(), year: IN_() }), "Include JLPT"),
  projects: ARR(obj({ name: S(), description: SN(), url: SN() })),
  work_preferences: obj({
    open_to_remote: BN(), open_to_relocate: BN(),
    target_countries: ARR(S()), notice_period: SN(), desired_salary: SN("With currency"),
  }),
  derived: obj({
    total_years_experience: NN("Excluding internships, volunteering and overlap"),
    seniority: { type: ["string", "null"], enum: ["intern","junior","mid","senior","lead","principal", null] },
    primary_field: SN("e.g. Backend Engineering"),
    japanese_level: { type: ["string", "null"], enum: ["N1","N2","N3","N4","N5","none", null] },
    has_degree: BN("Completed tertiary degree — relevant to Japan visa eligibility"),
    career_gaps: ARR(obj({ from: S("YYYY-MM"), to: S("YYYY-MM"), months: { type: "integer" } }), "Gaps over 6 months"),
  }),
  extraction_meta: obj({
    source_language: S("ISO 639-1 code of the document's own language"),
    confidence: obj({ identity: NN("0-1"), experience: NN("0-1"), education: NN("0-1"), skills: NN("0-1") }),
    missing_fields: ARR(S("Dotted path")),
    warnings: ARR(S("A specific concern for the reviewer")),
  }),
});

// Gemini rejects "very large or deeply nested" schemas without naming a number,
// so this stays lean on principle rather than to a published limit.

const SYSTEM_PROMPT = `You extract structured data from CVs for a platform matching African professionals with Japanese companies.

WRITE THE OUTPUT IN ENGLISH. CVs arrive in French, Japanese and other languages; the profile is always English. Translate every piece of prose you produce — headline, summary, job titles, role summaries, achievements, skill names, field labels, availability. Keep proper nouns as they are written: people, employers, schools, cities, qualifications. Record the document's own language in extraction_meta.source_language.

GROUNDING
1. Extract only what the document supports. Never invent an employer, date, qualification or skill.
2. Absent values are null, and their dotted path goes in extraction_meta.missing_fields.
3. headline and summary may be composed by you from the CV's content. Everything else is grounded in the text.
4. date_of_birth, gender, nationality, address_line and postal_code are transcribed, never deduced: no gender from a name or photograph, no birth date worked back from an age. nationality_code is the exception — it is the ISO 3166-1 alpha-2 code for whatever nationality is stated, so "Ghanaian" and "ガーナ" both give GH. Nationality and country of residence are different questions; record each where it belongs.

SHAPE
5. Dates are YYYY-MM. A year alone becomes month 01. A current role has end_date null and is_current true.
6. Deduplicate skills hard: ReactJS, React.js and React are one entry, canonical "React". Include skills evident in the work history but absent from any skills list.
7. Every field with a list of allowed values must use one of them exactly — "other" where nothing fits, or null where permitted. An invented value loses the whole extraction.
8. Order experience and education most recent first. total_years_experience counts professional work only: exclude internships, volunteering, and time where two roles overlapped. career_gaps lists unexplained gaps over six months. phone is E.164 where the country is clear.

JUDGEMENT
9. Confidence scores are your honest assessment. Score dates low when they are ambiguous — a confident wrong answer is worse than a flagged uncertain one.
10. Warn about anything a reviewer should check: overlapping employment, unexplained gaps, inconsistent dates, unreadable sections, or a document that is not a CV.

Return only the JSON object.`;

// ------------------------------------------------------------
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

async function pdfToText(bytes: Uint8Array): Promise<string> {
  const doc = await getDocumentProxy(bytes);
  const { text } = await extractText(doc, { mergePages: true });
  return (text as string).trim();
}

// 紙のCVをその場で撮って登録する導線のための、画像からの文字起こし。
// クライアントにOCR（tesseract等）を載せる手もあるが、斜めから撮った紙・影・
// 日本語混在に弱く、会場でスマホ撮影という用途では精度が出ない。抽出に使うのと
// 同じGeminiに文字起こしだけさせ、以降のパイプラインはテキストと共通にする。
async function imageToText(bytes: Uint8Array, mime: string): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GEMINI_API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      messages: [{
        role: "user",
        content: [
          { type: "text", text:
            "Transcribe this CV exactly as printed, in its original language. Keep line breaks " +
            "and section headings. Do not translate, summarise, correct or add anything. " +
            "Output only the transcription." },
          { type: "image_url", image_url: { url: `data:${mime};base64,${encodeBase64(bytes)}` } },
        ],
      }],
    }),
  });

  if (!res.ok) {
    throw Object.assign(new Error(`gemini_${res.status}`), { status: res.status, detail: await res.text() });
  }
  const body = await res.json();
  return (body.choices[0]?.message?.content ?? "").trim();
}

// DOCX は ZIP の中の word/document.xml が本文。変換ライブラリは書式のために
// 重くなるが、ここで欲しいのは抽出モデルに渡す素のテキストだけなので、
// 段落・改行・タブに当たるタグだけ区切りに変え、残りのタグを落とす。
// 日本語の職務経歴書は表組みが多いが、セルの中身も同じ <w:p> なので拾える。
async function docxToText(bytes: Uint8Array): Promise<string> {
  const { unzip } = await import("npm:fflate@0.8.2");

  const files: Record<string, Uint8Array> = await new Promise((resolve, reject) =>
    unzip(bytes, (err: unknown, out: Record<string, Uint8Array>) => err ? reject(err) : resolve(out)));

  const doc = files["word/document.xml"];
  if (!doc) throw new Error("no_document_xml");

  return new TextDecoder().decode(doc)
    .replace(/<w:tab\b[^>]*\/>/g, "\t")
    .replace(/<w:br\b[^>]*\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Post-schema checks the model cannot guarantee. */
function validate(d: any): string[] {
  const p: string[] = [];
  if (!d?.candidate?.full_name) p.push("No name extracted");
  (d?.experience ?? []).forEach((e: any, i: number) => {
    if (e.start_date && e.end_date && e.end_date < e.start_date) p.push(`experience[${i}] ends before it starts`);
    if (e.start_date && !/^\d{4}-\d{2}$/.test(e.start_date)) p.push(`experience[${i}].start_date is not YYYY-MM`);
  });
  const seen = new Set<string>();
  (d?.skills ?? []).forEach((s: any) => {
    const k = String(s.canonical ?? s.name ?? "").toLowerCase();
    if (k && seen.has(k)) p.push(`Duplicate skill after normalisation: ${s.canonical}`);
    seen.add(k);
  });
  return p;
}

/** Size the request so prompt + reserved output fits one minute's TPM budget. */
function plan(text: string, schema: unknown = CV_SCHEMA) {
  const budget = TPM_LIMIT - SAFETY;
  const fixed = TOK(SYSTEM_PROMPT) + TOK(JSON.stringify(schema)) + OVERHEAD;
  const roomForText = Math.max(0, budget - fixed - MIN_OUT);
  let body = text;
  let truncated = false;
  if (TOK(body) > roomForText) {
    body = body.slice(0, Math.floor(roomForText * 3.7));
    truncated = true;
  }
  const promptTok = fixed + TOK(body);
  const maxOut = Math.max(MIN_OUT, Math.min(MAX_OUT, budget - promptTok));
  return { body, truncated, promptTok, maxOut };
}

// The API rejects the whole extraction if a single enum lands outside its list.
// At temperature 0 a plain retry returns the identical answer, so the prompt has
// to change. One corrective pass, then give up.
const VALUE_ERROR = /value must be one of|does not validate with .*\/enum/i;

// The schema has a natural seam: who someone is (small, much the same size for
// everybody) and what they have done (unbounded — thirteen years across six
// employers produces several times the JSON of three years across one). A long
// senior CV can exceed the output ceiling as a whole while each half fits, so
// when the object comes back truncated, ask twice and stitch the halves together.
const SPLIT_A = ["candidate", "languages", "education", "certifications",
                 "work_preferences", "derived", "extraction_meta"];
const SPLIT_B = ["experience", "skills", "projects"];

function subSchema(keys: string[]) {
  const props: Record<string, unknown> = {};
  const all = (CV_SCHEMA as any).properties;
  keys.forEach((k) => { props[k] = all[k]; });
  return obj(props);
}

const TRUNCATED = (e: any) =>
  e.status === 507 || (e.status === 400 && /missing propert/i.test(e.detail ?? ""));

async function callLlm(text: string) {
  try {
    return await llmOnce(text, "");
  } catch (e: any) {
    if (TRUNCATED(e)) return await callLlmSplit(text);
    if (e.status !== 400 || !VALUE_ERROR.test(e.detail ?? "")) throw e;
    const field = (/'(\/[^']+)'/.exec(e.detail ?? "") ?? [])[1] ?? "";
    const out = await llmOnce(text,
      `Your previous answer was rejected. ${field || "A field"} used a value outside its ` +
      `allowed list. Every field with a list of allowed values must use one of them exactly — ` +
      `use "other" where nothing fits, or null where the field permits it. Return the whole object again.`);
    return { ...out, retried: true };
  }
}

/** Two passes over the same CV, each asked for a different half of the object. */
async function callLlmSplit(text: string) {
  const note = "This CV is long. Return only the parts of the object the schema asks for here.";
  const a = await llmOnce(text, note, subSchema(SPLIT_A));
  const b = await llmOnce(text, note, subSchema(SPLIT_B));
  return {
    data: { ...a.data, ...b.data },
    usage: {
      total_tokens: (a.usage?.total_tokens ?? 0) + (b.usage?.total_tokens ?? 0),
      completion_tokens: (a.usage?.completion_tokens ?? 0) + (b.usage?.completion_tokens ?? 0),
    },
    truncated_input: a.truncated_input || b.truncated_input,
    split: true,
  };
}

async function llmOnce(text: string, nudge: string, schema?: unknown) {
  schema = schema ?? CV_SCHEMA;
  const p = plan(text, schema);
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GEMINI_API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      max_completion_tokens: p.maxOut,
      reasoning_effort: REASONING_EFFORT,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Extract this CV.\n\n<cv>\n${p.body}\n</cv>${nudge ? "\n\n" + nudge : ""}` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "cv_extraction", strict: true, schema },
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    // A 400 naming missing properties is not a bad prompt — it is a generation
    // that ran out of output tokens, leaving a half-written object to validate.
    // Report it as truncation so the client shows the right remedy.
    // Missing properties means the object stopped early. A value outside an enum
    // is a different thing entirely, and callLlm retries that one.
    if (res.status === 400 && /missing propert/i.test(detail)) {
      throw Object.assign(new Error("output_truncated"), { status: 507, detail });
    }
    if (res.status === 400) {
      throw Object.assign(new Error("schema_violation"), { status: 400, detail });
    }
    // 413 = the request exceeded TPM. 429 = this minute's budget is spent.
    throw Object.assign(new Error(`gemini_${res.status}`), { status: res.status, detail });
  }

  const body = await res.json();
  const choice = body.choices[0];
  if (choice.finish_reason === "length") {
    throw Object.assign(new Error("output_truncated"), { status: 507 });
  }
  return {
    data: JSON.parse(choice.message.content),
    usage: body.usage ?? {},
    truncated_input: p.truncated,
  };
}

// ------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!GEMINI_API_KEY) return json({ error: "missing_gemini_key" }, 500);

  // --- auth: the caller must be a signed-in user ---
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return json({ error: "unauthorized" }, 401);

  let payload: { text?: string; storage_path?: string };
  try { payload = await req.json(); } catch { return json({ error: "bad_json" }, 400); }

  const started = Date.now();
  let text = (payload.text ?? "").trim();
  let textMs = 0;

  // --- resolve text from storage if a path was given ---
  if (!text && payload.storage_path) {
    // Only allow a user to parse files under their own prefix.
    if (!payload.storage_path.startsWith(`cvs/${user.id}/`)) {
      return json({ error: "forbidden_path" }, 403);
    }
    const t0 = Date.now();
    const { data: blob, error: dlErr } = await supabase.storage
      .from("cvs")
      .download(payload.storage_path.replace(/^cvs\//, ""));
    if (dlErr || !blob) return json({ error: "download_failed", detail: dlErr?.message }, 400);
    if (blob.size > MAX_BYTES) return json({ error: "file_too_large", max_bytes: MAX_BYTES }, 413);

    const bytes = new Uint8Array(await blob.arrayBuffer());
    const lower = payload.storage_path.toLowerCase();

    if (lower.endsWith(".pdf")) {
      try { text = await pdfToText(bytes); }
      catch (e) { return json({ error: "pdf_parse_failed", detail: String(e) }, 400); }
      // A PDF with no meaningful text layer is a scan. The extraction models
      // are text-only, so this must go through OCR before it can be parsed.
      if (text.replace(/\s/g, "").length < 120) {
        return json({ error: "needs_ocr", needs_ocr: true,
          message: "This PDF has no text layer. Run OCR on the client (tesseract.js) and resubmit as { text }." }, 422);
      }
    } else if (lower.endsWith(".docx")) {
      try { text = await docxToText(bytes); }
      catch (e) { return json({ error: "docx_parse_failed", detail: String(e) }, 400); }
    } else if (/\.(png|jpe?g)$/.test(lower)) {
      // cvsバケットが許可しているのは png / jpeg のみ（20260825000000_cv_uploads_storage.sql）
      const mime = lower.endsWith(".png") ? "image/png" : "image/jpeg";
      try { text = await imageToText(bytes, mime); }
      catch (e) { return json({ error: "image_read_failed", detail: String(e) }, 400); }
    } else if (lower.endsWith(".txt")) {
      text = new TextDecoder().decode(bytes).trim();
    } else {
      return json({ error: "unsupported_type",
        message: "Send .pdf, .docx, .txt or a photo (.png/.jpg) via storage_path, " +
                 "or extract client-side and send { text }." }, 415);
    }
    textMs = Date.now() - t0;
  }

  if (!text || text.replace(/\s/g, "").length < 80) {
    return json({ error: "insufficient_text",
      message: "Fewer than 80 non-whitespace characters — this does not look like a CV." }, 422);
  }

  // --- extract ---
  try {
    const t1 = Date.now();
    const { data, usage, truncated_input, split } = await callLlm(text) as any;
    const llmMs = Date.now() - t1;
    const problems = validate(data);

    return json({
      ok: true,
      data,
      problems,                       // schema-valid but suspicious — show in the review UI
      meta: {
        model: MODEL,
        source_chars: text.length,
        truncated_input,          // true if the CV was trimmed to fit the TPM budget
        split: !!split,           // true if the CV needed two passes to come back whole
        tpm_limit: TPM_LIMIT,
        usage,
        timings_ms: { text: textMs, llm: llmMs, total: Date.now() - started },
      },
    });
  } catch (e: any) {
    if (e.status === 413) {
      return json({ error: "over_tpm", tpm_limit: TPM_LIMIT,
        message: `Request exceeded ${TPM_LIMIT} TPM. Set GEMINI_TPM_LIMIT to your account's actual ceiling.`,
        detail: e.detail }, 413);
    }
    if (e.status === 429) {
      // Requests and tokens are capped separately. Same status, same wording, remedies
      // half an hour apart — the client needs to know which.
      const perDay = /per day|\(TPD\)/i.test(e.detail ?? "");
      // The wait comes back as "28.3725s" or "5m33.07s" depending on length.
      const w = /try again in ([0-9hms.]+)/i.exec(e.detail ?? "");
      const parts = w
        ? [/([\d.]+)h/.exec(w[1]), /([\d.]+)m/.exec(w[1]), /([\d.]+)s/.exec(w[1])]
        : [null, null, null];
      const wait = w
        ? (parts[0] ? +parts[0][1] * 3600 : 0) + (parts[1] ? +parts[1][1] * 60 : 0) + (parts[2] ? +parts[2][1] : 0)
        : (perDay ? 0 : 60);
      return json({ error: perDay ? "daily_limit" : "rate_limited",
        retry_after_s: Math.ceil(wait) || null,
        message: perDay
          ? "The daily token allowance is spent. Waiting a moment will not help — this resets on a rolling window."
          : "This minute's token budget is spent. The free tier refills per minute — retry in about 60s.",
        detail: e.detail }, 429);
    }
    if (e.status === 507) {
      return json({ error: "output_truncated",
        message: "Generation stopped before the JSON was complete — reasoning tokens and the object share one output ceiling. " +
                 `Reasoning effort is ${REASONING_EFFORT}; raise GEMINI_TPM_LIMIT if your account permits a larger reservation.`,
        reasoning_effort: REASONING_EFFORT, detail: e.detail }, 507);
    }
    if (e.status === 401 || e.status === 403 || e.status === 402) {
      return json({ error: "bad_api_key",
        message: "Gemini rejected the API key. Check it is current and that the Generative Language " +
                 "API is enabled on its project.", detail: e.detail }, 401);
    }
    if (e.status === 400) {
      return json({ error: "schema_violation",
        message: "The model returned a value outside its allowed list and a corrective retry did not fix it.",
        detail: e.detail }, 502);
    }
    console.error("parse-cv failed", e?.detail ?? e);
    return json({ error: "extraction_failed", detail: String(e?.message ?? e) }, 502);
  }
});
