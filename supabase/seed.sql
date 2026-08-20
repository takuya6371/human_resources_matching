-- ============================================================
-- ローカル開発用シードデータ
--
-- `npx supabase db reset` のたびに自動実行される。
-- auth.users への直接INSERTでテストアカウントを作成し、
-- handle_new_user() トリガー（raw_user_meta_data.role を見て
-- profiles/companies を自動作成する）に処理を任せたあと、
-- 各プロフィールの内容・審査ステータスをUPDATEで仕上げる。
--
-- パスワードは pgcrypto の crypt()/gen_salt('bf') でその場でハッシュ化
-- するため、外部ツール（bcryptコマンド等）は不要。
--
-- アカウント一覧は docs/dev-credentials.md を参照。
-- ============================================================

-- ------------------------------------------------------------
-- アカウント作成
-- supabase CLI がseed.sqlを複数バッチに分けて送るため、関数定義と
-- 呼び出しを分けると別バッチ扱いになり見えなくなることがある。
-- そのため単一のDOブロックにまとめている（タグは後段のbio本文で
-- 使う $$ と衝突しないよう $seed$ にしている）。
-- ------------------------------------------------------------
do $seed$
declare
  v_id uuid;
  rec record;
begin
  for rec in
    select * from (values
      ('admin@test.local',     'testpass123',    'talent',  null),
      ('talent1@test.local',   'testpass123',    'talent',  null),
      ('talent2@test.local',   'testpass123',    'talent',  null),
      ('talent3@test.local',   'testpass123',    'talent',  null),
      ('talent4@test.local',   'testpass123',    'talent',  null),
      ('talent5@test.local',   'testpass123',    'talent',  null),
      ('company1@test.local',  'testpass123',    'company', 'Test Corp')
    ) as t(email, password, role, company_name)
  loop
    v_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_id, 'authenticated', 'authenticated', rec.email,
      crypt(rec.password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('role', rec.role, 'company_name', rec.company_name),
      now(), now(),
      '', '', '', ''
    );

    insert into auth.identities (
      id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_id::text, v_id,
      jsonb_build_object('sub', v_id::text, 'email', rec.email, 'email_verified', false, 'phone_verified', false),
      'email', now(), now(), now()
    );
  end loop;
end
$seed$;

-- ------------------------------------------------------------
-- 管理者権限の付与
-- ------------------------------------------------------------
update public.profiles set role = 'admin'
where email in ('admin@test.local');

-- ------------------------------------------------------------
-- talent1: 標準的な内容（承認済み）
-- ------------------------------------------------------------
update public.profiles set
  status = 'approved',
  name_en = 'Test Talent', name_ja = 'テスト太郎',
  country = 'Kenya', country_ja = 'ケニア', flag = '🇰🇪',
  field = 'IT', field_ja = 'IT・エンジニアリング',
  university_en = 'Test University', faculty_en = 'Computer Science',
  degree = 'Bachelor', graduation_year = 2026, japanese_level = 'N2',
  skills = '{React,Python}', skills_ja = '{React,Python}',
  bio_en = 'A secret bio that must NOT leak to anon/talent.',
  bio_ja = '非公開の自己紹介',
  available_from = '2026-04-01', available_from_ja = '2026年4月〜',
  headline_en = 'Aspiring engineer', headline_ja = 'エンジニア志望'
where email = 'talent1@test.local';

-- ------------------------------------------------------------
-- talent2: フル項目埋め（承認済み、言語3件・職歴2件）
-- ------------------------------------------------------------
update public.profiles set
  status = 'approved',
  name_en = 'Amara Okafor', name_ja = 'アマラ・オコンクウォ',
  country = 'Nigeria', country_ja = 'ナイジェリア', flag = '🇳🇬',
  field = 'Business', field_ja = 'ビジネス',
  university_en = 'University of Tokyo', university_ja = '東京大学',
  faculty_en = 'Graduate School of Economics', faculty_ja = '経済学研究科',
  degree = 'Master', graduation_year = 2025,
  japanese_level = 'N1',
  skills = '{Marketing,"Project Management",Negotiation,Excel}',
  skills_ja = '{マーケティング,プロジェクト管理,交渉,Excel}',
  bio_en = $$Business generalist with a focus on market entry strategy for African markets. Interned at two major Japanese trading companies and led a cross-border marketing project.$$,
  bio_ja = $$アフリカ市場への参入戦略を専門とするビジネスジェネラリスト。大手日本企業2社でインターンを経験し、越境マーケティングプロジェクトをリードしました。$$,
  available_from = '2026-04-01', available_from_ja = '即日',
  headline_en = 'MBA-track generalist bridging Japan and West Africa',
  headline_ja = '日本と西アフリカを繋ぐビジネスジェネラリスト',
  open_to_work = true,
  residence_area = '東京都',
  past_clients = '{"Mitsubishi Corporation","Rakuten Group"}',
  years_in_japan = 4,
  hobbies = '茶道、マラソン、ナイジェリア料理',
  video_url = 'https://example.com/videos/amara-intro.mp4'
where email = 'talent2@test.local';

insert into public.profile_languages (profile_id, language, level, sort_order)
select id, v.language, v.level::language_level, v.sort_order
from public.profiles p, (values
  ('English','Native',0), ('Japanese','Business',1), ('French','Conversational',2)
) as v(language, level, sort_order)
where p.email = 'talent2@test.local';

