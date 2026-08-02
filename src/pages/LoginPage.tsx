import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../App'
import { t } from '../i18n'

const INPUT_CLS = 'input-line'
const LABEL_CLS = 'label-line'

export default function LoginPage() {
  const { user, company, accountType, login, signUp } = useAuth()
  const { lang, setLang } = useLang()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [signUpType, setSignUpType] = useState<'talent' | 'company'>('talent')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [signedUp, setSignedUp] = useState(false)

  // ログイン成功後、管理者は審査パネルへ、企業アカウントは人材一覧へ、人材は自分のダッシュボードへ遷移
  useEffect(() => {
    if (!user && !company) return
    const destination = accountType === 'admin' ? '/admin' : accountType === 'company' ? '/talents' : '/dashboard'
    navigate(destination, { replace: true })
  }, [user, company, accountType, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError(t(lang, 'login.errorEmpty'))
      return
    }
    if (mode === 'signup' && signUpType === 'company' && !companyName.trim()) {
      setError(t(lang, 'login.errorEmpty'))
      return
    }
    setSubmitting(true)
    setError('')

    if (mode === 'login') {
      const { error: authError } = await login(email, password)
      if (authError) {
        setError(t(lang, 'login.errorInvalid'))
        setSubmitting(false)
        return
      }
    } else {
      const { error: authError } = await signUp(email, password, {
        role: signUpType,
        companyName: signUpType === 'company' ? companyName.trim() : undefined,
      })
      if (authError) {
        setError(authError)
        setSubmitting(false)
        return
      }
      setSignedUp(true)
    }
    setSubmitting(false)
  }

  const isLogin = mode === 'login'

  return (
    <div className="min-h-screen line-page flex flex-col">
      <div className="px-6 py-4 flex items-center justify-between border-b border-hairline">
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <span className="font-display font-medium text-lg text-ink tracking-wide uppercase">AfriTalent</span>
        </Link>
        <div className="flex items-center border border-hairline">
          <button onClick={() => setLang('ja')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${lang === 'ja' ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'}`}>
            JA
          </button>
          <button onClick={() => setLang('en')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer border-l border-hairline ${lang === 'en' ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'}`}>
            EN
          </button>
          <button onClick={() => setLang('fr')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer border-l border-hairline ${lang === 'fr' ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'}`}>
            FR
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-display font-medium text-ink text-3xl tracking-wide mb-2">
              {isLogin ? t(lang, 'login.title') : t(lang, 'login.signUpTitle')}
            </h1>
            <p className="text-ink-soft text-sm">{t(lang, 'login.subtitle')}</p>
          </div>

          {signedUp ? (
            <div className="line-card p-8 text-center">
              <div className="avatar-line w-12 h-12 mx-auto mb-4">
                <span className="text-lg">✓</span>
              </div>
              <p className="text-ink-soft text-sm">{t(lang, 'login.signedUpMsg')}</p>
              <button onClick={() => { setMode('login'); setSignedUp(false) }}
                      className="btn-line-ghost mt-5 cursor-pointer">
                {t(lang, 'login.goToLogin')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="line-card p-8">
              {error && (
                <div className="mb-5 px-4 py-3 border border-seal text-seal text-sm">
                  {error}
                </div>
              )}

              {!isLogin && (
                <div className="mb-4">
                  <label className={LABEL_CLS}>
                    {t(lang, 'login.accountTypeLabel')}
                  </label>
                  <div className="flex items-center border border-hairline">
                    <button type="button" onClick={() => { setSignUpType('talent'); setError('') }}
                      className={`flex-1 py-2 text-sm font-medium transition-colors cursor-pointer ${signUpType === 'talent' ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'}`}>
                      {t(lang, 'login.accountTypeTalent')}
                    </button>
                    <button type="button" onClick={() => { setSignUpType('company'); setError('') }}
                      className={`flex-1 py-2 text-sm font-medium transition-colors cursor-pointer border-l border-hairline ${signUpType === 'company' ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'}`}>
                      {t(lang, 'login.accountTypeCompany')}
                    </button>
                  </div>
                </div>
              )}

              {!isLogin && signUpType === 'company' && (
                <div className="mb-4">
                  <label className={LABEL_CLS}>
                    {t(lang, 'login.companyNameLabel')}
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => { setCompanyName(e.target.value); setError('') }}
                    placeholder={t(lang, 'login.companyNamePlaceholder')}
                    className={INPUT_CLS}
                  />
                </div>
              )}

              <div className="mb-4">
                <label className={LABEL_CLS}>
                  {t(lang, 'login.emailLabel')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  placeholder={t(lang, 'login.emailPlaceholder')}
                  className={INPUT_CLS}
                />
              </div>

              <div className="mb-6">
                <label className={LABEL_CLS}>
                  {t(lang, 'login.passwordLabel')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                  className={INPUT_CLS}
                />
              </div>

              <button type="submit" disabled={submitting}
                      className="btn-line w-full justify-center disabled:opacity-50">
                {submitting ? '···' : (isLogin ? t(lang, 'login.submitBtn') : t(lang, 'login.signUpBtn'))}
              </button>

              <p className="text-center text-ink-faint text-xs mt-5">
                {isLogin ? t(lang, 'login.noAccount') : t(lang, 'login.hasAccount')}
                {' '}
                <button type="button"
                        onClick={() => { setMode(isLogin ? 'signup' : 'login'); setError('') }}
                        className="text-seal hover:opacity-70 cursor-pointer underline">
                  {isLogin ? t(lang, 'login.signUpLink') : t(lang, 'login.signInLink')}
                </button>
              </p>
            </form>
          )}

          <p className="text-center mt-5">
            <Link to="/" className="text-ink-faint text-sm hover:text-ink transition-colors no-underline">
              ← {t(lang, 'login.backToTop')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
