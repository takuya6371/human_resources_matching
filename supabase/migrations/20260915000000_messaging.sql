-- ============================================================
-- タレント⇔企業のメッセージング機能
--
-- docs/handover/message-platform（仕様のみ、実装なし）と
-- docs/bridge-migration-plan.md の「5 詳細設計」に基づく新規スキーマ。
--
-- 送信は必ず send-message Edge Function 経由（クライアントから
-- messages への直接INSERTはRLS/GRANTの両方で禁止する）。理由は
-- モデレーション（tier1ルール判定）をサーバー側で強制するため。
-- 今はブラウザのみで迂回可能というのが、HANDOVER.mdが指摘する
-- 唯一のセキュリティ課題。
-- ============================================================

create type thread_status as enum ('open', 'flagged');

create table threads (
  id                 uuid primary key default gen_random_uuid(),
  talent_id          uuid not null references profiles(id) on delete cascade,
  company_id         uuid not null references companies(id) on delete cascade,

  status             thread_status not null default 'open',
  support_requested  boolean not null default false,
  strike_count       integer not null default 0,

  -- 保留(flagged)時の理由。tier1/tier2どちらの判定で保留になったかを記録する。
  flagged_by         text check (flagged_by in ('rules', 'model')),
  flagged_category   text,
  flagged_quote      text,
  flagged_reason     text,
  flagged_at         timestamptz,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  unique (talent_id, company_id)
);

create table messages (
  id             uuid primary key default gen_random_uuid(),
  thread_id      uuid not null references threads(id) on delete cascade,
  from_user_id   uuid references auth.users(id),  -- システム通知はnull

  -- 'chat'=通常メッセージ、それ以外はシステム通知
  kind           text not null default 'chat'
                 check (kind in ('chat', 'held', 'released', 'support_requested')),
  text           text not null,
  translation    text,   -- 挿入後に非同期で埋める(translate Edge Functionを流用)
  read           boolean not null default false,

  created_at     timestamptz not null default now()
);

-- moderationイベントの監査ログ。threadsの flagged_* は「現在の状態」のみを
-- 持つため、履歴を残す目的で別テーブルにする。
create table thread_flags (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references threads(id) on delete cascade,
  verdict     text not null check (verdict in ('block', 'review')),
  categories  text[] not null default '{}',
  reason      text,
  created_at  timestamptz not null default now()
);

create index on threads (talent_id);
create index on threads (company_id);
create index on messages (thread_id, created_at);
create index on thread_flags (thread_id);

create trigger threads_updated_at
  before update on threads
  for each row execute function update_updated_at();

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table threads      enable row level security;
alter table messages     enable row level security;
alter table thread_flags enable row level security;

create policy "threads: select"
  on threads for select
  using (auth.uid() = talent_id or auth.uid() = company_id or is_admin());

-- スレッド開始は当事者本人のみ。会話内容自体はここでは扱わないため
-- モデレーションの対象外(タレント/企業のどちらからでも開始できる)。
create policy "threads: insert"
  on threads for insert
  with check (auth.uid() = talent_id or auth.uid() = company_id);

create policy "threads: update"
  on threads for update
  using (auth.uid() = talent_id or auth.uid() = company_id or is_admin());

grant select, insert, update on public.threads to authenticated;

create policy "messages: select"
  on messages for select
  using (
    exists (
      select 1 from threads t
      where t.id = messages.thread_id
        and (t.talent_id = auth.uid() or t.company_id = auth.uid())
    )
    or is_admin()
  );

-- messagesへの書き込みはservice role(send-message Edge Function、
-- 管理者操作用のEdge Function)のみ。クライアントから直接INSERT/UPDATE/
-- DELETEさせない。
grant select on public.messages to authenticated;
revoke insert, update, delete on public.messages from authenticated, anon;

create policy "thread_flags: select"
  on thread_flags for select
  using (is_admin());

grant select on public.thread_flags to authenticated;
revoke insert, update, delete on public.thread_flags from authenticated, anon;

-- ------------------------------------------------------------
-- threads の書き換えガード
--
-- RLSの update ポリシーは行単位の許可であり、列単位までは絞れない。
-- 参加者(タレント/企業)が自分で status / strike_count / flagged_* を
-- 書き換えてモデレーションを無効化できてしまうため、applications と
-- 同様のガードで、参加者は support_requested 以外を変更できないようにする。
-- ------------------------------------------------------------
create or replace function guard_thread_update()
returns trigger language plpgsql as $$
begin
  if is_admin() or auth.role() = 'service_role' then
    return new;
  end if;

  if auth.uid() = old.talent_id or auth.uid() = old.company_id then
    new.talent_id         := old.talent_id;
    new.company_id        := old.company_id;
    new.status            := old.status;
    new.strike_count      := old.strike_count;
    new.flagged_by        := old.flagged_by;
    new.flagged_category  := old.flagged_category;
    new.flagged_quote     := old.flagged_quote;
    new.flagged_reason    := old.flagged_reason;
    new.flagged_at        := old.flagged_at;
    return new;
  end if;

  return old;
end;
$$;

create trigger threads_guard_update
  before update on threads
  for each row execute function guard_thread_update();
