// Supabase の認証メールを、さくらのSMTPから送る。
//
// なぜ Supabase の「Custom SMTP」欄を使わないのか:
//   Supabase の認証基盤(GoTrue)は Go で書かれている。Go の TLS 実装は
//   DHE 鍵交換に非対応で、さらに Go 1.22 で RSA 鍵交換が既定から外れたため、
//   クライアントが出す暗号方式は ECDHE だけになった。
//   一方さくらのメールサーバーは TLS1.2 までで、ECDHE に非対応
//   （対応しているのは DHE と RSA 鍵交換のみ）。共通の暗号方式が無いので
//   さくら側が handshake_failure を返し、送信が必ず 500 になる。
//
//   Node の TLS は OpenSSL なので DHE を話せる。実測:
//     TLSv1.2 / DHE-RSA-AES256-GCM-SHA384、証明書検証OK、AUTH直前まで434ms
//   そこで Supabase の Send Email Hook から この関数を呼び、
//   Node からさくらへ送る。
//
// 制約: HTTPフックのタイムアウトは リトライ込みで5秒。
//       そのため SMTP 側のタイムアウトを短く切ってある。

import { createHmac, timingSafeEqual } from 'node:crypto'
import {
  BRAND, type Copy, type Lang, env, jsonError, pickLang, renderHtml, renderText, sendMail,
} from '../lib/mailer'

export const config = { path: '/api/auth-email' }

// ------------------------------------------------------------------
// Standard Webhooks の署名検証
//
// Supabase は webhook-id / webhook-timestamp / webhook-signature を付けてくる。
// 署名対象は `${id}.${timestamp}.${生のボディ}`。
// ライブラリを入れずに済む量なので自前で検証する。
// ------------------------------------------------------------------

const TOLERANCE_SEC = 5 * 60

function secretKey(raw: string): Buffer {
  // Supabase が見せる形式は "v1,whsec_<base64>"
  const base64 = raw.replace(/^v1,/, '').replace(/^whsec_/, '')
  return Buffer.from(base64, 'base64')
}

function verifySignature(secret: string, headers: Headers, body: string): string | null {
  const id = headers.get('webhook-id')
  const timestamp = headers.get('webhook-timestamp')
  const signature = headers.get('webhook-signature')
  if (!id || !timestamp || !signature) return 'missing webhook headers'

  const sent = Number(timestamp)
  if (!Number.isFinite(sent)) return 'bad webhook-timestamp'
  if (Math.abs(Math.floor(Date.now() / 1000) - sent) > TOLERANCE_SEC) {
    return 'webhook timestamp outside tolerance'
  }

  const expected = createHmac('sha256', secretKey(secret))
    .update(`${id}.${timestamp}.${body}`)
    .digest()

  // ヘッダーには "v1,<sig> v1,<sig>" と複数入り得る（鍵のローテーション中など）
  for (const part of signature.split(' ')) {
    const [version, value] = part.split(',')
    if (version !== 'v1' || !value) continue
    const got = Buffer.from(value, 'base64')
    if (got.length === expected.length && timingSafeEqual(got, expected)) return null
  }
  return 'signature mismatch'
}

// ------------------------------------------------------------------
// 文面
// ------------------------------------------------------------------

type ActionType =
  | 'signup' | 'recovery' | 'magiclink' | 'invite'
  | 'email_change' | 'email_change_new' | 'email_change_current'
  | 'reauthentication'

