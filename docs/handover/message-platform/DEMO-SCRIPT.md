# Live demo — AfriTalent Messages

Twelve minutes, three tabs, one thread. Everything below is typed live; nothing
is pre-recorded and nothing is faked.

---

## Before you start

```bash
cd message-platform
python3 serve.py
```

Open **http://localhost:8766** in **three tabs**, arranged left to right:

| Tab | Signed in as | Why |
|---|---|---|
| 1 · left | **Amara Chinelo Nwosu** | the candidate |
| 2 · middle | **Kenichi Tanaka** — 株式会社ミナトソフト | the recruiter |
| 3 · right | **AfriTalent Trust & Safety** | the platform |

In tabs 2 and 3, click the **Amara ↔ Tanaka** conversation so all three are on
the same thread.

**The conversation starts empty.** Nothing is pre-written — every message the
audience sees, including the ones that get blocked, you type in front of them.
Press **Reset** in any tab to get back to blank at any point; a note confirms it
happened.

**Check one thing before you start.** In the right-hand panel: *Second tier —
**armed***. If it says *not configured*, improvised wording will pass straight
through and step 6 will not work. Everything else runs regardless.

Three tabs side by side is the whole demo. Everything you do in one appears in
the other two while the audience watches.

---

## 1 · The problem, in one sentence — 30 seconds

> "A Kenyan engineer and a Tokyo recruiter want to hire each other. Neither
> reads the other's language well, and the moment they swap phone numbers this
> platform stops being able to protect either of them. Watch what happens."

Point at tab 1, then tab 2. Same conversation, two languages.

---

## 2 · It reads in both directions — 2 minutes

**Tab 2 (Tanaka), type:**

```
はじめまして。田中と申します。プロフィールを拝見しました。
```

Point at tab 1 as it arrives — Japanese message, English underneath, a second or
two later.

**Tab 1 (Amara), reply:**

```
Thank you for reaching out. I led the ledger service at Sendy for three years.
```

**Tab 2 again:**

```
素晴らしいですね。来週、一次面接をオンラインで実施できればと思います。
```

**Tab 1:**

```
That is wonderful news. Tuesday or Wednesday both work for me.
```

> "Neither of them switched language. Neither of them opened a translator.
> The small line under each message is done on the device — no server, no
> per-message cost."

Glance at tab 3: the admin has been reading both sides the whole time.

---

## 3 · The guardian is not a surprise — 20 seconds

Point at the notice at the top of the thread.

> "It says so, in both languages, before anyone types anything. Nobody discovers
> afterwards that they were being watched."

---

## 4 · The obvious attempt — 1 minute

**Tab 2 (Tanaka), start typing — do not press send yet:**

```
念のため携帯番号もお伝えします。090-1234-5678
```

Stop. Let them look at the red warning appearing *as you type*.

> "It has not been sent. It cannot be sent. The other side never sees it, and
> nothing has been reported — this is a first offence, and the message tells him
> why the platform works this way."

Press **Send** anyway. Nothing moves. Point at tab 1: unchanged.

**Now clear the box and try the disguises:**

```
０９０ー１２３４ー５６７８
```
> "Full-width Japanese digits. Different characters entirely."

```
zero nine zero one two three four five six seven eight
```
> "Typed as words."

```
0abc7abv0abc8nnn8nnn8nnnn1abc9abc0mnv9cvb0
```
> "That is a phone number with junk letters between every digit. Any rule that
> looks for a run of digits sees runs of length one and finds nothing."

Each one is refused, live.

---

## 5 · The number no single message contains — 1 minute

**Tab 2, send these as three separate messages:**

```
my number starts 090
```
```
then 1234
```

> "Both of those went through. Neither is a phone number."

```
and ends 5678
```

Blocked.

> "It keeps the last few things you said. That third message completes a number,
> so that is where it stops — and the naive version of this is worse than
> useless. Concatenating every digit means 'forty thousand transactions a day'
> plus 'ten in the morning' blocks an ordinary reply, which is exactly what the
> first build here did."

---

## 6 · The one that needs judgement — 2 minutes

> "Everything so far was a pattern. This is not."

**Tab 2, send:**

```
This is taking a while through the site. It is simpler if we just carry on somewhere more convenient for both of us — you know what I mean.
```

It sends. Let the pause sit.

> "No number. No address. No app named. Nothing to match. It goes through —
> and then the model reads it."

**This is the step to improvise on.** Anything that suggests going elsewhere
without naming a channel will do — *"there are easier ways to sort this out, if
you follow me"*, *"手っ取り早い方法がありますよね"*. The rules let it through and
the model reads it. What comes back is its own reasoning, not a canned line.

*(If the panel said "not configured", reload with `?mock=block` on the URL and
this step still runs — the panel then says it is mocked.)*

A moment later, in **all three tabs at once**:
- the thread is held
- a notice explains why, in both languages
- neither side can type
- a case opens in Trust & Safety

> "Rules stop the obvious ones for nothing. The model is asked about one message
> in five, and only about the ones the rules could not settle. Both people are
> told what happened; nothing was deleted."

---

## 7 · The platform decides — 1 minute

**Tab 3 (Trust & Safety) → Trust & Safety view.**

Read the case aloud: the exact message, and what the guardian thought of it.

Press **Release with a warning**.

Point at tabs 1 and 2 — both unlock instantly, both see the warning.

> "A person made that call, not the model. The model's job was to notice."

Then, still in tab 3, press **Clear all messages** on any case.

> "The only destructive action in the product, and only this account has it.
> Both sides go empty at the same moment."

---

## 8 · When the candidate is out of their depth — 1 minute

**Tab 1 (Amara) → Request support.**

> "Salary in a second language, against a recruiter who does this every day.
> One button, and a person from AfriTalent is in the room. Both sides see them
> arrive — nobody is being listened to secretly."

Show the same notice appearing in tab 2.

---

## 9 · The numbers — 90 seconds

Open **http://localhost:8766/bench.html** in a fourth tab.

> "Eighty labelled messages, every one listed so you can disagree with any of
> them."

| | |
|---|---|
| Violations caught by rules alone | **100%** |
| False positives on ordinary messages | **0%** |
| Messages needing a model call | **20%** |
| Model calls avoided | **80%** |

> "The benign half is adversarial on purpose — salaries, dates, semver,
> postcodes, 'line manager', 'deadline', 'オンライン'. Eighty per cent of the
> model spend disappears, and the twenty per cent that remains is spent on the
> messages that actually needed a judgement."

Scroll to the two failure rows at the bottom.

> "Both of those numbers were bought. The cross-message check used to block
> ordinary replies, and the hint detection was English-only — on a platform
> where the recruiter writes Japanese."

---

## 10 · Close — 30 seconds

> "Two people who do not share a language just held a hiring conversation,
> couldn't leak a phone number if they tried, and got a human the moment one of
> them wanted one. It runs in a browser tab with no account and no server."

---

## If something goes wrong

| | |
|---|---|
| A message will not send | Read the red warning aloud — that is the demo, not a fault |
| Tabs are out of step | Press **Reset** in any tab; all three reload the same state |
| Step 6 does not hold the thread | No API key. Reload with `?mock=block` in the URL |
| Translations say "not available" | This browser has no on-device translator — say so, and note the seeded messages still show theirs |
