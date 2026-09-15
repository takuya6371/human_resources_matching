-- ============================================================
-- いいね・コメント発生時の通知自動生成
--
-- notify_on_follow(20260916)と同じ理由・同じ設計(notificationsへの
-- 直接INSERTはadmin限定のまま、書き込みトリガーで生成する)。
-- ============================================================

create or replace function resolve_actor_type(p_user_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select case
    when exists (select 1 from profiles where id = p_user_id) then 'talent'
    when exists (select 1 from companies where id = p_user_id) then 'company'
    else 'system'
  end;
$$;

create or replace function notify_on_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
begin
  select company_id into v_company_id from posts where id = new.post_id;
  if v_company_id is not null and v_company_id <> new.user_id then
    insert into notifications (user_id, actor_id, actor_type, type, title, target_type, target_id)
    values (v_company_id, new.user_id, resolve_actor_type(new.user_id), 'like', 'New like', 'post', new.post_id);
  end if;
  return new;
end;
$$;

create trigger likes_notify
  after insert on likes
  for each row execute function notify_on_like();

create or replace function notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient uuid;
  v_type notification_type;
begin
  if new.parent_comment_id is not null then
    select user_id into v_recipient from comments where id = new.parent_comment_id;
    v_type := 'reply';
  else
    select company_id into v_recipient from posts where id = new.post_id;
    v_type := 'comment';
  end if;

  if v_recipient is not null and v_recipient <> new.user_id then
    insert into notifications (user_id, actor_id, actor_type, type, title, target_type, target_id)
    values (v_recipient, new.user_id, resolve_actor_type(new.user_id), v_type,
            case when v_type = 'reply' then 'New reply' else 'New comment' end,
            'post', new.post_id);
  end if;
  return new;
end;
$$;

create trigger comments_notify
  after insert on comments
  for each row execute function notify_on_comment();
