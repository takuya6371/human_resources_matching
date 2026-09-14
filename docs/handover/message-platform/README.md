# AfriTalent — Messages

Moderated messaging between African talent and Japanese company representatives.
Every message carries a translation for the other side. An AfriTalent guardian
watches the thread, and a conversation that tries to leave the platform is held
and handed to Trust & Safety.

**No backend, no account, no deployment.** Two browser tabs talk to each other
directly.

## Running a demo

**[DEMO-SCRIPT.md](DEMO-SCRIPT.md)** is a twelve-minute walkthrough for three
tabs side by side — exactly what to type, in what order, and what to say while
it happens.

## Running it

Open a terminal, and copy-paste these two lines:

```bash
cd message-platform
python3 serve.py
```

`serve.py` is `http.server` with caching switched off. Plain `http.server` lets
the browser keep old copies of the JavaScript, which during a demo looks exactly
like a broken feature — and a hard reload does not fix it, because module
caching ignores that.

Then open **http://localhost:8766** in two tabs, side by side.

Leave that terminal window alone while you use it — closing it stops the page
loading. When you are finished, press `Control` and `C` in it.

> Why a command at all: browsers refuse to let a page opened by double-click
> share storage between tabs, which is exactly what this needs. The line above
> is not a server in any real sense — it just hands the files to the browser.

## Chatting with someone

1. **Tab 1** — pick **Amara Chinelo Nwosu** from *Signed in as*.
2. **Tab 2** — pick **Kenichi Tanaka**, then click the Amara conversation.
3. Type in either. It appears in the other immediately.

**A third tab** signed in as **AfriTalent Trust & Safety** watches every
conversation live, and cannot post into any of them. That is the three-tab
arrangement the demo script uses.

Company representatives carry their company next to their name — in the account
bar, in the conversation list, in the thread header and on every message they
send. A recruiter only means anything as the company they are speaking for.

Each tab remembers who it is, so a reload does not swap your seat. Every message
is kept until an admin clears it — close the browser, come back tomorrow, it is
all still there.

Put the two tabs side by side and it reads as one conversation from both ends.

### The accounts

**Talent:** Amara Nwosu 🇰🇪 · Kwame Asante 🇬🇭 · Fatoumata Diallo 🇸🇳 ·
Selamawit Bekele 🇪🇹 · Grace Achieng 🇰🇪
**Company:** 田中健一 · 鈴木美咲 · 山田大輔 · 伊藤彩
**Platform:** AfriTalent Trust & Safety

They are paired into five conversations, all of them **empty**. Nothing is
pre-written: a demo where the conversation already exists reads as a screenshot,
so every message — including the blocked ones — is typed live.

**Reset** in the header puts everything back to how it started, in both tabs.

## Do I need a Google API key?

The key lives in **`chat-config.js`** — already there, copied from the CV
extractor. It is gitignored, and the two folders do not share anything
automatically: this file is the connection.

**Without it, going off script is not safe.** The rules layer catches every
contact detail however it is disguised, with no key at all. But wording with no
pattern in it — *"there are easier ways to sort this out, if you follow me"* —
is escalated to the second tier, and if that tier is not configured the message
simply goes through. The rules cannot settle it; that is the whole reason the
tier exists.

The guardian panel says which state you are in, so you never have to guess
mid-demo:

| Panel says | What happens if you improvise |
|---|---|
| Second tier · **armed** | vague wording gets read and judged |
| Second tier · **not configured** | vague wording passes, and the log says it was never checked |
| Second tier · **mocked** | `?mock=block` — anything escalated is treated as a catch |

> The key is readable by anyone who opens the folder or the dev tools. Fine on
> your own machine, wrong anywhere public.

## Translation

Every message carries a translation for the other side. Three engines are tried
in order, cheapest first:

1. **A phrasebook** for stock phrases — instant, free.
2. **The browser's on-device translator** (Chrome and Edge) — no key, no
   request, no tokens. Not every browser has it.
3. **Gemini**, using the key in `chat-config.js`, falling through
   `gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-3-flash-preview`.
   A rate-limited model does not mean the account is out.

The guardian panel names whichever one actually did the work, so "is translation
on?" is answerable by looking rather than by sending a message and waiting.

**Only the sender translates.** Every open tab used to translate every message,
which meant three clients racing on the same text, three times the API calls,
and a late writer overwriting what another tab had already stored. Other tabs
render what is saved.

**A failure is never permanent.** It used to be written down, so a message that
failed once — because the key was not wired yet, or the network blipped — was
marked untranslatable for ever and never retried. Failures now live in memory
for the session only, so a reload tries again, and every failed line carries a
**retry** link.

