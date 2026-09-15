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
| ResumeAnalyzer, Chatbot, GithubRepos | OUT(今回はコア機能優先のため対象外。関数実装自体は`base44/functions/`に存在し移植可能 — 詳細は上記スコープ方針を参照) |

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
   - 1a. cv-extract の migration 5本 + Edge Functions 4本を移植 — **完了**。`supabase db reset`(ローカル)で全migrationの適用を確認済み。`profileMapper.ts`の`PROFILE_PUBLIC_COLUMNS`に`verification_status`を追加。未実施: Edge Functionsの実機デプロイとシークレット設定(`GEMINI_API_KEY`/`DIDIT_API_KEY`/`DIDIT_WEBHOOK_SECRET`)
   - 1b. `threads` / `messages` / `thread_flags` の新規migration作成 — **完了**。`supabase db reset`(ローカル)で適用確認、GRANT/RLSが設計通り(`messages`/`thread_flags`はauthenticatedにSELECTのみ、`threads`はINSERT/SELECT/UPDATE)であることを確認済み
   - 1c. `posts` / `comments` / `likes` / `follows` / `interests` / `saved_items` / `notifications` / `team_members` / `trusted_companies` の新規migration作成 — **完了**。非正規化コピー列(user_name等)は持たずJOINする方針に変更、Challengeとの連携(SavedItemの'challenge')は今回スコープ外のため除外。RLSはなりすまし投稿の拒否・本人投稿の成功を実際にINSERTして確認済み。notificationsへの直接INSERTは admin(`is_admin()`)のみに限定 — follow/like/comment発生時の自動生成はPhase 4で設計
2. **UIコンポーネント基盤** — **完了**。TypeScript 6系では`baseUrl`が非推奨のため、`paths`のみ(`baseUrl`無し)で`@/`エイリアスを解決する構成にした。`npm run typecheck`/`build`/devサーバーで既存ページに影響がないことを確認済み
   - `@/` パスエイリアス追加(`vite.config.ts`, `tsconfig.json`)
   - `class-variance-authority` / `clsx` / `tailwind-merge` / 対応するRadixパッケージ / `tailwindcss-animate` を追加
   - `src/lib/utils.ts`(`cn()`)
   - 既存の `.btn-line` / `.badge-line` / `.avatar-line` / `.input-line` / `.label-line` / `.line-card` をラップする Button/Badge/Avatar/Input/Textarea/Label/Card
   - 既存に相当物がないRadix系(Dialog/DropdownMenu/Tabs/Tooltip/Separator)は paper/ink/seal/hairline トークンで新規スタイル
3. **骨格コンポーネント移植** — **完了**(詳細設計は下記)
4. **ページ移植(機能グループ単位)**(詳細設計は下記)
5. **メッセージング新規構築**: 1bのスキーマ + `moderation.js` + Realtime でゼロから実装(詳細設計は下記)

各フェーズはページ数・entity数が多いため、着手の都度あらためて具体的な変更内容を確認しながら進める(一括実装はしない)。

## 1b 詳細設計: threads / messages / thread_flags

`docs/handover/message-platform/data.js`・`app.js`・`moderation.js` の実装(localStorage版)からフィールドを特定した。

```
threads
  id                 uuid pk
  talent_id          uuid references profiles(id)
  company_id         uuid references companies(id)   -- companies.id は auth.users.id と同一(現行AuthContextの規約)
  status             text check in ('open','flagged') default 'open'
  support_requested  boolean default false
  strike_count       int default 0   -- send-messageがtier1 blockごとに+1、release/wipeでリセット
  flagged_by         text        -- 'rules' | 'model'(moderation.jsのverdict発生源)
  flagged_category   text        -- moderation.js の CATEGORY_COPY キー
  flagged_quote      text
  flagged_reason     text
  flagged_at         timestamptz
  created_at         timestamptz default now()
  unique(talent_id, company_id)

messages
  id             uuid pk
  thread_id      uuid references threads(id)
  from_user_id   uuid references auth.users(id)
  text           text
  translation    text            -- app.jsと同じく、挿入後に非同期で埋める
  system         text            -- 'stop' 等のシステム通知。null=通常メッセージ
  read           boolean default false   -- デモには無い。Navbar/Sidebarの未読バッジ用に追加
  created_at     timestamptz default now()

thread_flags     -- moderationイベントの監査ログ(デモはthreads.flagに1件上書きのみ、履歴を残すため追加)
  id          uuid pk
  thread_id   uuid references threads(id)
  verdict     text        -- moderation.js の 'block' | 'review'
  categories  text[]
  reason      text
  created_at  timestamptz default now()
```

