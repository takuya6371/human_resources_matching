-- ============================================================
-- 新規登録を復旧する
--
-- 20260924000000 で email を profiles から profile_private へ移したとき、
-- 新規登録時にプロフィール行を作る handle_new_user() を直し忘れていた。
-- この関数は profiles へ email を insert しており、列が無くなった結果
--
--   column "email" of relation "profiles" does not exist
--   → Auth 側には "Database error saving new user" (HTTP 500)
--
-- となって、人材アカウントの新規登録が一切できない状態だった。
-- 画面にはエラーオブジェクトがそのまま "{}" と出るだけで、
-- 何が起きたか分からなかった。
--
-- 20260926000000 で直した guard_verification_fields と同じ取りこぼし。
-- 列を動かしたとき、その列を参照する関数を洗い出していなかった。
--
-- profiles への insert が profiles_create_private トリガーを呼び、
-- profile_private の行は自動で作られる。そのあとに email を入れる。
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
begin
  v_role := coalesce(
    (new.raw_user_meta_data->>'role')::public.user_role,
    'talent'
  );

  if v_role = 'talent' then
    insert into public.profiles (id, role, name_en)
    values (new.id, 'talent', '');

    -- profiles への insert で profiles_create_private が走り、
    -- profile_private の行は既に作られている。
    update public.profile_private
       set email = new.email
     where id = new.id;
  elsif v_role = 'company' then
    insert into public.companies (id, name)
    values (new.id, coalesce(new.raw_user_meta_data->>'company_name', ''));
  end if;

  return new;
end;
$$;
