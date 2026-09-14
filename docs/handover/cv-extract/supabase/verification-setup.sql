-- ============================================================
-- Didit本人確認 — SQLエディタ貼り付け用
--
-- 20260827000000 と 20260829000000 を1つにまとめ、既存の本番
-- プロジェクトに対して安全に流せるよう冪等にしたもの。CLIを
-- 使わずSupabaseダッシュボードのSQL Editorから実行できる。
--
-- 既存データは変更しない。列とテーブルの追加のみ。
-- 二度実行しても同じ結果になる。
-- ============================================================

-- ------------------------------------------------------------
-- 1. 判定の4状態
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'verification_status') then
    create type verification_status as enum ('unverified', 'pending', 'verified', 'failed');
  end if;
end $$;

-- ------------------------------------------------------------
-- 2. profiles への列追加
--
-- 身分証の画像・番号は保存しない。受け取るのは「確認できたか否か」と
-- プロバイダ側の参照IDのみ。保持すれば漏洩時の被害が跳ね上がる。
-- ------------------------------------------------------------
alter table profiles
  add column if not exists verification_status   verification_status not null default 'unverified',
  add column if not exists verification_provider text,
  add column if not exists verification_ref      text,
  add column if not exists verification_detail   text,
  add column if not exists verified_at           timestamptz;

comment on column profiles.verification_status is
  '外部eKYCプロバイダによる本人確認の結果。クライアントからは更新不可。';
comment on column profiles.verification_detail is
  'Diditが返した生のステータス（Approved / In Review / Kyc Expired など）。';

-- ------------------------------------------------------------
-- 3. 本人が自分で「確認済み」にできてはならない
--
-- 更新はWebhookを受けるEdge Function（service_role）だけが行う。
-- ------------------------------------------------------------
create or replace function guard_verification_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.verification_status   is distinct from old.verification_status
  or new.verification_provider is distinct from old.verification_provider
  or new.verification_ref      is distinct from old.verification_ref
  or new.verification_detail   is distinct from old.verification_detail
  or new.verified_at           is distinct from old.verified_at then
    raise exception 'verification fields are set by the verification webhook, not by the client';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_verification_fields_trigger on profiles;
create trigger guard_verification_fields_trigger
  before update on profiles
  for each row execute function guard_verification_fields();

-- ------------------------------------------------------------
-- 4. Webhookの冪等性
--
-- Diditは5xx時に最大2回再送する。同じ event_id を二度処理しない
-- ことが必要で、主キー衝突をそのロックとして使う。
-- ------------------------------------------------------------
create table if not exists verification_events (
  event_id     text primary key,
  session_id   text,
  status       text,
  received_at  timestamptz not null default now()
);

create index if not exists verification_events_session_idx
  on verification_events (session_id, received_at desc);

alter table verification_events enable row level security;
revoke all on verification_events from anon, authenticated;

comment on table verification_events is
  'Didit Webhookの受信台帳。冪等性のためだけに存在し、判定内容は保持しない。';
