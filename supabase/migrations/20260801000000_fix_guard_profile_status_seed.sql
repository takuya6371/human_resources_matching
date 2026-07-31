-- ============================================================
-- guard_profile_status() のバグ修正
--
-- サーバー側（seed.sql・マイグレーション・postgresロールでの直接
-- 操作）からのUPDATEは auth.uid() が NULL になるが、is_admin() も
-- false を返すため「本人による不正なapproved書き換え」と誤判定され、
-- シードデータでstatusをapprovedに設定してもdraftへ戻されてしまって
-- いた。auth.uid() が NULL（=RLSをバイパスできるサーバー側コンテキ
-- スト）の場合はガードを適用しないよう修正する。
-- ============================================================

create or replace function guard_profile_status()
returns trigger language plpgsql as $$
begin
  -- 管理者、およびauth.uid()が取れないサーバー側の直接操作
  -- （シード・マイグレーション等）はそのまま許可
  if is_admin() or auth.uid() is null then
    return new;
  end if;

  -- 承認済みプロフィールの内容を本人が編集した場合（statusを触っていない
  -- = 値が変わっていない）は、自動的に審査中へ戻す。
  if old.status = 'approved' and new.status = old.status then
    new.status := 'pending';
    new.published_at := null;
    return new;
  end if;

  -- 本人が status を直接 approved に書き換えようとした場合は無視し、
  -- 元の値を維持する（承認は review_profile() 経由の管理者のみ）。
  if new.status = 'approved' and old.status <> 'approved' then
    new.status := old.status;
  end if;

  return new;
end;
$$;