RLS方針: `threads`はtalent_id/company_id本人のみ読み書き、adminは全件読み取り(特にflagged)。`messages`は自分が参加するスレッドのもののみ。`thread_flags`はservice role(Edge Function)からのinsertのみ、adminのみselect。

## 3 詳細設計: 骨格コンポーネント — **完了**

着手前の想定(bridge側をそのまま移植)は、実際にコードを読んだところ現行コードベースの状況と合わず、以下の通り方針を変更した。

| コンポーネント | 対応 | 状態 |
|---|---|---|
| Navbar | **移植しない**。現行の`Navbar.tsx`は既に`useAuth()`/`useLang()`に完全対応した成熟した実装。通知/メッセージの未読バッジ追加のみ必要だが、表示先ページ(`/notifications`, `/messages`)がPhase 4まで存在しないため、バッジ連携も**Phase 4のConnect/Saved/Notifications群と合わせて実施**に変更 | 見送り(Phase 4へ) |
| Footer | **変更しない**。bridge版は別デザイン言語(shadcn汎用トークン、3カラムのサイトマップ型)で現行の「Line」意匠と合わず、機能的にも今は不要 | 対応不要 |
| Layout(Outlet+Navbar+Sidebar+Footer+CookieConsent+Chatbotの束ね) | **導入しない**。各ページがNavbar/Footerを個別に描画する既存規約と衝突(ProtectedRouteと同じ理由) | 見送り |
| Sidebar | ログイン済み全ページのレイアウトを変えるUX判断のためユーザーに確認 → **今回は導入しない**という回答 | 見送り |
| AuthLayout | ルーティング用ラッパーではなくプレゼンテーショナルコンポーネントのため既存規約と衝突しない。paper/ink/sealで再スタイルして追加 | **完了** |
| AdminLayout | Phase 4で決定済みの`/admin/*`ネストルート化に対応するコンポーネント。`useAuth()`ベースの自己ガードパターンに合わせて追加(Outlet配下のページはPhase 4で実装、まだ未配線) | **完了** |
| PageNotFound | 新規追加。現行`App.tsx`に404キャッチオールルートが無かったため追加し、`<Route path="*">`で配線。i18nに`page404`キーを追加(en/ja/fr) | **完了** |
| ScrollToTop | **不要**。`src/App.tsx`に同等のインライン実装が既に存在する | 対応不要 |
| ProtectedRoute | **不要、導入しない**。現行コードベースは`AdminPage.tsx`/`DashboardPage.tsx`のように各ページが`useAuth()`+`useEffect`+`navigate()`で自己ガードするパターンで統一されている。bridgeのラッパー方式は導入せず、既存パターンに合わせる(フェーズ4で全新規ページに適用) | 対応不要 |

ブラウザで404ページとホームページの表示を確認済み(既存ページへの影響なし)。

## 4 詳細設計: ページ移植

### 前提とする既存パターン(Phase 3の調査で確認)

- 認証ガードは各ページの自己ガード方式(`useAuth()` + `useEffect` + `navigate()`)。`ProtectedRoute`は使わない。
- ルーティングは現行`App.tsx`のようにフラットな`<Route>`列挙(ネストルートなし)。ただし管理者ページは今回IN判定で単一`AdminPage`から分割構成に変えるため、`AdminLayout`配下だけネストルート(`/admin/*`)を導入する — これは唯一の構造変更なので着手前に明示しておく。
- 言語切り替えは現行の`LangContext`/`useLang()`(`App.tsx`)を使う。bridge独自の`src/lib/i18n.jsx`は導入しない(UI基盤フェーズの決定を踏襲)。
- entity→テーブル対応は上記「entity一覧と判定」表を正とする。

