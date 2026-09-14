-- ============================================================
-- 履歴書に必要な個人情報を profiles に持たせる
--
-- 生年月日・性別・住所は、英文CVにも記載されていることが多い
-- （ナイジェリア・ケニア・ガーナのCVでは一般的）。抽出できたものを
-- 保存せずに毎回入力させるのは二度手間であり、応募のたびに必要に
-- なる情報でもあるため、書類側ではなくプロフィール側に持つ。
--
-- 性別は任意。日本のJIS規格様式でも2021年以降は記載を求めない
-- 運用が広がっているため、NULL と 'undisclosed' を区別して扱う。
-- ============================================================

create type gender_option as enum ('male', 'female', 'other', 'undisclosed');

alter table profiles
  add column date_of_birth   date,
  add column gender          gender_option,
  add column nationality     text,
  add column postal_code     text,
  add column address_line    text,
  -- 住所のふりがな。履歴書の「ふりがな」欄に入る。
  add column address_kana_ja text,
  -- 履歴書のうちCVからは決して得られない項目
  add column commute_minutes    integer,
  add column dependents_count   integer,
  add column has_spouse          boolean,
  add column spouse_is_dependent boolean;

comment on column profiles.date_of_birth is
  'CVに記載があれば抽出、なければ本人が入力。年齢は保存せず、常に生年月日から算出する。';
comment on column profiles.gender is
  '本人が明示した場合のみ。氏名や写真から推測してはならない。undisclosed は「記入しない」の明示的な選択。';

-- 生年月日・住所は個人特定情報なので、企業向けの列一覧には含めない。
-- PROFILE_PUBLIC_COLUMNS（src/lib/profileMapper.ts）には追加しないこと。
-- 履歴書は応募が成立した相手にのみ渡す。
