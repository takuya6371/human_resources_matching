# チャレンジ機能（企業の課題 → 人材の提案 → 実際の仕事）設計

企業が「いま困っていること」を投稿し、人材が解き方を提案し、いちばん有用だった
提案を出した人に実際の仕事を出す。

## まず、この手の機能が失敗する理由

Stack Overflow のイメージから入ると必ず踏む罠が3つある。設計はこれを避ける
ためにある、と言ってよい。

### 1. タダ働きの温床になる（最大の問題）

提案が最初から公開だと、企業は20件読んで自社で実装し、誰も選ばない。
人材側はそれを一度見たら二度と書かない。**先に死ぬのは人材側の参加**で、
人材が来なくなれば企業も来なくなる。

Stack Overflow が成立するのは、回答が**知識**であって**納品物**ではないから。
「うちの課題をどう解くか」は納品物に近い。同じ公開モデルは乗らない。

→ **募集中は提案を非公開**にする。読めるのは出題企業と本人だけ。
　決着後に公開へ切り替える（下の「2段階の公開」）。

### 2. 企業が投げっぱなしにする

投稿して、締切が来て、何も言わない。回答した5人は放置される。
これが数回起きると機能が死ぬ。

→ **締切は必須**。締切後14日以内に結果（採用 or 該当なし）を宣言しないと
　**自動で「無応答」**になり、企業の公開プロフィールに出る。期限と評判で縛る。

### 3. 提案のコストが高すぎる

1件に5時間かかる形式にすると、10人が応募して45時間が無報酬で消える。
倫理的にもまずいし、続かない。

→ 提案フォームは**15分で書ける量に制限**する。プロトタイプや資料の作成は
　求めない。添付は任意の既存リンク（GitHub / Figma / 動画）1本まで。
　深掘りは「選考に進んでから」、つまり有償の会話に入ってからやる。

## 決めるべきこと（私の推奨つき）

| | 選択肢 | 推奨 |
|---|---|---|
| 提案の公開範囲 | 常に公開 / 常に非公開 / **2段階** | **2段階**。募集中は非公開、決着後に公開（本人が非公開も選べる） |
| 誰が「いちばん有用」を決めるか | 企業 / 投票 / 併用 | **企業が決定**。投票は公開後の参考値のみ。賞金が絡む判定を票に委ねない |
| 報酬の扱い | プラットフォームが仲介 / **当事者間** | **当事者間**。送金を握ると規制の話が一気に重くなる（下の法務） |
| 出題の事前審査 | なし / **管理者承認** | **承認制**。報酬を約束する投稿なので、既存のプロフィール承認と同じ仕組みを流用 |
| 1課題あたりの当選者 | 1名固定 / 可変 | **可変**（1名 or 複数）。Base44版の `num_winners` と同じ判断 |

## 要件

### 企業ができること

- 課題を書いて出す（タイトル / 困っていること / 求めるもの / 分野 / 締切 / 報酬）
- 報酬を明示する（金額 or 業務委託の内容）。**曖昧なまま出せない**
- 届いた提案を読む。気になったものを「候補」に上げる
- 候補とは**非公開でやりとり**できる（既存のメッセージ機能を使う）
- 採用を決める、または「該当なし」を宣言する
- 採用したら、その人に業務委託の話を直接進める

### 人材ができること

- 公開中の課題を一覧・検索する
- 提案を出す（解き方 / どう動くか / 期待できる結果 / 参考リンク）
- 自分の提案の状態を見る（提出済み / 候補 / 採用 / 不採用）
- 決着後、自分の提案を公開するか選ぶ（既定は公開）
- 公開された提案を読む・参考になったを押す

### 運営（管理者）ができること

- 出題を承認・却下する
- 無応答の企業を把握する
- 通報されたものを見る

### やらないこと（初期）

- 送金・エスクロー
- 提案への相互コメント（募集中は非公開なので成立しない）
- 自動マッチング・AIによる採点
- 添付ファイルのアップロード（リンクのみ）

## データモデル

既存の規約に合わせる。`companies` / `profiles` に紐づけ、enum は既存と同じ
命名、RLS は行単位、列を隠す必要があれば GRANT を使う。

