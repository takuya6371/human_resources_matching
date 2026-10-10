// チャレンジ機能の見本ページで使う文言。
//
// まだ構想段階の機能なので、i18n.ts には入れていない。
// 正式に作るときに i18n へ畳む（そのときキーの形はここに合わせればよい）。
// 分けてあるもう一つの理由は、i18n.ts が並行で編集されているため。
//
// 設計の中身は docs/challenge-design.md を参照。
//
// ここに出てくる企業名・人名はすべて架空。画面にもその旨を明記している。

import type { Lang } from '../types'

export interface DemoProposal {
  /** 架空の提案者 */
  author: string
  headline: string
  /** 'awarded' は採用、'shortlisted' は候補、'submitted' は提出済み */
  state: 'awarded' | 'shortlisted' | 'submitted'
  stateLabel: string
  approach: string
  result: string
}

export interface DemoChallenge {
  company: string
  industry: string
  title: string
  problem: string
  lookingFor: string
  areas: string[]
  deadline: string
  reward: string
  proposals: DemoProposal[]
}

export interface DemoCopy {
  /** 構想段階であることの告知 */
  draftBadge: string
  draftNote: string

  heroTitle: string
  heroLead: string

  fictionNote: string

  labelProblem: string
  labelLookingFor: string
  labelAreas: string
  labelDeadline: string
  labelReward: string
  labelProposals: string
  labelApproach: string
  labelResult: string

  /** 設計上の約束。企業にとっても人材にとっても、ここが売り。 */
  principlesTitle: string
  principles: { title: string; body: string }[]

  otherTitle: string

  /** 企業が最初に引っかかるところ。先回りして答えておく。 */
  faqTitle: string
  faqLead: string
  faq: { q: string; a: string }[]

  ctaTitle: string
  ctaBody: string
  ctaButton: string

  /** 企業向けページに差し込む一節 */
  teaserBadge: string
  teaserTitle: string
  teaserBody: string
  teaserLink: string

  featured: DemoChallenge
  others: { company: string; title: string; summary: string; areas: string[] }[]
}

