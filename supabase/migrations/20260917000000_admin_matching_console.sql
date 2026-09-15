-- ============================================================
-- 管理者による応募の代理作成を許可(MatchingConsole)
--
-- admin向けの手動マッチング機能。求人と人材をadminが結びつけて
-- 応募を代理作成できるようにする(AI不使用、その場でのスコアリング
-- はクライアント側で完結する)。既存の "applications: insert" は
-- 本人(auth.uid() = profile_id)のみを許可しており、admin代理作成を
-- 想定していなかったため is_admin() を追加する。
-- ============================================================

drop policy if exists "applications: insert" on applications;

create policy "applications: insert"
  on applications for insert
  with check (
    is_admin()
    or (
      auth.uid() = profile_id
      and exists (select 1 from profiles where id = auth.uid() and status = 'approved')
    )
  );