const COPY: Record<Lang, Record<ActionType, Copy>> = {
  ja: {
    signup: {
      subject: `【${BRAND}】メールアドレスの確認`,
      heading: 'メールアドレスを確認してください',
      lead: `${BRAND} へのご登録ありがとうございます。下のボタンを押すと登録が完了します。`,
      cta: 'メールアドレスを確認する',
    },
    recovery: {
      subject: `【${BRAND}】パスワードの再設定`,
      heading: 'パスワードを再設定します',
      lead: '下のボタンから、新しいパスワードを設定してください。',
      cta: 'パスワードを再設定する',
    },
    magiclink: {
      subject: `【${BRAND}】ログイン用リンク`,
      heading: 'ログインリンクをお送りします',
      lead: '下のボタンを押すと、パスワードなしでログインできます。',
      cta: 'ログインする',
    },
    invite: {
      subject: `【${BRAND}】へのご招待`,
      heading: `${BRAND} に招待されています`,
      lead: '下のボタンからアカウントを作成してください。',
      cta: 'アカウントを作成する',
    },
    email_change: {
      subject: `【${BRAND}】メールアドレス変更の確認`,
      heading: 'メールアドレスの変更を確認します',
      lead: '下のボタンを押すと、新しいメールアドレスが有効になります。',
      cta: '変更を確認する',
    },
    email_change_new: {
      subject: `【${BRAND}】新しいメールアドレスの確認`,
      heading: '新しいメールアドレスを確認します',
      lead: '下のボタンを押すと、このアドレスが新しい連絡先になります。',
      cta: '変更を確認する',
    },
    email_change_current: {
      subject: `【${BRAND}】メールアドレス変更の確認`,
      heading: 'メールアドレスの変更を確認します',
      lead: '現在のアドレス宛の確認です。下のボタンを押してください。',
      cta: '変更を確認する',
    },
    reauthentication: {
      subject: `【${BRAND}】確認コード`,
      heading: '確認コード',
      lead: '画面に次のコードを入力してください。',
      cta: '',
    },
  },
  en: {
    signup: {
      subject: `Confirm your email — ${BRAND}`,
      heading: 'Confirm your email address',
      lead: `Thanks for signing up to ${BRAND}. Press the button below to finish creating your account.`,
      cta: 'Confirm email address',
    },
    recovery: {
      subject: `Reset your password — ${BRAND}`,
      heading: 'Reset your password',
      lead: 'Press the button below to choose a new password.',
      cta: 'Reset password',
    },
    magiclink: {
      subject: `Your sign-in link — ${BRAND}`,
      heading: 'Here is your sign-in link',
      lead: 'Press the button below to sign in without a password.',
      cta: 'Sign in',
    },
    invite: {
      subject: `You're invited to ${BRAND}`,
      heading: `You've been invited to ${BRAND}`,
      lead: 'Press the button below to create your account.',
      cta: 'Create account',
    },
    email_change: {
      subject: `Confirm your new email — ${BRAND}`,
      heading: 'Confirm your email change',
      lead: 'Press the button below to activate your new email address.',
      cta: 'Confirm change',
    },
    email_change_new: {
      subject: `Confirm your new email — ${BRAND}`,
      heading: 'Confirm your new email address',
      lead: 'Press the button below to make this your new contact address.',
      cta: 'Confirm change',
    },
    email_change_current: {
      subject: `Confirm your email change — ${BRAND}`,
      heading: 'Confirm your email change',
      lead: 'This confirmation was sent to your current address. Press the button below.',
      cta: 'Confirm change',
    },
    reauthentication: {
      subject: `Your verification code — ${BRAND}`,
      heading: 'Verification code',
      lead: 'Enter this code on the screen.',
      cta: '',
    },
  },
  fr: {
    signup: {
      subject: `Confirmez votre e-mail — ${BRAND}`,
      heading: 'Confirmez votre adresse e-mail',
      lead: `Merci de votre inscription à ${BRAND}. Appuyez sur le bouton ci-dessous pour terminer.`,
      cta: "Confirmer l'adresse",
    },
    recovery: {
      subject: `Réinitialisez votre mot de passe — ${BRAND}`,
      heading: 'Réinitialisez votre mot de passe',
      lead: 'Appuyez sur le bouton ci-dessous pour choisir un nouveau mot de passe.',
      cta: 'Réinitialiser',
    },
    magiclink: {
      subject: `Votre lien de connexion — ${BRAND}`,
      heading: 'Voici votre lien de connexion',
      lead: 'Appuyez sur le bouton ci-dessous pour vous connecter sans mot de passe.',
      cta: 'Se connecter',
    },
    invite: {
      subject: `Vous êtes invité sur ${BRAND}`,
      heading: `Vous êtes invité sur ${BRAND}`,
      lead: 'Appuyez sur le bouton ci-dessous pour créer votre compte.',
      cta: 'Créer un compte',
    },
    email_change: {
      subject: `Confirmez votre nouvel e-mail — ${BRAND}`,
      heading: 'Confirmez le changement',
      lead: 'Appuyez sur le bouton ci-dessous pour activer votre nouvelle adresse.',
      cta: 'Confirmer',
    },
    email_change_new: {
      subject: `Confirmez votre nouvel e-mail — ${BRAND}`,
      heading: 'Confirmez votre nouvelle adresse',
      lead: 'Appuyez sur le bouton ci-dessous pour en faire votre adresse de contact.',
      cta: 'Confirmer',
    },
    email_change_current: {
      subject: `Confirmez le changement d'e-mail — ${BRAND}`,
      heading: 'Confirmez le changement',
      lead: 'Cette confirmation a été envoyée à votre adresse actuelle.',
      cta: 'Confirmer',
    },
    reauthentication: {
      subject: `Votre code de vérification — ${BRAND}`,
      heading: 'Code de vérification',
      lead: "Saisissez ce code à l'écran.",
      cta: '',
    },
  },
}

