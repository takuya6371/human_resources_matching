-- ============================================================
-- Didit本人確認への対応
--
-- 20260827000000 で追加した verification_* 列に、プロバイダ側の
-- 詳細ステータスと、Webhookの再送を安全に処理するための
-- イベント台帳を追加する。
--
-- Diditのステータスは10種類あり、こちらの4状態より細かい。
-- 判定は verification_status に、原文は verification_detail に残す。
-- ============================================================

alter table profiles
  add column if not exists verification_detail text;

comment on column profiles.verification_detail is
  'Diditが返した生のステータス（Approved / In Review / Kyc Expired など）。'
  'verification_status は本プラットフォーム側の4状態への写像。';

-- ------------------------------------------------------------
-- Webhookの冪等性。Diditは5xx時に最大2回再送するため、同じ
-- event_id を二度処理しないことが必要。主キー衝突をロックとして使う。
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

-- service_role（Webhook）だけが書き込む。クライアントからは一切触れない。
revoke all on verification_events from anon, authenticated;

-- 古いイベントは監査に不要になった時点で削除してよい。
comment on table verification_events is
  'Didit Webhookの受信台帳。冪等性のためだけに存在し、判定内容は保持しない。';
