-- ============================================================
-- 議事録 2026-07-10 反映: プロフィール項目追加 + 承認フロー
-- ============================================================

-- 承認ステータス enum
create type profile_status as enum ('draft', 'pending', 'approved', 'rejected');

-- ============================================================
-- profiles に項目追加
-- ============================================================
alter table profiles
  -- 承認フロー
  add column status          profile_status not null default 'draft',
  add column admin_note      text,                        -- 管理者コメント（却下理由など）
  add column published_at    timestamptz,                 -- 承認・公開日時

  -- 居住地（ソート要件）
  add column residence_area  text,                        -- 例: 東京都, 神奈川県

  -- 経歴・スキル追加項目
  add column dev_experience_years  integer,               -- 開発経験年数
  add column past_clients    text[] not null default '{}', -- 過去の取引先

  -- 自由記述・PR追加項目
  add column years_in_japan  integer,                     -- 日本在住年数
  add column hobbies         text,                        -- 趣味

  -- メディア
  add column video_url       text,                        -- 紹介動画URL（1分以内）

  -- 非公開管理項目（管理者のみ閲覧）
  add column marital_status  text;                        -- 婚姻関係

-- ============================================================
-- インデックス追加
-- ============================================================
create index on profiles (status);
create index on profiles (residence_area);

-- ============================================================
-- RLS ポリシー更新: 公開一覧は approved のみ
-- ============================================================

-- 既存の public read ポリシーを削除して再作成
drop policy "profiles: public read" on profiles;

-- 未ログインユーザー: approved のみ閲覧可
create policy "profiles: public read approved"
  on profiles for select
  using (
    status = 'approved'
    or auth.uid() = id          -- 本人は自分のdraftも見える
    or exists (                 -- 管理者は全件見える
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ============================================================
-- 管理者用ポリシー: 全プロフィールの更新（審査・承認）
-- ============================================================
create policy "profiles: admin full access"
  on profiles for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ============================================================
-- 登録者が申請できる関数（draft → pending）
-- ============================================================
create or replace function submit_profile_for_review()
returns void language plpgsql security definer as $$
begin
  update profiles
  set status = 'pending'
  where id = auth.uid()
    and status = 'draft';
end;
$$;

-- ============================================================
-- 管理者が承認/却下する関数
-- ============================================================
create or replace function review_profile(
  target_id uuid,
  new_status profile_status,
  note text default null
)
returns void language plpgsql security definer as $$
begin
  -- 呼び出し元が管理者かチェック
  if not exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Permission denied';
  end if;

  update profiles
  set
    status       = new_status,
    admin_note   = note,
    published_at = case when new_status = 'approved' then now() else null end
  where id = target_id;
end;
$$;
