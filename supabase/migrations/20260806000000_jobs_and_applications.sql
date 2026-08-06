-- ============================================================
-- 求人公募 + 応募機能（CloudWorksのような、企業が案件を公開し
-- 人材が応募できる仕組み）
--
-- jobs: 企業が作成する求人。status='open'のもののみ誰でも閲覧可能、
-- draft/closedは投稿企業と管理者のみ閲覧可能（プロフィールの承認
-- フローと同じ「投稿者/管理者は全ステータス、それ以外は公開分のみ」
-- というパターンを踏襲）。
--
-- applications: 人材が求人に応募した記録。1求人につき1人材1件まで。
-- ============================================================

create type job_status as enum ('draft', 'open', 'closed');
create type application_status as enum ('submitted', 'reviewing', 'accepted', 'rejected', 'withdrawn');

create table jobs (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references companies(id) on delete cascade,

  title_en         text not null default '',
  title_ja         text not null default '',
  description_en   text,
  description_ja   text,
  field            text,
  field_ja         text,
  japanese_level   jlpt_level,
  employment_type  text,   -- 例: full-time / contract / internship（自由入力）
  salary_range     text,
  location         text,

  status           job_status not null default 'draft',

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table applications (
  id              uuid primary key default gen_random_uuid(),
  job_id          uuid not null references jobs(id) on delete cascade,
  profile_id      uuid not null references profiles(id) on delete cascade,

  status          application_status not null default 'submitted',
  cover_message   text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (job_id, profile_id)
);

create index on jobs (company_id);
create index on jobs (status);
create index on applications (job_id);
create index on applications (profile_id);

create trigger jobs_updated_at
  before update on jobs
  for each row execute function update_updated_at();

create trigger applications_updated_at
  before update on applications
  for each row execute function update_updated_at();

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table jobs         enable row level security;
alter table applications enable row level security;

create policy "jobs: select"
  on jobs for select
  using (status = 'open' or auth.uid() = company_id or is_admin());

create policy "jobs: owner write"
  on jobs for all
  using (auth.uid() = company_id or is_admin())
  with check (auth.uid() = company_id or is_admin());

create policy "applications: select"
  on applications for select
  using (
    auth.uid() = profile_id
    or exists (select 1 from jobs where jobs.id = applications.job_id and jobs.company_id = auth.uid())
    or is_admin()
  );

-- 承認済みプロフィールの人材のみ応募できる（未承認プロフィールは企業から
-- 閲覧できずゲート表示になるため、応募だけできても企業側が中身を見られない）
create policy "applications: insert"
  on applications for insert
  with check (
    auth.uid() = profile_id
    and exists (select 1 from profiles where id = auth.uid() and status = 'approved')
  );

create policy "applications: update"
  on applications for update
  using (
    auth.uid() = profile_id
    or exists (select 1 from jobs where jobs.id = applications.job_id and jobs.company_id = auth.uid())
    or is_admin()
  );

grant select on public.jobs to anon, authenticated;
grant insert, update, delete on public.jobs to authenticated;

grant select, insert, update on public.applications to authenticated;

-- ------------------------------------------------------------
-- applications の書き換えガード
--
-- RLSの update ポリシーは「応募した本人 or 求人を出した企業」に
-- 行単位でUPDATEを許可しているが、列単位の制御はできない。
-- そのままだと人材が自分でstatusを'accepted'に書き換えて企業を
-- 欺いたり、企業がcover_message（応募メッセージ本文）を改ざんできて
-- しまう（profiles.role の権限昇格バグと同種の問題）。
-- そのため、どちらの当事者が更新したかによって触れる列を制限する。
-- ------------------------------------------------------------
create or replace function guard_application_update()
returns trigger language plpgsql as $$
declare
  v_is_company boolean;
begin
  if is_admin() or auth.uid() is null then
    return new;
  end if;

  v_is_company := exists (
    select 1 from jobs where jobs.id = new.job_id and jobs.company_id = auth.uid()
  );

  if v_is_company then
    -- 企業はstatusのみ変更可能（応募内容そのものは書き換えさせない）
    new.job_id := old.job_id;
    new.profile_id := old.profile_id;
    new.cover_message := old.cover_message;
  elsif auth.uid() = old.profile_id then
    -- 人材は取り下げ（withdrawn）以外のstatus変更はできない
    if new.status is distinct from old.status and new.status <> 'withdrawn' then
      new.status := old.status;
    end if;
    new.job_id := old.job_id;
    new.profile_id := old.profile_id;
  else
    return old;
  end if;

  return new;
end;
$$;

create trigger applications_guard_update
  before update on applications
  for each row execute function guard_application_update();

-- 応募時に status を submitted 以外に指定して作成することを防ぐ
create or replace function guard_application_insert()
returns trigger language plpgsql as $$
begin
  if not is_admin() and auth.uid() is not null then
    new.status := 'submitted';
  end if;
  return new;
end;
$$;

create trigger applications_guard_insert
  before insert on applications
  for each row execute function guard_application_insert();
