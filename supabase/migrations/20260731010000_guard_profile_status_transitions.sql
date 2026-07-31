-- ============================================================
-- プロフィールstatus遷移のガード + 再申請フローの修正
--
-- 直っていた問題:
-- 1. submit_profile_for_review() は status='draft' のときしか
--    pendingへ遷移できず、rejected（差し戻し）からの再申請ボタンが
--    実際には何も起きず失敗していた。
-- 2. "profiles: owner write" ポリシーは本人による行全体の書き込みを
--    許可しており、statusを含む全カラムを本人が自由に書き換え可能
--    だった。つまり人材アカウントがAPIを直接叩けば、審査を経ずに
--    自分のプロフィールを status='approved' にできてしまう状態だった。
-- 3. 承認済みプロフィールを編集しても、内容が審査なしでそのまま
--    公開され続けてしまっていた（再審査の仕組みがなかった）。
-- ============================================================

create or replace function submit_profile_for_review()
returns void language plpgsql security definer as $$
begin
  update profiles
  set status = 'pending', admin_note = null
  where id = auth.uid()
    and status in ('draft', 'rejected');
end;
$$;

create or replace function guard_profile_status()
returns trigger language plpgsql as $$
begin
  -- review_profile() 経由の管理者による更新はそのまま許可
  if is_admin() then
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

drop trigger if exists profiles_guard_status on profiles;
create trigger profiles_guard_status
  before update on profiles
  for each row execute function guard_profile_status();