The line says what actually went wrong:

| Line under the message | What it means |
|---|---|
| *quota exceeded — try again later* | the key is out of allowance; it refills |
| *translation service returned 4xx* | the key or the request was rejected |
| *could not translate* | no engine available at all |

Not *"not available in this browser"*, which is what it used to say for all
three and was usually wrong.

## The guardian says it is there

Every conversation opens with a standing notice from AfriTalent AI, in English
and Japanese, before anyone types. Nobody finds out afterwards that they were
being checked. An admin reading the thread sees a different version of the same
notice, because they are watching rather than being watched.

## What the guardian does

A model call per message is the naive design, and on any real volume it is the
whole budget. So there are two tiers:

**Tier 1 — rules.** Deterministic, free, instant, and it runs *before* a message
can be sent. Emails, phone numbers, links, handles, private messaging apps and
outright proposals to move off-platform never leave the box. The sender is told
what tripped it and why the platform works that way.

It catches the versions people use when they know they are being watched:

| Typed | Why it still fails |
|---|---|
| `amara dot nwosu at gmail dot com` | spelled separators are folded back to `@` and `.` |
| `０９０ー１２３４ー５６７８` | full-width Japanese digits are normalised to ASCII |
| `0 7 1 2 4 4 8 9 0 3` | spaces between digits are not a disguise |
| `zero seven zero eight eight eight one nine` | four or more number-words in a row become digits |
| `0abc7abv0abc8nnn8nnn8nnnn1abc9abc0mnv9cvb0` | digits keep bumping against letters — ordinary writing never does that |
| `my number starts 090` → `then 1234` → `and ends 5678` | the sender's recent turns are kept; the turn that completes the number is blocked |

Three blocked attempts in one conversation escalates to Trust & Safety. One slip
is a mistake; three is a pattern.

**Tier 2 — the model.** Only for messages the rules clear but that still read
like an attempt. *"It is simpler if we just carry on somewhere more convenient
— you know what I mean"* names no channel and matches no pattern; that is what
tier 2 is for. It is asked about **20% of messages**.

When the model catches something the message has already been delivered, so the
consequence is different: the thread is hidden from both sides, a notice
explains why, and a case opens in Trust & Safety. Nothing is deleted.

Without a Gemini key configured, tier 2 is skipped and the guardian panel says
so. To watch the whole flow anyway, add `?mock=block` to the URL — any message
the rules escalate is then treated as a catch.

## Trust & Safety

Switch to that account in either tab. Held conversations appear with the message
that caused it and what the guardian thought.

- **Release** — reopens it
- **Release with a warning** — reopens it and posts a warning into the thread
- **Clear all messages** — deletes the conversation for both people

Clearing is the only destructive action in the product, and it is admin-only.
Both tabs update the moment it happens.

## Measuring it

Open **http://localhost:8766/bench.html**. Eighty labelled messages run through
the rules with no model call, and the page prints every one so a disagreement is
visible rather than averaged away.

| | |
|---|---|
| Violations caught by rules alone | **100%** (34/34) |
| False positives on benign messages | **0%** (0/46) |
| Messages needing a model call | **22.9%** (naive baseline: 100%) |
| Model calls avoided | **77.1%** |
| Multi-turn conversations judged correctly | **4/4** |
| Vague hints escalated rather than blocked | **11/11** |

The benign half is adversarial on purpose: salaries, headcounts, dates, times,
semver, postcodes, invoice numbers, `JLPT N2`, `k8s v1.29`, "line manager", "in
line with", "deadline", "on-call", 「オンライン」 — everything a keyword filter
shreds.

Two of those numbers were bought the hard way. Concatenating every digit across
recent messages meant *"40,000 transactions a day"* followed by *"10:00 JST
works for me"* reached nine digits and blocked an ordinary reply. And the
weak-signal lexicon was English-only, so Japanese hints escalated nowhere at
all — on a platform where the company side writes Japanese. Both are now cases
in the corpus.

## Files

```
index.html      the app, and the one place a key goes
app.js          UI and state
app.css         the "Line" design system, shared with the rest of AfriTalent
moderation.js   the rules engine
db.js           localStorage, and the cross-tab sync
data.js         nine accounts and five seeded conversations
bench.html      the benchmark — open it, it runs itself
bench-data.js   the labelled corpus
```

## Honest limits

Everything lives in one browser's storage. Two tabs on the same machine share a
conversation; two different machines do not, and there is no login — you pick
who you are from a menu. That is the trade for having no backend at all, and it
is the right trade for testing how this feels. It is not the shape of a product
that carries real conversations between real people.
