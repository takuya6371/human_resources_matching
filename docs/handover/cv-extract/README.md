# CV extraction — talent onboarding

A CV goes in, a filled AfriTalent profile comes out. The page here walks the whole
of **Gate B — Build profile** from the talent onboarding flow: choose an input
method, parse to structured JSON, review and correct, land on a profile.

```
cv-extract/
  cv-extract-demo.html      the flow, in the app's own "Line" design system
  cv-schema.js              the extraction schema, shared with the edge function
  config.example.js         copy to config.js and put your key there
  sample-cvs/               a dummy CV to test with, in PDF, DOCX and TXT
  supabase/
    functions/parse-cv/     the production parser — key stays server-side
    migrations/             the private `cvs` storage bucket parse-cv reads from
```

## The provider

**Google Gemini**, `gemini-3.6-flash`, over its OpenAI-compatible endpoint at
`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`.

One provider, no fallbacks. A second path that is never exercised is a second
path that is quietly broken by the time you reach for it.

Gemini takes strict `json_schema` and — the thing that decided it — expresses
optional values as `type: ["string", "null"]`, exactly the shape this schema
already used. No conversion was needed. It also accepts `reasoning_effort`,
mapped internally to its own thinking budget.

Model choice is not free. `gemini-2.5-flash` is retired for new keys — the API
says so and points at 3.6. `gemini-3.7-flash` exists but spends far longer
thinking for no better extraction (21 seconds against 5 on a one-line prompt),
and `gemini-flash-latest` did not answer at all within 30 seconds.

**A CV takes 15–30 seconds.** The model reads the whole document before it
answers, so the extract step shows a running count of seconds rather than a
silent spinner, and every call carries a two-minute deadline. Without both, a
slow answer is indistinguishable from a hang.

Authentication is `Authorization: Bearer <key>`. The `?key=` query parameter and
the `x-goog-api-key` header both work on Gemini's native endpoints but are
rejected by the OpenAI-compatible one with *"Missing or invalid Authorization
header"*. Current keys start with `AQ.`; older ones with `AIza`.