const ja: DemoCopy = {
  draftBadge: '構想段階',
  draftNote: 'この機能はまだ公開していません。考えている形をお見せするための画面です。実際の投稿や提案はできません。',

  heroTitle: '困っていることを書く。\n解き方が集まる。',
  heroLead: '求人票では書けない「いま困っていること」を出してください。日本で学び、働いた人たちが解き方を提案します。いまも日本にいる人も、帰国した人も。いちばん有用だった提案を出した人に、実際の仕事を出せます。',

  fictionNote: '※ 以下の企業名・人名・内容はすべて架空の例です。',

  labelProblem: '困っていること',
  labelLookingFor: '求めるもの',
  labelAreas: '分野',
  labelDeadline: '締切',
  labelReward: '報酬',
  labelProposals: '届いた提案',
  labelApproach: '解き方',
  labelResult: '期待できる結果',

  principlesTitle: 'この仕組みで決めていること',
  principles: [
    {
      title: '募集中、提案は非公開',
      body: '提案を読めるのは出題した企業と本人だけです。他の応募者からは見えません。公開するかどうかは、結果が出たあとに提案者本人が選びます。',
    },
    {
      title: '結果の宣言に期限がある',
      body: '締切から14日以内に「採用」か「該当なし」を宣言していただきます。宣言がないと無応答として記録され、企業ページに表示されます。',
    },
    {
      title: '提案は15分で書ける量',
      body: '試作や資料の作成は求めません。解き方と、期待できる結果。それだけです。詳しい話は選考に進んでから、報酬のある場で行います。',
    },
  ],

  otherTitle: 'ほかに出ている課題',

  faqTitle: 'よくいただく質問',
  faqLead: '海外にいる方に仕事をお願いする、という点で引っかかりやすいところを先にお答えします。構想段階のため、実際の運用で変わる可能性があります。',
  faq: [
    {
      q: '海外在住の人に、どうやって報酬を支払うのですか',
      a: '当面は、貴社から提案者へ直接お支払いいただく形を想定しています。当社は資金をお預かりしません。送金は銀行送金のほか、Wiseのような国際送金サービスをお使いいただけます。国によって対応状況と着金手段が異なり、銀行口座ではなくモバイルマネーが主流の国もあります。報酬額を決める前に受取方法を確認しておくと、行き違いがありません。',
    },
    {
      q: '源泉徴収は必要ですか',
      a: '非居住者への支払いが「国内源泉所得」にあたるかどうかで変わります。役務の提供が国外で行われる場合は原則として該当せず、源泉徴収が不要という整理が一般的です。ただし成果物の著作権譲渡の対価と評価されると「使用料」として扱われる可能性があり、契約書の書き方が影響します。租税条約による軽減・免除もあります。当社は税務の専門家ではありませんので、貴社の顧問税理士にご確認ください。',
    },
    {
      q: '消費税やインボイスはどうなりますか',
      a: '国外で行われる役務の提供は国外取引となり、消費税の課税対象外（不課税）となるのが基本です。その場合、仕入税額控除の対象ではないため、適格請求書の有無は問題になりません。経理の方が迷いやすいところなので、契約時に整理しておくことをお勧めします。',
    },
    {
      q: '相手が本人かどうか、どう確認するのですか',
      a: '提案者が企業とつながる前に、身分証による本人確認を必須にしています。氏名と顔写真の照合を行い、確認が済んだ方だけが企業とやりとりできます。お支払い先の口座名義が確認済みの氏名と一致するかも、あわせてご確認ください。',
    },
    {
      q: '課題に自社の内部情報を書いても大丈夫ですか',
      a: '顧客の個人情報は書かないでください。海外在住の方に見える以上、個人データの国外提供にあたる可能性があります。入力時にも検出して警告します。社内の業務手順や数値については、公開しても差し支えない範囲でお書きください。提案の精度は具体性で決まるので、書ける範囲で具体的に書いていただくほど良い提案が集まります。',
    },
    {
      q: '提案を読むだけ読んで、採用しないことはできますか',
      a: '「該当なし」の宣言はできます。ただし締切から14日以内に結果を宣言していただく決まりで、宣言がない場合は無応答として記録され、貴社のページに表示されます。また、採用しなかった提案のアイデアの権利は提案者に残ります。評価のために読む権利のみをお渡しする形になります。',
    },
  ],

  ctaTitle: '最初の課題を一緒に作りませんか',
  ctaBody: '興味のある企業の方とご一緒に、最初の数件を設計したいと考えています。業種や課題の性質によって、どういう出し方が効くかは変わります。お話を聞かせてください。',
  ctaButton: 'お問い合わせ',

  teaserBadge: '構想中',
  teaserTitle: '求人の前に、課題を出すという手',
  teaserBody: '「どんな人が欲しいか」より「いま何に困っているか」のほうが書きやすい、という声をいただきます。課題を出して、解き方の提案を集め、いちばん有用だった人に仕事を出す。日本で学び、帰国した人たちにも届きます。採用ではなく、国境をまたいだ業務委託として。',
  teaserLink: '考えている形を見る',

  featured: {
    company: '株式会社サクラ・トレーディング',
    industry: '食品輸出 / 従業員58名',
    title: '海外向けECの問い合わせ対応が回らない',
    problem: '2年前に英語・フランス語での販売を始めましたが、問い合わせ対応が追いついていません。担当は日本人2名で、翻訳ツールを使って返信しています。返信までに平均3日かかっており、その間に注文を取り消されることが月に10件ほどあります。\n\n翻訳ツールの訳が原因で誤解が生じたことも何度かありました。「賞味期限」を期限切れと受け取られて返金対応になった例があります。人を増やす予算は今期はありません。',
    lookingFor: '返信までの時間を1営業日以内にしたい。人員は増やさない前提でお願いします。完璧な多言語対応でなくてよく、取り消しが減ればまず十分です。',
    areas: ['カスタマーサポート', '多言語', '業務設計', '生成AI'],
    deadline: '2026年11月14日',
    reward: '現金10万円。採用した方には業務委託として継続（月20万円規模・3か月）を想定しています。',
    proposals: [
      {
        author: 'アミナタ D.',
        headline: 'EC運用 / 仏語・英語・日本語 / 元在日5年・現ダカール在住',
        state: 'awarded',
        stateLabel: '採用',
        approach: '問い合わせを減らす方向から入ることを提案します。\n\n頂いた状況を読む限り、3日かかっていること自体より「なぜ問い合わせが来るか」が問題に見えます。東京で越境ECの運用を5年やっていましたが、問い合わせの6割は商品ページに書いていない情報の確認でした。\n\nいま私はダカールにいて、まさに御社のような日本の店から買う側です。何が書いていないと不安になるかは、こちら側にいるとよく分かります。賞味期限の誤解も表記の問題で、こちらでは日付の順序自体が違います。\n\n手順は、まず直近3か月の問い合わせを分類する。多い順に上位10個を商品ページに書き足す。残ったものにテンプレートを用意する。この順番です。',
        result: '問い合わせの件数自体が半分程度まで減る見込みです。残りはテンプレートで即答できるので、1営業日以内は人を増やさずに達成できます。賞味期限の表記は "Best before" と日付形式の明示で解消します。',
      },
      {
        author: 'ジョセフ O.',
        headline: 'バックエンド開発 / Python / 東京在住3年',
        state: 'shortlisted',
        stateLabel: '候補',
        approach: '過去の問い合わせメールを学習させて、自動で分類と下書き作成を行う仕組みを作ります。\n\n既存のメール環境に組み込む形にすれば、担当者の作業は「下書きを読んで直して送る」だけになります。用語集を作り、賞味期限のような誤訳しやすい語は固定の訳を当てます。',
        result: '1件あたりの対応時間が短くなり、同じ2名で当日返信が可能になります。構築に3〜4週間を見込みます。',
      },
      {
        author: 'セラマウィット B.',
        headline: 'カスタマーサクセス / 英語・アムハラ語 / 元在日2年・現アディスアベバ在住',
        state: 'submitted',
        stateLabel: '提出済み',
        approach: '時差を逆に使うことを提案します。私のいるアディスアベバは日本より6時間遅く、日本の夜が現地の夕方です。週10時間程度の業務委託で、日本時間の夜間を埋めます。欧州・アフリカの顧客にとっては日中にあたるため、体感の返信速度が大きく変わります。',
        result: '欧州時間での即日返信が可能になります。既存の2名の負荷も下がります。',
      },
    ],
  },

  others: [
    {
      company: '北関東精密工業株式会社',
      title: '安全教育の資料が日本語だけで、伝わっているか確認できない',
      summary: '外国籍の従業員が12名います。安全教育は日本語の資料と口頭で行っていますが、理解できているかを確認する方法がありません。事故が起きてからでは遅いので、何か手を打ちたい。',
      areas: ['製造', '教育設計', '多言語', '安全管理'],
    },
    {
      company: '株式会社みのり食品',
      title: 'アフリカ市場に出たいが、どの国から始めるべきか判断できない',
      summary: '乾麺と調味料を製造しています。アフリカへの輸出を検討していますが、社内に知見がなく、商社の提案を評価することもできません。まず現地の生活実感から教えてほしい。',
      areas: ['市場調査', '食品', '輸出', '現地事情'],
    },
  ],
}

