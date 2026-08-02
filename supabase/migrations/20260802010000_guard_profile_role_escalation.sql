-- ============================================================
-- 重大な権限昇格の脆弱性を修正
--
-- "profiles: owner write" ポリシーは `using (auth.uid() = id)
-- with check (auth.uid() = id)` で行の所有者チェックのみを行っており、
-- どのカラムを書き換えられるかは制限していなかった。
-- RLSはカラム単位の制御ができないため、talentアカウントが
-- Supabase REST APIを直接叩けば
--   PATCH /rest/v1/profiles?id=eq.<自分のuid>  { "role": "admin" }
-- のようなリクエストで自分自身のroleをadminに書き換え、
-- is_admin()が真になる＝実質的に管理者権限を完全に乗っ取れて
-- しまう状態だった（アプリのUIにroleを変更する機能がないため
-- 気づきにくいが、RLSはUIの制限に依存しない）。
--
-- guard_profile_status() と同じ「本人による不正な書き換えは
-- 無視して元の値に戻す」パターンを role カラムにも適用する。
-- ============================================================
create or replace function guard_profile_status()
returns trigger language plpgsql as $$
begin
  -- 管理者、およびauth.uid()が取れないサーバー側の直接操作
  -- （シード・マイグレーション等）はそのまま許可
  if is_admin() or auth.uid() is null then
    return new;
  end if;

  -- 本人が role を書き換えようとした場合は無視し、元の値を維持する
  -- （role変更は管理者がSQLで直接行う運用で、アプリ機能としては提供しない）。
  if new.role is distinct from old.role then
    new.role := old.role;
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
