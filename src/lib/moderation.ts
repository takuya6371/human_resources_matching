/* ============================================================
   NeBonga Link — message moderation
   ------------------------------------------------------------
   Two tiers, in this order:

     1. RULES  deterministic, free, instant. Runs in the browser
               before a message can be sent, and again on the
               server so the browser cannot be bypassed.
     2. MODEL  only for messages the rules cleared but that carry
               a risk signal. This is the whole point: a model
               call per message is the naive design and costs a
               token budget nobody has.

   The rules do not just look for "@" — an attempt worth catching
   is an attempt someone is trying to hide. Everything is NFKC
   normalised first, which folds full-width Japanese input
   (＠０９０) onto ASCII, then obfuscation is unpicked before any
   pattern runs.

   Shared verbatim by the browser (src/pages/MessagesPage.tsx) and
   the send-message Edge Function (supabase/functions/send-message).
   Ported as-is from docs/handover/message-platform/moderation.js —
   do not fork into two copies (see docs/bridge-migration-plan.md).
   ============================================================ */

const ZERO_WIDTH = /[​-‍⁠﻿­]/g

/** Fold the ways people hide contact details back onto plain text. */
export function normalise(text: string): string {
  let t = String(text || '').normalize('NFKC').replace(ZERO_WIDTH, '').toLowerCase()

  // (at) [at] {at} <at> アット  ->  @      and the same shapes for dot
  t = t.replace(/\s*[([{<]\s*(?:at|@|アット)\s*[)\]}>]\s*/g, '@')
  t = t.replace(/\s*[([{<]\s*(?:dot|\.|ドット)\s*[)\]}>]\s*/g, '.')
  // "name at gmail dot com" — only when a plausible domain follows
  t = t.replace(/\s+at\s+(?=[a-z0-9-]+\s*(?:\.|dot)\s*[a-z]{2,})/g, '@')
  t = t.replace(/\s+dot\s+/g, '.')
  t = t.replace(/\s*[-_]\s*at\s*[-_]\s*/g, '@')
  t = foldNumberWords(t)
  return t
}

/* "zero seven zero eight eight eight one nine zero nine zero" is a phone
   number typed out. Four or more in a row is nobody's sentence — three or
   fewer stays alone, so "two or three years" is untouched. */
const NUM_WORDS: Record<string, string> = {
  zero: '0', oh: '0', o: '0', one: '1', two: '2', three: '3', four: '4',
  five: '5', six: '6', seven: '7', eight: '8', nine: '9',
}
const NUM_RUN = /\b(?:(?:zero|oh|one|two|three|four|five|six|seven|eight|nine)[\s.·-]+){3,}(?:zero|oh|one|two|three|four|five|six|seven|eight|nine)\b/g
function foldNumberWords(t: string): string {
  return t.replace(NUM_RUN, run =>
    run.split(/[\s.·-]+/).filter(Boolean).map(w => NUM_WORDS[w] ?? '').join(''))
}

/* Digits split by spaces, dashes, dots or Japanese separators still form a
   phone number. Letters break a run, so "5 years" and "2019" never merge. */
const SEPARATORS = /[\s\-().・･ー–—_/]/g
function digitRuns(t: string): string[] {
  return (t.replace(SEPARATORS, '').match(/\d+/g) || [])
}
function longestDigitRun(t: string): number {
  return digitRuns(t).reduce((m, d) => Math.max(m, d.length), 0)
}

/* A message that is plausibly one part of a number handed over piece by piece:
   short and mostly digits, or carrying language that frames it as a fragment.
   Returns the digits, or '' when the message is just a message with numbers
   in it — which is most of them, on a platform where people discuss salaries,
   headcounts and interview times. */
const FRAGMENT_INTENT = /\b(?:number|phone|mobile|cell|call|reach|contact|starts?|ends?|then|next|last|first|rest|part|digits)\b|(?:番号|携帯|続き|残り|最初|最後)/
function phoneFragment(t: string): string {
  const digits = digitRuns(t).join('')
  if (digits.length < 3 || digits.length >= 9) return ''   // 9+ is caught outright
  const alnum = t.replace(/[^a-z0-9]/g, '')
  const share = digits.length / Math.max(1, alnum.length)
  return (share >= 0.5 || FRAGMENT_INTENT.test(t)) ? digits : ''
}

/* A number with letters shoved between the digits — 0abc7abv0abc8nnn8nnn…
   carries 070888819090. Digit runs are useless here: every run is one digit
   long. What gives it away is the interleaving itself. An ordinary sentence
   containing numbers separates them with spaces and punctuation ("2026-09-03
   at 10:00", "40,000 transactions"); a hidden number bumps digits straight up
   against letters over and over. Count those transitions. */
