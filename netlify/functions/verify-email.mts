// メールアドレスの到達確認。
//
// Supabase の「Confirm email」は OFF にしてある。会場のQRから登録した人を
// その場でアプリに入れるため（確認するまでログインさせない設定だと、
// 電波の悪い会場でメールを開けない人がそのまま離脱する）。
//
// かわりに、登録直後にここから確認メールを送り、未確認のあいだは
// 画面に警告を出す。送信に失敗しても登録自体は通り、単に未確認のままになる。
// 確認状態は public.email_verifications が正（auth.users.email_confirmed_at は
// Confirm email を OFF にすると登録時に自動で入るので当てにならない）。
//
//   POST /api/verify-email/send     Authorization: Bearer <ユーザーのアクセストークン>
//   POST /api/verify-email/confirm  { "token": "..." }

import { createHash, randomBytes } from 'node:crypto'
import { type Copy, type Lang, env, jsonError, pickLang, sendMail } from '../lib/mailer'

export const config = { path: ['/api/verify-email/send', '/api/verify-email/confirm'] }

// 連打での再送を防ぐ。さくらの送信数（15分で約100通）を1人で食わないように。
const RESEND_INTERVAL_SEC = 60

const COPY: Record<Lang, Copy> = {
  ja: {
    subject: '【NeBonga Link】メールアドレスの確認',
    heading: 'メールアドレスを確認してください',
    lead: 'ご登録ありがとうございます。下のボタンを押すと、このアドレスが確認済みになります。企業からの連絡を受け取るために必要です。',
    cta: 'メールアドレスを確認する',
  },
  en: {
    subject: 'Confirm your email address — NeBonga Link',
    heading: 'Confirm your email address',
    lead: 'Thanks for registering. Press the button below to confirm this address. We need it to pass messages from companies on to you.',
    cta: 'Confirm email address',
  },
  fr: {
    subject: 'Confirmez votre adresse e-mail — NeBonga Link',
    heading: 'Confirmez votre adresse e-mail',
    lead: "Merci de votre inscription. Appuyez sur le bouton ci-dessous pour confirmer cette adresse. Elle nous sert à vous transmettre les messages des entreprises.",
    cta: "Confirmer l'adresse",
  },
}

function anonKey(): string {
  const k = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  if (!k) throw new Error('missing env SUPABASE_ANON_KEY')
  return k
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

// 書き込みは全て security definer の関数越しにやる。
// そうすれば service_role キー（全権）を Netlify に置かずに済む。
// 本人は自分の行にトークンを立てられるだけで、verified_at には触れない。
async function rpc(name: string, args: Record<string, unknown>, bearer?: string): Promise<string> {
  const key = anonKey()
  const res = await fetch(`${env('SUPABASE_URL')}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: key,
      authorization: bearer ?? `Bearer ${key}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(args),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${name} failed: ${res.status} ${text.slice(0, 200)}`)
  // text/plain を返す関数なので、JSONの引用符だけ外す。
  return text.replace(/^"|"$/g, '')
}

// 呼び出し元が誰かを Supabase に確かめる。宛先と言語を取るため。
// アクセストークンを自前で検証せず、Auth に問い合わせるほうが取りこぼしがない。
async function currentUser(auth: string) {
  const res = await fetch(`${env('SUPABASE_URL')}/auth/v1/user`, {
    headers: { apikey: anonKey(), authorization: auth },
  })
  if (!res.ok) return null
  return await res.json() as {
    id: string; email?: string; user_metadata?: Record<string, unknown>
  }
}

async function handleSend(req: Request): Promise<Response> {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return jsonError(401, 'not signed in')

  const user = await currentUser(auth)
  if (!user?.email) return jsonError(401, 'not signed in')

  const token = randomBytes(32).toString('base64url')
  const status = await rpc('request_email_verification', { p_token_hash: hashToken(token) }, auth)

  if (status === 'not_signed_in') return jsonError(401, 'not signed in')
  if (status === 'already_verified') return Response.json({ status: 'already_verified' })
  if (status === 'throttled') {
    return Response.json({ status: 'throttled', retryAfterSec: RESEND_INTERVAL_SEC }, { status: 429 })
  }

  const lang = pickLang(user.user_metadata?.lang)
  const siteUrl = process.env.SITE_URL || 'https://nebonga-link.com'
  const link = `${siteUrl}/verify-email?token=${encodeURIComponent(token)}`

  try {
    const messageId = await sendMail(user.email, lang, COPY[lang], link, null, siteUrl)
    console.log('verification sent', JSON.stringify({ to: user.email, lang, messageId }))
    return Response.json({ status: 'sent' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('verification send failed', JSON.stringify({ to: user.email, error: msg }))
    // 送れなかったことを記録しておく。画面には「未確認」として出る。
    await rpc('record_email_verification_error', { p_error: msg }, auth).catch(() => {})
    return jsonError(500, msg)
  }
}

async function handleConfirm(req: Request): Promise<Response> {
  let token = ''
  try {
    token = (await req.json() as { token?: string }).token ?? ''
  } catch { /* 下の空チェックで弾く */ }
  if (!token) return jsonError(400, 'no token')

  const status = await rpc('confirm_email_verification', { p_token_hash: hashToken(token) })
  if (status === 'verified') {
    console.log('verified')
    return Response.json({ status: 'verified' })
  }
  return Response.json({ status }, { status: 400 })
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 })
  try {
    return new URL(req.url).pathname.endsWith('/confirm')
      ? await handleConfirm(req)
      : await handleSend(req)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('unhandled', msg)
    return jsonError(500, msg)
  }
}
