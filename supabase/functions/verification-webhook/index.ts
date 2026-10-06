// ============================================================
// supabase/functions/verification-webhook/index.ts
//
// Didit tells us how the check went. This is the ONLY thing that may write a
// verified status — the database trigger blocks everyone else, including the
// candidate's own browser.
//
// Deploy (note --no-verify-jwt: the caller is Didit, not a signed-in user):
//   supabase secrets set DIDIT_WEBHOOK_SECRET=...
//   supabase functions deploy verification-webhook --no-verify-jwt
//
// Then register the destination once, which is what mints the secret:
//   curl -X POST https://verification.didit.me/v3/webhook/destinations/ \
//     -H "x-api-key: $DIDIT_API_KEY" -H "Content-Type: application/json" \
//     -d '{"label":"NeBonga Link",
//          "url":"https://<ref>.functions.supabase.co/verification-webhook",
//          "webhook_version":"v3",
//          "subscribed_events":["status.updated","data.updated"]}'
//
// The URL must be public HTTPS. Didit's SSRF guard refuses localhost and
// private ranges, so this cannot be tested against a laptop.
// ============================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

const SECRET = Deno.env.get("DIDIT_WEBHOOK_SECRET")!;

/* ------------------------------------------------------------
   Canonicalisation for X-Signature-V2.

   Didit signs a re-serialised form of the body rather than the raw bytes,
   which is what lets the signature survive a JSON middleware round-trip.
   Reproduce it exactly: whole-number floats collapse to integers, keys sort
   lexicographically at every level, array order is preserved, and Unicode
   stays unescaped (the JS default).
   ------------------------------------------------------------ */
function shortenFloats(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(shortenFloats);
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, shortenFloats(x)]),
    );
  }
  if (typeof v === "number" && !Number.isInteger(v) && v % 1 === 0) return Math.trunc(v);
  return v;
}

function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") {
    return Object.keys(v as object).sort().reduce<Record<string, unknown>>((acc, k) => {
      acc[k] = sortKeys((v as Record<string, unknown>)[k]);
      return acc;
    }, {});
  }
  return v;
}

const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");

/** Constant time: a compare that returns early leaks the signature a byte at a time. */
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)));
}

/* Didit's ten literal statuses, compared case-sensitively, mapped onto the
   four this platform stores. Anything mid-flight is "pending" so a profile
   never sits looking unverified while a check is actually running. */
const STATUS_MAP: Record<string, string> = {
  "Approved": "verified",
  "Declined": "failed",
  "Kyc Expired": "unverified",
  "Expired": "unverified",
  "Abandoned": "unverified",
  "Not Started": "pending",
  "In Progress": "pending",
  "Awaiting User": "pending",
  "In Review": "pending",
  "Resubmitted": "pending",
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method_not_allowed", { status: 405 });

  const raw = await req.text();
  const sig = req.headers.get("x-signature-v2") ?? "";
  const ts = Number(req.headers.get("x-timestamp"));

  // 1. Freshness, so a captured delivery cannot be replayed later.
  if (!ts || Math.abs(Date.now() / 1000 - ts) > 300) {
    return new Response("stale", { status: 401 });
  }
  if (!SECRET) return new Response("not_configured", { status: 500 });

  let parsed: any;
  try { parsed = JSON.parse(raw); } catch { return new Response("bad_json", { status: 400 }); }

  // 2 & 3. Canonicalise, then compare in constant time.
  const canonical = JSON.stringify(sortKeys(shortenFloats(parsed)));
  const expected = await hmacHex(SECRET, canonical);
  if (!safeEqual(expected, sig)) return new Response("bad_signature", { status: 401 });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // 4. Idempotency. Didit retries on 5xx, and a retry must not re-run the
  //    decision. The insert is the lock: a duplicate event_id collides on the
  //    primary key and we stop here.
  const { error: dupe } = await admin.from("verification_events").insert({
    event_id: parsed.event_id,
    session_id: parsed.session_id ?? null,
    status: parsed.status ?? null,
  });
  if (dupe) {
    if (dupe.code === "23505") return new Response("ok");   // already handled
    console.error("idempotency insert failed", dupe);
  }

  // 5. Apply it.
  const profileId = parsed.vendor_data;
  const status = String(parsed.status ?? "");
  const mapped = STATUS_MAP[status];

  if (profileId && mapped) {
    // The verdict itself stays on `profiles` — a company may see that a
    // candidate is verified. Which provider was used and the session id
    // identify the person to that provider, so 20260924000000 moved them to
    // `profile_private`, readable only by the candidate and admins.
    const { error } = await admin.from("profiles").update({
      verification_status: mapped,
      verified_at: mapped === "verified" ? new Date().toISOString() : null,
    }).eq("id", profileId);
    if (error) console.error("profile update failed", error);

    const { error: privErr } = await admin.from("profile_private").update({
      verification_provider: "didit",
      verification_ref: parsed.session_id ?? null,
      verification_detail: status,
    }).eq("id", profileId);
    if (privErr) console.error("profile_private update failed", privErr);
  }

  // Deliberately nothing from `decision` is stored: not the document number,
  // not the images, not the extracted fields. Only the verdict. Everything
  // else stays with the provider, which is the entire reason for using one.

  // 6. 2xx quickly. Anything slow belongs on a queue, not in this handler.
  return new Response("ok");
});
