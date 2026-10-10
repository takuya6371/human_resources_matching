import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useLang } from '../App'
import { t } from '../i18n'

type State = 'checking' | 'verified' | 'invalid' | 'expired' | 'failed'

// 確認メールのリンク先。?token= を関数に渡して確認済みにする。
// ログインしていなくても踏める（別の端末でメールを開くことがあるため）。
export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const { lang } = useLang()
  const [state, setState] = useState<State>('checking')
  // React 18 の StrictMode は effect を2回走らせる。トークンは使い捨てなので、
  // 2回目で「無効」になってしまう。1回だけ送る。
  const sent = useRef(false)

  useEffect(() => {
    if (sent.current) return
    sent.current = true

    const token = params.get('token')
    if (!token) { setState('invalid'); return }

    fetch('/api/verify-email/confirm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async res => {
        const body = await res.json().catch(() => null) as { status?: string } | null
        if (body?.status === 'verified') return setState('verified')
        if (body?.status === 'expired') return setState('expired')
        if (body?.status === 'invalid') return setState('invalid')
        setState('failed')
      })
      .catch(() => setState('failed'))
  }, [params])

  const title = state === 'verified' ? t(lang, 'emailVerify.doneTitle')
    : state === 'checking' ? t(lang, 'emailVerify.checkingTitle')
    : t(lang, 'emailVerify.failTitle')

  const body = state === 'verified' ? t(lang, 'emailVerify.doneBody')
    : state === 'checking' ? ''
    : state === 'expired' ? t(lang, 'emailVerify.expiredBody')
    : state === 'invalid' ? t(lang, 'emailVerify.invalidBody')
    : t(lang, 'emailVerify.failedBody')

  return (
    <div className="min-h-screen line-page flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-20">
        <div className="w-full max-w-md text-center">
          <h1 className="font-display text-ink text-2xl sm:text-3xl leading-tight">{title}</h1>
          {body && <p className="mt-4 text-ink-soft text-sm leading-relaxed">{body}</p>}
          {state !== 'checking' && (
            <div className="mt-8 flex justify-center gap-3">
              <Link to="/dashboard" className="btn-line no-underline">
                {t(lang, 'emailVerify.toDashboard')}
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
