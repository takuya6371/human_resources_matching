/* ============================================================
   Labelled corpus for the moderation benchmark.
   `bad: true`  the message must not reach the other side.
   `bad: false` the message is ordinary recruiting talk and must
                go through untouched.
   The benign half is deliberately adversarial: numbers, dates,
   money, versions, tooling and scheduling are what a naive
   contact-detector shreds.
   ============================================================ */
export const CASES = [
  // ---------- plain contact details ----------
  { t: 'You can email me at amara.nwosu@protonmail.com', bad: true, note: 'email, plain' },
  { t: 'My number is +254 712 448 903', bad: true, note: 'phone, intl spaced' },
  { t: '携帯は090-1234-5678です', bad: true, note: 'phone, JP' },
  { t: 'Here is my WhatsApp: 08061234567', bad: true, note: 'app + phone' },
  { t: 'Add me on Telegram, my handle is @amara_dev', bad: true, note: 'app + handle' },
  { t: 'LINE ID: amara-nwosu-96', bad: true, note: 'LINE id' },
  { t: 'ラインのIDはkwame1994です', bad: true, note: 'LINE id, JP' },
  { t: 'Check my portfolio at https://amaranwosu.dev and mail me there', bad: true, note: 'url' },
  { t: 'wa.me/254712448903', bad: true, note: 'shortlink' },
  { t: 'Reach me on selamawit.bekele@proton.me instead', bad: true, note: 'email + intent' },

  // ---------- obfuscated ----------
  { t: 'amara dot nwosu at gmail dot com', bad: true, note: 'spelled separators' },
  { t: 'chidi (at) outlook (dot) com', bad: true, note: 'bracketed separators' },
  { t: 'my mail is grace[at]moringa[dot]school', bad: true, note: 'square brackets' },
  { t: '０９０ー１２３４ー５６７８ に電話してください', bad: true, note: 'full-width digits' },
  { t: 'ｆ.ｄｉａｌｌｏ＠ｏｕｔｌｏｏｋ.ｆｒ', bad: true, note: 'full-width email' },
  { t: 'call 0 7 1 2 4 4 8 9 0 3 any time', bad: true, note: 'spaced digits' },
  { t: 'number: 0712-448-903', bad: true, note: 'dashed' },
  { t: 'reach me at 254.712.448.903', bad: true, note: 'dotted' },
  { t: '0abc7abv0abc8nnn8nnn8nnnn1abc9abc0mnv9cvb0', bad: true, note: 'digits interleaved with filler letters' },
  { t: 'my num 0x7x0x8x8x8x1x9x0x9x0', bad: true, note: 'single-letter separators' },
  { t: 'zero seven zero eight eight eight one nine zero nine zero', bad: true, note: 'spelled-out digits' },

  // ---------- intent without details ----------
  { t: "Let's continue this conversation outside the platform", bad: true, note: 'explicit intent' },
  { t: 'It would be faster if you contact me directly', bad: true, note: 'contact me directly' },
  { t: 'Shall we move this discussion elsewhere?', bad: true, note: 'move elsewhere' },
  { t: 'Send me your personal email and we can talk properly', bad: true, note: 'asks for personal email' },
  { t: '直接連絡を取りましょう', bad: true, note: 'intent, JP' },
  { t: 'プラットフォームの外でやり取りしませんか', bad: true, note: 'off-platform, JP' },
  { t: '個人の連絡先を教えてください', bad: true, note: 'asks personal contact, JP' },
  { t: 'メールアドレスを交換しましょう', bad: true, note: 'exchange email, JP' },
  { t: 'Find me on Instagram, same name', bad: true, note: 'find me on' },
  { t: 'ラインで連絡しませんか', bad: true, note: 'LINE by name, JP' },
  { t: 'My LINE ID is kwame_1994', bad: true, note: 'LINE id, EN' },
  { t: 'ワッツアップの番号を送ります', bad: true, note: 'WhatsApp, JP' },
  { t: "Here's my number, text me tonight", bad: true, note: 'here is my number' },

  // ---------- ordinary recruiting talk that must survive ----------
  { t: 'I have 7 years of experience building payment systems', bad: false, note: 'years' },
  { t: 'We are a team of 240 people across 3 offices', bad: false, note: 'headcount' },
  { t: 'The salary band is 6,500,000 JPY per year', bad: false, note: 'money' },
  { t: 'I passed JLPT N2 in July 2025', bad: false, note: 'certification + date' },
  { t: 'Could we schedule the interview for 2026-09-03 at 10:00 JST?', bad: false, note: 'date and time' },
  { t: 'I work mostly in React 18 and Node.js 20', bad: false, note: 'versions' },
  { t: 'Our office is in Shibuya, near the station', bad: false, note: 'company location' },
  { t: 'I led a team of 5 on a system handling 40,000 deliveries a day', bad: false, note: 'scale' },
  { t: 'The role is remote-first with a 2 hour overlap requirement', bad: false, note: 'overlap' },
  { t: '弊社は2015年に設立され、従業員は約180名です', bad: false, note: 'company facts, JP' },
  { t: '面接は9月3日の10時からでいかがでしょうか', bad: false, note: 'scheduling, JP' },
  { t: 'ご経歴を拝見しました。ぜひ一度お話しさせてください', bad: false, note: 'polite opener, JP' },
  { t: 'I am available from 1 May 2026 with two months notice', bad: false, note: 'availability' },
  { t: 'We use Slack and Jira internally, and English is fine for daily work', bad: false, note: 'internal tools' },
  { t: 'Can you tell me more about the team structure?', bad: false, note: 'question' },
  { t: 'I would like to understand the visa sponsorship process', bad: false, note: 'visa' },
  { t: 'My current role ends in March, so April would suit me', bad: false, note: 'timing' },
  { t: 'Thank you for the update, I will review the job description', bad: false, note: 'thanks' },
  { t: 'The product line we support serves 9,000 merchants', bad: false, note: '"line" as a word' },
  { t: 'My line manager suggested I apply for this', bad: false, note: '"line manager"' },
  { t: 'We are in line with the market rate for this level', bad: false, note: '"in line with"' },
  { t: 'The deadline for the take-home task is Friday', bad: false, note: 'deadline contains "line"' },
  { t: 'We can do the interview over Zoom if that helps', bad: false, note: 'legitimate tooling' },
  { t: 'A Google Meet invitation will come from our recruiting team', bad: false, note: 'legitimate tooling' },
  { t: 'I saw the role on LinkedIn originally', bad: false, note: 'mentions LinkedIn innocently' },
  { t: 'Our engineering blog covers the migration in detail', bad: false, note: 'no url given' },
  { t: 'I am comfortable with on-call rotations', bad: false, note: '"call" innocent' },
  { t: 'The call yesterday was helpful, thank you', bad: false, note: '"call" innocent' },
  { t: 'Postcode is 150-0002 for the office address', bad: false, note: 'postcode, 7 digits' },
  { t: 'Version 3.11.174 of the library had the bug', bad: false, note: 'semver' },
  { t: 'Invoice 2024-0051 was settled last week', bad: false, note: 'reference number' },
  { t: 'I passed JLPT N2 in July 2025 and plan to take N1 in 2026', bad: false, note: 'N2/N1 create letter-digit joins' },
  { t: 'We run React 18, Node 20, Vue 3 and Next 15 across 4 services', bad: false, note: 'many version joins' },
  { t: 'Could we schedule the interview for 2026-09-03 at 10:00 JST?', bad: false, note: 'date and time, 12 digits' },
  { t: 'The cluster runs k8s v1.29 with 3 nodes and 12000 pods at peak', bad: false, note: 'infra numbers' },
  { t: 'It should take two or three weeks, maybe four at the outside', bad: false, note: 'number words, short run' },
  { t: 'One or two of the team have done this before', bad: false, note: 'number words, short run' },
  { t: 'よろしくお願いいたします', bad: false, note: 'closing, JP' },
  { t: 'オンライン面接でも構いません', bad: false, note: 'オンライン contains ライン' },
  { t: 'オンラインでの打ち合わせを希望します', bad: false, note: 'オンライン again' },
  { t: 'デッドラインは金曜日です', bad: false, note: 'デッドライン contains ライン' },
  { t: 'My personal opinion is that the stack suits me well', bad: false, note: '"personal" innocent' },
  { t: 'The direct manager for this role is in Osaka', bad: false, note: '"direct" innocent' },
  { t: 'I have attached nothing here, the CV is already on my profile', bad: false, note: 'profile mention' },
  { t: 'Happy to share more about my work on the ledger service', bad: false, note: '"share" innocent' },
  { t: 'Is there an easier way to book the interview slot in your system?', bad: false, note: '"easier way" about the platform itself' },
  { t: 'We found a better way to structure the onboarding', bad: false, note: '"better way" about work' },
  { t: 'This back and forth on the spec has been useful', bad: false, note: '"back and forth" innocent' },
  { t: 'The interview panel will be three people from the platform team', bad: false, note: '"platform" innocent' },
];

