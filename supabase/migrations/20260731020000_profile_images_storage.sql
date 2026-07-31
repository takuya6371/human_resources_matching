-- ============================================================
-- プロフィール画像（人材の顔写真・企業ロゴ）用のStorageバケット
--
-- 人材・企業とも自分のuid配下のフォルダ（{auth.uid()}/...）にしか
-- アップロードできない。バケット自体はpublicなので、URLさえ分かれば
-- 誰でも閲覧できる（video_url等の既存の外部リンク項目と同じ扱い）。
-- ティザー表示（profiles_preview）にはavatar_urlを含めていないため、
-- 未ログイン・人材アカウントには通常URLが渡らない。
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-images',
  'profile-images',
  true,
  5242880, -- 5MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "profile-images: public read"
  on storage.objects for select
  using (bucket_id = 'profile-images');

create policy "profile-images: owner insert"
  on storage.objects for insert
  with check (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "profile-images: owner update"
  on storage.objects for update
  using (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "profile-images: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- profiles.avatar_url は本人が編集可能（承認済みプロフィールへの編集は
-- 既存の guard_profile_status トリガーにより自動的に審査中へ戻る）。
