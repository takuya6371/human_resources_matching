-- ============================================================
-- メールアドレスの到達確認を自前で持つ
--
-- Supabase の「Confirm email」は、確認するまでログインさせない。
-- イベント会場でQRから登録してもらう運用では、その場でアプリに入れないと
-- 離脱するので、この設定は OFF にする（= 登録した瞬間にセッションが張られる）。
--
-- かわりに、登録直後に確認メールを送り、未確認のあいだは画面に警告を出す。
-- メール送信に失敗した場合も「未確認」として扱えばよく、登録自体は通る。
--
-- Supabase の auth.users.email_confirmed_at は、Confirm email を OFF に
-- すると登録時に自動で入ってしまい、確認の有無を表さない。だから別に持つ。
--
-- 人材(profiles)と企業(companies)の両方で使うので、auth.users に紐づける。
-- ============================================================

create table public.email_verifications (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  -- 平文のトークンは保存しない。メールに載せたものの sha256 だけを持つ。
  token_hash  text,
  sent_at     timestamptz,
  expires_at  timestamptz,
  verified_at timestamptz,
  -- 送信を試みた回数。再送の濫用を見るため。
  send_count  integer not null default 0,
  -- 最後に失敗した理由（SMTPのエラーなど）。運用で原因を追うため。
  last_error  text
);

comment on table public.email_verifications is
  'メールアドレスの到達確認。Supabaseの Confirm email は OFF にしてあり、これが正。';

create index on public.email_verifications (token_hash);

alter table public.email_verifications enable row level security;

create policy "email_verifications: owner select"
  on public.email_verifications for select
  using (auth.uid() = user_id);

create policy "email_verifications: admin select"
  on public.email_verifications for select
  using (is_admin());

-- 本人に見せるのは「確認できているか」だけ。
--
-- token_hash を本人に読ませてはいけない。読めてしまうと、メールを受け取らずに
-- そのハッシュで確認APIを叩き、自分で自分を確認済みにできてしまう。
-- 行はRLSで、列はGRANTで絞る（RLSは列を守れない）。
grant select (user_id, sent_at, expires_at, verified_at, send_count, last_error)
  on public.email_verifications to authenticated;

-- 直接の書き込みは誰にも許さない。下の関数経由だけにする。
revoke insert, update, delete on public.email_verifications from authenticated, anon;

-- ------------------------------------------------------------
-- 送信の記録
--
-- 本人が自分の行にトークンを立てる。verified_at は触れない
-- （本人が自分を確認済みにできてはいけない）。
-- ------------------------------------------------------------
create function public.request_email_verification(p_token_hash text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.email_verifications%rowtype;
begin
  if v_uid is null then
    return 'not_signed_in';
  end if;

  select * into v_row from public.email_verifications where user_id = v_uid;

  if v_row.verified_at is not null then
    return 'already_verified';
  end if;

  -- 連打での再送を止める。さくらの送信数を1人で食わないように。
  if v_row.sent_at is not null and v_row.sent_at > now() - interval '60 seconds' then
    return 'throttled';
  end if;

  insert into public.email_verifications as ev
    (user_id, token_hash, sent_at, expires_at, send_count)
  values
    (v_uid, p_token_hash, now(), now() + interval '24 hours', 1)
  on conflict (user_id) do update
    set token_hash = excluded.token_hash,
        sent_at    = excluded.sent_at,
        expires_at = excluded.expires_at,
        send_count = ev.send_count + 1,
        last_error = null;

  return 'ok';
end;
$$;

-- ------------------------------------------------------------
-- 送信に失敗したことの記録。原因を後から追うためだけのもの。
-- ------------------------------------------------------------
create function public.record_email_verification_error(p_error text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  update public.email_verifications
     set last_error = left(p_error, 500)
   where user_id = auth.uid();
end;
$$;

-- ------------------------------------------------------------
-- 確認
--
-- メールのリンクは別の端末で開かれることがあるので、ログインしていなくても
-- 踏めなければならない。トークン（32バイトの乱数）を知っていることだけが条件。
-- ------------------------------------------------------------
create function public.confirm_email_verification(p_token_hash text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.email_verifications%rowtype;
begin
  if p_token_hash is null or p_token_hash = '' then
    return 'invalid';
  end if;

  select * into v_row from public.email_verifications
   where token_hash = p_token_hash;

  -- 行が無い＝使用済みか偽のトークン。どちらかは明かさない。
  if not found then
    return 'invalid';
  end if;

  if v_row.expires_at is not null and v_row.expires_at < now() then
    return 'expired';
  end if;

  update public.email_verifications
     set verified_at = now(),
         -- 使い捨てにする。
         token_hash  = null,
         last_error  = null
   where user_id = v_row.user_id;

  return 'verified';
end;
$$;

-- 既定では PUBLIC に実行権が付くので、いったん剥がしてから必要なものだけ渡す。
revoke execute on function public.request_email_verification(text) from public;
revoke execute on function public.record_email_verification_error(text) from public;
revoke execute on function public.confirm_email_verification(text) from public;

grant execute on function public.request_email_verification(text) to authenticated;
grant execute on function public.record_email_verification_error(text) to authenticated;
-- 確認だけは未ログインでも呼べる必要がある。
grant execute on function public.confirm_email_verification(text) to anon, authenticated;
