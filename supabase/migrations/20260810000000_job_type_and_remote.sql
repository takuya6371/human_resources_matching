-- ============================================================
-- 求人の「案件種別」を追加
--
-- これまで jobs は正社員採用のみを前提にした項目（年収レンジ・
-- 日本国内の勤務地）しか持っていなかったが、プロダクトの前提
-- （docs/vision.md, docs/scope-japan-resident-vs-overseas.md）は
-- 正規雇用だけでなく業務委託（Andela型の継続稼働契約）・受託開発
-- （成果物ベースの単発プロジェクト）も並列のレールとして扱い、
-- 業務委託・受託開発では人材が日本に居住している必要すらない、
-- という設計を最初から想定している。
--
-- job_type: employment（正社員）/ staffing（業務委託・継続稼働）/
--           project（受託開発・単発プロジェクト）
-- remote_ok: 人材が日本に来ず、アフリカ在住のまま就業可能か
-- duration: 契約期間・プロジェクト期間（自由入力）
-- deliverables: 成果物（主に受託開発で使用、自由入力）
-- ============================================================

create type job_type as enum ('employment', 'staffing', 'project');

alter table jobs
  add column job_type job_type not null default 'employment',
  add column remote_ok boolean not null default false,
  add column duration text,
  add column deliverables text;
