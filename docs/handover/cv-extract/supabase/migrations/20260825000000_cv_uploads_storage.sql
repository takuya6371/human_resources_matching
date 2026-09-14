-- ============================================================
-- CV原本（履歴書・職務経歴書）用のStorageバケット
--
-- parse-cv Edge Function が `cvs/<uid>/<file>` を読み取る前提のバケット。
-- profile-images と違い public は false。CVには氏名・電話番号・住所が
-- そのまま入るため、URLを知っていれば誰でも読める状態にはしない。
-- 読み書きとも本人のみ、Edge Function は service role で読む。
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cvs',
  'cvs',
  false,
  8388608, -- 8MB（parse-cv の MAX_BYTES と一致させる）
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/png',
    'image/jpeg'
  ]
)
on conflict (id) do nothing;

create policy "cvs: owner read"
  on storage.objects for select
  using (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "cvs: owner insert"
  on storage.objects for insert
  with check (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "cvs: owner update"
  on storage.objects for update
  using (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "cvs: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
