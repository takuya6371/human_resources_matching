-- ============================================================
-- 本人確認まわりの service_role 権限付与漏れを修正する
--
-- 20260919000000 が threads/messages/thread_flags について直したのと
-- 同じ漏れが、profiles / profile_private / verification_events に残っていた。
-- いずれも migration が anon と authenticated にしか GRANT しておらず、
-- service_role には何も明示していない。
--
-- Supabase のクラウド側は postgres ロールの default privileges により
-- 結果的に service_role へ権限が渡るが、ローカル（supabase db reset）では
-- 渡らない。つまり同じコードがローカルでだけ permission denied で落ちる。
-- 環境ごとの既定値に依存せず、必要な権限を明示する。
--
-- 対象の Edge Function:
--   start-verification   profiles.verification_status を更新し、
--                        provider と session id を profile_private に書く
--   verification-webhook 判定結果を同様に書き戻す
--   verification-status  判定の読み出し（呼び出し元の権限で動くが、
--                        service_role 経路でも読めるようにしておく）
--
-- delete は与えない。本人確認の記録を消す経路は用意しない。
-- ============================================================

grant select, update on public.profiles        to service_role;
grant select, insert, update on public.profile_private to service_role;
grant select, insert on public.verification_events to service_role;
