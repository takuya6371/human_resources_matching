import { supabase } from './supabase'

// 日本語欄を空のまま保存したときに、英語から自動翻訳して埋めるためのヘルパー。
// 実際のGemini呼び出しはEdge Function側で行う（APIキーをクライアントに
// 渡さないため）。翻訳が失敗した場合は例外を投げず、空文字の配列を返して
// 呼び出し側が「翻訳できなかった＝日本語欄は空のまま保存」にフォールバックできるようにする。
// translate Edge Function は1回あたりの件数に上限があるため、それに合わせて分割して呼ぶ。
// CVから取り込んだスキルは20件を簡単に超える。
const MAX_TEXTS_PER_CALL = 20

// 翻訳が落ちている・遅いときに、保存全体を道連れにしないための上限。
// Edge Function が無反応だと invoke は長く待つ。実測で保存に約20秒かかり、
// 会場のスマホでは「固まった」と見なされて離脱する。
// 打ち切った場合は空で返り、呼び出し側が「英語のまま保存」に倒す。
const TRANSLATE_TIMEOUT_MS = 6000

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    p,
    new Promise<null>(resolve => setTimeout(() => resolve(null), ms)),
  ])
}

export async function translateToJa(texts: string[]): Promise<string[]> {
  if (texts.every(t => !t.trim())) return texts.map(() => '')

  const chunks: string[][] = []
  for (let i = 0; i < texts.length; i += MAX_TEXTS_PER_CALL) {
    chunks.push(texts.slice(i, i + MAX_TEXTS_PER_CALL))
  }

  // チャンクは並列に投げる。直列だと、翻訳が落ちているときに打ち切りの
  // 待ち時間がチャンク数だけ積み上がる（スキル26件で2チャンク＝16秒）。
  // 並列なら、何件あっても待つのは1回分で済む。
  const results = await Promise.all(chunks.map(chunk =>
    withTimeout(
      supabase.functions.invoke<{ translations?: string[]; error?: string }>(
        'translate',
        { body: { texts: chunk, target: 'ja' } }
      ),
      TRANSLATE_TIMEOUT_MS
    ).then(res => {
      // res が null = 時間切れ。error / translations 無しも同じ扱いで空に倒す。
      const translations = res && !res.error ? res.data?.translations : undefined
      return translations ?? chunk.map(() => '')
    })
  ))

  return results.flat()
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
