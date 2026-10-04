import type { LegalDocSet } from './types'

// ============================================================
// プライバシーポリシー
//
// 実装に書いてあることだけを書く。機能を足したらここも足すこと。
// 現時点で外部に個人データが出ていく先は3つだけ:
//   Google LLC (Gemini API)  履歴書の読み取り・翻訳・メッセージの自動審査
//   Supabase Inc.            DB・認証・ファイル保管（東京リージョン）
//   Netlify, Inc.            画面の配信とアクセスログ
// DIDIT の本人確認はEdge Functionが存在するが画面から呼ばれていないため
// 記載していない。提供を開始する時点で第5条と第6条に追記すること。
// ============================================================

export const privacy: LegalDocSet = {
  ja: {
    title: 'プライバシーポリシー',
    intro: [
      '{{name}}（以下「当社」といいます）は、当社が提供する人材と企業のマッチングサービス（以下「本サービス」といいます）において取得する個人情報を、個人情報の保護に関する法律その他の法令を遵守し、本ポリシーに従って取り扱います。',
    ],
    blocks: [
      {
        heading: '1. 事業者',
        table: {
          head: ['項目', '内容'],
          rows: [
            ['名称', '{{name}}'],
            ['代表者', '{{representative}}'],
            ['所在地', '{{address}}'],
            ['個人情報に関する問い合わせ先', '{{contactEmail}}'],
          ],
        },
      },
      {
        heading: '2. 取得する情報',
        paragraphs: ['当社は、本サービスの提供にあたり、次の情報を取得します。'],
        table: {
          head: ['区分', '具体的な項目'],
          rows: [
            ['アカウント情報', 'メールアドレス、パスワード（当社は暗号化された値のみを保有し、平文のパスワードを知り得ません）、登録日時、最終ログイン日時'],
            ['人材のプロフィール', '氏名（英語・日本語）、顔写真、国、居住エリア、分野、大学・学部・学位・卒業年、日本語レベル、語学、スキル、職務経歴、自己紹介、就業可能時期、在日年数、趣味、動画のURL、帰国予定時期'],
            ['人材の非公開情報', '生年月日、性別、国籍、郵便番号、住所、通勤時間、配偶者の有無、扶養家族の人数'],
            ['アップロードされたファイル', '履歴書その他の書類、プロフィール写真'],
            ['企業の情報', '企業名、事業内容、業種、規模、ウェブサイト、ロゴ、求人の内容'],
            ['活動の記録', '応募とその内容、連絡希望、メッセージの本文および自動翻訳、相談ボードの投稿、投稿へのコメント、いいね、フォロー、保存した項目、通知'],
            ['お問い合わせ', 'お名前、会社名、メールアドレス、お問い合わせ種別、お問い合わせ内容'],
            ['審査に関する記録', 'プロフィールの審査状況、当社が内部で記録する審査メモ、メッセージの自動審査の結果'],
            ['技術的な情報', 'IPアドレス、ブラウザの種類、アクセス日時、参照元のURL'],
          ],
        },
      },
      {
        heading: '3. 取得の方法',
        list: [
          '利用者が本サービスの画面に入力し、またはファイルをアップロードすることにより取得します。',
          'アップロードされた履歴書については、第5条に定める外部サービスによる自動的な読み取りを行い、その結果を利用者が確認し保存した範囲で取得します。',
          '本サービスの利用に伴い、サーバーおよび配信基盤のログとして自動的に記録される情報を取得します。',
        ],
      },
      {
        heading: '4. 利用目的',
        paragraphs: ['当社は、取得した情報を次の目的のために利用します。'],
        list: [
          '本サービスの提供、本人確認およびアカウントの管理',
          '人材のプロフィールの審査、掲載の可否の判断および掲載',
          '人材と企業との間のマッチング、連絡の仲介および応募の管理',
          'プロフィールおよびメッセージの翻訳',
          '本サービスの安全確保を目的とした、メッセージおよび投稿の内容の確認',
          '利用者からのお問い合わせへの対応',
          '本サービスに関するお知らせおよび重要な通知の送信',
          '利用状況の分析による本サービスの改善および新機能の検討',
          '本規約に違反する行為への対応、不正利用の防止および紛争への対応',
          '法令に基づく対応',
        ],
      },
      {
        heading: '5. 外部サービスへの提供および委託',
        paragraphs: [
          '当社は、本サービスの提供に必要な範囲で、次の外部サービスを利用しています。いずれも日本国外に所在する事業者であり、個人データの取扱いの全部または一部を委託しています。',
        ],
        table: {
          head: ['委託先・外部サービス', '送信される情報と目的'],
          rows: [
            [
              'Google LLC（Gemini API／米国）',
              'アップロードされた履歴書の内容、プロフィールの文章、メッセージの本文。履歴書からの項目の読み取り、日本語と英語の相互翻訳、および安全確保のためのメッセージの自動審査に用います。',
            ],
            [
              'Supabase, Inc.（米国。データの保管場所は日本・東京リージョン）',
              '本ポリシー第2条に掲げる情報の全般。データベース、認証基盤およびファイル保管領域として用います。',
            ],
            [
              'Netlify, Inc.（米国）',
              'IPアドレス、ブラウザの種類、アクセス日時等の接続情報。画面の配信およびアクセスログの記録に用います。',
            ],
          ],
        },
        list: [
          '当社は、委託先との間で個人データの取扱いに関する契約を締結し、委託先における取扱いを監督します。',
          '各事業者が所在する国の個人情報保護制度に関する情報は、当社の問い合わせ窓口にご請求いただければ提供します。',
          '上記のほか、当社の役員および従業者のうち、業務上必要な者に限り、取得した情報を取り扱います。',
        ],
      },
      {
        heading: '6. 外国にある第三者への提供について',
        paragraphs: [
          '前条のとおり、当社は米国に所在する事業者に個人データの取扱いを委託しています。利用者は、本サービスの利用を開始することにより、この取扱いに同意したものとします。',
          'Supabase, Inc. については、データの物理的な保管場所を日本（東京リージョン）に指定していますが、同社は米国法人であるため、外国にある第三者への提供として記載しています。',
        ],
      },
      {
        heading: '7. 第三者提供',
        paragraphs: [
          '当社は、次の場合を除き、取得した個人データを第三者に提供しません。',
        ],
        list: [
          '本人の同意がある場合',
          '法令に基づく場合',
          '人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき',
          '国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることによりその事務の遂行に支障を及ぼすおそれがあるとき',
          '第5条に定める委託に伴って提供する場合',
        ],
      },
      {
        heading: '8. 本サービス内での公開範囲',
        paragraphs: [
          '本サービスは、情報の種類ごとに閲覧できる範囲を分けており、企業のアカウントからは技術的に取得できない情報があります。',
        ],
        table: {
          head: ['情報', '閲覧できる範囲'],
          rows: [
            ['分野、国、日本語レベル、スキル、学歴、居住エリア、就業可能時期', '本サービスの閲覧者（未登録者を含む）。氏名および連絡先は含まれません'],
            ['氏名、顔写真、自己紹介、職務経歴、語学、動画、帰国予定時期', '当社の承認を経たプロフィールに限り、企業のアカウント'],
            ['メールアドレス、生年月日、性別、国籍、住所、通勤時間、配偶者および扶養家族の有無、当社の審査メモ', '本人および当社のみ。企業のアカウントは閲覧できません'],
            ['アップロードした履歴書等のファイル', '本人および当社のみ'],
            ['相談ボードの投稿', '人材のアカウントおよび当社のみ。企業のアカウントは閲覧できません。他の人材には投稿者名が表示されません'],
            ['メッセージ', '当該やり取りの当事者および当社のみ'],
            ['企業のプロフィールおよび求人', '本サービスの閲覧者'],
          ],
        },
        list: [
          '人材のプロフィールは、当社が承認するまで企業に表示されません。',
          '利用者は、公開される項目を本サービスの設定により変更することができます。',
        ],
      },
      {
        heading: '9. 保存期間',
        list: [
          'アカウントおよびプロフィールの情報は、アカウントが存続する間、保存します。',
          '退会または登録の抹消があった場合、当社は、アカウントおよびプロフィールの情報を退会後6か月以内に削除します。',
          'アップロードされた履歴書等のファイルは、利用者が本サービス上で削除した時点、または退会後6か月以内のいずれか早い時点で削除します。',
          'メッセージ、応募およびその審査の記録は、紛争への対応および不正利用の防止のため、退会後1年間保存したうえで削除します。',
          'お問い合わせの記録は、受領から3年間保存します。',
          '法令により保存が義務づけられている情報については、当該法令の定める期間、保存します。',
        ],
      },
      {
        heading: '10. 安全管理措置',
        list: [
          '通信はすべて暗号化しています。',
          'データベースには行単位のアクセス制御を適用し、利用者の種別ごとに取得できる範囲を制限しています。',
          '生年月日、住所、家族構成その他の機微な情報および当社の審査メモは、企業に表示される情報とは別の領域に保存し、本人および当社以外は取得できない構成としています。',
          'アップロードされたファイルは、本人および当社のみがアクセスできる保管領域に保存しています。',
          '個人データを取り扱う従業者を必要な範囲に限定し、権限を管理しています。',
        ],
      },
      {
        heading: '11. Cookie等の取扱い',
        list: [
          '本サービスは、ログイン状態の維持と、選択された表示言語の保持にのみ、ブラウザの保存領域（ローカルストレージ）を使用します。いずれも本サービスの提供に必要なものです。',
          '当社は、アクセス解析、広告の配信および第三者による行動ターゲティングを目的とした Cookie を使用していません。そのため、Cookie の使用に関する同意を求める表示は行っていません。',
          '保存される値は、認証に用いるトークンと言語の選択のみであり、閲覧履歴や行動の記録は保存していません。',
          'ブラウザの設定により保存を無効にすることができますが、その場合はログインを維持できないなど、本サービスの一部を利用できなくなります。',
          '当社が解析または広告の目的でブラウザの保存領域を使用することとなった場合は、あらかじめ本ポリシーを改定し、必要な同意取得の手段を設けます。',
        ],
      },
      {
        heading: '12. 開示、訂正、削除等の請求',
        list: [
          '利用者は、自己の個人情報について、利用目的の通知、開示、内容の訂正、追加または削除、利用の停止、消去および第三者への提供の停止を請求することができます。',
          'プロフィールおよびアップロードしたファイルについては、本サービスの画面から利用者自身で修正および削除を行うことができます。',
          '前各項の請求は、{{contactEmail}} までご連絡ください。当社は、ご本人であることを確認したうえで、法令に従い対応します。',
          '請求への対応にあたり、当社は手数料を申し受けません。',
          '法令上、当社が応じられない場合があります。その場合は理由を付してご連絡します。',
        ],
      },
      {
        heading: '13. 未成年者の利用',
        paragraphs: [
          '本サービスは、就業または業務の受託を目的とする方を対象としています。18歳未満の方は、親権者その他の法定代理人の同意を得たうえで利用してください。',
        ],
      },
      {
        heading: '14. 本ポリシーの変更',
        paragraphs: [
          '当社は、本ポリシーを変更することがあります。変更後の内容は本サービス上に表示し、重要な変更については、効力発生日より前に相当の予告期間を置いて告知します。',
        ],
      },
      {
        heading: '15. お問い合わせ窓口',
        paragraphs: [
          '個人情報の取扱いに関するお問い合わせは、次の窓口までお願いします。',
          '{{name}}　{{privacyOfficer}}',
          'メール: {{contactEmail}}',
          '所在地: {{address}}',
        ],
      },
      {
        heading: '16. 言語',
        paragraphs: [
          '本ポリシーは日本語を正文とします。日本語以外の言語による表示は参考のための訳文であり、日本語の本文と相違がある場合は日本語の本文が優先します。',
        ],
      },
    ],
    dateLabel: { effective: '施行日', revised: '最終改定日' },
  },

  en: {
    title: 'Privacy Policy',
    intro: [
      '{{name}} ("we", "us") handles personal information obtained through the talent-matching service we operate ("the Service") in accordance with the Act on the Protection of Personal Information and other applicable laws of Japan, and in accordance with this Policy.',
      'The Japanese text of this Policy is the governing version. This English text is provided for reference only; if the two differ, the Japanese text prevails.',
    ],
    blocks: [
      {
        heading: '1. Who we are',
        table: {
          head: ['Item', 'Detail'],
          rows: [
            ['Name', '{{name}}'],
            ['Representative', '{{representative}}'],
            ['Address', '{{address}}'],
            ['Contact for privacy matters', '{{contactEmail}}'],
          ],
        },
      },
      {
        heading: '2. Information we collect',
        paragraphs: ['We collect the following information in order to provide the Service.'],
        table: {
          head: ['Category', 'Items'],
          rows: [
            ['Account', 'Email address, password (we hold only an encrypted value and cannot see the password itself), registration date, last sign-in'],
            ['Talent profile', 'Name (English and Japanese), photograph, country, area of residence, field, university, faculty, degree, year of graduation, Japanese level, languages, skills, work history, self-introduction, availability, years in Japan, interests, video URL, planned return date'],
            ['Talent private information', 'Date of birth, gender, nationality, postal code, address, commuting time, whether you have a spouse, number of dependants'],
            ['Uploaded files', 'CVs and other documents, profile photographs'],
            ['Company information', 'Company name, description, industry, size, website, logo, job postings'],
            ['Activity records', 'Applications and their content, contact requests, message text and its machine translation, posts on the consultation board, comments, likes, follows, saved items, notifications'],
            ['Enquiries', 'Your name, company, email address, enquiry type and message'],
            ['Review records', 'Profile review status, our internal review notes, results of automated message screening'],
            ['Technical information', 'IP address, browser type, access times, referring URL'],
          ],
        },
      },
      {
        heading: '3. How we collect it',
        list: [
          'From what Users enter in the Service or upload to it.',
          'For uploaded CVs, by automated reading using the external service described in section 5, to the extent that the User then checks and saves the result.',
          'Automatically, as server and delivery-platform logs generated when the Service is used.',
        ],
      },
      {
        heading: '4. Why we use it',
        paragraphs: ['We use the information we collect for the following purposes.'],
        list: [
          'Providing the Service, verifying identity and managing Accounts',
          'Reviewing Talent profiles, deciding whether to publish them, and publishing them',
          'Matching Talent with Companies, facilitating contact and managing applications',
          'Translating profiles and messages',
          'Checking the content of messages and posts in order to keep the Service safe',
          'Responding to enquiries',
          'Sending announcements and important notices about the Service',
          'Analysing usage in order to improve the Service and consider new functions',
          'Responding to breaches of the Terms, preventing misuse and dealing with disputes',
          'Complying with legal obligations',
        ],
      },
      {
        heading: '5. External services and processors',
        paragraphs: [
          'We use the following external services to the extent necessary to provide the Service. All are located outside Japan, and we entrust all or part of the handling of personal data to them.',
        ],
        table: {
          head: ['Processor / external service', 'What is sent, and why'],
          rows: [
            [
              'Google LLC (Gemini API, United States)',
              'The contents of uploaded CVs, profile text and message text. Used to extract fields from CVs, to translate between Japanese and English, and to screen messages automatically for safety.',
            ],
            [
              'Supabase, Inc. (United States; data stored in the Tokyo region of Japan)',
              'Generally all information listed in section 2. Used as our database, authentication system and file storage.',
            ],
            [
              'Netlify, Inc. (United States)',
              'Connection information such as IP address, browser type and access times. Used to deliver the site and to keep access logs.',
            ],
          ],
        },
        list: [
          'We have contracts with these processors covering their handling of personal data, and we supervise that handling.',
          'Information about the data-protection regime of the country in which each processor is located is available on request from our contact point.',
          'Apart from the above, our officers and employees handle the information only where their work requires it.',
        ],
      },
      {
        heading: '6. Transfers outside Japan',
        paragraphs: [
          'As set out in section 5, we entrust the handling of personal data to companies located in the United States. By starting to use the Service, Users consent to this.',
          'For Supabase, Inc. we have specified Japan (the Tokyo region) as the physical location in which data is stored, but because the company is incorporated in the United States we list it here as a transfer to a third party outside Japan.',
        ],
      },
      {
        heading: '7. Disclosure to third parties',
        paragraphs: ['We do not provide personal data to third parties except in the following cases.'],
        list: [
          'Where the individual has consented',
          'Where required by law',
          'Where necessary to protect a person\'s life, body or property and it is difficult to obtain consent',
          'Where it is necessary to co-operate with a national or local government body, or a person engaged by one, in carrying out statutory duties, and obtaining consent would impede those duties',
          'Where provision accompanies the outsourcing described in section 5',
        ],
      },
      {
        heading: '8. Who can see what within the Service',
        paragraphs: [
          'The Service separates visibility by type of information. Some information cannot be retrieved by a Company Account by any technical means.',
        ],
        table: {
          head: ['Information', 'Who can see it'],
          rows: [
            ['Field, country, Japanese level, skills, education, area of residence, availability', 'Anyone viewing the Service, including people who are not registered. Names and contact details are not included.'],
            ['Name, photograph, self-introduction, work history, languages, video, planned return date', 'Company Accounts, for profiles we have approved'],
            ['Email address, date of birth, gender, nationality, address, commuting time, spouse and dependants, our review notes', 'Only the individual and us. Company Accounts cannot see these.'],
            ['Uploaded CVs and other files', 'Only the individual and us'],
            ['Posts on the consultation board', 'Only Talent Accounts and us. Company Accounts cannot see the board, and other Talent do not see the author\'s name.'],
            ['Messages', 'Only the parties to that exchange and us'],
            ['Company profiles and job postings', 'Anyone viewing the Service'],
          ],
        },
        list: [
          'A Talent profile is not shown to Companies until we approve it.',
          'Users can change which items are published using the settings in the Service.',
        ],
      },
      {
        heading: '9. How long we keep it',
        list: [
          'Account and profile information is kept for as long as the Account exists.',
          'If an Account is closed or deleted, we delete the Account and profile information within six months.',
          'Uploaded CVs and other files are deleted when the User deletes them in the Service, or within six months of the Account closing, whichever is earlier.',
          'Messages, applications and screening records are kept for one year after the Account closes, so that we can deal with disputes and prevent misuse, and are then deleted.',
          'Enquiry records are kept for three years from receipt.',
          'Where law requires us to retain information, we keep it for the period that law specifies.',
        ],
      },
      {
        heading: '10. Security measures',
        list: [
          'All communications are encrypted.',
          'Row-level access control is applied to the database, limiting what each type of User can retrieve.',
          'Date of birth, address, family circumstances and other sensitive information, together with our review notes, are stored separately from the information shown to Companies, in a structure that only the individual and we can read.',
          'Uploaded files are held in storage accessible only to the individual and to us.',
          'Access to personal data is limited to the employees whose work requires it, and their permissions are managed.',
        ],
      },
      {
        heading: '11. Cookies and similar technologies',
        list: [
          'The Service uses browser storage (local storage) only to keep you signed in and to remember the display language you choose. Both are necessary to provide the Service.',
          'We do not use cookies for analytics, advertising or behavioural targeting by third parties. For that reason we do not show a cookie consent banner.',
          'The only values stored are your authentication token and your language choice. We do not store browsing history or records of your behaviour.',
          'You can disable storage in your browser, but parts of the Service, such as staying signed in, will then not work.',
          'If we ever use browser storage for analytics or advertising, we will amend this Policy in advance and put a means of obtaining consent in place.',
        ],
      },
      {
        heading: '12. Your rights',
        list: [
          'You may request notification of the purpose of use, disclosure, correction, addition or deletion of content, suspension of use, erasure, and suspension of provision to third parties, in respect of your own personal information.',
          'You can correct and delete your profile and uploaded files yourself from within the Service.',
          'For the requests above, please contact {{contactEmail}}. We will verify your identity and respond in accordance with the law.',
          'We do not charge a fee for responding to such requests.',
          'In some cases the law does not permit us to comply. We will then tell you, with our reasons.',
        ],
      },
      {
        heading: '13. Minors',
        paragraphs: [
          'The Service is intended for people seeking employment or contract work. If you are under 18, please use the Service only with the consent of a parent or other legal representative.',
        ],
      },
      {
        heading: '14. Changes to this Policy',
        paragraphs: [
          'We may change this Policy. We will display the amended version within the Service, and for significant changes we will give notice a reasonable period before the change takes effect.',
        ],
      },
      {
        heading: '15. Contact',
        paragraphs: [
          'For enquiries about how we handle personal information, please contact:',
          '{{name}} {{privacyOfficer}}',
          'Email: {{contactEmail}}',
          'Address: {{address}}',
        ],
      },
      {
        heading: '16. Language',
        paragraphs: [
          'The Japanese text of this Policy is the governing version. Text in any other language is a reference translation, and the Japanese text prevails in the event of any difference.',
        ],
      },
    ],
    dateLabel: { effective: 'Effective', revised: 'Last revised' },
  },
}
