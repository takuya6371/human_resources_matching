# AfriTalent — Role Capabilities / ロール別の機能まとめ

Three account types exist in this app: **Talent**, **Company**, **Admin**.
このアプリには3種類のアカウント種別があります: **人材 (Talent)**, **企業 (Company)**, **管理者 (Admin)**。

---

## 1. Talent（人材）

**EN**
- Sign up / log in as a talent (`role: 'talent'` at signup).
- Manage own profile via the Dashboard (`TalentDashboard`):
  - Edit name (EN/JA), headline, university/faculty, Japanese level (JLPT N1–N5), availability date, "open to work" toggle.
  - Edit skills (EN/JA, auto-translated to JA if left blank), bio (EN/JA, auto-translated).
  - Edit extra info: residence area, years of dev experience, years in Japan, hobbies, video URL, past clients.
  - Manage language list (name + proficiency level) and work experience list (company/role/period/description, EN & JA).
  - Upload a profile photo (avatar).
- Profile has a review status: `draft` → `pending` → `approved`/`rejected`.
  - Can submit profile for admin review (`submitForReview`) when status is `draft` or `rejected` (resubmit).
  - Can see admin's rejection note if rejected.
  - Approved profile edits may auto-revert to pending, per DB trigger logic.
- Browse job listings (`/jobs`), view job detail, and apply to jobs with a cover message.
- View "My Applications" page — list of submitted applications with status (submitted/reviewing/accepted/rejected/withdrawn); can withdraw an active application.
- Browse other approved talents' full profiles (talent list/detail pages) — talents get full access like companies (`hasFullAccess`) since role is talent... *(note: only company/admin get full unlocked list in code; talent's own access level for browsing others follows the same public flow as guests unless separately gated — see code for exact gating)*.
- Switch UI language (JA/EN/FR).
- Log out.

**JA**
- 人材としてサインアップ／ログイン（サインアップ時に `role: 'talent'` を指定）。
- ダッシュボード（`TalentDashboard`）で自分のプロフィールを管理:
  - 氏名（英語/日本語）、見出し、大学・学部、日本語レベル（JLPT N1〜N5）、稼働開始可能時期、「求職中」トグルの編集。
  - スキル（英語/日本語、日本語が空欄なら自動翻訳）、自己紹介文（英語/日本語、自動翻訳対応）の編集。
  - 追加情報：居住エリア、開発経験年数、在日年数、趣味、動画URL、過去のクライアントの編集。
  - 言語スキル一覧（言語名＋レベル）、職務経歴一覧（会社名/役職/期間/内容、英語・日本語）の追加・編集・削除。
  - プロフィール写真（アバター）のアップロード。
- プロフィールには審査ステータスがあります: `draft`（下書き）→ `pending`（審査待ち）→ `approved`（承認済み）/`rejected`（差し戻し）。
  - ステータスが `draft` または `rejected` のとき、審査への提出（再提出）が可能。
  - 差し戻された場合、管理者からのコメント（admin_note）を確認できる。
  - 承認済みプロフィールを編集すると、DBのトリガーにより自動的に審査待ちへ戻る場合がある。
- 求人一覧（`/jobs`）の閲覧、求人詳細の閲覧、カバーメッセージ付きで応募が可能。
- 「応募履歴」ページで自分の応募状況（submitted/reviewing/accepted/rejected/withdrawn）を確認、応募中の案件は取り下げ可能。
- 他の承認済み人材のプロフィール一覧・詳細を閲覧可能。
- UI言語の切り替え（日本語/英語/フランス語）。
- ログアウト。

---

## 2. Company（企業）

**EN**
- Sign up / log in as a company (`role: 'company'`, with company name at signup).
- Manage company profile via `CompanyDashboard`:
  - Edit company name (EN/JA), description, industry, size, website, logo (upload or URL).
- Full unrestricted access to browse the complete talent list and full talent profiles (no teaser/gated view), with filters by field, Japanese level, residence area, and "open to work".
- Manage own job postings (`CompanyJobsPage`, `/company/jobs`):
  - Create, edit, delete job postings.
  - Fields: title (EN/JA, auto-translate), description (EN/JA, auto-translate), field/category, required Japanese level, job type (employment / staffing / project), remote-OK flag, employment type, salary/compensation range, location, and (for staffing/project) duration and deliverables.
  - Set job status: draft / open / closed. Only `open` jobs are publicly visible in the job list.
- View and manage applicants per job (`JobApplicantsPage`, `/company/jobs/:id/applicants`):
  - See applicant profile summary, cover message, submission date.
  - Update application status: reviewing / accepted / rejected.
  - Link out to the applicant's full profile.
- Switch UI language (JA/EN/FR). Log out.

