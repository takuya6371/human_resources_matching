-- ============================================================
-- 投稿フィード(Connect)・フォロー・興味表明・ブックマーク・通知・
-- 運営コンテンツ(チーム紹介・信頼企業ロゴ)
--
-- docs/front/bridge-africa-talent/base44/entities/*.jsonc のフィールド
-- 定義・RLSルールを土台に、Postgresの流儀へ書き直した:
--   - user_name/company_name/actor_name 等の非正規化コピー列は持たず、
--     参照先(profiles/companies)をJOINして取得する
--   - likes/comments件数は都度COUNT()する(カウンタ列+トリガーの
--     保守コストを避ける。件数が問題になる規模になってから検討する)
--   - Challenge機能は今回スコープ外のため、SavedItem.item_typeの
--     'challenge'は含めない
--   - Notificationへの直接INSERTは許可しない(なりすまし通知のスパム
--     経路になるため)。'platform'種別のみ管理者が作成できる。
--     follow/like/comment等からの自動生成はPhase 4で個別に設計する
-- ============================================================

create type post_type as enum ('opportunity', 'scholarship', 'program', 'social_problem');
create type post_status as enum ('active', 'closed');

create table posts (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references companies(id) on delete cascade,
  type        post_type not null default 'opportunity',
  title       text not null,
  body        text not null,
  image_url   text,
  video_url   text,
  status      post_status not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table comments (
  id                 uuid primary key default gen_random_uuid(),
  post_id            uuid not null references posts(id) on delete cascade,
  user_id            uuid not null references auth.users(id),
  user_type          text not null check (user_type in ('talent', 'company')),
  body               text not null,
  parent_comment_id  uuid references comments(id) on delete cascade,
  created_at         timestamptz not null default now()
);

create table likes (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references posts(id) on delete cascade,
  user_id     uuid not null references auth.users(id),
  created_at  timestamptz not null default now(),
  unique (post_id, user_id)
);

create table follows (
  id           uuid primary key default gen_random_uuid(),
  follower_id  uuid not null references auth.users(id),
  target_type  text not null check (target_type in ('company', 'talent')),
  target_id    uuid not null,
  created_at   timestamptz not null default now(),
  unique (follower_id, target_type, target_id)
);

create table interests (
  id             uuid primary key default gen_random_uuid(),
  from_user_id   uuid not null references auth.users(id),
  from_type      text not null check (from_type in ('talent', 'company')),
  to_user_id     uuid not null references auth.users(id),
  to_type        text not null check (to_type in ('talent', 'company')),
  job_id         uuid references jobs(id) on delete set null,
  created_at     timestamptz not null default now()
);

create type saved_item_type as enum ('job', 'post', 'talent', 'company');

create table saved_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id),
  item_type   saved_item_type not null,
  -- item_idはitem_typeに応じてjobs/posts/profiles/companiesのいずれかを指す
  -- 多態参照のため単一のFK制約は張れない
  item_id     uuid not null,
  created_at  timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);

create type notification_type as enum (
  'follow', 'like', 'comment', 'reply', 'mention', 'message',
  'application', 'opportunity', 'match', 'platform'
);

create table notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id),
  actor_id     uuid references auth.users(id),
  actor_type   text check (actor_type in ('talent', 'company', 'system')),
  type         notification_type not null,
  title        text not null,
  body         text,
  target_type  text,
  target_id    uuid,
  read         boolean not null default false,
  created_at   timestamptz not null default now()
);

create table team_members (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  photo          text,
  position       text not null,
  bio            text,
  location       text,
  linkedin       text,
  website        text,
  display_order  integer not null default 0,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

create table trusted_companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  logo_url    text,
  website     text,
  sort_order  integer not null default 0,
  visible     boolean not null default true,
  created_at  timestamptz not null default now()
);

create index on posts (company_id);
create index on posts (status, created_at desc);
create index on comments (post_id);
create index on likes (post_id);
create index on follows (follower_id);
create index on follows (target_type, target_id);
create index on interests (from_user_id);
create index on interests (to_user_id);
create index on saved_items (user_id);
create index on notifications (user_id, read, created_at desc);

create trigger posts_updated_at
  before update on posts
  for each row execute function update_updated_at();

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table posts             enable row level security;
alter table comments          enable row level security;
alter table likes             enable row level security;
alter table follows           enable row level security;
alter table interests         enable row level security;
alter table saved_items       enable row level security;
alter table notifications     enable row level security;
alter table team_members      enable row level security;
alter table trusted_companies enable row level security;

-- posts: 公開の機会フィード。誰でも閲覧、投稿は企業アカウントのみ、
-- 更新・削除は投稿元企業か管理者のみ。
create policy "posts: select" on posts for select using (true);
create policy "posts: insert" on posts for insert
  with check (auth.uid() = company_id and is_company());
create policy "posts: update" on posts for update
  using (auth.uid() = company_id or is_admin());
create policy "posts: delete" on posts for delete
  using (auth.uid() = company_id or is_admin());

grant select on public.posts to anon, authenticated;
grant insert, update, delete on public.posts to authenticated;

create policy "comments: select" on comments for select using (true);
create policy "comments: insert" on comments for insert with check (auth.uid() = user_id);
create policy "comments: update" on comments for update using (auth.uid() = user_id or is_admin());
create policy "comments: delete" on comments for delete using (auth.uid() = user_id or is_admin());

grant select on public.comments to anon, authenticated;
grant insert, update, delete on public.comments to authenticated;

create policy "likes: select" on likes for select using (true);
create policy "likes: insert" on likes for insert with check (auth.uid() = user_id);
create policy "likes: delete" on likes for delete using (auth.uid() = user_id or is_admin());

grant select on public.likes to anon, authenticated;
grant insert, delete on public.likes to authenticated;

create policy "follows: select" on follows for select using (true);
create policy "follows: insert" on follows for insert with check (auth.uid() = follower_id);
create policy "follows: delete" on follows for delete using (auth.uid() = follower_id or is_admin());

grant select on public.follows to anon, authenticated;
grant insert, delete on public.follows to authenticated;

-- interests: 送り手・受け手どちらも閲覧できる(応募とは別の「興味あり」導線)
create policy "interests: select" on interests for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id or is_admin());
create policy "interests: insert" on interests for insert with check (auth.uid() = from_user_id);
create policy "interests: delete" on interests for delete
  using (auth.uid() = from_user_id or is_admin());

grant select, insert, delete on public.interests to authenticated;

create policy "saved_items: select" on saved_items for select
  using (auth.uid() = user_id or is_admin());
create policy "saved_items: insert" on saved_items for insert with check (auth.uid() = user_id);
create policy "saved_items: delete" on saved_items for delete
  using (auth.uid() = user_id or is_admin());

grant select, insert, delete on public.saved_items to authenticated;

-- notifications: 本人と管理者のみ閲覧。既読フラグの更新は本人のみ。
-- 新規作成はここでは開放しない(下記コメント参照)。
create policy "notifications: select" on notifications for select
  using (auth.uid() = user_id or is_admin());
create policy "notifications: update" on notifications for update
  using (auth.uid() = user_id or is_admin());
create policy "notifications: insert admin only" on notifications for insert
  with check (is_admin());

grant select, update, insert on public.notifications to authenticated;

-- team_members / trusted_companies: 運営が管理する公開コンテンツ。
-- 誰でも閲覧、書き込みは管理者のみ。
create policy "team_members: select" on team_members for select using (true);
create policy "team_members: admin write" on team_members for all
  using (is_admin()) with check (is_admin());

grant select on public.team_members to anon, authenticated;
grant insert, update, delete on public.team_members to authenticated;

create policy "trusted_companies: select" on trusted_companies for select using (true);
create policy "trusted_companies: admin write" on trusted_companies for all
  using (is_admin()) with check (is_admin());

grant select on public.trusted_companies to anon, authenticated;
grant insert, update, delete on public.trusted_companies to authenticated;