const en: DemoCopy = {
  draftBadge: 'Concept',
  draftNote: 'This feature is not live yet. This page shows the shape we are considering. Nothing here can be posted or submitted.',

  heroTitle: 'Post what you are stuck on.\nGet ways to solve it.',
  heroLead: 'Write the thing a job posting cannot express: what is actually going wrong right now. People who studied and worked in Japan propose how they would solve it — some still here, some back in their home country. Whoever gives the most useful answer can be given the actual work.',

  fictionNote: 'All company names, people and content below are fictional examples.',

  labelProblem: 'The problem',
  labelLookingFor: 'What we want',
  labelAreas: 'Areas',
  labelDeadline: 'Deadline',
  labelReward: 'Reward',
  labelProposals: 'Proposals received',
  labelApproach: 'Approach',
  labelResult: 'Expected result',

  principlesTitle: 'What this system commits to',
  principles: [
    {
      title: 'Proposals stay private while open',
      body: 'Only the company that posted and the author can read a proposal. Other applicants cannot. After a decision is made, the author chooses whether to make theirs public.',
    },
    {
      title: 'A decision is due on a deadline',
      body: 'Companies declare either an award or no award within 14 days of closing. If they do not, it is recorded as no response and shown on their company page.',
    },
    {
      title: 'A proposal takes fifteen minutes',
      body: 'No prototypes, no decks. How you would solve it, and what it would achieve. The detailed work happens after shortlisting, where it is paid.',
    },
  ],

  otherTitle: 'Other open problems',

  faqTitle: 'Questions we get',
  faqLead: 'The parts that usually give companies pause when the person is based overseas. This is still a concept, so details may change.',
  faq: [
    {
      q: 'How do we pay someone living abroad?',
      a: 'For now, you pay the author directly. We do not hold funds. A bank transfer works, as do services such as Wise. Coverage and the way money arrives differ by country — in several, mobile money is more common than a bank account. Confirming how they will receive payment before agreeing an amount avoids most of the friction.',
    },
    {
      q: 'Do we need to withhold tax?',
      a: 'It depends on whether the payment counts as Japan-source income. Where the service is performed outside Japan, the usual reading is that it does not, so withholding is not required. However, if the payment is treated as consideration for assigning copyright it may be classed as a royalty, and how the contract is worded matters. Tax treaties can also reduce or remove withholding. We are not tax advisers — please check with yours.',
    },
    {
      q: 'What about consumption tax and qualified invoices?',
      a: 'A service performed outside Japan is generally an out-of-scope transaction for consumption tax. In that case there is no input tax credit to claim, so the absence of a qualified invoice is not a problem. It is a common source of confusion in accounting, so it is worth settling at contract time.',
    },
    {
      q: 'How do we know the person is who they say they are?',
      a: 'Identity verification with a government ID is required before anyone can connect with a company. We check the name against a photo, and only verified people can start a conversation. We also suggest checking that the bank account name matches the verified name.',
    },
    {
      q: 'Can we include internal information in the problem?',
      a: 'Please do not include customers\' personal data. Because people overseas can read it, that may amount to transferring personal data outside Japan. We also detect and warn about it as you type. Internal procedures and figures are fine as long as you are comfortable with them being read. Proposals are only as good as the specifics, so the more concrete you can be, the better the answers.',
    },
    {
      q: 'Can we read the proposals and award nobody?',
      a: 'You can declare that none fit. You do have to declare an outcome within 14 days of the deadline; if you do not, it is recorded as no response and shown on your company page. Rights in proposals you did not select stay with their authors — what you receive is the right to read them in order to evaluate them.',
    },
  ],

  ctaTitle: 'Help us shape the first ones',
  ctaBody: 'We want to design the first few problems together with the companies that find this interesting. What works depends a lot on the industry and the kind of problem. Tell us about yours.',
  ctaButton: 'Get in touch',

  teaserBadge: 'Concept',
  teaserTitle: 'Post a problem instead of a job',
  teaserBody: 'Companies tell us it is easier to describe what is going wrong than to describe who they want to hire. Post the problem, collect proposals, and give the work to whoever answered best. It also reaches the people who studied here and have since gone home — not as a hire, but as cross-border contract work.',
  teaserLink: 'See the shape of it',

  featured: {
    company: 'Sakura Trading Co., Ltd.',
    industry: 'Food export / 58 employees',
    title: 'We cannot keep up with enquiries from our overseas store',
    problem: 'We started selling in English and French two years ago, and enquiry handling has not kept up. Two Japanese staff answer them using translation tools. Replies take three days on average, and we lose about ten orders a month to cancellations in the meantime.\n\nThe translations have also caused misunderstandings. One customer read our "best before" date as an expiry and we had to issue a refund. There is no budget to add headcount this year.',
    lookingFor: 'We want to reply within one business day, without hiring anyone. It does not need to be perfect multilingual support. Fewer cancellations would already be enough.',
    areas: ['Customer support', 'Multilingual', 'Process design', 'Generative AI'],
    deadline: '14 November 2026',
    reward: 'JPY 100,000 in cash. We expect to continue with the selected person on a contract basis (around JPY 200,000 per month, three months).',
    proposals: [
      {
        author: 'Aminata D.',
        headline: 'E-commerce operations / FR, EN, JA / 5 years in Japan, now in Dakar',
        state: 'awarded',
        stateLabel: 'Awarded',
        approach: 'I would start by reducing the number of enquiries rather than answering them faster.\n\nFrom what you describe, the three days is a symptom. I ran cross-border e-commerce in Tokyo for five years, and six out of ten enquiries were asking for information missing from the product page.\n\nI now live in Dakar, which makes me exactly the customer buying from a Japanese store like yours. From this side it is very clear what is missing. The best-before issue is a labelling problem — here the date order itself is different.\n\nThe order would be: classify three months of past enquiries, add the top ten missing facts to the product pages, then write templates for whatever remains.',
        result: 'I would expect enquiry volume itself to roughly halve. What is left can be answered from templates immediately, so one business day is reachable without new headcount. The date issue is solved by writing "Best before" with an explicit date format.',
      },
      {
        author: 'Joseph O.',
        headline: 'Backend development / Python / 3 years in Tokyo',
        state: 'shortlisted',
        stateLabel: 'Shortlisted',
        approach: 'Train a classifier on your past enquiry emails and have it draft replies automatically.\n\nBuilt into your existing mail setup, your staff would only read, correct and send. A glossary pins the translation of terms that get mistranslated, such as best-before dates.',
        result: 'Handling time per enquiry drops enough for the same two people to reply same-day. I would estimate three to four weeks to build.',
      },
      {
        author: 'Selamawit B.',
        headline: 'Customer success / EN, Amharic / 2 years in Japan, now in Addis Ababa',
        state: 'submitted',
        stateLabel: 'Submitted',
        approach: 'Use the time difference rather than fighting it. Addis Ababa is six hours behind Tokyo, so your night is my late afternoon. About ten hours a week on contract would cover it. For European and African customers that is the middle of their day, which changes the perceived speed completely.',
        result: 'Same-day replies in European time, and less load on your existing two staff.',
      },
    ],
  },

  others: [
    {
      company: 'Kita-Kanto Precision Industries',
      title: 'Our safety training is Japanese-only and we cannot tell if it lands',
      summary: 'We have twelve foreign employees. Safety training is delivered with Japanese documents and spoken explanation, but we have no way to check whether it was understood. Finding out after an accident is too late.',
      areas: ['Manufacturing', 'Instructional design', 'Multilingual', 'Safety'],
    },
    {
      company: 'Minori Foods Co., Ltd.',
      title: 'We want to enter African markets but cannot judge where to start',
      summary: 'We make dried noodles and seasonings. We are considering exporting to Africa, but nobody here has the background to evaluate what the trading houses propose. Start by telling us what daily life there actually looks like.',
      areas: ['Market research', 'Food', 'Export', 'Local knowledge'],
    },
  ],
}

