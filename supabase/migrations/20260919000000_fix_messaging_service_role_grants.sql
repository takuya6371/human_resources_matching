-- ============================================================
-- threads/messages/thread_flags への service_role 権限付与漏れを修正
--
-- Phase 1b(20260915000000_messaging.sql)ではauthenticatedへの
-- GRANTのみ行い、service_role には何も明示的に付与していなかった。
-- スキーマのデフォルト権限だけではSELECT/INSERT/UPDATE/DELETEが
-- 揃わず、send-message Edge Function(service role接続)が
-- 「thread_not_found」を返す不具合として発覚した
-- (実際にはpermission deniedだが、コード側でerrorを見ずに
-- data nullのみ見ていたため誤った404を返していた)。
-- ============================================================

grant select, insert, update, delete on public.threads to service_role;
grant select, insert, update, delete on public.messages to service_role;
grant select, insert, update, delete on public.thread_flags to service_role;
