-- ============================================================
-- AfriTalent: 初期スキーマ
-- ============================================================

-- ユーザーロール
create type user_role as enum ('talent', 'company', 'admin');

-- JLPT レベル
create type jlpt_level as enum ('N1', 'N2', 'N3', 'N4', 'N5');

-- 言語習熟度
create type language_level as enum ('Native', 'Fluent', 'Business', 'Conversational', 'Basic');

-- コンタクトステータス
create type contact_status as enum ('pending', 'accepted', 'declined');

-- ============================================================
-- profiles（人材プロフィール）
-- ============================================================
create table profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  role             user_role not null default 'talent',

  -- 名前
  name_en          text not null default '',
  name_ja          text not null default '',

  -- 基本情報
  country          text,
  country_ja       text,
  flag             text,
  avatar_url       text,

  -- 専門分野
  field            text,
  field_ja         text,

  -- 学歴
  university_en    text,
  university_ja    text,
  faculty_en       text,
  faculty_ja       text,
  degree           text,
  graduation_year  integer,

  -- 日本語レベル
  japanese_level   jlpt_level,

  -- スキル
  skills           text[] not null default '{}',
  skills_ja        text[] not null default '{}',

  -- 自己紹介
  bio_en           text,
  bio_ja           text,

  -- 就業情報
  available_from     date,
  available_from_ja  text,
  open_to_work       boolean not null default true,

  -- ヘッドライン（一行紹介）
  headline_en      text,
  headline_ja      text,

  -- 連絡先
  email            text,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ============================================================
-- profile_languages（話せる言語）
-- ============================================================
create table profile_languages (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  language    text not null,
  level       language_level not null,
  sort_order  integer not null default 0
);

-- ============================================================
-- profile_experiences（職務経験）
-- ============================================================
create table profile_experiences (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references profiles(id) on delete cascade,
  company_en   text,
  company_ja   text,
  role_en      text,
  role_ja      text,
  period       text,
  desc_en      text,
  desc_ja      text,
  sort_order   integer not null default 0
);

-- ============================================================
-- companies（企業アカウント）
-- ============================================================
create table companies (
  id           uuid primary key references auth.users(id) on delete cascade,
  name         text not null,
  name_ja      text,
  description  text,
  industry     text,
  size         text,
  website      text,
  logo_url     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- contact_requests（スカウト・問い合わせ）
-- ============================================================
create table contact_requests (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references companies(id) on delete cascade,
  profile_id   uuid not null references profiles(id) on delete cascade,
  message      text,
  status       contact_status not null default 'pending',
  created_at   timestamptz not null default now()
);

-- ============================================================
-- updated_at 自動更新トリガー
-- ============================================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

create trigger companies_updated_at
  before update on companies
  for each row execute function update_updated_at();

-- ============================================================
-- インデックス
-- ============================================================
create index on profiles (field);
create index on profiles (japanese_level);
create index on profiles (open_to_work);
create index on profiles using gin (skills);
create index on profile_languages (profile_id);
create index on profile_experiences (profile_id, sort_order);
create index on contact_requests (profile_id);
create index on contact_requests (company_id);

-- ============================================================
-- RLS（Row Level Security）
-- ============================================================
alter table profiles          enable row level security;
alter table profile_languages enable row level security;
alter table profile_experiences enable row level security;
alter table companies         enable row level security;
alter table contact_requests  enable row level security;

-- profiles: 誰でも読める、本人だけ書ける
create policy "profiles: public read"
  on profiles for select using (true);

create policy "profiles: owner write"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- profile_languages: 誰でも読める、本人だけ書ける
create policy "profile_languages: public read"
  on profile_languages for select using (true);

create policy "profile_languages: owner write"
  on profile_languages for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- profile_experiences: 誰でも読める、本人だけ書ける
create policy "profile_experiences: public read"
  on profile_experiences for select using (true);

create policy "profile_experiences: owner write"
  on profile_experiences for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- companies: 誰でも読める、本人だけ書ける
create policy "companies: public read"
  on companies for select using (true);

create policy "companies: owner write"
  on companies for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- contact_requests: 当事者（企業・人材）のみ
create policy "contact_requests: company read"
  on contact_requests for select
  using (auth.uid() = company_id);

create policy "contact_requests: talent read"
  on contact_requests for select
  using (auth.uid() = profile_id);

create policy "contact_requests: company insert"
  on contact_requests for insert
  with check (auth.uid() = company_id);

create policy "contact_requests: talent update status"
  on contact_requests for update
  using (auth.uid() = profile_id);

-- ============================================================
-- 新規ユーザー登録時に profiles / companies を自動作成
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_role user_role;
begin
  v_role := coalesce(
    (new.raw_user_meta_data->>'role')::user_role,
    'talent'
  );

  if v_role = 'talent' then
    insert into profiles (id, role, email, name_en)
    values (new.id, 'talent', new.email, '');
  elsif v_role = 'company' then
    insert into companies (id, name)
    values (new.id, coalesce(new.raw_user_meta_data->>'company_name', ''));
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
