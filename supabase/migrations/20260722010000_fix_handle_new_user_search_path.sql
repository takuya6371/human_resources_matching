-- ============================================================
-- handle_new_user() の search_path バグ修正
--
-- Supabase の supabase_auth_admin ロール（GoTrue が auth.users への
-- INSERT トリガーを実行する際のロール）は search_path が auth スキーマ
-- のみに絞られている。そのため、public スキーマのオブジェクトを
-- スキーマ修飾なしで参照する既存の handle_new_user() は
-- 「type "user_role" does not exist」等のエラーで必ず失敗し、
-- 新規登録（サインアップ）自体がこれまで機能していなかった。
-- ============================================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer
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
    insert into public.profiles (id, role, email, name_en)
    values (new.id, 'talent', new.email, '');
  elsif v_role = 'company' then
    insert into public.companies (id, name)
    values (new.id, coalesce(new.raw_user_meta_data->>'company_name', ''));
  end if;

  return new;
end;
$$;
