-- ============================================================
-- フォロー時の通知自動生成
--
-- notificationsへの直接INSERTはPhase 1cでadmin限定にした
-- (なりすまし通知のスパム経路を避けるため)。フォローされた側への
-- 通知は、クライアントに書き込み権限を与えるのではなく、followsへの
-- INSERT自体をトリガーとしてサーバー側(security definer)で生成する。
-- ============================================================

create or replace function notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_type text;
begin
  select case
    when exists (select 1 from profiles where id = new.follower_id) then 'talent'
    when exists (select 1 from companies where id = new.follower_id) then 'company'
    else 'system'
  end into v_actor_type;

  -- titleは英語の暫定表示用フォールバック。本アプリはen/ja/frの多言語対応のため、
  -- 実際の表示はNotificationsページ側でtype='follow'+actor_id/actor_typeから
  -- 都度ローカライズして組み立てる想定(このtitleをそのまま信用しない)。
  insert into notifications (user_id, actor_id, actor_type, type, title, target_type, target_id)
  values (
    new.target_id,
    new.follower_id,
    v_actor_type,
    'follow',
    'New follower',
    new.target_type,
    new.follower_id
  );

  return new;
end;
$$;

create trigger follows_notify
  after insert on follows
  for each row execute function notify_on_follow();
