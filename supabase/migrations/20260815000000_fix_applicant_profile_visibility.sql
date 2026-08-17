-- ============================================================
-- 応募者プロフィールの可視性バグ修正
--
-- 発見経緯: 人材が承認済みプロフィールを編集すると自動的に審査中へ
-- 差し戻される（guard_profile_statusトリガー、既存仕様）。ところが
-- profiles の SELECT ポリシーは「企業には status='approved' の
-- プロフィールしか見せない」という条件のままだったため、既に応募
-- 済みの人材が編集しただけで、企業の「応募者一覧」からその人の
-- 氏名・プロフィールが見えなくなってしまっていた（実機で再現確認済み）。
--
-- 採用選考の実務上、応募者の情報は審査状態に関わらず企業に見える
-- べきなので、「自分の求人に応募してきた人材」という例外を追加する。
-- ============================================================

create or replace function has_applied_to_my_job(p_profile_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from applications a
    join jobs j on j.id = a.job_id
    where a.profile_id = p_profile_id and j.company_id = auth.uid()
  );
$$;

drop policy if exists "profiles: select" on profiles;
create policy "profiles: select"
  on profiles for select
  using (
    auth.uid() = id
    or is_admin()
    or (status = 'approved' and is_company())
    or has_applied_to_my_job(id)
  );

drop policy if exists "profile_languages: select" on profile_languages;
create policy "profile_languages: select"
  on profile_languages for select
  using (
    auth.uid() = profile_id
    or is_admin()
    or (
      is_company()
      and (
        exists (select 1 from profiles p where p.id = profile_languages.profile_id and p.status = 'approved')
        or has_applied_to_my_job(profile_languages.profile_id)
      )
    )
  );

drop policy if exists "profile_experiences: select" on profile_experiences;
create policy "profile_experiences: select"
  on profile_experiences for select
  using (
    auth.uid() = profile_id
    or is_admin()
    or (
      is_company()
      and (
        exists (select 1 from profiles p where p.id = profile_experiences.profile_id and p.status = 'approved')
        or has_applied_to_my_job(profile_experiences.profile_id)
      )
    )
  );
