// さくらのSMTPへ送る部分と、メールの体裁。
// send-auth-email（Supabaseの認証メール）と verify-email（アドレス到達確認）で共用する。
//
// なぜ Supabase の Custom SMTP ではなくここから送るのか、
// なぜポート465なのかは docs/auth-email.md を参照。

import nodemailer from 'nodemailer'

export type Lang = 'ja' | 'en' | 'fr'

export const BRAND = 'NeBonga Link'
export const TAGLINE = 'Better connections, better work'

export function pickLang(value: unknown): Lang {
  return value === 'en' || value === 'fr' ? value : 'ja'
}

export function env(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`missing env ${name}`)
  return v
}

// 共通の末尾。心当たりが無ければ無視してほしい旨と、リンクが切れていた場合の案内。
export const TAIL: Record<Lang, { ignore: string; expired: string; fallback: string; footer: string }> = {
  ja: {
    ignore: 'このメールに心当たりがない場合は、何もせずに破棄してください。',
    expired: 'リンクの有効期限が切れている場合は、お手数ですがもう一度お試しください。',
    fallback: 'ボタンが使えない場合は、次のURLをブラウザに貼り付けてください。',
    footer: 'このメールは送信専用です。返信はできません。',
  },
  en: {
    ignore: "If you weren't expecting this email, you can safely ignore it.",
    expired: 'If the link has expired, please request a new one.',
    fallback: "If the button doesn't work, paste this URL into your browser.",
    footer: 'This mailbox is not monitored. Please do not reply.',
  },
  fr: {
    ignore: "Si vous n'attendiez pas cet e-mail, vous pouvez l'ignorer.",
    expired: 'Si le lien a expiré, veuillez en demander un nouveau.',
    fallback: 'Si le bouton ne fonctionne pas, collez cette URL dans votre navigateur.',
    footer: "Cette boîte n'est pas surveillée. Merci de ne pas répondre.",
  },
}

export interface Copy {
  subject: string
  heading: string
  lead: string
  cta: string
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}

// 画面と同じ Line のトークン（paper / ink / hairline / seal）で組む。
// メールクライアントは外部CSSもclassも当てにならないので、全てインラインで書く。
export function renderHtml(
  lang: Lang, copy: Copy, link: string | null, code: string | null, siteUrl: string,
): string {
  const tail = TAIL[lang]
  const button = link
    ? `<tr><td style="padding:28px 0 8px;">
         <a href="${escapeHtml(link)}" style="display:inline-block;background:#1C1B18;color:#FAF8F4;
            text-decoration:none;padding:14px 28px;font-size:14px;letter-spacing:.08em;
            text-transform:uppercase;">${escapeHtml(copy.cta)}</a>
       </td></tr>`
    : ''
  const codeBlock = code
    ? `<tr><td style="padding:28px 0 8px;">
         <div style="display:inline-block;border:1px solid #E7E2D6;padding:16px 28px;
            font-size:28px;letter-spacing:.3em;color:#1C1B18;font-family:monospace;">
            ${escapeHtml(code)}</div>
       </td></tr>`
    : ''
  const fallback = link
    ? `<tr><td style="padding:20px 0 0;color:#B7B2A1;font-size:12px;line-height:1.7;">
         ${escapeHtml(tail.fallback)}<br>
         <span style="color:#8A8577;word-break:break-all;">${escapeHtml(link)}</span>
       </td></tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(copy.subject)}</title></head>
<body style="margin:0;padding:0;background:#FAF8F4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F4;">
<tr><td align="center" style="padding:40px 16px;">
  <table role="presentation" width="480" cellpadding="0" cellspacing="0"
         style="width:480px;max-width:100%;text-align:left;
                font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <tr><td style="padding-bottom:28px;border-bottom:1px solid #E7E2D6;">
      <div style="font-size:18px;letter-spacing:.18em;color:#1C1B18;">${BRAND.toUpperCase()}</div>
      <div style="font-size:11px;letter-spacing:.06em;color:#B7B2A1;padding-top:4px;">${TAGLINE}</div>
    </td></tr>
    <tr><td style="padding-top:32px;font-size:20px;color:#1C1B18;line-height:1.5;">
      ${escapeHtml(copy.heading)}</td></tr>
    <tr><td style="padding-top:12px;font-size:14px;color:#8A8577;line-height:1.9;">
      ${escapeHtml(copy.lead)}</td></tr>
    ${button}${codeBlock}
    <tr><td style="padding-top:20px;font-size:12px;color:#B7B2A1;line-height:1.8;">
      ${escapeHtml(tail.expired)}<br>${escapeHtml(tail.ignore)}</td></tr>
    ${fallback}
    <tr><td style="padding-top:32px;border-top:1px solid #E7E2D6;"></td></tr>
    <tr><td style="padding-top:16px;font-size:11px;color:#B7B2A1;line-height:1.8;">
      ${escapeHtml(tail.footer)}<br>
      <a href="${escapeHtml(siteUrl)}" style="color:#A6332B;text-decoration:none;">${escapeHtml(siteUrl)}</a>
    </td></tr>
  </table>
</td></tr></table></body></html>`
}

export function renderText(
  lang: Lang, copy: Copy, link: string | null, code: string | null, siteUrl: string,
): string {
  const tail = TAIL[lang]
  return [
    `${BRAND} — ${TAGLINE}`, '', copy.heading, '', copy.lead, '',
    link ?? '', code ?? '', '',
    tail.expired, tail.ignore, '', tail.footer, siteUrl,
  ].filter(l => l !== '').join('\n')
}

// Supabase の Send Email Hook は5秒で打ち切る。関数は米国オハイオで動き、
// さくら（日本）との1往復が約170ms。往復の数がそのまま効くので、
// 2往復少ない465（暗黙のTLS）を既定にし、タイムアウトも短く切る。
export function createTransport() {
  const port = Number(process.env.SMTP_PORT || 465)
  return nodemailer.createTransport({
    host: env('SMTP_HOST'),
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user: env('SMTP_USER'), pass: env('SMTP_PASS') },
    // 逆引きを待たない。待つと1往復ぶん損をする。
    name: 'nebonga-link.com',
    connectionTimeout: 3500,
    greetingTimeout: 3500,
    socketTimeout: 4000,
    disableFileAccess: true,
    disableUrlAccess: true,
  })
}

export async function sendMail(
  to: string, lang: Lang, copy: Copy, link: string | null, code: string | null, siteUrl: string,
): Promise<string> {
  const transport = createTransport()
  try {
    const info = await transport.sendMail({
      from: { name: process.env.MAIL_FROM_NAME || BRAND, address: env('MAIL_FROM') },
      to,
      subject: copy.subject,
      text: renderText(lang, copy, link, code, siteUrl),
      html: renderHtml(lang, copy, link, code, siteUrl),
    })
    return info.messageId
  } finally {
    transport.close()
  }
}

export function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: { http_code: status, message } }), {
    status, headers: { 'content-type': 'application/json' },
  })
}
