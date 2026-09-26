import { supabase } from './supabase'

// 日本語欄を空のまま保存したときに、英語から自動翻訳して埋めるためのヘルパー。
// 実際のGemini呼び出しはEdge Function側で行う（APIキーをクライアントに
// 渡さないため）。翻訳が失敗した場合は例外を投げず、空文字の配列を返して
// 呼び出し側が「翻訳できなかった＝日本語欄は空のまま保存」にフォールバックできるようにする。
// translate Edge Function は1回あたりの件数に上限があるため、それに合わせて分割して呼ぶ。
// CVから取り込んだスキルは20件を簡単に超える。
const MAX_TEXTS_PER_CALL = 20

export async function translateToJa(texts: string[]): Promise<string[]> {
  if (texts.every(t => !t.trim())) return texts.map(() => '')

  const out: string[] = []
  for (let i = 0; i < texts.length; i += MAX_TEXTS_PER_CALL) {
    const chunk = texts.slice(i, i + MAX_TEXTS_PER_CALL)
    const { data, error } = await supabase.functions.invoke<{ translations?: string[]; error?: string }>(
      'translate',
      { body: { texts: chunk, target: 'ja' } }
    )
    out.push(...(error || !data?.translations ? chunk.map(() => '') : data.translations))
  }
  return out
}

// EN/JA のペアで、JAが空欄ならENから自動翻訳して埋める。
// 1回のEdge Function呼び出しにまとめるため、空欄のペアだけ抽出してから
// まとめて翻訳し、結果を元の位置に戻す。
export async function fillMissingJapanese(pairs: { en: string; ja: string }[]): Promise<string[]> {
  const indicesToTranslate: number[] = []
  const textsToTranslate: string[] = []

  pairs.forEach((pair, i) => {
    if (!pair.ja.trim() && pair.en.trim()) {
      indicesToTranslate.push(i)
      textsToTranslate.push(pair.en)
    }
  })

  if (textsToTranslate.length === 0) {
    return pairs.map(p => p.ja)
  }

  const translated = await translateToJa(textsToTranslate)
  const result = pairs.map(p => p.ja)
  indicesToTranslate.forEach((originalIndex, i) => {
    result[originalIndex] = translated[i] || result[originalIndex]
  })
  return result
}
