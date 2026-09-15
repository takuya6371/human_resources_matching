-- ============================================================
-- profile_photos（証明写真・人柄写真）
--
-- profiles.avatar_url は1枚しか持てない。日本向けの応募では
-- 履歴書に貼る証明写真（30x40mm）と、人柄が伝わるカジュアル写真を
-- 分けて扱う必要があるため、別テーブルに切り出す。
--
--   portrait : 証明写真。履歴書に自動で挿入される。1人1枚。
--   casual   : 人柄写真。最大3枚。caption付き。
--
-- 画像の実体は既存の profile-images バケット（{auth.uid()}/...）に置く。
-- ============================================================

create type profile_photo_kind as enum ('portrait', 'casual');

create table profile_photos (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  kind        profile_photo_kind not null,
  url         text not null,
  caption_en  text,
  caption_ja  text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index profile_photos_profile_id_idx on profile_photos (profile_id);

-- 証明写真は1人1枚に限る（履歴書に貼るものが複数あると意味を成さない）
create unique index profile_photos_one_portrait_idx
  on profile_photos (profile_id)
  where kind = 'portrait';

-- カジュアル写真は3枚まで
create or replace function guard_casual_photo_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.kind = 'casual' and (
    select count(*) from profile_photos
    where profile_id = new.profile_id and kind = 'casual'
  ) >= 3 then
    raise exception 'casual photo limit reached (max 3)';
  end if;
  return new;
end;
$$;

create trigger guard_casual_photo_limit_trigger
  before insert on profile_photos
  for each row execute function guard_casual_photo_limit();

alter table profile_photos enable row level security;

-- 本人は自分の写真を全操作できる
create policy "profile_photos: owner all"
  on profile_photos for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- 企業・管理者は、プロフィール本体を閲覧できる相手の写真のみ閲覧できる。
-- 可視性の判定は profiles 側のRLSに委ねる（承認済み or 自社求人への応募者）。
create policy "profile_photos: visible with profile"
  on profile_photos for select
  using (exists (select 1 from profiles p where p.id = profile_photos.profile_id));

grant select, insert, update, delete on profile_photos to authenticated;
grant select on profile_photos to anon;
