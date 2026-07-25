-- ============================================================
-- 企業アカウント限定の全文閲覧 + 未ログイン/人材向けティザー
-- ============================================================

-- 企業アカウントかどうかを判定するヘルパー（is_admin() と同じくRLS再帰を回避）
create or replace function is_company()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from companies where id = auth.uid()
  );
$$;

-- ------------------------------------------------------------
-- profiles: フル閲覧は 本人 / 管理者 / 企業アカウント のみ
-- ------------------------------------------------------------
drop policy if exists "profiles: select" on profiles;

create policy "profiles: select"
  on profiles for select
  using (
    auth.uid() = id
    or is_admin()
    or (status = 'approved' and is_company())
  );

-- ------------------------------------------------------------
-- profile_languages / profile_experiences も同様に絞る
-- （旧ポリシーは using (true) で誰でも全件閲覧できてしまっていたため修正）
-- ------------------------------------------------------------
drop policy if exists "profile_languages: public read" on profile_languages;

create policy "profile_languages: select"
  on profile_languages for select
  using (
    auth.uid() = profile_id
    or is_admin()
    or (
      is_company()
      and exists (
        select 1 from profiles p
        where p.id = profile_languages.profile_id and p.status = 'approved'
      )
    )
  );

drop policy if exists "profile_experiences: public read" on profile_experiences;

create policy "profile_experiences: select"
  on profile_experiences for select
  using (
    auth.uid() = profile_id
    or is_admin()
    or (
      is_company()
      and exists (
        select 1 from profiles p
        where p.id = profile_experiences.profile_id and p.status = 'approved'
      )
    )
  );

-- ------------------------------------------------------------
-- 未ログイン・人材アカウント向けティザービュー
-- 連絡先や氏名・自己紹介などを含まない、安全なカラムのみ公開する。
-- view所有者（migration実行ロール）としてRLSをバイパスし、
-- ここで絞ったカラム・行だけが誰でも見える状態になる。
-- ------------------------------------------------------------
-- ビュー名に "teaser" 等の広告/トラッキング関連語を含めると、uBlock Origin 等の
-- 広告ブロッカーがURLパターンマッチでリクエスト自体をブロックしてしまうため
-- "profiles_preview" という名前にしている（実際にブラウザで再現・確認済み）。
create view public.profiles_preview as
select
  id,
  field,
  field_ja,
  country,
  country_ja,
  flag,
  japanese_level,
  skills,
  skills_ja,
  open_to_work,
  university_en,
  faculty_en,
  degree,
  graduation_year,
  residence_area,
  available_from,
  available_from_ja,
  status
from profiles
where status = 'approved';

grant select on public.profiles_preview to anon, authenticated;
