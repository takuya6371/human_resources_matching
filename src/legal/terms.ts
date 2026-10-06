import type { LegalDocSet } from './types'

// ============================================================
// 利用規約
//
// 実装に合わせて書いている。変更するときは対応する挙動も確認すること:
//   第6条 審査と掲載      → profiles.status / AdminTalentReviewPage
//   第7条 公開範囲        → profiles_preview ビュー / profile_private テーブル
//   第8条 履歴書の自動処理 → supabase/functions/parse-cv
//   第9条 自動翻訳        → supabase/functions/translate
//   第11条 メッセージ審査  → supabase/functions/send-message の screen()
//   第12条 相談ボード      → board_threads / board_replies の RLS
// ============================================================

export const terms: LegalDocSet = {
  ja: {
    title: '利用規約',
    intro: [
      '本利用規約（以下「本規約」といいます）は、{{name}}（以下「当社」といいます）が提供する人材と企業のマッチングサービス「{{serviceName}}」（以下「本サービス」といいます）の利用条件を定めるものです。本サービスを利用する方（以下「利用者」といいます）は、本規約に同意したうえで本サービスを利用するものとします。',
    ],
    blocks: [
      {
        heading: '第1条（適用）',
        list: [
          '本規約は、本サービスの利用に関する当社と利用者との間の一切の関係に適用されます。',
          '当社が本サービス上で個別に定める注意事項、ガイドラインその他の定めは、本規約の一部を構成します。',
          '本規約の内容と前項の個別の定めが矛盾する場合は、個別の定めが優先します。',
        ],
      },
      {
        heading: '第2条（定義）',
        list: [
          '「人材」とは、就業先または業務委託先を探す目的で本サービスに登録した個人をいいます。',
          '「企業」とは、人材の採用または業務委託を目的として本サービスに登録した法人その他の団体をいいます。',
          '「アカウント」とは、利用者が本サービスを利用するために登録する資格をいいます。',
          '「登録情報」とは、利用者がアカウントに関連して当社に提供した情報（プロフィール、履歴書ファイル、投稿、メッセージを含みます）をいいます。',
          '「公開プロフィール」とは、第7条に定める範囲で企業に対して表示される人材の登録情報をいいます。',
        ],
      },
      {
        heading: '第3条（本サービスの内容）',
        paragraphs: [
          '本サービスは、日本に在住する外国籍の人材と、国内外で事業を行う企業とが相互に情報を把握し、連絡を取るための場を提供するものです。',
        ],
        list: [
          '当社は、人材と企業との間の雇用契約、業務委託契約その他の契約の当事者となりません。契約条件の交渉、締結、履行および紛争の解決は、人材と企業が自らの責任で行うものとします。',
          '当社は、人材に対して特定の企業への就業を、企業に対して特定の人材の採用を、それぞれ保証または推奨するものではありません。',
          '当社は、本サービスを通じて採用、就業、受注その他の成果が得られることを保証しません。',
        ],
      },
      {
        heading: '第4条（アカウント登録）',
        list: [
          '本サービスの利用を希望する者は、当社の定める方法により登録を申請し、当社がこれを承認することによってアカウントが作成されます。',
          '利用者は、登録に際して真実かつ正確な情報を提供しなければなりません。',
          '人材のアカウントは、登録する本人が自ら登録するものとし、第三者が本人に代わって登録することはできません。',
          '企業のアカウントは、当該企業において本サービスの利用について権限を有する者が登録するものとします。',
          '当社は、登録申請者が過去に本規約に違反したことがある場合、提供された情報に虚偽がある場合その他当社が不適当と判断した場合には、登録を承認しないことがあります。この場合、当社はその理由を開示する義務を負いません。',
        ],
      },
      {
        heading: '第5条（アカウントの管理）',
        list: [
          '利用者は、自己の責任においてメールアドレスおよびパスワードを管理するものとし、これを第三者に利用させ、または譲渡、貸与してはなりません。',
          'メールアドレスおよびパスワードの組み合わせによって行われた本サービス上の行為は、当該アカウントの利用者による行為とみなします。',
          'アカウントが第三者に利用されたことが判明した場合、利用者は直ちに当社に通知するものとします。',
        ],
      },
      {
        heading: '第6条（プロフィールの審査と掲載）',
        list: [
          '人材が登録したプロフィールは、当社の審査を経て承認された場合に限り、企業に対して表示されます。',
          '審査では、記載内容の整合性、本サービスの目的との適合性その他当社が必要と認める事項を確認します。',
          '当社は、審査の結果として承認、保留または非承認の判断を行います。当社は審査の基準および個別の判断理由を開示する義務を負いません。',
          '当社は、いったん承認したプロフィールについても、記載内容の変更、第13条に定める禁止事項への該当その他の事由があるときは、表示を停止し、または再度の審査を行うことができます。',
          '審査および掲載は、当社が記載内容の真実性、正確性または最新性を保証するものではありません。',
        ],
      },
      {
        heading: '第7条（登録情報の公開範囲）',
        paragraphs: [
          '人材の登録情報は、情報の種類に応じて次の範囲で取り扱われます。詳細はプライバシーポリシーに定めます。',
        ],
        table: {
          head: ['情報の種類', '閲覧できる者'],
          rows: [
            ['分野、国、日本語レベル、スキル、学歴、居住エリア（都道府県等の単位）、就業可能時期', '本サービスの閲覧者（未登録者を含む）'],
            ['氏名、顔写真、自己紹介、職務経歴、語学、動画、帰国予定時期その他の公開プロフィール', '承認後、企業のアカウント'],
            ['メールアドレス、生年月日、性別、国籍、住所、通勤時間、配偶者および扶養家族の有無、当社の審査記録', '本人および当社のみ（企業は閲覧できません）'],
            ['履歴書等のアップロードしたファイル', '本人および当社のみ'],
            ['相談ボードの投稿', '人材のアカウントおよび当社のみ（企業は閲覧できません）。他の人材からは投稿者名が表示されません'],
            ['メッセージ', '当該やり取りの当事者および当社のみ'],
          ],
        },
        list: [
          '人材は、公開プロフィールに掲載される内容を、本サービス上の設定により変更することができます。',
          '企業は、本サービスを通じて知り得た人材の情報を、採用または業務委託の検討の目的以外に利用してはならず、第三者に提供してはなりません。',
        ],
      },
      {
        heading: '第8条（履歴書等のアップロードと自動処理）',
        list: [
          '人材は、履歴書その他の書類をアップロードし、記載内容をプロフィールに取り込むことができます。',
          '前項の取り込みは、第9条に定める外部の生成AIサービスを利用した自動的な読み取りによって行われます。アップロードされたファイルの内容は、当該サービスに送信されます。',
          '自動的な読み取りの結果には、誤り、欠落または解釈の相違が含まれることがあります。利用者は、プロフィールとして保存する前に内容を自ら確認するものとし、当社は読み取り結果の正確性を保証しません。',
          '利用者は、自己が権利を有するか、または適法に利用できるファイルのみをアップロードするものとします。第三者の個人情報が含まれる場合は、当該第三者の同意を得たうえでアップロードするものとします。',
        ],
      },
      {
        heading: '第9条（自動翻訳および外部サービスの利用）',
        list: [
          '本サービスは、プロフィール、メッセージその他の文章について、Google LLC が提供する生成AIサービス（Gemini API）を利用した機械翻訳および自動審査を行います。',
          '機械翻訳の結果は原文と意味が異なることがあります。翻訳結果と原文が矛盾する場合は、利用者が入力した原文を基準とします。',
          '当社は、外部サービスの仕様変更、停止その他の事由により、翻訳または自動審査の機能を変更または終了することがあります。',
        ],
      },
      {
        heading: '第10条（企業の義務）',
        list: [
          '企業は、本サービスに掲載する求人および自社の情報について、真実かつ正確な内容を記載しなければなりません。',
          '企業は、募集、選考および契約の各段階において、労働基準法、職業安定法、出入国管理及び難民認定法、労働者派遣法その他の関係法令を遵守しなければなりません。',
          '企業は、人種、国籍、民族、信条、性別、社会的出身、障害、その他の事由による不当な差別的取扱いを行ってはなりません。',
          '企業は、本サービスを通じて人材と連絡を取る目的が、採用または業務委託の検討にあることを明示しなければならず、営業、勧誘その他の目的で人材に連絡してはなりません。',
          '企業は、本サービスを通じて取得した情報を、自社の採用管理の範囲を超えて蓄積し、または他の企業と共有してはなりません。',
        ],
      },
      {
        heading: '第11条（メッセージ機能）',
        list: [
          '人材と企業は、本サービス上のメッセージ機能を通じて連絡を取ることができます。',
          '当社は、メッセージの内容について、第9条に定める外部サービスを利用した自動的な審査を行います。審査は、本サービスの安全を確保する目的に限って行われます。',
          '審査の結果、本規約に違反する内容または違反のおそれがある内容が検出された場合、当社は、当該メッセージの送信を保留し、警告を表示し、やり取りを停止し、または第15条の措置を講じることができます。',
          '当社は、メッセージの内容を常時監視する義務を負わず、また、すべての不適切な内容を検出することを保証しません。',
          '利用者は、本サービス外の連絡手段に移行した後のやり取りについて、自己の責任で行うものとします。',
        ],
      },
      {
        heading: '第12条（相談ボード）',
        list: [
          '相談ボードは、人材が在留資格、就業、帰国その他の事柄について相談し、情報を交換するための場です。企業のアカウントは相談ボードを閲覧できません。',
          '相談ボードにおける投稿者名は、当社の投稿を除き、他の利用者に表示されません。ただし、投稿内容から投稿者が識別されることがあるため、利用者は投稿する情報の範囲を自ら判断するものとします。',
          '当社または他の利用者による回答は、一般的な情報の提供であって、法律、在留資格、税務その他の個別の専門的助言ではありません。具体的な手続については、所管の官公庁または資格を有する専門家に確認するものとします。',
          '当社は、投稿が第13条に定める禁止事項に該当するときは、これを削除することができます。',
        ],
      },
      {
        heading: '第13条（禁止事項）',
        paragraphs: ['利用者は、本サービスの利用にあたり、次の行為を行ってはなりません。'],
        list: [
          '法令または公序良俗に違反する行為',
          '犯罪行為に関連する行為',
          '虚偽の情報を登録し、または他人になりすます行為',
          '他の利用者の個人情報を、本サービスの目的の範囲を超えて収集し、蓄積し、または第三者に提供する行為',
          '他の利用者に対する誹謗中傷、脅迫、差別的言動、ハラスメントその他の迷惑行為',
          '本サービスを通じて知り得た人材の情報を、採用または業務委託の検討以外の目的で利用する行為',
          '本サービスを、求人または求職と無関係な営業、勧誘、宣伝または金銭の要求のために利用する行為',
          '就業に先立って、人材に対し金銭、保証金その他の経済的負担を求める行為',
          '本サービスの運営を妨害する行為、過度の負荷をかける行為、または不正にアクセスする行為',
          '本サービスを自動的な手段により機械的に読み取り、または複製する行為',
          '当社または第三者の知的財産権、肖像権、プライバシーその他の権利を侵害する行為',
          'その他、当社が不適切と判断する行為',
        ],
      },
      {
        heading: '第14条（登録情報の権利）',
        list: [
          '利用者が本サービスに登録または投稿した情報の権利は、当該利用者または正当な権利者に帰属します。',
          '利用者は当社に対し、本サービスの提供、運営、改善および広報のために必要な範囲で、登録情報を無償で利用（複製、翻訳、翻案、公開範囲に応じた表示を含みます）することを許諾します。',
          '前項の広報のための利用にあたり、個人を識別できる情報を含む形で公表する場合は、あらかじめ本人の同意を得るものとします。',
        ],
      },
      {
        heading: '第15条（利用の停止および登録の抹消）',
        paragraphs: [
          '当社は、利用者が次のいずれかに該当する場合、事前の通知なく、登録情報の表示停止、本サービスの利用停止またはアカウントの抹消を行うことができます。',
        ],
        list: [
          '本規約に違反した場合',
          '登録情報に虚偽の事実があることが判明した場合',
          '支払いの停止、破産手続の開始その他の信用状態の悪化が認められる場合',
          '当社からの連絡に対し、相当の期間が経過しても応答がない場合',
          'その他、本サービスの利用を継続することが適当でないと当社が判断した場合',
        ],
      },
      {
        heading: '第16条（本サービスの変更、中断および終了）',
        list: [
          '当社は、利用者への事前の通知なく、本サービスの内容を変更し、または機能を追加または廃止することができます。',
          '当社は、システムの保守、障害、天災その他の事由により、本サービスの提供を中断することができます。緊急の場合を除き、あらかじめ告知します。',
          '当社は、相当の予告期間をもって告知することにより、本サービスの全部または一部を終了することができます。',
          '前各項により利用者に生じた損害について、当社は責任を負いません。',
        ],
      },
      {
        heading: '第17条（免責）',
        list: [
          '当社は、本サービスに掲載された情報の真実性、正確性、完全性および最新性について保証しません。',
          '当社は、人材と企業との間、または利用者間に生じた交渉、契約、紛争について、当事者となるものではなく、責任を負いません。ただし、当社は必要と認める場合に限り、事実関係の確認その他の対応を行うことがあります。',
          '当社は、本サービスが利用者の特定の目的に適合すること、期待する機能を有すること、および中断、エラーまたは不具合が生じないことを保証しません。',
          '当社は、外部サービスの障害または仕様変更に起因して生じた損害について、責任を負いません。',
        ],
      },
      {
        heading: '第18条（損害賠償）',
        list: [
          '利用者が本規約に違反して当社に損害を与えた場合、当社は当該利用者に対しその賠償を請求することができます。',
          '当社の責めに帰すべき事由により利用者に損害が生じた場合、当社の賠償責任は、当該損害が発生した時点から過去1年間に当該利用者が当社に支払った利用料金の額を上限とします。本サービスが無償で提供されている場合の上限額は、1万円とします。',
          '前項は、当社に故意または重大な過失がある場合には適用しません。',
          '当社は、いかなる場合においても、逸失利益、事業の機会の喪失その他の間接損害について責任を負いません。',
        ],
      },
      {
        heading: '第19条（利用料金）',
        list: [
          '本サービスは、現在、人材および企業のいずれに対しても無償で提供されています。',
          '当社が有償の機能を導入する場合は、その内容、料金および支払方法を、適用開始前に本サービス上で告知します。',
        ],
      },
      {
        heading: '第20条（本規約の変更）',
        list: [
          '当社は、必要と認める場合、本規約を変更することができます。',
          '本規約を変更する場合、当社は、変更後の内容および効力発生日を、効力発生日より前に本サービス上に表示します。利用者に重大な影響を及ぼす変更については、相当の予告期間を置きます。',
          '変更後に利用者が本サービスを利用したときは、変更後の本規約に同意したものとみなします。',
        ],
      },
      {
        heading: '第21条（連絡および通知）',
        paragraphs: [
          '当社から利用者への連絡は、本サービス上の表示または登録されたメールアドレスへの送信により行います。利用者から当社への連絡は、本サービスのお問い合わせ窓口または {{contactEmail}} までお願いします。',
        ],
      },
      {
        heading: '第22条（準拠法および管轄）',
        list: [
          '本規約の解釈および適用には、日本法を準拠法とします。',
          '本サービスまたは本規約に関して生じた紛争については、{{court}} を第一審の専属的合意管轄裁判所とします。',
        ],
      },
      {
        heading: '第23条（言語）',
        paragraphs: [
          '本規約は日本語を正文とします。日本語以外の言語による表示は参考のための訳文であり、日本語の本文と相違がある場合は日本語の本文が優先します。',
        ],
      },
    ],
    dateLabel: { effective: '施行日', revised: '最終改定日' },
  },

  en: {
    title: 'Terms of Service',
    intro: [
      'These Terms of Service ("Terms") set out the conditions for using {{serviceName}} ("the Service"), the talent-matching service operated by {{name}} ("we", "us"). By using the Service, you ("you", "the User") agree to these Terms.',
      'The Japanese text of these Terms is the governing version. This English text is provided for reference only; if the two differ, the Japanese text prevails.',
    ],
    blocks: [
      {
        heading: 'Article 1 (Scope)',
        list: [
          'These Terms apply to all relations between us and Users concerning the Service.',
          'Guidelines, notices and other rules that we publish separately within the Service form part of these Terms.',
          'Where these Terms conflict with such separate rules, the separate rules prevail.',
        ],
      },
      {
        heading: 'Article 2 (Definitions)',
        list: [
          '"Talent" means an individual who registers with the Service in order to find employment or contract work.',
          '"Company" means a corporation or other organisation that registers with the Service in order to hire or contract with Talent.',
          '"Account" means the registration that entitles a User to use the Service.',
          '"Registered Information" means information a User provides to us in connection with an Account, including profiles, uploaded CV files, posts and messages.',
          '"Public Profile" means the Registered Information of a Talent that is shown to Companies within the scope set out in Article 7.',
        ],
      },
      {
        heading: 'Article 3 (Nature of the Service)',
        paragraphs: [
          'The Service provides a place where foreign professionals residing in Japan and companies operating in Japan and abroad can see each other\'s information and get in contact.',
        ],
        list: [
          'We are not a party to any employment, service or other contract between a Talent and a Company. Negotiating, concluding and performing such contracts, and resolving any dispute arising from them, are the responsibility of the Talent and the Company.',
          'We do not guarantee or recommend any particular Company to a Talent, or any particular Talent to a Company.',
          'We do not guarantee that using the Service will result in hiring, employment, a contract or any other outcome.',
        ],
      },
      {
        heading: 'Article 4 (Registration)',
        list: [
          'An Account is created when an applicant applies in the manner we specify and we approve the application.',
          'Users must provide information that is true and accurate.',
          'A Talent Account must be registered by the individual themselves; no third party may register on their behalf.',
          'A Company Account must be registered by a person authorised within that Company to use the Service.',
          'We may decline an application, including where the applicant has previously breached these Terms, where the information provided is false, or where we otherwise consider the application unsuitable. We are not obliged to disclose our reasons.',
        ],
      },
      {
        heading: 'Article 5 (Account security)',
        list: [
          'Users are responsible for managing their email address and password, and must not allow a third party to use them or transfer or lend them.',
          'Any action taken on the Service using a given email address and password is deemed to be an action of the User of that Account.',
          'Users must notify us immediately if they discover that their Account has been used by a third party.',
        ],
      },
      {
        heading: 'Article 6 (Profile review and publication)',
        list: [
          'A Talent profile is shown to Companies only after we have reviewed and approved it.',
          'In our review we check the internal consistency of the profile, its fit with the purpose of the Service, and any other matter we consider necessary.',
          'We approve, hold or decline a profile as a result of the review. We are not obliged to disclose our review criteria or the reasons for an individual decision.',
          'Even after approval, we may suspend display of a profile or review it again where its content has changed, where it falls within Article 13, or for other reasons.',
          'Review and publication do not constitute any warranty by us as to the truth, accuracy or currency of the content.',
        ],
      },
      {
        heading: 'Article 7 (Who can see what)',
        paragraphs: [
          'Registered Information of a Talent is handled within the following scopes. Further detail is set out in the Privacy Policy.',
        ],
        table: {
          head: ['Type of information', 'Who can see it'],
          rows: [
            ['Field, country, Japanese level, skills, education, area of residence (prefecture level), availability', 'Anyone viewing the Service, including people who are not registered'],
            ['Name, photograph, self-introduction, work history, languages, video, planned return date and other Public Profile items', 'Company Accounts, after approval'],
            ['Email address, date of birth, gender, nationality, address, commuting time, spouse and dependants, our internal review notes', 'Only the Talent themselves and us. Companies cannot see these.'],
            ['Uploaded CV and other files', 'Only the Talent themselves and us'],
            ['Posts on the consultation board', 'Only Talent Accounts and us. Companies cannot see the board, and other Talent do not see the author\'s name.'],
            ['Messages', 'Only the parties to that exchange and us'],
          ],
        },
        list: [
          'Talent may change what appears in their Public Profile using the settings in the Service.',
          'Companies must not use information about Talent obtained through the Service for any purpose other than considering hiring or contracting, and must not provide it to any third party.',
        ],
      },
      {
        heading: 'Article 8 (Uploading CVs and automated processing)',
        list: [
          'Talent may upload a CV or other document and import its contents into their profile.',
          'That import is performed by automated reading using the external generative-AI service referred to in Article 9. The contents of the uploaded file are transmitted to that service.',
          'Automated reading may produce errors, omissions or differences of interpretation. Users must check the content themselves before saving it as their profile, and we do not warrant the accuracy of the result.',
          'Users may upload only files they own or may lawfully use. Where a file contains the personal information of a third party, the User must obtain that person\'s consent before uploading.',
        ],
      },
      {
        heading: 'Article 9 (Machine translation and external services)',
        list: [
          'The Service performs machine translation and automated screening of profiles, messages and other text using a generative-AI service provided by Google LLC (the Gemini API).',
          'Machine translation may differ in meaning from the original. Where a translation conflicts with the original, the text as entered by the User governs.',
          'We may change or discontinue the translation or screening functions as a result of changes to, or the suspension of, external services.',
        ],
      },
      {
        heading: 'Article 10 (Obligations of Companies)',
        list: [
          'Companies must publish true and accurate information about their job postings and about themselves.',
          'Companies must comply with the Labour Standards Act, the Employment Security Act, the Immigration Control and Refugee Recognition Act, the Worker Dispatch Act and other applicable laws at every stage of recruitment, selection and contracting.',
          'Companies must not discriminate unfairly on grounds of race, nationality, ethnicity, creed, sex, social origin, disability or any other such ground.',
          'When contacting Talent through the Service, Companies must make clear that their purpose is to consider hiring or contracting, and must not contact Talent for sales, solicitation or other purposes.',
          'Companies must not accumulate information obtained through the Service beyond the scope of their own recruitment management, and must not share it with other companies.',
        ],
      },
      {
        heading: 'Article 11 (Messaging)',
        list: [
          'Talent and Companies may contact each other using the messaging function of the Service.',
          'We screen message content automatically using the external service referred to in Article 9. Screening is carried out solely to keep the Service safe.',
          'Where screening detects content that breaches, or may breach, these Terms, we may hold the message, display a warning, suspend the exchange, or take the measures set out in Article 15.',
          'We are under no obligation to monitor message content continuously, and we do not guarantee that we will detect all inappropriate content.',
          'Users act at their own risk in any exchange that continues outside the Service.',
        ],
      },
      {
        heading: 'Article 12 (Consultation board)',
        list: [
          'The consultation board is a place for Talent to ask about and exchange information on residence status, work, returning home and similar matters. Company Accounts cannot see the board.',
          'Author names on the board are not shown to other Users, except for our own posts. Because the content of a post may nevertheless identify its author, Users should judge for themselves what information to post.',
          'Answers given by us or by other Users are general information, not individual legal, immigration, tax or other professional advice. For specific procedures, please confirm with the competent authority or a qualified professional.',
          'We may delete a post that falls within Article 13.',
        ],
      },
      {
        heading: 'Article 13 (Prohibited conduct)',
        paragraphs: ['Users must not do any of the following when using the Service.'],
        list: [
          'Acts that breach law or public order and morals',
          'Acts connected with criminal activity',
          'Registering false information or impersonating another person',
          'Collecting, accumulating or providing to third parties the personal information of other Users beyond the purpose of the Service',
          'Defamation, threats, discriminatory conduct, harassment or other nuisance towards other Users',
          'Using information about Talent obtained through the Service for any purpose other than considering hiring or contracting',
          'Using the Service for sales, solicitation, advertising or demands for money unrelated to recruitment or job-seeking',
          'Requiring a Talent to pay money, a deposit or bear any other financial burden before starting work',
          'Interfering with the operation of the Service, placing an excessive load on it, or gaining unauthorised access',
          'Reading or copying the Service mechanically by automated means',
          'Infringing the intellectual property, likeness, privacy or other rights of us or any third party',
          'Any other conduct we consider inappropriate',
        ],
      },
      {
        heading: 'Article 14 (Rights in Registered Information)',
        list: [
          'Rights in information a User registers or posts on the Service belong to that User or to the rightful owner.',
          'Users grant us a royalty-free licence to use Registered Information (including reproduction, translation, adaptation and display according to the applicable visibility scope) to the extent necessary to provide, operate, improve and publicise the Service.',
          'Where use for publicity under the preceding paragraph would publish information that identifies an individual, we will obtain that person\'s consent in advance.',
        ],
      },
      {
        heading: 'Article 15 (Suspension and termination of Accounts)',
        paragraphs: [
          'We may, without prior notice, suspend display of Registered Information, suspend use of the Service or delete an Account where a User:',
        ],
        list: [
          'breaches these Terms;',
          'is found to have registered false information;',
          'suspends payments, enters bankruptcy proceedings or otherwise suffers a deterioration in creditworthiness;',
          'fails to respond to our contact for a reasonable period; or',
          'is, in our judgement, otherwise not suitable to continue using the Service.',
        ],
      },
      {
        heading: 'Article 16 (Changes, interruption and discontinuation)',
        list: [
          'We may change the content of the Service and add or remove functions without prior notice to Users.',
          'We may interrupt the Service for maintenance, failures, natural disasters or other reasons. Except in an emergency, we will give notice in advance.',
          'We may discontinue all or part of the Service by giving notice with a reasonable notice period.',
          'We are not liable for loss arising to Users under the preceding paragraphs.',
        ],
      },
      {
        heading: 'Article 17 (Disclaimers)',
        list: [
          'We do not warrant the truth, accuracy, completeness or currency of information published on the Service.',
          'We are not a party to, and are not liable for, negotiations, contracts or disputes between Talent and Companies or between Users. We may, however, where we consider it necessary, confirm the facts or take other action.',
          'We do not warrant that the Service is fit for a User\'s particular purpose, that it has the functions a User expects, or that it will be free from interruption, error or defect.',
          'We are not liable for loss arising from the failure of, or changes to, external services.',
        ],
      },
      {
        heading: 'Article 18 (Liability)',
        list: [
          'Where a User causes us loss in breach of these Terms, we may claim compensation from that User.',
          'Where a User suffers loss due to a cause attributable to us, our liability is limited to the fees that User paid us in the one year before the loss arose. Where the Service is provided free of charge, that limit is JPY 10,000.',
          'The preceding paragraph does not apply where we have acted with intent or gross negligence.',
          'We are in no case liable for lost profits, lost business opportunities or other indirect loss.',
        ],
      },
      {
        heading: 'Article 19 (Fees)',
        list: [
          'The Service is currently provided free of charge to both Talent and Companies.',
          'If we introduce paid functions, we will publish their content, price and payment method within the Service before they take effect.',
        ],
      },
      {
        heading: 'Article 20 (Changes to these Terms)',
        list: [
          'We may change these Terms where we consider it necessary.',
          'Where we change these Terms, we will display the amended content and its effective date within the Service before that date. For changes that materially affect Users, we will allow a reasonable notice period.',
          'A User who uses the Service after a change takes effect is deemed to have agreed to the amended Terms.',
        ],
      },
      {
        heading: 'Article 21 (Notices)',
        paragraphs: [
          'We contact Users by displaying a notice within the Service or by sending it to the registered email address. Users may contact us through the enquiry form in the Service or at {{contactEmail}}.',
        ],
      },
      {
        heading: 'Article 22 (Governing law and jurisdiction)',
        list: [
          'These Terms are governed by and construed in accordance with the laws of Japan.',
          'Any dispute concerning the Service or these Terms is subject to the exclusive jurisdiction of {{court}} as the court of first instance.',
        ],
      },
      {
        heading: 'Article 23 (Language)',
        paragraphs: [
          'The Japanese text of these Terms is the governing version. Text in any other language is a reference translation, and the Japanese text prevails in the event of any difference.',
        ],
      },
    ],
    dateLabel: { effective: 'Effective', revised: 'Last revised' },
  },
}
