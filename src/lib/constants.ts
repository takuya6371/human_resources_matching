// 人材の分野・求人の分野で共通して使う語彙。
export const FIELDS = ['IT', 'Business', 'Engineering', 'Data'] as const
export const FIELDS_JA: Record<string, string> = {
  IT: 'IT・エンジニアリング',
  Business: 'ビジネス',
  Engineering: '工学',
  Data: 'データ',
}
export const LEVELS = ['N1', 'N2', 'N3', 'N4', 'N5'] as const

export const JOB_TYPES = ['employment', 'staffing', 'project'] as const

export const COMPENSATION_LABEL_KEY: Record<(typeof JOB_TYPES)[number], string> = {
  employment: 'jobs.compensationLabelEmployment',
  staffing: 'jobs.compensationLabelStaffing',
  project: 'jobs.compensationLabelProject',
}
