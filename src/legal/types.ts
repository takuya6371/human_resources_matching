import type { Lang } from '../types'

export interface LegalBlock {
  /** 条番号や見出し。'第1条（適用）' のような形 */
  heading: string
  /** 段落。改行は配列で分ける */
  paragraphs?: string[]
  /** 箇条書き。番号は描画側で振る */
  list?: string[]
  /** 公開範囲表のような2列の表 */
  table?: { head: [string, string]; rows: [string, string][] }
}

export interface LegalDoc {
  title: string
  /** 前文。条文の前に置く */
  intro?: string[]
  blocks: LegalBlock[]
  /** 末尾に置く日付行のラベル */
  dateLabel: { effective: string; revised: string }
}

/** fr は法務文書としての訳を用意していないため en にフォールバックする。 */
export type LegalDocSet = { ja: LegalDoc; en: LegalDoc }

export function pickDoc(set: LegalDocSet, lang: Lang): LegalDoc {
  return lang === 'ja' ? set.ja : set.en
}