const fr: DemoCopy = {
  draftBadge: 'Concept',
  draftNote: "Cette fonctionnalité n'est pas encore en ligne. Cette page montre la forme envisagée. Rien ici ne peut être publié ni soumis.",

  heroTitle: 'Publiez ce qui vous bloque.\nRecevez des façons de le résoudre.',
  heroLead: "Décrivez ce qu'une offre d'emploi ne peut pas dire : ce qui ne va pas en ce moment. Des personnes qui ont étudié et travaillé au Japon proposent leur façon de le résoudre — certaines encore sur place, d'autres rentrées au pays. Celle dont la réponse est la plus utile peut se voir confier le travail.",

  fictionNote: 'Les entreprises, personnes et contenus ci-dessous sont des exemples fictifs.',

  labelProblem: 'Le problème',
  labelLookingFor: 'Ce que nous cherchons',
  labelAreas: 'Domaines',
  labelDeadline: 'Date limite',
  labelReward: 'Rémunération',
  labelProposals: 'Propositions reçues',
  labelApproach: 'Approche',
  labelResult: 'Résultat attendu',

  principlesTitle: 'Les engagements du système',
  principles: [
    {
      title: 'Les propositions restent privées',
      body: "Pendant la période ouverte, seuls l'entreprise et l'auteur peuvent lire une proposition. Les autres candidats n'y ont pas accès. Après la décision, l'auteur choisit de la rendre publique ou non.",
    },
    {
      title: 'La décision a une échéance',
      body: "L'entreprise déclare un lauréat ou une absence de lauréat dans les 14 jours suivant la clôture. À défaut, une absence de réponse est enregistrée et affichée sur sa page.",
    },
    {
      title: 'Une proposition prend quinze minutes',
      body: 'Ni prototype ni dossier. Comment vous le résoudriez, et ce que cela donnerait. Le travail détaillé vient après la présélection, et il est rémunéré.',
    },
  ],

  otherTitle: 'Autres problèmes ouverts',

  faqTitle: 'Questions fréquentes',
  faqLead: "Ce qui fait généralement hésiter les entreprises lorsque la personne réside à l'étranger. Il s'agit encore d'un concept : les détails peuvent évoluer.",
  faq: [
    {
      q: "Comment payer une personne qui vit à l'étranger ?",
      a: "Pour l'instant, vous payez directement l'auteur. Nous ne détenons aucun fonds. Un virement bancaire convient, tout comme des services tels que Wise. La couverture et le mode de réception varient selon les pays : dans plusieurs d'entre eux, l'argent mobile est plus courant qu'un compte bancaire. Confirmer le mode de réception avant de convenir d'un montant évite la plupart des frictions.",
    },
    {
      q: 'Faut-il pratiquer une retenue à la source ?',
      a: "Cela dépend si le paiement constitue un revenu de source japonaise. Lorsque la prestation est réalisée hors du Japon, la lecture habituelle est que ce n'est pas le cas, et la retenue n'est pas requise. En revanche, si le paiement est qualifié de contrepartie d'une cession de droits d'auteur, il peut être traité comme une redevance : la rédaction du contrat compte. Les conventions fiscales peuvent aussi réduire ou supprimer la retenue. Nous ne sommes pas conseillers fiscaux — consultez le vôtre.",
    },
    {
      q: "Et la TVA japonaise et les factures qualifiées ?",
      a: "Une prestation réalisée hors du Japon est en principe hors champ de la taxe à la consommation. Dans ce cas, il n'y a pas de crédit de taxe à récupérer, et l'absence de facture qualifiée ne pose pas de problème. C'est une source fréquente de confusion en comptabilité : mieux vaut le clarifier à la signature.",
    },
    {
      q: "Comment savoir que la personne est bien celle qu'elle prétend ?",
      a: "Une vérification d'identité par pièce officielle est obligatoire avant tout contact avec une entreprise. Nous contrôlons le nom et la photo, et seules les personnes vérifiées peuvent engager une conversation. Nous conseillons aussi de vérifier que le titulaire du compte bancaire correspond au nom vérifié.",
    },
    {
      q: 'Peut-on inclure des informations internes dans le problème ?',
      a: "N'incluez pas de données personnelles de vos clients. Comme des personnes à l'étranger peuvent les lire, cela pourrait constituer un transfert de données personnelles hors du Japon. Nous le détectons et vous alertons à la saisie. Les procédures et chiffres internes conviennent si vous acceptez qu'ils soient lus. La qualité des propositions dépend de la précision : plus vous êtes concret, meilleures sont les réponses.",
    },
    {
      q: 'Peut-on lire les propositions et ne retenir personne ?',
      a: "Vous pouvez déclarer qu'aucune ne convient. Vous devez toutefois déclarer une issue dans les 14 jours suivant la clôture ; à défaut, une absence de réponse est enregistrée et affichée sur votre page. Les droits sur les propositions non retenues restent à leurs auteurs : vous recevez seulement le droit de les lire pour les évaluer.",
    },
  ],

  ctaTitle: 'Construisons les premiers ensemble',
  ctaBody: "Nous souhaitons concevoir les premiers cas avec les entreprises que cela intéresse. Ce qui fonctionne dépend beaucoup du secteur et de la nature du problème. Parlez-nous du vôtre.",
  ctaButton: 'Nous contacter',

  teaserBadge: 'Concept',
  teaserTitle: "Publier un problème plutôt qu'une offre",
  teaserBody: "Les entreprises nous disent qu'il est plus facile de décrire ce qui ne va pas que de décrire qui elles veulent recruter. Publiez le problème, recueillez des propositions, confiez le travail à qui a le mieux répondu. Cela atteint aussi celles et ceux qui ont étudié ici puis sont rentrés — non comme un recrutement, mais comme une prestation transfrontalière.",
  teaserLink: 'Voir la forme envisagée',

  featured: {
    company: 'Sakura Trading Co., Ltd.',
    industry: 'Export alimentaire / 58 salariés',
    title: 'Nous ne suivons plus les demandes de notre boutique à l’international',
    problem: "Nous vendons en anglais et en français depuis deux ans, et le traitement des demandes ne suit plus. Deux collaborateurs japonais y répondent à l'aide d'outils de traduction. Les réponses prennent trois jours en moyenne, et nous perdons une dizaine de commandes par mois annulées entre-temps.\n\nLes traductions ont aussi créé des malentendus : un client a lu notre date de durabilité minimale comme une date de péremption, et nous avons dû le rembourser. Aucun budget de recrutement cette année.",
    lookingFor: "Répondre sous un jour ouvré, sans recruter. Un support multilingue parfait n'est pas nécessaire ; moins d'annulations suffirait déjà.",
    areas: ['Support client', 'Multilingue', 'Conception des processus', 'IA générative'],
    deadline: '14 novembre 2026',
    reward: "100 000 JPY en espèces. Nous envisageons de poursuivre avec la personne retenue en prestation (environ 200 000 JPY par mois, trois mois).",
    proposals: [
      {
        author: 'Aminata D.',
        headline: 'Opérations e-commerce / FR, EN, JA / 5 ans au Japon, aujourd’hui à Dakar',
        state: 'awarded',
        stateLabel: 'Retenue',
        approach: "Je commencerais par réduire le nombre de demandes plutôt que par y répondre plus vite.\n\nD'après votre description, les trois jours sont un symptôme. J'ai géré une boutique transfrontalière à Tokyo pendant cinq ans : six demandes sur dix portaient sur une information absente de la fiche produit.\n\nJe vis aujourd'hui à Dakar, donc je suis exactement la cliente qui achète dans une boutique japonaise comme la vôtre. Vu d'ici, ce qui manque saute aux yeux. La date est un problème d'étiquetage : ici, l'ordre des dates lui-même diffère.\n\nL'ordre serait : classer trois mois de demandes passées, ajouter les dix informations manquantes les plus fréquentes aux fiches produit, puis rédiger des modèles pour le reste.",
        result: "Le volume de demandes devrait environ diminuer de moitié. Le reste se traite immédiatement par modèles, donc un jour ouvré est atteignable sans recrutement. La question des dates se règle par la mention « Best before » et un format de date explicite.",
      },
      {
        author: 'Joseph O.',
        headline: 'Développement backend / Python / 3 ans à Tokyo',
        state: 'shortlisted',
        stateLabel: 'Présélectionné',
        approach: "Entraîner un classifieur sur vos anciens e-mails et lui faire rédiger automatiquement les brouillons de réponse.\n\nIntégré à votre messagerie actuelle, vos collaborateurs n'auraient plus qu'à lire, corriger et envoyer. Un glossaire fige la traduction des termes souvent mal rendus.",
        result: "Le temps de traitement par demande baisse suffisamment pour que les deux mêmes personnes répondent le jour même. Trois à quatre semaines de mise en place.",
      },
      {
        author: 'Selamawit B.',
        headline: 'Customer success / EN, amharique / 2 ans au Japon, aujourd’hui à Addis-Abeba',
        state: 'submitted',
        stateLabel: 'Soumise',
        approach: "Utiliser le décalage horaire au lieu de le subir. Addis-Abeba a six heures de moins que Tokyo : votre nuit est ma fin d'après-midi. Environ dix heures par semaine en prestation suffiraient. Pour les clients européens et africains, c'est le milieu de leur journée.",
        result: "Réponses le jour même en heure européenne, et charge allégée pour vos deux collaborateurs.",
      },
    ],
  },

  others: [
    {
      company: 'Kita-Kanto Precision Industries',
      title: "Notre formation sécurité n'existe qu'en japonais",
      summary: "Nous employons douze personnes étrangères. La formation à la sécurité se fait avec des documents japonais et des explications orales, sans moyen de vérifier la compréhension. L'apprendre après un accident serait trop tard.",
      areas: ['Industrie', 'Ingénierie pédagogique', 'Multilingue', 'Sécurité'],
    },
    {
      company: 'Minori Foods Co., Ltd.',
      title: 'Nous voulons aborder les marchés africains sans savoir par où commencer',
      summary: "Nous fabriquons des nouilles sèches et des condiments. Nous envisageons d'exporter vers l'Afrique, mais personne en interne ne peut évaluer les propositions des maisons de commerce. Commencez par nous dire à quoi ressemble la vie quotidienne là-bas.",
      areas: ['Étude de marché', 'Alimentaire', 'Export', 'Connaissance du terrain'],
    },
  ],
}

const COPY: Record<Lang, DemoCopy> = { ja, en, fr }

export function challengeDemo(lang: Lang): DemoCopy {
  return COPY[lang] ?? ja
}