**JA**
- 企業としてサインアップ／ログイン（サインアップ時に `role: 'company'` と会社名を指定）。
- `CompanyDashboard` で企業プロフィールを管理:
  - 会社名（英語/日本語）、事業内容説明、業種、規模、Webサイト、ロゴ（アップロードまたはURL指定）の編集。
- 人材一覧・人材の全プロフィールを制限なく閲覧可能（一般ユーザー向けの一部だけ見える「ティザー表示」ではなくフルアクセス）。分野・日本語レベル・居住エリア・「求職中のみ」で絞り込み可能。
- 自社の求人情報を管理（`CompanyJobsPage`, `/company/jobs`）:
  - 求人の作成・編集・削除。
  - 項目：タイトル（英語/日本語、自動翻訳）、説明文（英語/日本語、自動翻訳）、分野、必要な日本語レベル、雇用形態区分（正社員雇用／人材派遣／業務委託プロジェクト）、リモート可否、雇用形態、給与・報酬レンジ、勤務地、（派遣・業務委託の場合）期間と成果物。
  - 求人ステータス設定：下書き／公開中／終了。「公開中」の求人のみ一般の求人一覧に表示される。
- 求人ごとの応募者を閲覧・管理（`JobApplicantsPage`, `/company/jobs/:id/applicants`）:
  - 応募者プロフィールの概要、カバーメッセージ、応募日時の確認。
  - 応募ステータスの更新（審査中／採用／不採用）。
  - 応募者の詳細プロフィールへのリンク。
- UI言語の切り替え（日本語/英語/フランス語）。ログアウト。

---

## 3. Admin（管理者）

**EN**
- Access the admin panel (`/admin`), gated by `user.role === 'admin'`.
- Review talent profiles submitted for approval (`AdminPage`):
  - "Pending" tab: profiles awaiting review.
  - "All" tab: all profiles regardless of status (draft/pending/approved/rejected), with status badges.
  - Approve a pending profile (`review_profile` RPC → status `approved`).
  - Reject a pending profile with an optional note visible to the talent (`review_profile` RPC → status `rejected`).
  - View a link to the full public talent profile page for any listed profile.
- View contact/business inquiries submitted via the site's contact form ("Inquiries" tab): name, company, email, inquiry type, message, and timestamp.
- Switch UI language (JA/EN/FR — via the general nav, not shown directly on this page besides title). Log out.
- Admins are effectively treated as having "full access" like companies when browsing the talent list (unrestricted, non-teaser view).
- Note: there is no dedicated UI in this codebase for admins to create other admin accounts, manage jobs, or manage companies — admin capability is scoped to profile approval/rejection and viewing inquiries.

**JA**
- 管理画面（`/admin`）にアクセス可能（`user.role === 'admin'` のユーザーのみ）。
- 審査提出された人材プロフィールを確認（`AdminPage`）:
  - 「審査待ち」タブ：レビュー待ちのプロフィール一覧。
  - 「すべて」タブ：ステータス（下書き／審査待ち／承認済み／差し戻し）を問わず全プロフィールをバッジ付きで一覧表示。
  - 審査待ちプロフィールの承認（`review_profile` RPCを呼び出し、ステータスを `approved` に）。
  - 審査待ちプロフィールの差し戻し。任意でコメント（人材本人に表示される）を添えて `rejected` に変更可能。
  - 一覧の各プロフィールから、公開プロフィールページへのリンクを確認できる。
- サイトのお問い合わせフォームから送信された問い合わせ内容を閲覧（「お問い合わせ」タブ）：氏名、会社名、メールアドレス、問い合わせ種別、本文、送信日時。
- UI言語の切り替え（日本語/英語/フランス語）。ログアウト。
- 人材一覧の閲覧に関しては、企業アカウントと同様に制限なしのフルアクセス（一般ユーザー向けのティザー表示ではない）。
- 補足：本コードベースには、管理者が他の管理者アカウントを作成したり、企業や求人情報を直接管理したりするための専用UIはありません。管理者の機能はプロフィールの承認・差し戻しと問い合わせ閲覧に限定されています。

---

## Shared / Public (not logged in or general)

**EN**: Anyone (including logged-out visitors) can browse the homepage, a teaser (limited) view of the talent list, individual public talent detail pages, the job list, job detail pages, and submit a business/contact inquiry — which then appears in the Admin's "Inquiries" tab.

**JA**: 未ログインのユーザーを含め誰でも、トップページ、限定表示（ティザー）の人材一覧、公開人材詳細ページ、求人一覧、求人詳細ページの閲覧、およびお問い合わせフォームからの送信が可能です。送信された内容は管理者の「お問い合わせ」タブに表示されます。