Gemini rejects "very large or deeply nested" schemas without naming a number, so
`CV_SCHEMA` stays lean on principle rather than to a published limit. Your actual
rate limits are visible in [AI Studio](https://aistudio.google.com/rate-limit);
`GEMINI_TPM_LIMIT` only exists to stop a very long CV reserving more output than
your account allows.

## Where the API key goes

**For this demo page — `cv-extract/config.js`.** The page reads it on load, so
you paste the key once and never again:

```bash
cd cv-extract
cp config.example.js config.js
# edit config.js, set GEMINI_API_KEY: 'AIza...'
```

Get a key at <https://aistudio.google.com/apikey> → **Create API key**. Current
keys start with `AQ.`, older ones with `AIza`. `config.js` is gitignored.

Resolution order, first hit wins:

1. `window.AFRITALENT_CONFIG.GEMINI_API_KEY` from `config.js`
2. `localStorage['afritalent_llm_key']` — set by typing a key into the
   **Developer settings** drawer at the bottom of step 1
3. nothing — the page runs in demo mode and replays a bundled extraction of the
   sample CV. It refuses to fake a result for any other document.

The header of step 1 tells you which one is live.

**For production — a Supabase secret, never the browser.** The demo calls the
API from the page because that is what a demo is for. The real flow calls
`supabase/functions/parse-cv`, which reads the key from the function environment:

```bash
supabase secrets set GEMINI_API_KEY=AIza...
supabase secrets set GEMINI_CV_MODEL=gemini-3.7-flash    # optional
supabase secrets set GEMINI_TPM_LIMIT=250000             # optional
supabase functions deploy parse-cv
supabase db push                              # creates the private `cvs` bucket
```

The React app then calls it with the user's session and never sees the key:

```ts
const { data } = await supabase.functions.invoke('parse-cv', {
  body: { storage_path: `cvs/${user.id}/${file.name}` },   // or { text: '...' }
})
```

**Google Drive (optional).** The Drive button opens a local stand-in picker
until you add both of these to `config.js`, at which point it opens the real
Google Picker:

```js
GOOGLE_API_KEY: '...',      // Google Cloud console → Credentials → API key
GOOGLE_CLIENT_ID: '...',    // OAuth 2.0 Client ID (Web), origin http://localhost:8000
```

Enable **Google Picker API** and **Google Drive API** on the project first.

## Running it

Serve it over http — opening the file straight from disk makes the browser block
the cross-origin call to the API, and `sample-cvs/` cannot be fetched:

```bash
cd cv-extract && python3 -m http.server 8000
```

Then <http://localhost:8000/cv-extract-demo.html>.

## Testing it

`sample-cvs/` holds six fictional CVs, each a different shape chosen to break
something different: no personal details at all, one written in French, one
written in Japanese by a Ghanaian living in Tokyo, a messy self-taught junior
with year-only dates, and a thirteen-year senior history with overlapping
consulting. See **[sample-cvs/README.md](sample-cvs/README.md)** for what each
one exercises and for the four real defects the corpus has already caught.

All six appear in the demo's Google Drive picker.

Four ways in, all of them live on the page:

| Input | What it exercises |
|---|---|
| Drag the file onto the drop zone | `DataTransfer` → same handler as browse |
| **Choose a file** | `<input type=file>`, PDF/DOCX/TXT/PNG/JPG |
| **Google Drive** | picker → download → same handler |
| **Paste the text** / **Fill it in myself** | the no-parse branches of the flow |

PDFs are read with pdf.js, DOCX with mammoth, images with tesseract.js. A PDF
with no text layer is rejected as a scan rather than parsed into nothing —
production returns `needs_ocr` for the same case.

## What the page shows

1. **Upload** — the four input methods.
2. **Extract** — the pipeline stages with timings. Nothing about tokens or
   budgets: that is engineering detail and it sits in the **Extracted JSON**
   tab on the next step, where it belongs.
3. **Review** — every field the app actually stores, pre-filled and editable,
   marked `auto-filled` until you touch it and `you edited` after. Alongside it:
   per-section confidence, the model's warnings, and the fields your CV did not
   supply.
4. **Identity** — a 証明写真 for the 履歴書, up to three casual photographs, and
   the identity check. All optional and skippable; the profile keeps a route back.
5. **Profile** — the talent's own dashboard (`TalentDashboard.tsx`), the same
   profile as a company sees it (`TalentDetailPage.tsx`), and the **Japanese CV**.

**Edit Profile** reopens step 3 as an edit form — same field set, because the app
has only one. **Save changes** writes back and shows the green confirmation bar;
**Cancel** genuinely discards. **Submit for review** moves the profile from
`draft` to `pending`. Editing an already-approved profile drops it back to
`pending`, which is what the `guard_profile_status` trigger does in the database.
Saving is in-memory here — the real call is `AuthContext.updateProfile()`.

## Two audiences, one screen

The review step is read by a talent, not an engineer, and machine-shaped values
kept leaking into it. They are separated now, by rule rather than case by case:

- `validate()` returns each finding tagged `dev` or not. *"The dates for Lead
  Software Engineer at Sendy Logistics end before they begin"* is for the talent;
  *"experience[2].start_date is not YYYY-MM"* is not, and is hidden unless
  `?dev=1`. Only untagged findings turn the pipeline stage red.
- `extraction_meta.missing_fields` holds dotted schema paths. Every empty field
  already says "not on your CV" beside itself, so the list is both redundant and
  unreadable for a talent — it is dev-only.
- `source_language` comes back as an ISO code. It renders as *English*, *French*,
  *Japanese*.
- Career gaps are printed as *August 2022*, not *2022-08*.

Countries are resolved through `Intl.DisplayNames` rather than a hand-written
table, in English and Japanese, with the flag computed from the ISO code. A
table only ever covers the countries somebody thought of; this covers all of
them, and a code that is not a real country produces no flag rather than a
placeholder box. Avatar initials prefer Latin letters, so a name written
「クワメ・アサンテ（Kwame Asante）」 gives KA rather than ク（.

## Developer view

The page shows a talent only what a talent needs. Everything else — the API key
and model settings, the extracted JSON, the CV text, the database columns — is
behind a flag rather than deleted:

```
http://localhost:8000/cv-extract-demo.html?dev=1
```

## Photographs

Two different jobs, so two different treatments.

**証明写真** is a document photograph at a fixed 30×40mm — a 3:4 portrait, plain
background, shoulders up. It is cropped to that ratio in the browser with a
vertical-position slider, because a centre crop takes the top off most heads. It
goes onto the 履歴書 automatically and becomes `profiles.avatar_url`.

**Casual photographs** exist because 人柄 carries real weight in Japanese hiring
and a CV cannot show it. Up to three, each with a caption — the caption does more
work than the photograph on its own. They appear as an *In person* card on the
profile a company sees, and as a third sheet, 人柄, after the two formal
documents, where the captions are rendered in Japanese by the same call that
builds the 履歴書.

Everything is decoded with `imageOrientation: 'from-image'`, so photographs taken
on a phone are not rotated on their side, and resized before being held — a phone
photograph is several megabytes and none of that survives the frame it lands in.

`profiles.avatar_url` only holds one image, so the casual set needs its own
table: see `supabase/migrations/20260826000000_profile_photos.sql`. It caps
portraits at one per profile and casual photographs at three, in the database
rather than only in the UI.

## Identity verification

Run by **[Didit](https://didit.me)**. **The ID document never touches this
application.** The candidate is handed to Didit, Didit checks the document
against a selfie, and what comes back is a verdict — the status, the provider,
and Didit's session id. Not the images, not the document number, not the
extracted fields.

That is not squeamishness. Holding passport scans makes you a target and pulls
you under obligations you do not want. It is a thing to outsource.

### The three pieces

| Function | Job |
|---|---|
| `start-verification` | Opens a Didit session with your API key, returns a URL |
| `verification-webhook` | Receives the signed decision — the **only** writer of a verified status |
| `verification-status` | What the page polls, because finishing the flow is not the same as passing it |

That last one matters. The SDK callback and the return redirect both only tell
you the candidate reached the end, and a declined check reaches the end too.
Neither is proof of anything.

### Setting it up

**1. Schema.** `supabase/verification-setup.sql` is `20260827` and `20260829`
combined into one idempotent script — paste it into the dashboard's **SQL
Editor** and run it. It only adds columns and a table; it changes no existing
data and can be run twice.

**2. Deploy and set secrets.** Server-side only — the API key never reaches a
browser.

```bash
supabase secrets set DIDIT_API_KEY=...
supabase functions deploy start-verification
supabase functions deploy verification-status
supabase functions deploy verification-webhook --no-verify-jwt
```

`--no-verify-jwt` on the webhook: the caller is Didit, not a signed-in user. In
the dashboard that switch is **Verify JWT** on the function's page — turn it
off for the webhook and leave it on for the other two.

Both steps also work entirely from the dashboard if you would rather not touch
a terminal: **Edge Functions → Deploy a new function** takes pasted code, and
**Edge Functions → Secrets** holds `DIDIT_API_KEY` / `DIDIT_WEBHOOK_SECRET`
the same way `AZURE_TRANSLATOR_KEY` is already held for `translate`.

**3. Register the webhook**, which is what mints the signing secret:

```bash
curl -X POST https://verification.didit.me/v3/webhook/destinations/ \
  -H "x-api-key: $DIDIT_API_KEY" -H "Content-Type: application/json" \
  -d '{"label":"AfriTalent",
       "url":"https://<project-ref>.supabase.co/functions/v1/verification-webhook",
       "webhook_version":"v3",
       "subscribed_events":["status.updated","data.updated"]}'
```

Save `secret_shared_key` from the response:

```bash
supabase secrets set DIDIT_WEBHOOK_SECRET=...
```

**4. Point the page at the two public functions** — `VERIFY_START_URL` and
`VERIFY_STATUS_URL` in `config.js` —
`https://<project-ref>.supabase.co/functions/v1/start-verification` and
`.../verification-status`.

The webhook URL must be **public HTTPS**. Didit's SSRF guard refuses localhost
and private ranges. Leave `VERIFY_START_URL` blank and the button runs a
labelled simulation instead — which proves nothing, but lets you walk the
states.

### Testing the real thing without deploying

A public URL does not have to mean a deployed backend. Put a tunnel in front of
your laptop and run `dev-server.py`, which answers the same three endpoints and
verifies signatures the same way.

```bash
python3 dev-server.py
```

Then, in a second terminal:

```bash
npx cloudflared tunnel --url http://localhost:8767
```

That prints an `https://<random>.trycloudflare.com` address. The hostname is
public, so Didit's SSRF guard is satisfied, and traffic still terminates on your
machine. Register the webhook against it:

```
https://<random>.trycloudflare.com/api/verification-webhook
```

Put your key and the returned `secret_shared_key` in `.env.local`:

```
DIDIT_API_KEY=...
DIDIT_WEBHOOK_SECRET=...
```

and set both URLs in `config.js` to `http://localhost:8767/api/...` — the page
talks to your machine directly; only Didit needs the tunnel. Decisions land in
`.dev-verification.json` and every delivery prints a line:

```
  ✓ webhook: Approved → verified
  · webhook e1… already handled, ignoring retry
  ✗ webhook rejected: signature did not match
```

The quick tunnel gets a new hostname each restart, so re-register the
destination when you restart it — or use a named tunnel if that gets old.

**What this is not.** `dev-server.py` has no auth, no RLS, and one hardcoded
user. It exists so the signature path can be exercised against live deliveries
rather than only against a reimplementation of it. The Supabase functions are
the real implementation; the two agree on canonicalisation, the 300-second
freshness window, and `event_id` de-duplication.

**Do not point the webhook at a hosted frontend** — a Vercel/Netlify/Base44
preview URL of the app itself. Those serve pages; they have no route that checks
the signature, and the decision payload carries the candidate's name, date of
birth, and document fields. A webhook destination is somewhere that verifies and
stores. Everywhere else is a place that PII leaks to.

### The workflow id is not a secret

`b298bbe5-267f-4af3-9107-11025cebb290` ("Free KYC") lives in
`start-verification/index.ts`, not in the environment. It is per-session
configuration, and having it in code means you can see which workflow a session
was created against.

### Things worth knowing about the implementation

**`vendor_data` comes from the session, never the request body.** It is the
profile id the webhook will later mark verified — accepting it from the browser
would let anyone start a check against someone else's profile.

**The signature is checked before the body is trusted.** Didit signs a
*re-serialised* form rather than the raw bytes, which is what lets it survive a
JSON middleware round-trip: whole-number floats collapse to integers, keys sort
at every level, array order is preserved, Unicode stays unescaped. Deliveries
older than 300 seconds are refused, and the comparison is constant-time. There
is no official verify helper — this canonicalisation is the supported approach.

**Retries are deduplicated on `event_id`.** Didit retries twice on a 5xx, and a
retry must not re-run the decision. `verification_events` has `event_id` as its
primary key, so the insert *is* the lock: a duplicate collides and the handler
stops.

**All ten statuses are handled**, compared case-sensitively. `Approved` and
`Declined` are terminal; `In Review`, `Resubmitted`, `Awaiting User` and the
rest stay pending so a profile never looks unverified while a check is running;
`Kyc Expired` returns to unverified. The raw Didit status is kept in
`verification_detail` alongside the mapped one.

**The flow opens in an iframe, never a same-tab redirect.** Everything on this
page is in memory — the parsed CV, the corrections, the photographs — and
redirecting away throws all of it out and returns the candidate to an empty
page. Small screens get a new tab, which keeps this one alive.

## Language

The interface is English throughout, because the person using it is applying
*to* Japan, not *from* it. Japanese terms are named in English with the romaji
alongside where the word is the thing itself — "a rirekisho, the standard
personal-history form" — rather than dropped in as 履歴書 for a reader who cannot
yet read it.

The two documents are the exception, and stay entirely Japanese: they are the
artefact, not a description of one. Each carries a small English caption on
screen (`RIREKISHO · PERSONAL HISTORY`) so it is clear which is which; the
caption is hidden when printed, since a Japanese employer receives a Japanese
document.

## The Japanese CV

A Japanese application is not a translated CV. It is two documents:

- **履歴書** — a ruled form with a fixed row order. 学歴・職歴 is written
  chronologically, oldest first, education before work, with 入学/卒業 and
  入社/退職, closed with 現在に至る and 以上.
- **職務経歴書** — prose. 職務要約, then per-employer 事業内容 / 業務内容 / 実績,
  then スキル and 自己PR.

The row order and the set phrases are conventions, so they are generated in the
page. Only the Japanese wording is asked of the model, and it is sent the
extracted data rather than the CV — a much smaller request than the extraction.

It runs on demand, the first time the tab is opened, and is cached until the
profile or the photo captions change. The documents also print: there is a
Print button, and a print stylesheet that drops the page furniture and
puts each document on its own A4 page. **On the 8,000 TPM free tier the extraction and this second
pass will not both fit inside one minute** — you get a countdown showing the API's
own retry time, and the extraction is unaffected.

### What the CV already told us

Date of birth, gender, nationality and a full postal address are **extracted like
anything else**, because plenty of CVs state them outright — Nigerian, Kenyan and
Ghanaian ones routinely do, and a US-style CV routinely does not. Whatever the
document supplies is written straight into the form, and the Japanese pass
supplies the address in Japanese along with its hiragana reading.

They are transcribed, never deduced. Rule 9 of the extraction prompt says so
explicitly: gender is never inferred from a first name, a photograph or a
pronoun, and a date of birth is never calculated back from an age or a
graduation year. A wrong date of birth on a 履歴書 is worse than a blank one.

### The blanks are editable

Whatever the CV could not supply stays a blank, and the 履歴書 behaves like the
form it is: every blank is an input, tinted so it is easy to find, and the talent
types into the document itself. A counter tracks what is still empty, and
**Save** persists it.

The banner names what is actually still blank — "Still blank: your commuting
time, whether you have a spouse and 6 months on your history" — rather than
assuming. Every field the form renders registers itself, and the count is simply
the ones that are empty, so the tinting and the counter cannot drift apart. They
did once: the count read a hand-written list while the tint was computed per
field, so blank month cells and the 通勤時間 block were visibly empty and
cheerfully reported as "All filled in".

The editable set is the standard one a Japanese employer expects:

- 生年月日 as separate 年 / 月 / 日 boxes, with 満X歳 computed live. Separate boxes
  rather than a date picker, because `<input type="date">` renders in the
  browser's locale and `18/04/1996` on a 履歴書 looks wrong.
- 性別, offering 記入しない — Japan has been moving away from a required gender
  field since 2021, so "prefer not to say" is a real answer, not a fallback
- ふりがな for the address, in hiragana
- 〒 postcode and the full address, prefecture down to the house number
- 電話 and E-mail, prefilled from the CV
- 通勤時間, 扶養家族数（配偶者を除く）, 配偶者, 配偶者の扶養義務
- 本人希望記入欄
- The 月 column wherever the CV gave a year with no month

The instruction says it plainly, in both languages: the tinted boxes must be
filled **in Japanese**, because a 履歴書 written in English will not be read.

Everything is saved under `afritalent_ja_fill` in `localStorage` for the demo.
In production they belong on `profiles`, which is what
`..._personal_details.sql` adds: they are profile facts, not document facts, and
they are needed again for every application the talent makes. That migration
deliberately does **not** add them to `PROFILE_PUBLIC_COLUMNS` — a date of birth
and a home address are not browsing data, and the 履歴書 goes only to a company
the talent has actually applied to.

## If extraction fails

**"Generated JSON does not match the expected schema … missing properties:
'work_preferences', 'derived', 'extraction_meta'"**

Not a prompt problem, despite what the message says. Those are the *last three*
properties in the object: generation stopped partway and the API validated a
half-written result.

Gemini thinks before it answers, and the thinking is drawn from the same
`max_completion_tokens` ceiling as the JSON. Left high, the thinking eats the
budget and the object never reaches its tail. Both the demo and `parse-cv` send
`reasoning_effort: 'low'`, which is the right setting here anyway — extraction
is transcription, not deduction.

If it still truncates, the extraction falls back to **two passes** on its own —
identity, education and languages in one, work history and skills in the other —
and stitches the halves together. The seam is where the size is: everyone's
identity is about the same length, while a thirteen-year career across six
employers produces several times the JSON of a three-year one. Splitting raises
the room for the work-history half from 4,181 tokens to 5,357.

The response records `split: true` when this happened, and the demo shows
"two passes" alongside the token count. On the 8,000 TPM free tier the two calls
will not both fit inside one minute; the demo waits out the gap and continues,
reporting the countdown as it goes. Raising `GEMINI_TPM_LIMIT` to your account's
real ceiling removes both the split and the wait.

Override the effort with `GEMINI_REASONING_EFFORT` in `config.js`, or per-run
in the **Developer settings** drawer.

## Field mapping

The extraction schema is richer than the `profiles` table, so the mapping is
lossy on purpose. Worth knowing:

- `available_from` is a `date` column, so free text like "two months' notice" is
  parsed into a real date or left blank — never shoved in as prose. The original
  wording is shown under the field so nothing is silently dropped.
- `dev_experience_years` is an `integer`, so `derived.total_years_experience` is
  rounded.
- The `_ja` columns stay empty here. They are filled on save by
  `src/lib/translate.ts`, exactly as the dashboard does today.
- Education picks the highest completed qualification, not the first row —
  evening language programmes routinely sit above the degree on a CV.
- Nothing on a CV maps to `video_url`; a portfolio link is not an intro video.