insert into public.profile_experiences (profile_id, company_en, company_ja, role_en, role_ja, period, desc_en, desc_ja, sort_order)
select id, e.company_en, e.company_ja, e.role_en, e.role_ja, e.period, e.desc_en, e.desc_ja, e.sort_order
from public.profiles p, (values
  ('Mitsubishi Corporation','三菱商事','Business Development Intern','事業開発インターン','2024.06 – 2024.09',
   'Supported new market research for African trade routes.','アフリカ向け新規貿易ルートの市場調査を支援。',0),
  ('Rakuten Group','楽天グループ','Marketing Assistant','マーケティングアシスタント','2025.01 – 2025.03',
   'Localized marketing campaigns for West African partners.','西アフリカ向けパートナー企業のマーケティング施策をローカライズ。',1)
) as e(company_en, company_ja, role_en, role_ja, period, desc_en, desc_ja, sort_order)
where p.email = 'talent2@test.local';

-- ------------------------------------------------------------
-- talent3: 最小限入力（審査待ち、言語・職歴なし）
-- ------------------------------------------------------------
update public.profiles set
  status = 'pending',
  name_en = 'Kwame Mensah', name_ja = 'クワメ・メンサ',
  country = 'Ghana', country_ja = 'ガーナ', flag = '🇬🇭',
  field = 'Engineering', field_ja = '工学',
  university_en = 'Kyoto Institute of Technology', university_ja = '京都工芸繊維大学',
  degree = 'Bachelor', graduation_year = 2027,
  japanese_level = 'N4',
  skills = '{AutoCAD}', skills_ja = '{AutoCAD}',
  bio_en = 'Mechanical engineering student.', bio_ja = '機械工学専攻の学生です。',
  available_from = '2027-04-01', open_to_work = true
where email = 'talent3@test.local';

-- ------------------------------------------------------------
-- talent4: 長文・絵文字・引用符・アポストロフィ（下書き、未申請）
-- ------------------------------------------------------------
update public.profiles set
  status = 'draft',
  name_en = 'Fatima El-Sayed', name_ja = 'ファティマ・エルサイード',
  country = 'Egypt', country_ja = 'エジプト', flag = '🇪🇬',
  field = 'Data', field_ja = 'データ',
  university_en = 'Waseda University', university_ja = '早稲田大学',
  faculty_en = 'Graduate School of Fundamental Science and Engineering', faculty_ja = '基幹理工学研究科',
  degree = 'Master', graduation_year = 2026,
  japanese_level = 'N3',
  skills = '{Python,R,"Machine Learning",SQL,Tableau,"Deep Learning",Statistics,"A/B Testing"}',
  skills_ja = '{Python,R,機械学習,SQL,Tableau,深層学習,統計学,ABテスト}',
  bio_en = $$I'm a data scientist who loves turning "messy" data into decisions. Previously interned at a fintech startup where I built a churn-prediction model that's still in production. 日本語も勉強中です！$$,
  bio_ja = $$「汚い」データを意思決定に変えるのが好きなデータサイエンティストです。以前はフィンテックのスタートアップでインターンをし、今も本番稼働中の解約予測モデルを構築しました。$$,
  available_from = '2026-09-01', available_from_ja = '2026年9月〜',
  headline_en = 'Data scientist who can''t stop A/B testing everything',
  headline_ja = '何でもA/Bテストしたがるデータサイエンティスト',
  open_to_work = true,
  residence_area = '神奈川県',
  years_in_japan = 2,
  dev_experience_years = 3,
  hobbies = 'ボルダリング、SF小説、猫2匹（モモ・タロウ）',
  video_url = 'https://example.com/fatima-intro.mp4'
where email = 'talent4@test.local';

-- ------------------------------------------------------------
-- talent5: 差し戻し済み、記号入りスキル、複数言語
-- ------------------------------------------------------------
update public.profiles set
  status = 'rejected',
  admin_note = '経歴の記載に不整合があります。職務経歴を見直して再提出してください。',
  name_en = 'Zanele Dlamini', name_ja = 'ザネレ・ドラミニ',
  country = 'South Africa', country_ja = '南アフリカ', flag = '🇿🇦',
  field = 'IT', field_ja = 'IT・エンジニアリング',
  university_en = 'Osaka University', university_ja = '大阪大学',
  degree = 'Bachelor', graduation_year = 2025,
  japanese_level = 'N5',
  skills = '{"C++","Node.js","C#",".NET"}', skills_ja = '{"C++","Node.js","C#",".NET"}',
  bio_en = 'Backend engineer interested in distributed systems.',
  bio_ja = '分散システムに興味があるバックエンドエンジニアです。',
  available_from = '2026-04-01', available_from_ja = '2026年4月〜',
  open_to_work = true, residence_area = '大阪府'
where email = 'talent5@test.local';

insert into public.profile_languages (profile_id, language, level, sort_order)
select id, v.language, v.level::language_level, v.sort_order
from public.profiles p, (values
  ('English','Fluent',0), ('Zulu','Native',1), ('Japanese','Basic',2)
) as v(language, level, sort_order)
where p.email = 'talent5@test.local';

-- ------------------------------------------------------------
-- company1: Test Corp
-- ------------------------------------------------------------
update public.companies set
  name = 'Test Corp', name_ja = 'テスト株式会社',
  description = 'QA目的のテスト用会社概要です。',
  industry = 'IT', website = 'https://example.com'
where id in (select id from auth.users where email = 'company1@test.local');