```sql
create type challenge_status as enum (
  'draft',      -- 企業が書いている途中
  'pending',    -- 管理者の承認待ち（profile_status と同じ考え方）
  'open',       -- 募集中。提案は非公開
  'judging',    -- 締切後、結果の宣言待ち
  'awarded',    -- 採用者が決まった
  'no_award',   -- 該当なしと宣言された
  'abandoned',  -- 期限内に宣言されなかった（自動）
  'rejected'    -- 管理者が却下
);

create type submission_status as enum (
  'submitted',   -- 提出済み
  'shortlisted', -- 候補に上がった
  'awarded',     -- 採用
  'declined'     -- 不採用
);

create table challenges (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references companies(id) on delete cascade,

  -- 画面は EN/JA 両方出すので、既存の jobs と同じく2列持つ
  title_en         text not null default '',
  title_ja         text not null default '',
  problem_en       text,          -- 困っていること
  problem_ja       text,
  looking_for_en   text,          -- 求めるもの・成功の条件
  looking_for_ja   text,
  areas            text[] not null default '{}',  -- 分野・技術

  -- 報酬。曖昧なまま出させないので not null 相当の扱いにする
  reward_kind      text not null, -- 'cash' | 'paid_project' | 'both'
  reward_amount    text not null, -- '10万円' '要相談（30万円規模）' など自由文
  reward_detail    text,

  deadline         date not null,
  max_winners      integer not null default 1 check (max_winners between 1 and 5),

  status           challenge_status not null default 'draft',
  -- 結果の宣言期限。締切 + 14日。超えると abandoned。
  decide_by        date,
  decided_at       timestamptz,
  review_note      text,          -- 管理者の却下理由

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table challenge_submissions (
  id             uuid primary key default gen_random_uuid(),
  challenge_id   uuid not null references challenges(id) on delete cascade,
  profile_id     uuid not null references profiles(id) on delete cascade,

  -- 15分で書ける量に収める。フォーム側でも文字数を制限する。
  approach         text not null,  -- どう解くか（必須）
  how_it_works     text,           -- どう動くか
  expected_result  text,           -- 期待できる結果
  supporting_url   text,           -- 既存の成果物へのリンク1本

  status         submission_status not null default 'submitted',
  -- 決着後に公開するか。既定は公開、本人が下ろせる。
  public_after_decision boolean not null default true,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  unique (challenge_id, profile_id)   -- 1課題につき1人1案
);

-- 公開後の「参考になった」。likes は post_id 固定なので流用できない。
create table submission_helpful (
  submission_id  uuid not null references challenge_submissions(id) on delete cascade,
  user_id        uuid not null references auth.users(id),
  created_at     timestamptz not null default now(),
  primary key (submission_id, user_id)
);
```

### RLS の要点

提案の可視性がこの機能の肝なので、ここだけ丁寧に書く。

```sql
-- 提案を読めるのは:
--   本人 / 出題企業 / 管理者 / （決着後かつ本人が公開を選んでいれば）誰でも
create policy "challenge_submissions: select"
  on challenge_submissions for select
  using (
    auth.uid() = profile_id
    or is_admin()
    or exists (
      select 1 from challenges c
      where c.id = challenge_id and c.company_id = auth.uid()
    )
    or (
      public_after_decision
      and exists (
        select 1 from challenges c
        where c.id = challenge_id
          and c.status in ('awarded', 'no_award')
      )
    )
  );
```

**募集中は他の人材から見えない。** だから提案の盗用も起きない。

書き込み側は、承認済みプロフィールだけが提出できる（`applications` と同じ条件）。
**締切を過ぎたら本人も編集できない**ようにする。後から書き換えられると、
「先に出したのに取られた」の証拠にならないため。

```sql
create policy "challenge_submissions: owner write"
  on challenge_submissions for all
  using (auth.uid() = profile_id)
  with check (
    auth.uid() = profile_id
    and exists (select 1 from profiles where id = auth.uid() and status = 'approved')
    and exists (
      select 1 from challenges c
      where c.id = challenge_id and c.status = 'open' and c.deadline >= current_date
    )
  );
```

`status` を企業が動かす操作（候補に上げる・採用する）は、本人が自分で
書き換えられてはいけない。`guard_verification_fields` と同じく
**トリガーで old の値に戻す**か、security definer の関数越しにする。
後者のほうがわかりやすい（`shortlist_submission` / `award_submission`）。

### 無応答の自動判定

`decide_by` を過ぎても `decided_at` が入っていないものを `abandoned` にする。
Supabase の `pg_cron` か、既存の Edge Function を日次で叩く。
**この1本を作らないと機能が死ぬ**ので、後回しにしない。

## 既存資産の再利用

新しく作らなくていいものを作らないこと。

| やりたいこと | 使うもの |
|---|---|
| 候補者との非公開のやりとり | `threads` / `messages`（既存） |
| 不適切な投稿の検出 | `src/lib/moderation.ts` の `screen()`（既存。メッセージと同じものを使う） |
| 通知 | `notifications`（`notification_type` に `challenge` を追加） |
| 保存 | `saved_items`（`saved_item_type` に `challenge` を追加） |
| 出題の承認 | 管理画面の既存の審査パターン（`profile_status` の流れをそのまま） |
| 採用後の契約 | 既存の `jobs` に下書きを作り、`applications` を採用済みで作る |
| 企業ロゴ・人材の写真 | 既存の非正規化しない方針どおり JOIN で引く |