function hiddenNumber(t: string): boolean {
  const digits = (t.match(/\d/g) || []).length
  if (digits < 9) return false
  const transitions = (t.match(/\d[a-z]|[a-z]\d/g) || []).length
  return transitions >= 6
}

const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/
const URL = /\b(?:https?:\/\/|www\.)\S{2,}/
const BARE_DOMAIN = /\b[a-z0-9][a-z0-9-]{1,}\.(?:com|net|org|jp|io|me|dev|app|link|ly|gg|xyz|site|online|info|biz)\b/
const SHORTLINK = /\b(?:wa\.me|t\.me|lin\.ee|line\.me|bit\.ly|linktr\.ee|discord\.gg)\b/
const HANDLE = /(?:^|\s)@[a-z0-9_.]{3,}/
const INTL_PHONE = /\+\d[\d\s().-]{7,}/

/* "line" is an ordinary English word — line manager, product line, deadline —
   so it only counts when it is carrying an ID. The rest are unambiguous.

   Two traps here. \b is defined on ASCII word characters, so it never matches
   between two Japanese characters: /\bライン\b/ silently matches nothing at
   all. And ライン is a substring of オンライン, so an online interview would
   otherwise read as a LINE ID. */
const PRIVATE_APPS_ASCII = /\b(?:whatsapp|whats app|telegram|wechat|we chat|kakao|viber|signal app|imo|botim)\b/
const PRIVATE_APPS_CJK = /(?<!オン)ライン|ワッツアップ|テレグラム|カカオ|ウィーチャット|ヴァイバー/
const PRIVATE_APPS = { test: (t: string) => PRIVATE_APPS_ASCII.test(t) || PRIVATE_APPS_CJK.test(t) }
const LINE_ID = /\bline\s*(?:id|@|アカウント|account)\b|(?<!オン)ライン\s*(?:の)?\s*(?:id|アカウント)/
const APP_NEUTRAL = /\b(?:zoom|google meet|teams|skype|discord|instagram|messenger|facebook|linkedin)\b/

/* Proposing to leave the platform. Split by how explicit it is: an outright
   proposal is blocked, a hint is only a reason to look closer. */
