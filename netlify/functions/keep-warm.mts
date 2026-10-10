// 認証メールのフックを温めておく。
//
// Supabase の Send Email Hook は5秒で打ち切る。送信そのものは2秒前後で終わるが、
// 関数がコールドスタートすると起動だけで1.5〜2秒かかり、合計が5秒を超えて
// 「Failed to reach hook within maximum time of 5.000000 seconds」になる。
// 実測: コールド 2.06秒 / ウォーム 0.63〜1.42秒。
//
// 5分おきに GET で叩く。GET は 405 を返すだけでメールは送らないが、
// コンテナと nodemailer の読み込みは生きたままになる。
// 呼び出し回数は スケジュール+ping で月1.7万回ほど。無料枠は12.5万回。

export const config = { schedule: '*/5 * * * *' }

export default async () => {
  const url = `${process.env.SITE_URL || 'https://nebonga-link.com'}/api/auth-email`
  const started = Date.now()
  try {
    const res = await fetch(url, { method: 'GET' })
    console.log(`warm ${res.status} ${Date.now() - started}ms`)
  } catch (e) {
    console.warn('warm failed', e instanceof Error ? e.message : String(e))
  }
  return new Response('ok')
}
