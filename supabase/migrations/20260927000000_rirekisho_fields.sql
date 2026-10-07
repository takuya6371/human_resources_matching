-- ============================================================
-- 日本式履歴書（JIS様式）を出力するために足りない項目を追加する
--
-- profile_private には既に、通勤時間・扶養家族数・配偶者の有無・
-- 配偶者の扶養義務・住所のふりがなが入っている。これらは履歴書以外の
-- 用途がほぼ無い項目で、つまりこのスキーマは最初から履歴書を出すために
-- 設計されていた。ただし入力画面も出力機能も作られないまま放置されていた。
--
-- JIS様式と突き合わせて、本当に足りなかったのは以下だけだった。
--   氏名のふりがな / 電話番号 / 免許・資格 / 本人希望記入欄
--   学歴・職歴の「年月」（いまは自由文の period しかない）
--
-- なお parse-cv は certifications / phone / date_of_birth / gender /
-- postal_code / address_line / 入学年月 をすでに抽出しているのに、
-- クライアントが受け取らず捨てていた。CVを1枚上げれば履歴書の中身は
-- ほぼ埋まる。
-- ============================================================

alter table public.profile_private
  -- 氏名のふりがな。住所のふりがな（address_kana_ja）は既にある。
  add column name_kana_ja text,
  add column phone text,
  -- 履歴書の「本人希望記入欄」。「貴社規定に従います」等が入る。
  add column preferred_conditions text;

comment on column public.profile_private.name_kana_ja is
  '氏名のふりがな。履歴書の氏名欄に併記する。';
comment on column public.profile_private.preferred_conditions is
  '履歴書の本人希望記入欄。';

-- ------------------------------------------------------------
-- 職歴の年月
--
-- period は "2023-02 – Present" のような自由文で、履歴書の
-- 「平成○年○月 入社」という形に組み直せない。parse-cv は
-- start_date / end_date を YYYY-MM で返しているので受け皿を作る。
-- 表示用の period はそのまま残す（手入力の人はこちらを使う）。
-- ------------------------------------------------------------
alter table public.profile_experiences
  add column started_on date,
  add column ended_on   date,
  add column is_current boolean not null default false;

-- ------------------------------------------------------------
-- 免許・資格
--
-- 履歴書には独立した欄がある。JLPTもここに入る（japanese_level は
-- 検索用の区分なので別物）。企業にも見せる情報なので、
-- profile_languages / profile_experiences と同じ公開範囲にする。
-- ------------------------------------------------------------
create table public.profile_certifications (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  name_ja     text,
  acquired_on date,
  sort_order  integer not null default 0
);

create index on public.profile_certifications (profile_id);

alter table public.profile_certifications enable row level security;

-- 本人・管理者・（承認済みプロフィールに限り）企業アカウント。
-- profile_languages と同じ条件に揃えている。
create policy "profile_certifications: select"
  on public.profile_certifications for select
  using (
    auth.uid() = profile_id
    or is_admin()
    or (
      is_company()
      and exists (
        select 1 from public.profiles p
        where p.id = profile_certifications.profile_id and p.status = 'approved'
      )
    )
  );

create policy "profile_certifications: owner write"
  on public.profile_certifications for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

grant select on public.profile_certifications to anon, authenticated;
grant insert, update, delete on public.profile_certifications to authenticated;
grant select, insert, update, delete on public.profile_certifications to service_role;
