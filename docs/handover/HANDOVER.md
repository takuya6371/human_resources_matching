# AfriTalent — CV extraction and moderated messaging

Two modules. They share one Gemini key and one design language, and they are at
very different stages — a difference that matters more than anything else in
this document:

- **`cv-extract/`** contains real production code — edge functions, migrations,
  a schema — plus a demo page wrapped around it.
- **`message-platform/`** is entirely a specification. Nothing in it is meant to
  ship.

Read [What is a specification](#what-is-a-specification-not-source) before you
merge anything.

---

## What is production code

Merge these into the main React app as they are.

### `cv-extract/supabase/functions/`

| Function | Role |
|---|---|
| `parse-cv` | CV text or a stored file → structured JSON. See the [API contract](#parse-cv-api-contract). |
| `start-verification` | Opens a Didit KYC session, returns a hosted URL. Holds the API key. |
| `verification-webhook` | Receives the signed decision. **The only writer of a verified status.** |

`verification-status` is also present. It is what the browser polls, and it
exists because neither the SDK callback nor the return redirect is proof of
anything — both fire when the candidate reaches the end, and a declined check
reaches the end too. Keep it.

### `cv-extract/supabase/migrations/`

```
20260825000000_cv_uploads_storage.sql
20260826000000_profile_photos.sql
20260827000000_identity_verification.sql
20260828000000_personal_details.sql
20260829000000_didit_verification.sql
```

All five are required. `20260828` (personal details) is the one most easily
skipped — the Japanese 履歴書 fields depend on it.

They slot in after `20260815000000_fix_applicant_profile_visibility` in the main
repo. No renumbering needed. `20260829` depends on `20260827`, so keep the order.

`verification-setup.sql` is **not** a migration. It is `20260827` and `20260829`
flattened into one idempotent script for pasting into the Supabase SQL editor
when CLI access is not available. If you are running migrations properly, ignore
it.

### `cv-extract/cv-schema.js` and `message-platform/moderation.js`

Framework-free, no imports, no DOM. Port verbatim.

`moderation.js` already runs unchanged in both the browser and a Deno edge
function — it is a pure function over a string. Do not fork it into two copies;
the whole point is that the client and the server reach the same verdict.

### `cv-extract/sample-cvs/`

The test corpus. Six CVs across PDF/DOCX/TXT, deliberately awkward: French with
accents, Japanese, a minimal graduate CV, a long senior one. `*.txt` is the
source of truth; `mkcv.py` regenerates the binaries.

Every entry in [Known defects](#known-defects-the-corpus-already-caught) was
found by one of these. Keep them in CI.

---

## What is a specification, NOT source

**`cv-extract/cv-extract-demo.html` and everything in `message-platform/`.**

These are vanilla DOM: string concatenation into `innerHTML`, global mutable
state, no build step. That is deliberate — it made the behaviour arguable
before committing to component boundaries. It is not a starting point for
merging.

**Do not port this DOM code into the React app.** Read it, take the behaviour,
and rebuild the UI as React + Tailwind components against the existing design
tokens in `tailwind.config.js`. The demo pages are the acceptance criteria: if
the React version does what the page does, it is right.

What to take from them:

- the step sequence (upload → extract → review → identity → profile)
- the review screen's field-level corrections, and that corrections happen
  *before* the Japanese documents are generated
- the 履歴書 / 職務経歴書 layout and which cells are editable
- the chat layout, the per-message translation line, the moderation notice
- every error message — they were written carefully and are the part most often
  lost in a rewrite

What to leave behind: all of it, structurally.

---

## parse-cv API contract

`POST` with the user's session. Auth is required; an unauthenticated call is
`401 unauthorized`.

### Request

Two shapes, one of which must be present:

```jsonc
{ "text": "AMARA CHINELO NWOSU\nLagos, Nigeria\n…" }   // already-extracted text
{ "storage_path": "cvs/<uid>/<file>.pdf" }             // a file in the cvs bucket
```

`storage_path` **must** begin `cvs/<the caller's own uid>/` — anything else is
`403 forbidden_path`. Accepts `.pdf` and `.txt`. Ceiling is 8 MB.

### Response

```jsonc
{
  "ok": true,
  "data": { /* the CV object — see cv-schema.js */ },
  "problems": [ /* schema-valid but suspicious; show these in the review UI */ ],
  "meta": {
    "model": "gemini-3.6-flash",
    "source_chars": 4812,
    "truncated_input": false,   // the CV was trimmed to fit the TPM budget
    "split": false,             // needed two passes to come back whole
    "tpm_limit": 250000,
    "usage": { "total_tokens": 0, "completion_tokens": 0 },
    "timings_ms": { "text": 0, "llm": 0, "total": 0 }
  }
}
```

`problems` is not an error. It is the extraction's own doubts — surface them as
review prompts rather than blocking on them.

### Errors

| `error` | HTTP | Trigger | What the client should do |
|---|---|---|---|
| `needs_ocr` | 422 | PDF whose text layer has <120 non-whitespace chars — i.e. a scan. Models are text-only. | Run OCR client-side (tesseract.js), resubmit as `{ text }`. Response carries `needs_ocr: true`. |
| `over_tpm` | 413 | One request exceeded the per-minute ceiling outright. | Not retryable as-is. Raise `GEMINI_TPM_LIMIT` to the account's real limit. |
| `rate_limited` | 429 | This minute's token budget is spent. | Retry after `retry_after_s` (≈60s). |
| `daily_limit` | 429 | The **daily** allowance is spent. Distinguished from the above by `per day`/`(TPD)` in the provider's message. | Waiting will not help; it resets on a rolling window. |
| `output_truncated` | 507 | Generation stopped before the JSON closed — reasoning tokens and the object share one output ceiling. | Usually already handled internally by the two-pass split; if it surfaces, the CV is beyond the account's ceiling. |
| `schema_violation` | 502 | A value outside its allowed list, and the corrective retry did not fix it. | Real failure. Log `detail` — it names the JSON pointer. |
| `insufficient_text` | 422 | <80 non-whitespace chars. | Not a CV. |
| `unsupported_type` | 415 | Not `.pdf`/`.txt` via `storage_path`. | Extract client-side, send `{ text }`. |
| `file_too_large` | 413 | Over 8 MB. | — |
| `pdf_parse_failed` | 400 | The PDF would not open. | — |
| `bad_api_key` | 401 | Provider rejected the key (401/402/403). | Ops problem, not a user problem. |
| `missing_gemini_key` | 500 | Secret not set. | — |

`rate_limited` and `daily_limit` are separate on purpose. See the defects list.

---

## Design decisions that are not obvious from the code

### Why TPM budgeting exists

The provider counts **prompt tokens plus whatever you reserve in
`max_completion_tokens`** against a single per-minute ceiling. Reserving output
you never use still spends the budget.

So `plan()` sizes each request before sending: fixed cost (system prompt +
schema + overhead), then the CV text, then output reserved from what remains.

Without it you get a class of failure that looks random. A short CV succeeds and
a long one returns 413 — not because the *response* was too big, but because the
request reserved more than the minute allowed. Removing the budgeting to
"simplify" will reintroduce exactly that.

`MIN_OUT` is 3000. Reserve less and the object is guaranteed to be cut off
before it closes, because reasoning tokens are drawn from the same allowance.

### The two-pass split

Triggers when a single pass comes back truncated — a 507, or a 400 whose detail
says `missing propert…`.

The schema has a natural seam: *who someone is* (bounded — roughly the same size
for everybody) versus *what they have done* (unbounded — thirteen years across
six employers is several times the JSON of three years at one). A long senior CV
can exceed the output ceiling as a whole while each half fits comfortably.

So the CV is sent twice, each pass asked for a different half of the object, and
the halves are merged. Costs one extra call on the small minority of CVs that
need it, instead of raising the reservation for every CV that does not.

Split A: `candidate, languages, education, certifications, work_preferences,
derived, extraction_meta`. Split B: `experience, skills, projects`.

### The enum-failure corrective retry

The API rejects the entire extraction if one enum lands outside its list.

**A plain retry cannot help.** Temperature is 0, so the same input returns the
same wrong answer — retrying is a guaranteed-identical second failure. The
*prompt* has to change.

So the retry appends a correction naming the offending field (parsed out of the
error's JSON pointer) and restating the rule: use a listed value exactly, `other`
where nothing fits, `null` where permitted. One corrective pass, then give up.

If you ever make temperature non-zero, revisit this — a plain retry becomes
viable, but extraction stops being reproducible, which is a worse trade.

### Moderation is two tiers, and tier 1 must stay deterministic

`screen()` in `moderation.js` returns `verdict` **and** `needsModel`.

- **Tier 1 — rules, every message, free.** Email, URLs, bare domains, phone
  numbers, handles, messaging-app IDs, strong off-platform intent. Unicode is
  NFKC-normalised and common obfuscations unfolded first, so `(at)`, full-width
  characters and digits-spelled-as-words are caught. Returns `block` outright —
  `needsModel: false`. No model call.
- **Tier 2 — the model, only when tier 1 saw a risk signal** (weak intent, risk
  lexicon, ≥5 consecutive digits, or app talk) and could not settle it. That is
  the only path where `needsModel: true`.

**Tier 1 must never become a model call.** The economics of the platform depend
on it: a model call per message is what makes token cost scale with conversation
volume rather than with suspicion. Measured on the bench corpus, roughly a
quarter of messages reach tier 2. Move the boundary and that number goes to 100%.

Two subtleties worth preserving:

- Messages with no signal at all never reach the model, so a clean conversation
  costs nothing.
- Split numbers ("090…" then "1234…" then "5678…") are caught across messages
  via `context.recent`, but only counting messages that *look* like fragments.
  Naive digit-concatenation blocks ordinary replies — "40,000 transactions" plus
  "10:00 JST" reaches nine digits.

---

## Known defects the corpus already caught

Verbatim from `cv-extract/sample-cvs/README.md`. This section exists so they are
not reintroduced during the React rewrite.

- **An enum outside its list.** `chidi-okonkwo` produced a skill category the
  API rejected, losing the whole extraction. Fixed with an explicit prompt rule plus
  a one-shot corrective retry — at temperature 0 a plain retry returns the same
  answer, so the prompt has to change.
- **Nationality confused with residence.** `kwame-asante` came out as
  「日本 🇯🇵」 on an African talent platform. The extraction now carries
  `nationality_code` and the profile is keyed on where someone is *from*, with
  Tokyo recorded as their residence.
- **Schema guidance that never reached the model.** `grace-achieng` returned 5.5
  years for someone with about two. The rule excluding internships lives in the
  schema *descriptions*, which are stripped before sending to save tokens — so
  it was never in force. The conventions that change output are now prompt rules.
- **Daily vs per-minute rate limits.** They are capped separately, with near-identical
  wording, and the remedies are half an hour apart. The error said "retry in
  about 60 seconds" for a cap that needed 26 minutes.
- **Two wait formats.** The wait comes back as `28.3725s` under a minute and
  `5m33.07s` over it. The parser only read the first shape, so precisely the
  waits worth telling someone about came out blank.
- **A senior CV that would not fit at all.** `selamawit-bekele` exceeded the
  output ceiling on the old 8,000-token-a-minute provider. Extraction gained a
  two-pass fallback — identity and history separately — which stays in place. A
  long enough CV finds the output ceiling wherever it is.

- **Fixes tailored to one CV.** Twice. A gap de-duplication matched the literal
  string `2022-08` and broke the moment the model wrote "August 2022" instead; a
  country lookup covered fifteen hand-listed countries. Both are now written
  against the shape of the problem rather than the example in front of them.

---

## Not built yet

**There is no messaging schema.** No `messages` table, no `threads` table, no
migration for either. The prototype fakes persistence entirely in
`localStorage`, and "realtime" is `BroadcastChannel` plus the `storage` event
between tabs of one browser on one machine.

Still to do:

1. `threads` / `messages` / `thread_flags` tables, with RLS — a talent sees only
   their own threads; a company rep sees their company's; admin sees held
   threads.
2. Realtime sync (Supabase Realtime), replacing `db.js` wholesale.
3. Server-side moderation. Today it runs only in the browser, which means it is
   advisory — anyone can bypass it from the console. `moderation.js` must run in
   an edge function on write, with the client copy kept purely for instant
   feedback.
4. Persisting the admin hold/release actions, which are in-memory today.

Point 3 is the one with a security consequence. Everything else is scaffolding.

Also unbuilt on the CV side: nothing polls `verification-status` from the React
app yet, and the Didit webhook has never received a live delivery — it has only
been exercised against a reimplementation of the signature scheme and a local
tunnel. First deploy should verify a real webhook lands and validates.

---

## Setup

### cv-extract

```bash
cp config.example.js config.js
```

Then put a Gemini key in it. Get one at <https://aistudio.google.com/apikey> —
the free tier is enough. Current keys start `AQ.`; older ones `AIza`.

`config.js` is gitignored and is a **demo-only** convenience: it is loaded by
the page, so the key is visible to anyone with the folder or the dev tools.
Nothing in the React app should read it.

Server side:

```bash
supabase secrets set GEMINI_API_KEY=...
supabase secrets set DIDIT_API_KEY=...
supabase secrets set DIDIT_WEBHOOK_SECRET=...
supabase db push
supabase functions deploy parse-cv
supabase functions deploy start-verification
supabase functions deploy verification-status
supabase functions deploy verification-webhook --no-verify-jwt
```

`--no-verify-jwt` on the webhook only: the caller is Didit, not a signed-in
user. Every other function must keep JWT verification on.

`DIDIT_WEBHOOK_SECRET` comes from registering the destination, which needs a
public HTTPS URL:

```bash
curl -X POST https://verification.didit.me/v3/webhook/destinations/ \
  -H "x-api-key: $DIDIT_API_KEY" -H "Content-Type: application/json" \
  -d '{"label":"AfriTalent",
       "url":"https://<project-ref>.supabase.co/functions/v1/verification-webhook",
       "webhook_version":"v3",
       "subscribed_events":["status.updated","data.updated"]}'
```

Save `secret_shared_key` from the response. The workflow id lives in
`start-verification/index.ts`, not in the environment — it is configuration, not
a secret, and having it in code means you can see which workflow a session was
created against.

Run the demo:

```bash
python3 dev-server.py            # http://localhost:8767
```

`dev-server.py` is a laptop-only stand-in for the three verification functions,
storing decisions in a JSON file. It has no auth, no RLS, and one hardcoded
user. It exists so the webhook signature path can be exercised against live
deliveries through a tunnel (`brew install cloudflared`; the server starts and
registers one itself). **It is not a deployment target.**

With `VERIFY_START_URL` blank, the identity step runs a clearly-labelled
simulation instead, which proves nothing but lets you walk the states.

### message-platform

```bash
cp chat-config.example.js chat-config.js     # key optional
python3 serve.py                              # http://localhost:8766
```

The key is optional and arms only two things: translation when the browser has
no on-device `Translator` (Chrome/Edge have it; Safari/Firefox do not), and
moderation tier 2. Tier 1 and every demo scenario run with no key at all.

Open two tabs side by side to see cross-tab sync; a third at `?role=admin` for
the moderation view. `DEMO-SCRIPT.md` is a 12-minute walkthrough.

`serve.py` sends `Cache-Control: no-store`. Use it rather than any other static
server — the modules are cached aggressively otherwise, and you will spend an
afternoon debugging code that is not running.

`bench.html` runs the moderation corpus: ~80 labelled messages plus multi-turn
sequences. Last run: 100% recall (34/34), 0% false positives (0/49), 22.9% of
messages reaching tier 2. Run it after any change to `moderation.js`.

---

## Secrets

Credentials live in `cv-extract/config.js`, `message-platform/chat-config.js`
and `cv-extract/.env.local`. All three are gitignored and are not distributed —
create them from the `.example` files alongside them.

One hazard when scanning for leaked keys: `grep` on macOS is often **ugrep**,
whose recursive mode honours `.gitignore` by default. A recursive scan for key
patterns therefore skips exactly the files that hold keys, and reports clean.
Scan with an explicit file walk rather than `grep -r`.
