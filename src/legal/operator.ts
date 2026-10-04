// ============================================================
// 規約・プライバシーポリシーに差し込む事業者情報。
//
// ここだけ埋めれば両方の文書に反映される。空のままだと画面上に
// 「（未記入）」と出るので、公開前に必ず埋めること。
// 法人登記や特商法表記と表記揺れがあると意味がないので、
// 登記上の名称・所在地をそのまま入れる。
// ============================================================

export const OPERATOR = {
  /** 登記上の事業者名。例: '株式会社ネボンガ' */
  name: '',
  /** 代表者名 */
  representative: '',
  /** 所在地（郵便番号から） */
  address: '',
  /** 問い合わせ先メールアドレス。開示・削除請求の窓口も兼ねる */
  contactEmail: '',
  /** 個人情報保護管理者の役職・氏名。置かない場合は空でよい */
  privacyOfficer: '',
  /** 施行日。例: '2026年10月5日' */
  effectiveDate: '',
  /** 最終改定日。初版なら施行日と同じでよい */
  revisedDate: '',
  /** 第一審の専属的合意管轄裁判所。例: '東京地方裁判所' */
  court: '',
} as const

export type OperatorKey = keyof typeof OPERATOR

/** 未記入の項目を文中で目立たせる。公開前の取りこぼしを防ぐため。 */
export function field(key: OperatorKey): string {
  return OPERATOR[key] || '（未記入）'
}

/** 本文テンプレート中の {{name}} 等を差し替える。 */
export function fillOperator(text: string): string {
  return text.replace(/\{\{(\w+)\}\}/g, (whole, key) =>
    key in OPERATOR ? field(key as OperatorKey) : whole
  )
}

/** 空欄が残っているか。公開前チェック用に画面上部へ警告を出す。 */
export function missingOperatorFields(): OperatorKey[] {
  return (Object.keys(OPERATOR) as OperatorKey[])
    .filter(k => k !== 'privacyOfficer' && !OPERATOR[k])
}