### グループ順序と個別対応

1. **認証一式** — **完了**。着手前に現行`LoginPage.tsx`を確認したところ、Login/Register/GetStartedは既にログイン・サインアップ(タレント/企業選択込み)として1ページに統合済みで、追加実装は不要だった。実際に必要だったのはForgotPassword/ResetPasswordの2ページのみ:
   - `AuthContext`に`resetPasswordRequest`/`resetPassword`を追加(Supabaseの`resetPasswordForEmail`/`updateUser`を使用。bridge版はトークンを手動で扱う設計だったが、Supabaseはメールリンクで回復用セッションが自動確立されるためトークンの受け渡しは不要)
   - `AuthLayout`をbridge版ではなく`LoginPage.tsx`の実際のヘッダー構造(ロゴ+言語切替+カード)から共通化して作り直し、`LoginPage.tsx`自身もこれを使うようリファクタ(見た目の変更なし、ブラウザで確認済み)
   - ローカルのMailpitで実際にメール送信→リンククリック→パスワード変更→ログイン状態遷移までエンドツーエンドで動作確認
   - **副次的発見**: `supabase/config.toml`の`site_url`/`additional_redirect_urls`が実際の開発ポート(README記載の`localhost:5173`)と不一致で、パスワード再設定メールが送信されない不具合があったため修正
   - Register.jsxのOTP認証・Social Auth(Google等)は現行のSupabase標準の確認メールフローと異なる仕組みで、追加のインフラ設定(OAuthプロバイダ登録等)が必要なため今回は見送り
2. **タレント側** — **完了**。着手前に現行実装を確認したところ、既に大部分がカバー済みだった:
   - TalentDashboard/TalentProfile(自己編集) → 現行`DashboardPage`+`TalentDashboard`が両方を1コンポーネントに統合済み(閲覧/編集モード切替)
   - TalentPublicProfile → 現行`TalentDetailPage`が同等(企業/管理者はフル情報、それ以外はゲート表示)
   - TalentBrowse → 現行`TalentListPage`が同等(検索・フィルタ・ティザー表示)
   - TalentOnboarding → **移植しない**。bridge版は6ステップウィザードで、現行スキーマに無い項目(visa_status、salary_expectation、height/weight等の「fun facts」、github_username)を多数含み、クレジット付与(Checkout連動、対象外)にも依存する。現行の「ダッシュボードで直接編集」で初回入力の要件は満たせるため見送り
   - **実際に必要だった作業**: Phase 1cで作った`follows`/`interests`テーブルの使い先(FollowButton/InterestButton)が未実装だったため新規追加。bridgeでの実際の使用箇所を調査し、`TalentCard`(一覧、小)と`TalentDetailPage`(詳細、小)に設置。`InterestButton`は企業アカウントのみ表示(bridgeの`TalentBrowse.jsx`の条件を踏襲)
   - フォロー時の通知自動生成トリガー(`notify_on_follow`)を追加。notifications直接INSERTはadmin限定のまま、`follows`へのINSERT自体をトリガーに(security definer)することでなりすまし通知を防止
   - 実装中に発見・修正したバグ: `InterestButton`が`user`(タレント用)を参照しており、企業アカウント(`company`)でログイン中は常に未ログイン扱いになっていた。ブラウザでの実クリック確認で発覚
   - ブラウザで企業アカウントとして実際にフォロー/興味ありをクリックし、DB反映(followsテーブル・通知トリガー・interestsテーブル)を確認
3. **企業・求人側**: CompanyOnboarding/CompanyDashboard/CompanyProfile/CompanyPublicProfile/PostJob/Jobs。`CompanyDashboard`/`CompanyPublicProfile`は`Challenge`ウィジェットと`Promotion`(ブースト)UIを削って移植。
4. **管理者(分割構成)**: AdminHome/TalentReview/CompanyReview/JobModeration/Team/MatchingConsole/Analytics を`AdminLayout`配下のネストルートとして追加。現行の単一`AdminPage.tsx`をどう扱うか(置き換え/併存)はこのフェーズ着手時に別途確認する。
5. **Connect/Saved/Notifications**: Connect(`posts`/`comments`/`likes`テーブル)、Saved(`saved_items`)、Notifications(`notifications`)。NavbarのMessage関連バッジは1b完了後に接続。

