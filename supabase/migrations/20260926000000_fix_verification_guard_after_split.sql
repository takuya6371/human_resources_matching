-- ============================================================
-- 本人確認フィールドのガードを、列の移動に追従させる
--
-- 20260924000000 で verification_provider / verification_ref を
-- profiles から profile_private へ移したが、profiles 側のガード
-- トリガー guard_verification_fields() が移動後も両方を参照していた。
-- そのため profiles への UPDATE がすべて
--
--   record "new" has no field "verification_provider"
--
-- で失敗していた。つまりプロフィールの保存が一切できない状態。
-- クライアント側が error を握り潰していたため「保存しました」と出て
-- いたか、無言で止まっていた。
--
-- profiles に残っているのは verification_status と verified_at の2つ。
-- ガードの目的（判定はWebhookだけが書ける）は、この2つを守れば足りる。
-- 移した3列は profile_private 側で守る。
-- ============================================================

create or replace function public.guard_verification_fields()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.verification_status is distinct from old.verification_status
  or new.verified_at         is distinct from old.verified_at then
    raise exception 'verification fields are set by the verification webhook, not by the client';
  end if;

  return new;
end;
$$;

-- 移した3列も、本人が自分で書き換えられてはいけない。
-- profile_private は本人が更新できる（住所などを自分で直すため）ので、
-- 本人確認まわりの列だけ old の値に戻す。
create or replace function public.guard_private_verification_fields()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  new.verification_provider := old.verification_provider;
  new.verification_ref      := old.verification_ref;
  new.verification_detail   := old.verification_detail;
  return new;
end;
$$;

drop trigger if exists profile_private_guard_verification on public.profile_private;
create trigger profile_private_guard_verification
  before update on public.profile_private
  for each row execute function public.guard_private_verification_fields();