// ------------------------------------------------------------------
// 本体
// ------------------------------------------------------------------

interface HookPayload {
  user: { email?: string; user_metadata?: Record<string, unknown> }
  email_data: {
    token?: string
    token_hash?: string
    token_new?: string
    token_hash_new?: string
    redirect_to?: string
    email_action_type?: string
    site_url?: string
  }
}

const fail = jsonError

// 環境変数の入れ忘れで例外が出ると Netlify が素の502を返し、画面にも
// ログにも理由が出ない。何が足りないかは必ず応答に載せる。
export default async (req: Request): Promise<Response> => {
  try {
    return await handle(req)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('unhandled', msg)
    return fail(500, msg)
  }
}

async function handle(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 })

  const body = await req.text()

  const bad = verifySignature(env('SEND_EMAIL_HOOK_SECRET'), req.headers, body)
  if (bad) {
    console.warn('rejected hook request:', bad)
    return fail(401, bad)
  }

  let payload: HookPayload
  try {
    payload = JSON.parse(body)
  } catch {
    return fail(400, 'bad json')
  }

  const to = payload.user?.email
  const data = payload.email_data ?? {}
  const action = (data.email_action_type ?? 'signup') as ActionType
  if (!to) return fail(400, 'no recipient')

  const lang = pickLang(payload.user?.user_metadata?.lang)
  const copy = COPY[lang][action] ?? COPY[lang].signup
  const siteUrl = data.site_url || env('SITE_URL')

  // 確認リンクは Supabase の /auth/v1/verify を踏ませる。踏むと redirect_to へ戻る。
  // email_change_new のときは新しいアドレス用のハッシュを使う。
  const hash = action === 'email_change_new' ? (data.token_hash_new || data.token_hash) : data.token_hash
  const link = action === 'reauthentication' || !hash
    ? null
    : `${env('SUPABASE_URL')}/auth/v1/verify`
      + `?token=${encodeURIComponent(hash)}`
      + `&type=${encodeURIComponent(action)}`
      + `&redirect_to=${encodeURIComponent(data.redirect_to || siteUrl)}`
  const code = action === 'reauthentication' ? (data.token ?? null) : null

  // 配信そのものはしないで、組み立てまでを確認したいとき（ローカル検証用）。
  if (process.env.AUTH_EMAIL_DRY_RUN === '1') {
    console.log('[dry-run]', JSON.stringify({ to, lang, action, subject: copy.subject, link, code }))
    return new Response(JSON.stringify({
      dryRun: true, subject: copy.subject, link, code,
      html: renderHtml(lang, copy, link, code, siteUrl),
      text: renderText(lang, copy, link, code, siteUrl),
    }), { status: 200, headers: { 'content-type': 'application/json' } })
  }

  try {
    const messageId = await sendMail(to, lang, copy, link, code, siteUrl)
    console.log('sent', JSON.stringify({ to, lang, action, messageId }))
    return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('send failed', JSON.stringify({ to, action, error: msg }))
    return fail(500, msg)
  }
}
