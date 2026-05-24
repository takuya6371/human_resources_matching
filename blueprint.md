# AfriTalent Blueprint

日本に留学中のアフリカ人材と日本企業をつなぐマッチングサービス。

---

## 画面一覧

| 画面 | URL | ステータス |
|---|---|---|
| ホーム | `/` | ✅ 実装済 |
| 人材一覧 | `/talents` | ✅ 実装済 |
| 人材詳細 | `/talent/:id` | ✅ 実装済 |
| ログイン | `/login` | ✅ 実装済（モック） |
| ダッシュボード（人材） | `/dashboard` | ✅ 実装済（モック） |
| 企業管理画面 | `/company` | ❌ 未実装 |

---

## 機能一覧

### 人材閲覧（非ログイン）

| 機能 | ステータス | 備考 |
|---|---|---|
| 人材一覧表示 | ✅ | モック5名 |
| キーワード検索 | ✅ | 名前・スキル対応、URLパラメータ `?q=` |
| 専門分野フィルター | ✅ | |
| 日本語レベルフィルター | ✅ | JLPT N1〜N4 |
| 人材詳細ページ | ✅ | スキル・自己紹介・学歴・言語・経験・日本語レベル |
| 企業からの問い合わせ | ❌ | ボタンのみ、送信機能なし |

### 認証

| 機能 | ステータス | 備考 |
|---|---|---|
| ログイン | ✅ | モック（任意のID/PW） |
| ログアウト | ✅ | |
| 会員登録 | ❌ | DB連携が必要 |
| セッション永続化 | ❌ | リロードでログアウト |

### ダッシュボード（人材側）

| 機能 | ステータス | 備考 |
|---|---|---|
| プロフィール表示 | ✅ | |
| 基本情報編集 | ✅ | 名前（英/日）、ヘッドライン、日本語レベル、就業可能時期 |
| 学歴編集 | ✅ | 大学・学部（英/日） |
| スキル編集 | ✅ | カンマ区切り（英/日） |
| 自己紹介編集 | ✅ | 英/日 |
| 求職状態（Open to Work） | ✅ | ON/OFF切り替え |
| 言語スキル編集 | ✅ | 追加・削除、レベル選択 |
| 職務経験編集 | ✅ | 追加・削除（会社・役職・期間・説明、英/日） |
| 画像アップロード | ❌ | 現在はイニシャルアバター |

### 企業側

| 機能 | ステータス | 備考 |
|---|---|---|
| 企業管理画面 | ❌ | 未実装 |
| 人材へのコンタクト | ❌ | 未実装 |
| スカウト機能 | ❌ | 未実装 |

### UI/UX

| 機能 | ステータス |
|---|---|
| 英語/日本語切り替え（全ページ） | ✅ |
| アフリカンカラーテーマ（ダーク） | ✅ |
| レスポンシブ対応 | ✅ |
| Netlify デプロイ対応（`_redirects`） | ✅ |

---

## データモデル（現状）

```typescript
Talent {
  id, nameEn, nameJa
  country, countryJa, flag
  avatarColor, initials
  field, fieldJa
  university, universityJa, faculty, facultyJa
  degree, graduationYear
  japaneseLevel: 'N1' | 'N2' | 'N3' | 'N4' | 'N5'
  skills[], skillsJa[]
  headlineEn, headlineJa
  openToWork: boolean
  languages: { name, level }[]
  experience: { company, companyJa, role, roleJa, period, descriptionEn, descriptionJa }[]
  bioEn, bioJa
  availableFrom, availableFromJa
}
```

---

## 技術スタック

| 領域 | 採用技術 |
|---|---|
| フロントエンド | React 18 + Vite + TypeScript |
| スタイリング | Tailwind CSS v3（カスタムテーマ） |
| ルーティング | React Router v6 |
| 状態管理 | React Context API（言語・認証） |
| データ | JSONモック（`src/data/talents.json`） |
| ホスティング | Netlify（無料プラン） |

---

## 今後の拡張トリガー

| 条件 | 対応 |
|---|---|
| 人材詳細のSEO強化が必要 | Next.js（SSR）へ移行 |
| バックエンドAPIを自前で持ちたい | Next.js API Routes |
| 実際の会員登録・DB連携 | Supabase + Next.js |
| 企業管理・スカウト機能 | バックエンド設計が必要 |
