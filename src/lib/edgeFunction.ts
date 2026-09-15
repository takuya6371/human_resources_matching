import { supabase } from './supabase'

const BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

// supabase-js の functions.invoke() は非2xxレスポンスのJSONボディを取り出すのに
// error.context を手動でparseする必要があり、send-message/moderate-threadのように
// 4xxボディ(reason/strikeCount等)を使う呼び出し元では扱いにくいため、直接fetchする。
export async function callEdgeFunction<T = any>(name: string, body: unknown): Promise<{ status: number; data: T | null }> {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`${BASE}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? ''}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => null)
  return { status: res.status, data: data as T | null }
}
