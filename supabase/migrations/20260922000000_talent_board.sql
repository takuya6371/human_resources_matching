-- ============================================================
-- 人材向けの相談掲示板
--
-- 既存の posts（Connect）は company_id が NOT NULL で、RLSも is_company()
-- 限定の「企業の発信」用。人材が相談を書ける場がないため別に用意する。
--
-- 閲覧範囲を人材と運営に限るのが要点。「ビザが不安」「帰国後どうするか」と
-- いった率直な相談が、応募先になり得る企業から読める状態だと、本音が書けず
-- 掲示板として機能しなくなる。よって企業アカウントからは読めない。
--
-- 回答は運営と他の人材の両方ができる（同じ立場の先輩の経験が最も役に立つ）。
-- 投稿には掲載承認を要求しない。登録直後こそ相談したいことが多いため。
-- ============================================================

create table public.board_threads (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles(id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 200),
  body       text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create table public.board_replies (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.board_threads(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index board_threads_created_at_idx on public.board_threads (created_at desc);
create index board_replies_thread_id_idx  on public.board_replies (thread_id, created_at);

alter table public.board_threads enable row level security;
alter table public.board_replies enable row level security;

-- 閲覧: 企業以外の認証済みユーザー（＝人材と管理者）のみ
create policy "board_threads: select" on public.board_threads for select
  using (auth.uid() is not null and not is_company());
create policy "board_replies: select" on public.board_replies for select
  using (auth.uid() is not null and not is_company());

-- 投稿: 本人名義でのみ。企業は不可
create policy "board_threads: insert" on public.board_threads for insert
  with check (auth.uid() = author_id and not is_company());
create policy "board_replies: insert" on public.board_replies for insert
  with check (auth.uid() = author_id and not is_company());

-- 削除: 本人または管理者（運営が不適切な投稿を落とせるようにする）
create policy "board_threads: delete" on public.board_threads for delete
  using (auth.uid() = author_id or is_admin());
create policy "board_replies: delete" on public.board_replies for delete
  using (auth.uid() = author_id or is_admin());

grant select, insert, delete on public.board_threads to authenticated;
grant select, insert, delete on public.board_replies to authenticated;