**非正規化コピー列は持たない。** Base44版の `Challenge` は `company_name` /
`company_logo` を、`IdeaSubmission` は `talent_name` / `talent_photo` を
持っていたが、この移植では一貫して持たない方針でやってきている
（`docs/bridge-migration-plan.md` の `SavedPage` の項を参照）。

## 画面

| 画面 | 役割 |
|---|---|
| `/challenges` | 一覧。分野・締切・報酬で絞り込み |
| `/challenges/:id` | 課題の詳細。人材には提案フォーム、企業には受領一覧 |
| `/challenges/:id/submissions/:sid` | 提案の詳細（権限に応じて） |
| `/company/challenges` | 企業の管理。候補に上げる・採用する・該当なしを宣言する |
| `/dashboard` の中 | 人材が出した提案と、その状態の一覧 |
| `/admin/challenges` | 出題の承認、無応答企業の把握 |

ナビには「チャレンジ」を1つ足す。トップバーは既に項目が多いので、
人材/企業で出し分けている既存の `primary` / `secondary` の仕組みに乗せる。

## 法務・在留資格（着手前に確認すべきこと）

私は専門家ではないので、**以下は「調べるべき論点」として渡す**。
断定として受け取らないこと。

1. **在留資格**（これが最重要）
　提案者の多くは留学生の可能性がある。留学の在留資格で報酬を得るには
　**資格外活動許可**が必要で、原則**週28時間**の上限がある。
　「採用されたら実際の仕事」を謳う以上、応募時点でこれを案内しないと、
　善意で参加した人を違法状態に置く。技術・人文知識・国際業務の人でも、
　本業以外の業務委託は資格の範囲内かの確認が要る。
　→ **提案フォームに注意書きと確認チェックを置く**のが最低限。

2. **有料職業紹介事業**
　プラットフォームが報酬の一部を取る設計にすると、職業紹介にあたる
　可能性がある。**当事者間の契約に徹し、送金を握らない**ことで当面は
　避けられる見込みだが、収益化の設計時に必ず相談すること。

3. **提案の権利関係**
　採用されなかった提案のアイデアを企業が使ったらどうなるか。規約で
　明示しておく必要がある。少なくとも:
　- 提案の権利は提案者に残る
　- 企業が得るのは「評価のために読む」権利だけ
　- 採用して契約した場合の扱いは、その契約で定める
　既存の `src/legal/terms.ts` に章を足す形になる。

4. **報酬の表示**
　「賞金」と書くか「業務委託の報酬」と書くかで扱いが変わり得る。
　景品表示法の論点があるので確認。

## 作る順番

イベントが近いので、**イベント前には作らない。** 登録導線を優先する。
以下はイベント後の段取り。

### 第1段階（最小・2〜3日）

出題と提案が成立するところまで。これだけで価値を検証できる。

- `challenges` / `challenge_submissions` の2テーブルと RLS
- 一覧 `/challenges` と詳細 `/challenges/:id`
- 提案フォーム
- 企業側の受領一覧と「採用」「該当なし」
- 管理者の承認

**まだ作らない:** 公開アーカイブ、参考になった、無応答の自動判定、
候補とのやりとり。

### 第2段階（運用に耐えるように）

- 無応答の自動判定（`abandoned`）と企業プロフィールへの表示
- 候補とのメッセージ連携
- 通知
- 決着後の公開アーカイブと「参考になった」

### 第3段階（Stack Overflow らしさ）

- 公開アーカイブの検索・分野別の閲覧
- 人材プロフィールに「公開した提案」を出す（ポートフォリオになる）
- 採用実績の表示

この第3段階まで来てはじめて Stack Overflow 的な資産になる。
**逆に言うと、第1段階は Stack Overflow ではない。** そこを混同しないこと。

## この設計で解けていないこと

正直に書いておく。

- **最初の1件をどう埋めるか。** 課題がゼロの一覧に人材は来ないし、
  人材がいない場に企業は出題しない。初期は運営が企業に直接依頼して
  数件並べるしかない。機能ではなく営業の問題。
- **提案の質をどう担保するか。** 承認制は出題側にしか効かない。
  提案側は数が出てから考える。
- **報酬が実際に払われたか。** 当事者間にすると把握できない。
  人材側に「受け取った」を記録してもらう程度が限界。
