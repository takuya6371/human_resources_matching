-- ============================================================
-- 本人確認（身元確認）の結果を保持する
--
-- 重要：身分証明書の画像そのものは保存しない。撮影・照合は外部の
-- eKYCプロバイダに委ね、こちらが受け取るのは「確認できたか否か」と
-- プロバイダ側の参照IDのみ。パスポート番号・在留カード番号などは
-- 一切保持しない（保持すると個人情報保護法上の要配慮個人情報に
-- 準じた管理義務と、漏洩時の被害が跳ね上がる）。
-- ============================================================

create type verification_status as enum ('unverified', 'pending', 'verified', 'failed');

alter table profiles
  add column verification_status    verification_status not null default 'unverified',
  add column verification_provider  text,   -- 'stripe' | 'persona' | 'trustdock' 等
  add column verification_ref       text,   -- プロバイダ側のセッションID
  add column verified_at            timestamptz;

-- ------------------------------------------------------------
-- 本人が自分で「確認済み」にできてはならない。
-- 更新はWebhookを受けるEdge Function（service_role）だけが行う。
-- ------------------------------------------------------------
create or replace function guard_verification_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.verification_status   is distinct from old.verification_status
  or new.verification_provider is distinct from old.verification_provider
  or new.verification_ref      is distinct from old.verification_ref
  or new.verified_at           is distinct from old.verified_at then
    raise exception 'verification fields are set by the verification webhook, not by the client';
  end if;

  return new;
end;
$$;

create trigger guard_verification_fields_trigger
  before update on profiles
  for each row execute function guard_verification_fields();

-- 企業・管理者が閲覧する列に確認状態を加える（PROFILE_PUBLIC_COLUMNS も更新すること）。
comment on column profiles.verification_status is
  '外部eKYCプロバイダによる本人確認の結果。クライアントからは更新不可。';