/* Wording that names no channel and matches no pattern. The rules must NOT
   block these — there is not enough to act on — but they must hand them to the
   model. A hint that reaches neither is the gap the whole design exists to
   close, and it is invisible unless it is measured separately. */
export const HINTS = [
  { t: 'This is taking a while through the site. It is simpler if we just carry on somewhere more convenient for both of us.', note: 'EN, no channel named' },
  { t: 'You know what I mean, right? There are easier ways to do this.', note: 'EN, insinuation' },
  { t: 'I would rather discuss the offer somewhere else, if that is alright.', note: 'EN, somewhere else' },
  { t: 'もう少し簡単な方法で続けられると良いのですが、お分かりいただけますよね', note: 'JP, no channel named' },
  { t: 'サイト以外でやり取りした方が早いかもしれません', note: 'JP, outside the site' },
  { t: '別の方法でご連絡できればと思います', note: 'JP, another way' },
  { t: '都合の良い場所で話を続けましょう', note: 'JP, convenient place' },
  { t: 'Honestly this back and forth is slow. There are easier ways for us to sort this out, if you follow me.', note: 'EN, improvised — no channel, no pattern' },
  { t: 'There must be a quicker route than this.', note: 'EN, comparative + vague noun' },
  { t: 'We could settle this between ourselves and save the trouble.', note: 'EN, between ourselves' },
  { t: '手っ取り早い方法がありますよね', note: 'JP, a quicker way' },
];

/* Conversations, not single messages. Each turn is checked with the previous
   turns as context, which is where a naive digit-accumulator falls over. */
export const SEQUENCES = [
  { note: 'a number handed over three digits at a time', bad: true,
    turns: ['my number starts 090', 'then 1234', 'and ends 5678'] },
  { note: 'ordinary talk that happens to contain numbers', bad: false,
    turns: ['I led a team on a system handling 40,000 transactions a day',
            'Tuesday at 10:00 JST works for me',
            'The band was 6,500,000 JPY at my last role'] },
  { note: 'scheduling across turns', bad: false,
    turns: ['Could we meet on 2026-09-03?', 'I am free from 13:00', 'That is 5 days from now'] },
  { note: 'an email spelled out over two turns', bad: true,
    turns: ['my address is amara.nwosu', 'at protonmail dot com'] },
];
