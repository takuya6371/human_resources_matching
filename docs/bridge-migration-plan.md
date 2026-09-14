# bridge-africa-talent / docs/handover 統合計画

## Context

`docs/front/bridge-africa-talent` は業務委託先が納品した、Base44(SaaS/ノーコード基盤)上で動く別系統のフロントエンド一式(143ファイル、19 entity)。Base44は今後使わない方針のため、コード(UI・ロジック)だけを現行の `matching`(React+TS+Vite+Supabase)に移植する。ただしBase44の `base44.entities.*` / `base44.auth.*` 呼び出しは全てSupabaseに書き換えが必要で、コードをコピーするだけでは動かない。

`docs/handover/HANDOVER.md` はこれとは別に、`cv-extract`(本番相当のSupabase Edge Functions/migration)と `message-platform`(チャット機能の仕様書、実装なし)の引き継ぎ資料で、統合方針が既に文書化されている。

本計画は、ユーザーとの確認の上で決めた移植スコープと、両ソースの取り込み手順をまとめたもの。実装はフェーズごとに区切って進める(一括実装はしない)。

## 確定したスコープ方針(ユーザー確認済み)

- 拡張機能(Challenges/Assessments、Blog、Checkout/課金)は**今回は対象外**。コア機能(人材・求人・企業・管理者)を先に進める。
- 投稿フィードは `Connect` を採用(`Newsfeed` と機能重複、`Newsfeed` は不採用)。
- メッセージングは `docs/handover/message-platform` の仕様(2段階モデレーション設計済み)を主軸にする。bridgeの `Messages.jsx` はUI参考のみ。
- `Matches`(`computeMatches`)/ `GithubRepos`(`githubRepos`)/ `ResumeAnalyzer`(`analyzeResume`)/ `Chatbot`(`askAfriTalent`)/ `aiMatchInsight` は `docs/front/bridge-africa-talent/base44/functions/*/entry.ts` に実装が存在する(Base44はカスタムサーバー関数のソースをアプリ側リポジトリで管理する方式のため、納品物に含まれていた)。`computeMatches` と `githubRepos` はAI不使用で移植は容易、`analyzeResume` / `askAfriTalent` / `aiMatchInsight` は `base44.asServiceRole.integrations.Core.InvokeLLM` というBase44のLLMラッパーに依存しており、移植には自前のLLM連携への置き換えが必要。いずれも技術的には移植可能だが、**コア機能を先に進める方針のため今回はスコープ外**とし、拡張フェーズで改めて検討する。
- `OAuthConsent` はBase44のMCPサーバー専用ページのため恒久的に対象外。

## bridge-africa-talent 機能一覧と判定

### ページ

| ページ | 内容 | 判定 |
|---|---|---|
| Home | トップページ | IN |
| HowItWorks / About / Privacy / Terms | 静的ページ | IN |
| Contact | 問い合わせ | IN(現行`ContactPage`と統合・置き換え検討) |
| Login / Register / ForgotPassword / ResetPassword / GetStarted | 認証一式(現行はLoginのみ) | IN |
| TalentOnboarding / TalentDashboard / TalentProfile / TalentPublicProfile / TalentBrowse | タレント側動線 | IN |
| CompanyOnboarding / CompanyDashboard / CompanyProfile / CompanyPublicProfile / PostJob / Jobs | 企業・求人側動線 | IN |
| AdminHome / TalentReview / CompanyReview / JobModeration / Team | 管理者(現行は単一`AdminPage`、bridgeは分割構成) | IN |
| MatchingConsole / Analytics | 管理者向けマッチング支援・分析 | IN |
| Connect | 投稿フィード | IN |
| Notifications | 通知一覧 | IN |
| Saved | ブックマーク | IN |
| Messages | チャットUI | 参考のみ(データ層は使わない) |
| Newsfeed | 投稿フィード(Connectと重複) | OUT |
| Matches | AIマッチング提案 | OUT |
| Challenges / ChallengeDetail / CompanyChallengeManage / Assessments | スキル診断・チャレンジ | OUT |
| Blogs / BlogPost | ブログ/CMS | OUT |
| Checkout | 決済 | OUT |
| OAuthConsent | Base44 MCP専用 | OUT(恒久) |

### entity → 実際に使うテーブルの要否(IN対象ページからの参照のみで判定)

| entity | 参照元(IN対象のみ) | 判定 |
|---|---|---|
| Application | CompanyDashboard, Jobs, TalentDashboard, AdminHome, Analytics, MatchingConsole | 既存`applications`で対応済み |
| CompanyProfile | 多数のIN対象ページ | 既存`companies`で対応済み(命名差異あり) |
| Job | 多数のIN対象ページ | 既存`jobs`で対応済み |
| TalentProfile | 多数のIN対象ページ | 既存`profiles`で対応済み |
| Post / Comment / Like | PostCard, CompanyPublicProfile, Connect | **新規**(Connect投稿フィード) |
| Follow | FollowButton, CompanyProfile, CompanyPublicProfile, Connect, TalentProfile, TalentPublicProfile | **新規** |
| Interest | InterestButton, CompanyDashboard, TalentDashboard | **新規**(応募とは別の「興味表明」導線) |
| SavedItem | SaveButton, Saved | **新規** |
| Notification | Navbar/Sidebar, Notifications | **新規** |
| TeamMember | About, admin/Team | **新規**(小規模) |
| TrustedCompany | LogoCarousel(Home) | **新規**(小規模) |
| Message | Navbar/Sidebar, CompanyDashboard, TalentDashboard, Messages | **不採用** — message-platform仕様の`threads`/`messages`スキーマに置き換える |
| Challenge | CompanyDashboard, CompanyPublicProfile 内のウィジェットとしても参照あり | OUT。該当ウィジェットは移植時に**削って**ページを移す |
| IdeaSubmission | TalentProfile, TalentPublicProfile 内のウィジェットとしても参照あり | OUT。同上、該当ウィジェットを削る |
| Promotion | BoostModal, CompanyDashboard, CompanyPublicProfile, Connect 内の「投稿をブースト」機能 | OUT(Checkout連動のため)。該当UIを削る |
| AssessmentResult / SkillAssessment / Blog | Assessments / Blog系ページのみ | OUT |

