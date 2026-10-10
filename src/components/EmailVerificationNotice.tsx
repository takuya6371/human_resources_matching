import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../App'
import { t } from '../i18n'

// メールアドレスがまだ確認できていないことを本人に伝える。
//
// Supabase の「Confirm email」は OFF にしてある。会場のQRから登録した人を
// その場でアプリに入れるためで、確認は後追いにしている。だから
// 未確認のまま使えてしまう状態が普通に起きる。ここで気づかせる。
//
// 確認メールの送信に失敗した場合も、登録自体は成立させて未確認のままにする。
// 利用者から見ると同じ「まだ確認できていない」なので、文面も分けない。
export default function EmailVerificationNotice() {
  const { emailVerified, sendVerificationEmail } = useAuth()
  const { lang } = useLang()
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'throttled' | 'failed'>('idle')

  // null は読み込み中。確認済みなら何も出さない。
  if (emailVerified !== false) return null

  async function resend() {
    setState('sending')
    const { status } = await sendVerificationEmail()
    setState(status === 'sent' ? 'sent'
      : status === 'throttled' ? 'throttled'
      : status === 'already_verified' ? 'sent'
      : 'failed')
  }

  return (
    <div className="border-b border-seal/30 bg-seal/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3
                      flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <p className="flex-1 text-seal text-sm leading-relaxed">
          <span className="font-medium">{t(lang, 'emailVerify.bannerTitle')}</span>
          <span className="text-ink-soft"> {t(lang, 'emailVerify.bannerBody')}</span>
        </p>

        {state === 'sent' ? (
          <p className="text-ink-soft text-xs whitespace-nowrap">{t(lang, 'emailVerify.resent')}</p>
        ) : state === 'throttled' ? (
          <p className="text-ink-soft text-xs whitespace-nowrap">{t(lang, 'emailVerify.tooSoon')}</p>
        ) : (
          <div className="flex items-center gap-3">
            {state === 'failed' && (
              <span className="text-seal text-xs">{t(lang, 'emailVerify.resendFailed')}</span>
            )}
            <button
              onClick={resend}
              disabled={state === 'sending'}
              className="btn-line-ghost text-xs whitespace-nowrap disabled:opacity-50"
            >
              {state === 'sending' ? '···' : t(lang, 'emailVerify.resend')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
