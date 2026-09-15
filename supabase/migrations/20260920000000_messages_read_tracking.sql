-- ============================================================
-- 既読管理とサポート要請通知
--
-- 20260915000000_messaging.sql は messages への insert/update/delete を
-- authenticatedから全面的に剥奪した(送信はsend-message経由のみに強制するため)。
-- そのままだと開封時の既読化(read列)もクライアントからできなくなってしまうため、
-- threads.support_requested と同じ考え方(参加者が変更してよい列だけをトリガーで
-- 許可し、他の列はold値に戻す)でmessagesにも同様のガードを追加する。
--
-- あわせて、サポート要請(threads.support_requested)はクライアントが直接
-- updateできる列だが、要請時にスレッドへ通知メッセージを挿入する処理は
-- (messagesへの直接insertができない以上)notify_on_follow等と同じ
-- security definerトリガーで行う。
-- ============================================================

grant update on public.messages to authenticated;

create policy "messages: update read status"
  on messages for update
  using (
    exists (
      select 1 from threads t
      where t.id = messages.thread_id
        and (t.talent_id = auth.uid() or t.company_id = auth.uid())
    )
  );

create or replace function guard_message_update()
returns trigger language plpgsql as $$
begin
  if is_admin() or auth.role() = 'service_role' then
    return new;
  end if;

  new.thread_id     := old.thread_id;
  new.from_user_id  := old.from_user_id;
  new.kind          := old.kind;
  new.text          := old.text;
  new.translation   := old.translation;
  new.created_at    := old.created_at;
  return new;
end;
$$;

create trigger messages_guard_update
  before update on messages
  for each row execute function guard_message_update();

-- ------------------------------------------------------------
-- サポート要請の通知メッセージ(message-platform/app.js requestSupport() の文言を移植)
-- ------------------------------------------------------------
create or replace function notify_support_requested()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name_en text;
  v_name_ja text;
begin
  if new.support_requested and not old.support_requested then
    if auth.uid() = new.talent_id then
      select coalesce(nullif(name_en, ''), 'A candidate'), coalesce(nullif(name_ja, ''), name_en)
        into v_name_en, v_name_ja
        from profiles where id = new.talent_id;
    else
      select coalesce(nullif(name, ''), 'A company'), coalesce(nullif(name_ja, ''), name)
        into v_name_en, v_name_ja
        from companies where id = new.company_id;
    end if;

    insert into messages (thread_id, from_user_id, kind, text, translation)
    values (
      new.id, null, 'support_requested',
      v_name_en || ' asked for an AfriTalent intermediary. Someone from our team has joined and can see the conversation from here on. They can help with anything you would rather not raise directly.',
      v_name_ja || 'がアフリタレント運営の仲介を依頼しました。以降のやり取りを運営が確認し、直接お話ししにくい事柄もサポートいたします。'
    );
  end if;
  return new;
end;
$$;

create trigger threads_notify_support_requested
  after update on threads
  for each row execute function notify_support_requested();