### コンポーネント

| コンポーネント | 判定 |
|---|---|
| `components/ui/*`(shadcn/ui, Radix) | IN — 移植の土台として最初に着手 |
| Navbar, Footer, Layout, AdminLayout, Sidebar, AuthLayout, ProtectedRoute, ScrollToTop, PageNotFound | IN(骨格) |
| PostCard, FollowButton, InterestButton, SaveButton, MessageButton, LanguageSwitcher, LogoCarousel, CookieConsent, Badges, ReputationBadges, ShareSheet, AuthPrompt, AuthRoleSelector, SocialAuthButtons, GoogleIcon, AfricaLogo | IN(IN対象ページの付随部品) |
| BoostModal, PlanCard, CreditEarning | OUT(課金連動) |
| ResumeAnalyzer, Chatbot, GithubRepos | OUT(base44サーバー関数依存、未納品) |

## docs/handover の取り込み方針

### cv-extract(本番相当コード)— そのまま移植

- migration 5本(`20260825`〜`20260829`)を、既存の `supabase/migrations/20260815000000_fix_applicant_profile_visibility.sql` の後ろに**順序通りそのまま**追加。リネーム不要。
- Edge Functions 4本(`parse-cv`, `start-verification`, `verification-webhook`, `verification-status`)を `supabase/functions/` にそのまま配置。`verification-webhook` のみ `--no-verify-jwt` でデプロイ。
- `cv-schema.js` はフレームワーク非依存なのでそのまま移植。
- `sample-cvs/` はテスト資産としてそのままCIに組み込む。
- `cv-extract-demo.html` はコードとして移植しない。Reactでのアップロード→抽出→レビュー→本人確認→プロフィール化フローを作る際の**受け入れ基準**として参照する。
- 必要シークレット: `GEMINI_API_KEY`, `DIDIT_API_KEY`, `DIDIT_WEBHOOK_SECRET`(`supabase secrets set`)。

### message-platform(仕様書)— 作り直し

- コードは移植しない。参照するのは: ステップ順(upload→extract→review→identity→profile相当のチャット版)、チャットのレイアウト、メッセージ単位の翻訳表示、モデレーション通知文言、エラーメッセージ文言。
- `moderation.js` のみフレームワーク非依存の純粋関数としてそのまま移植し、クライアント側(即時フィードバック)とSupabase Edge Function側(書き込み時の強制、今はデモがブラウザのみで迂回可能なため)の両方で同一コードを使う。
- 新規スキーマが必要: `threads` / `messages` / `thread_flags` + RLS(タレントは自分のスレッドのみ、企業側は自社のスレッドのみ、管理者は保留中スレッドを閲覧)。現状どこにも存在しない。
- `db.js`(localStorage + BroadcastChannelの疑似永続化)はSupabase Realtimeに置き換える。
- `bench.html` のモデレーションコーパス(約80件のラベル付きメッセージ)は `moderation.js` 変更時の回帰テストとして移植する。

## 実行フェーズ(フェーズごとに区切って進める)

1. **DB基盤**
   - 1a. cv-extract の migration 5本 + Edge Functions 4本を移植
   - 1b. `threads` / `messages` / `thread_flags` の新規migration作成(message-platform仕様に基づく)
   - 1c. `posts` / `comments` / `likes` / `follows` / `interests` / `saved_items` / `notifications` / `team_members` / `trusted_companies` の新規migration作成(RLS込み)
2. **UIコンポーネント基盤**
   - `@/` パスエイリアス追加(`vite.config.ts`, `tsconfig.json`)
   - `class-variance-authority` / `clsx` / `tailwind-merge` / 対応するRadixパッケージ / `tailwindcss-animate` を追加
   - `src/lib/utils.ts`(`cn()`)
   - 既存の `.btn-line` / `.badge-line` / `.avatar-line` / `.input-line` / `.label-line` / `.line-card` をラップする Button/Badge/Avatar/Input/Textarea/Label/Card
   - 既存に相当物がないRadix系(Dialog/DropdownMenu/Tabs/Tooltip/Separator)は paper/ink/seal/hairline トークンで新規スタイル
3. **骨格コンポーネント移植**: Navbar/Footer/Layout/AdminLayout/Sidebar/ProtectedRoute 等
4. **ページ移植(機能グループ単位)**: 認証一式 → タレント側 → 企業・求人側 → 管理者(分割構成) → Connect/Saved/Notifications
5. **メッセージング新規構築**: message-platform仕様に基づき `threads`/`messages`/`thread_flags` + `moderation.js` + Realtime でゼロから実装

各フェーズはページ数・entity数が多いため、フェーズ2以降は着手の都度あらためて具体的な変更内容を確認しながら進める(一括実装はしない)。

## 検証方法

- 各フェーズ完了時に `npm run typecheck` と `npm run build` を実行
- DBフェーズは `supabase db push`(ローカル)後、RLSを anon/authenticated 双方のロールで手動確認
- UI基盤フェーズは既存ページ(HomePage等)を崩さないことを目視確認してから新規ページ移植に進む
