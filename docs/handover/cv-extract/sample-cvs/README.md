# Sample CVs

A test corpus, not six copies of one CV. Each one is a different shape, chosen
to break something different. Every file is fictional.

| CV | Formats | What it is for |
|---|---|---|
| `amara-nwosu-cv` | PDF, DOCX, TXT | The happy path. Kenyan full-stack engineer, JLPT N2, personal details present, deliberate skill duplicates and a six-month career gap. |
| `chidi-okonkwo-cv` | PDF, TXT | **No personal details at all** and no Japanese. Career changer from banking into data. Exercises the "your CV did not give us…" path and the `Data` field mapping. |
| `fatoumata-diallo-cv` | PDF, TXT | **Written in French**, with accents, from Senegal. Marketing rather than engineering. Exercises non-English extraction, CEFR levels, the `Business` field, and non-ASCII through the PDF text layer. |
| `kwame-asante-cv` | DOCX, TXT | **Written in Japanese**, a 職務経歴書 from a Ghanaian living in Tokyo. JLPT N1. Exercises Japanese extraction and, critically, nationality (Ghana) differing from country of residence (Japan). |
| `grace-achieng-cv` | DOCX, TXT | **Minimal and messy.** Self-taught junior, years with no months, an unfinished degree, freelance/intern/volunteer rather than employment. Exercises low confidence, long `missing_fields`, and the blank 月 cells on the Japanese CV. |
| `selamawit-bekele-cv` | PDF, TXT | **Long and senior.** Thirteen years, six roles, consulting that deliberately overlaps a full-time job. Exercises overlap detection, `employment_type` variety, and the output token ceiling. |

No PDF for the two DOCX-only CVs: the generator writes base-14 Helvetica with
WinAnsi encoding, which covers French accents but not Japanese — a CJK PDF needs
an embedded CID font. DOCX is UTF-8 XML and is what a Japanese candidate would
send anyway.

## What this corpus has already caught

Worth recording, because each was a real defect that the single original CV
never triggered:

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

## Regenerating

`*.txt` is the source of truth. After editing one:

```bash
python3 mkcv.py <stem> pdf,docx
```

`amara-nwosu-cv.txt` is additionally inlined in `cv-extract-demo.html` as
`SAMPLE_CV`, the fallback when `sample-cvs/` cannot be fetched. Keep the two
identical.