## 5 詳細設計: メッセージング機能

`docs/handover/message-platform/app.js` の送信・保留・解除・サポート要請フローと、既存の `src/lib/translate.ts` / `supabase/functions/translate`(Azure Translator、既存デプロイ済み)を突き合わせた。

### 重要な既存資産の再利用

- **翻訳は新規実装しない**。既存の`translate` Edge Function(Azure Translator、`AZURE_TRANSLATOR_KEY`/`AZURE_TRANSLATOR_REGION`は設定済み)をそのまま呼び出す。同関数は`to`のみ指定で`from`は自動判定のため、双方向翻訳(EN⇔JA)にそのまま使える。移植が要るのは`isJa()`(正規表現1行)のみ。
- tier2モデレーションはGemini(`GEMINI_API_KEY`)を使う。cv-extract(Phase 1a)で設定するシークレットと同一のものを流用できる。

### 送信経路: クライアントから直接insertしない

HANDOVER.mdが明記する唯一のセキュリティ課題(「モデレーションは今ブラウザのみで迂回可能」)に対応するため、送信は新規Edge Function `send-message` を経由させる(直接`messages`テーブルへのinsertはRLSで禁止し、Edge Function内でservice roleとして書き込む)。

1. 呼び出しユーザーがそのスレッドの参加者(`talent_id`/`company_id`)であることを確認
2. そのスレッドでの送信者本人の直近4件を取得し、`screen()`の`context.recent`に渡す(電話番号の分割送信検知に必要)
3. `moderation.js`の`screen()`を**そのまま**移植した共通コード(`src/lib/moderation.ts`)をクライアントとこのEdge Functionの両方から使う(HANDOVER.md要件どおり、同一判定ロジックを両側で使う)
4. tier1 `block` → `strike_count`(threadsに追加する列)をインクリメント、`thread_flags`に記録。3回目で`threads.status='flagged'`+保留通知メッセージを挿入し、送信自体は拒否(4xx)。1・2回目は送信拒否のみ
5. tier1 `clear` → メッセージを即挿入(楽観的配信)。挿入後に非同期で`translate`を呼び`messages.translation`を埋める
6. tier1 `review`(`needsModel`)→ 4と同様にまず挿入(元実装どおり配信優先)。その後非同期でGeminiにtier2判定させ、`block`なら事後的に`threads.status='flagged'`+保留通知を追加。モデル未設定/失敗時は**フェイルオープン**(元実装の挙動を踏襲、メッセージは残す)

### 管理者アクション(HANDOVER.mdが「未実装」と明記している部分)

message-platformのデモにもbridgeの`Messages.jsx`にも、保留スレッドを扱う永続化された管理画面は存在しない。以下をゼロから設計・新規実装する。

- **release**(警告あり/なし): `threads.status='open'`、`strike_count`リセット、再開通知メッセージを挿入
- **wipeThread**: 管理者がスレッドのメッセージを全削除(スレッド自体は残す)
- **requestSupport**: talent/company側から運営の介入を要請(`support_requested`列)、通知メッセージを挿入
- 上記を操作する管理者用ページを新規追加(Phase 4の管理者分割構成に1ページ追加する形になる)

### リアルタイム・未読

- `messages`テーブル(`thread_id`でフィルタ)にSupabase Realtime購読 → スレッド内の即時反映
- `threads`テーブルの`status`変化を購読 → 管理者の保留キューに反映
- Navbar/Sidebarの未読バッジは`messages.read`を集計、開封時に既読へ更新。Realtimeで即時反映

## 検証方法

- 各フェーズ完了時に `npm run typecheck` と `npm run build` を実行
- DBフェーズは `supabase db push`(ローカル)後、RLSを anon/authenticated 双方のロールで手動確認
- UI基盤フェーズは既存ページ(HomePage等)を崩さないことを目視確認してから新規ページ移植に進む