const INTENT_STRONG = [
  /\b(?:let'?s|lets|shall we|why don'?t we|we can|we could|better to|easier to)\b[^.!?]{0,40}\b(?:continue|talk|chat|speak|move|take this|discuss|connect|communicate)\b[^.!?]{0,30}\b(?:outside|off|elsewhere|directly|privately|another way|somewhere else)\b/,
  /\b(?:outside|off)\s+(?:of\s+)?(?:this|the)\s+(?:platform|site|app|system)\b/,
  /\b(?:reach|contact|call|text|email|mail|message|dm|ping)\s+me\s+(?:at|on|via|直接)?\b/,
  /\b(?:my|personal|private|direct)\s+(?:number|phone|mobile|cell|email|e-mail|mail|contact|address|line\s*id)\b/,
  /\b(?:add|invite|find|follow)\s+me\s+on\b/,
  /\b(?:here'?s|here is|this is)\s+my\s+(?:number|email|phone|contact|mail)\b/,
  /直接\s*(?:連絡|やり取り|話|メール|電話)/,
  /(?:プラットフォーム|サイト|こちら)\s*(?:の)?\s*外/,
  /(?:個人|プライベート)\s*(?:の)?\s*(?:連絡先|メール|電話|アドレス)/,
  /(?:連絡先|メールアドレス|電話番号|携帯番号)\s*(?:を)?\s*(?:教えて|送って|交換)/,
]
/* Hints, not proposals. These do not block — they buy a model call. The
   Japanese side needs as much cover as the English one: the company reps write
   Japanese, so an English-only hint lexicon leaves half the platform unwatched,
   which is precisely the half doing the recruiting. */
const INTENT_WEAK = [
  /\b(?:faster|quicker|easier|simpler|convenient)\b[^.!?]{0,30}\b(?:if we|to just|directly|outside|somewhere|another)\b/,
  /\b(?:offline|off-platform|off platform|side channel)\b/,
  /\b(?:keep in touch|stay in touch|get in touch)\b/,
  /\b(?:somewhere|some place|another way|another channel)\b[^.!?]{0,25}\b(?:convenient|easier|better|else)\b/,
  /\b(?:you know what i mean|you know where|if you know|if you follow me|you follow me|you get me|catch my drift|reading me|between you and me|between us)\b/,
  // "there are easier ways to sort this out" — the shape of every improvised
  // approach: a comparative, a vague noun, and no channel named anywhere.
  /\b(?:easier|quicker|faster|simpler|better|another|other|different)\s+(?:way|ways|route|channel|option|method)\b/,
  /\b(?:sort this out|settle this|handle this|deal with this|take this)\b[^.!?]{0,30}\b(?:ourselves|直接|between|privately|quietly|another)\b/,
  /\bthis (?:back and forth|is slow|is taking)\b/,
  /(?:もっと)?(?:簡単|楽|早|速|便利)[^。！!？?]{0,20}(?:方法|やり方|やり取り|続け|話|場所)/,
  /(?:別|他|ほか)の(?:方法|手段|場所|ところ|チャネル)/,
  /(?:こちら|ここ|サイト|システム)以外/,
  /お分かり(?:いただけ|でしょう|ですよね)|分かりますよね|わかりますよね|ご存知/,
  /(?:都合の良い|都合のいい)(?:場所|方法|ところ)/,
  /(?:早い|直接の方が|やりとり)/,
]

/* Words that make a cleared message worth a model call. Deliberately broad —
   a false positive here costs one cheap call, a false negative costs a
   candidate's phone number. */
const RISK_LEXICON = /\b(?:contact|reach|connect|direct|directly|outside|private|privately|personal|personally|platform|offline|number|phone|mobile|cell|mail|email|handle|profile|account|invite|add me|share|send me|between us|discreet|quietly|somewhere|elsewhere|convenient)\b|(?:連絡|直接|個人|携帯|電話|メール|アカウント|共有|外部|内緒|以外|別の方法|他の方法|お分かり|ご存知|手っ取り早|早い方法)/

export const CATEGORY_COPY: Record<string, string> = {
  email: 'an email address',
  phone: 'a phone number',
  url: 'a link',
  handle: 'a social handle',
  app: 'a private messaging app',
  intent: 'a plan to move the conversation off NeBonga Link',
  split: 'a phone number spread across several messages',
}

export interface ScreenContext {
  /** this sender's recent messages in this thread, newest last. Used to catch
   *  a number typed a few digits at a time, which every single-message
   *  checker misses. */
  recent?: string[]
}

export interface ScreenResult {
  verdict: 'block' | 'review' | 'clear'
  categories: string[]
  reason: string
  needsModel: boolean
}

export function screen(text: string, context: ScreenContext = {}): ScreenResult {
  const raw = String(text || '')
  const t = normalise(raw)
  const hits = new Set<string>()

  if (EMAIL.test(t)) hits.add('email')
  if (URL.test(t) || SHORTLINK.test(t) || BARE_DOMAIN.test(t)) hits.add('url')
  if (longestDigitRun(t) >= 9 || INTL_PHONE.test(t) || hiddenNumber(t)) hits.add('phone')
  if (!hits.has('email') && HANDLE.test(t)) hits.add('handle')
  if (LINE_ID.test(t)) hits.add('app')
  // An app named on its own is only a signal; an app named next to an ID, a
  // number or an invitation is somebody handing over a channel.
  const APP_CONTEXT = /\b(?:id|add|invite|number|contact|me|my|dm)\b|連絡|追加|番号|送り|送る|送ります|交換|教えて|アカウント/
  if (PRIVATE_APPS.test(t) && (APP_CONTEXT.test(t) || hits.has('phone'))) hits.add('app')
  if (INTENT_STRONG.some(r => r.test(t))) hits.add('intent')

  if (hits.size) {
    const categories = [...hits]
    return {
      verdict: 'block',
      categories,
      reason: describe(categories),
      needsModel: false,
    }
  }

  /* Digits accumulating across messages: 090 … then 1234 … then 5678.

     Naively concatenating every digit in the last few messages does not work:
     "40,000 transactions a day" followed by "10:00 JST works for me" reaches
     nine digits and blocks an ordinary reply. Only count messages that look
     like a fragment of a number — mostly digits, or explicitly framed as one
     part of several — and require at least two of them. */
  const here = phoneFragment(t)
  if (here) {
    const fragments = (context.recent || []).slice(-4).map(normalise).map(phoneFragment).filter(Boolean)
    const total = fragments.join('') + here
    if (fragments.length >= 1 && total.length >= 9) {
      return { verdict: 'block', categories: ['split'], reason: describe(['split']), needsModel: false }
    }
  }

  const weak = INTENT_WEAK.some(r => r.test(t))
  const risky = RISK_LEXICON.test(t)
  const numeric = longestDigitRun(t) >= 5
  const appTalk = PRIVATE_APPS.test(t) || APP_NEUTRAL.test(t)

  if (weak || risky || numeric || appTalk) {
    return { verdict: 'review', categories: [], reason: '', needsModel: true }
  }
  return { verdict: 'clear', categories: [], reason: '', needsModel: false }
}

function describe(categories: string[]): string {
  const parts = categories.map(c => CATEGORY_COPY[c] || c)
  if (parts.length === 1) return parts[0]
  return parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1]
}
