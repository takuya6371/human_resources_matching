import { supabase } from './supabase'

// 日本語欄を空のまま保存したときに、英語から自動翻訳して埋めるためのヘルパー。
// 実際のAzure Translator呼び出しはEdge Function側で行う（APIキーをクライアントに
// 渡さないため）。翻訳が失敗した場合は例外を投げず、空文字の配列を返して
// 呼び出し側が「翻訳できなかった＝日本語欄は空のまま保存」にフォールバックできるようにする。
export async function translateToJa(texts: string[]): Promise<string[]> {
  if (texts.every(t => !t.trim())) return texts.map(() => '')

  const { data, error } = await supabase.functions.invoke<{ translations?: string[]; error?: string }>(
    'translate',
    { body: { texts, target: 'ja' } }
  )

  if (error || !data?.translations) {
    return texts.map(() => '')
  }
  return data.translations
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
