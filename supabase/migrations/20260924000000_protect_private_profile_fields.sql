-- ============================================================
-- 機微な個人情報を profiles から分離する
--
-- profiles のRLSは「行」単位のため、承認済みプロフィールの行を読める企業
-- アカウントは、APIを直接叩けば その行の全列を取得できる。画面では
-- PROFILE_PUBLIC_COLUMNS で絞っているが、それはアプリ側の都合でしかなく、
-- ブラウザから select=* を投げれば以下がそのまま返っていた:
--
--   email / admin_note(管理者の内部審査メモ) / date_of_birth / gender /
--   nationality / postal_code / address_line / address_kana_ja /
--   commute_minutes / dependents_count / has_spouse / spouse_is_dependent /
--   verification_ref ほか
--
-- 応募先になり得る企業が、候補者の自宅住所・生年月日・配偶者や扶養家族の
-- 有無まで取得できる状態だった。列単位の制御はRLSでは表現できないので、
-- これらを本人と管理者だけが読めるテーブルへ移す。
--
-- 移す列はいずれも現時点でフロントエンドから参照されていない（email と
-- admin_note を除く）。CV取り込みの受け皿として用意されたまま未使用だった。
-- ============================================================

create table public.profile_private (
  id                    uuid primary key references public.profiles(id) on delete cascade,
  email                 text,
  admin_note            text,
  date_of_birth         date,
  gender                gender_option,
  nationality           text,
  postal_code           text,
  address_line          text,
  address_kana_ja       text,
  commute_minutes       integer,
  dependents_count      integer,
  has_spouse            boolean,
  spouse_is_dependent   boolean,
  verification_provider text,
  verification_ref      text,
  verification_detail   text,
  updated_at            timestamptz not null default now()
);

comment on table public.profile_private is
  '本人と管理者のみが読める個人情報。企業からは参照できない。';

-- 既存データを移送
insert into public.profile_private (
  id, email, admin_note, date_of_birth, gender, nationality, postal_code,
  address_line, address_kana_ja, commute_minutes, dependents_count,
  has_spouse, spouse_is_dependent, verification_provider, verification_ref,
  verification_detail)
select
  id, email, admin_note, date_of_birth, gender, nationality, postal_code,
  address_line, address_kana_ja, commute_minutes, dependents_count,
  has_spouse, spouse_is_dependent, verification_provider, verification_ref,
  verification_detail
from public.profiles;

alter table public.profiles
  drop column email,
  drop column admin_note,
  drop column date_of_birth,
  drop column gender,
  drop column nationality,
  drop column postal_code,
  drop column address_line,
  drop column address_kana_ja,
  drop column commute_minutes,
  drop column dependents_count,
  drop column has_spouse,
  drop column spouse_is_dependent,
  drop column verification_provider,
  drop column verification_ref,
  drop column verification_detail;

alter table public.profile_private enable row level security;

-- 本人と管理者のみ。企業アカウントはいかなる経路でも読めない。
create policy "profile_private: select" on public.profile_private for select
  using (auth.uid() = id or is_admin());
create policy "profile_private: insert" on public.profile_private for insert
  with check (auth.uid() = id or is_admin());
create policy "profile_private: update" on public.profile_private for update
  using (auth.uid() = id or is_admin());

grant select, insert, update on public.profile_private to authenticated;

-- プロフィール作成時に対になる行を必ず用意する
create or replace function public.create_profile_private()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profile_private (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger profiles_create_private
  after insert on public.profiles
  for each row execute function public.create_profile_private();
