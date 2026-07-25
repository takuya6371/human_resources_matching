-- ============================================================
-- RLS 再帰問題の修正 + 問い合わせテーブル追加
-- ============================================================

-- is_admin() を security definer で定義することで RLS 再帰を回避
create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- 既存の再帰しうるポリシーを差し替え
drop policy if exists "profiles: public read approved" on profiles;
drop policy if exists "profiles: admin full access" on profiles;

create policy "profiles: select"
  on profiles for select
  using (
    status = 'approved'
    or auth.uid() = id
    or is_admin()
  );

create policy "profiles: admin all"
  on profiles for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
-- 問い合わせテーブル
-- ============================================================
create table inquiries (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  company       text,
  email         text not null,
  inquiry_type  text,
  message       text not null,
  created_at    timestamptz not null default now()
);

alter table inquiries enable row level security;

-- 誰でも送信できる
create policy "inquiries: anyone insert"
  on inquiries for insert with check (true);

-- 管理者だけ閲覧できる
create policy "inquiries: admin read"
  on inquiries for select using (is_admin());
