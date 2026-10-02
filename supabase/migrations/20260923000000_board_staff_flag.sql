-- ============================================================
-- 相談ボードの投稿に「運営によるものか」を持たせる
--
-- 人材は他人の profiles 行をRLSで読めないため、ボード上の投稿者名は
-- 他人から見ると常に空になり、全員が「登録者」と表示される。
-- 匿名性としてはむしろ望ましい（在留資格や退職の相談を実名で晒さずに済む）が、
-- 運営の回答と他の登録者の体験談が区別できないのは相談の場として問題がある。
-- 「ビザはこの手続きで大丈夫」と書かれたとき、それが公式見解なのか個人の
-- 思い込みなのかを読み手が判断できない。
--
-- 名前を公開する（profilesのRLSを緩める）のではなく、運営かどうかだけを
-- 真偽値で持たせる。投稿者のroleはクライアントから詐称できないよう、
-- security definer のトリガーでサーバー側が決める。
-- ============================================================

alter table public.board_threads add column from_staff boolean not null default false;
alter table public.board_replies add column from_staff boolean not null default false;

create or replace function public.set_board_from_staff()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- クライアントが渡した値は信用せず、投稿者のroleから必ず決め直す
  new.from_staff := exists (
    select 1 from public.profiles
    where id = new.author_id and role = 'admin'
  );
  return new;
end;
$$;

create trigger board_threads_from_staff
  before insert or update on public.board_threads
  for each row execute function public.set_board_from_staff();

create trigger board_replies_from_staff
  before insert or update on public.board_replies
  for each row execute function public.set_board_from_staff();

-- 既存行の埋め直し
update public.board_threads t set from_staff = exists (
  select 1 from public.profiles p where p.id = t.author_id and p.role = 'admin');
update public.board_replies r set from_staff = exists (
  select 1 from public.profiles p where p.id = r.author_id and p.role = 'admin');
