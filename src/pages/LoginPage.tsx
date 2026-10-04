import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../App'
import { t } from '../i18n'
import AuthLayout from '../components/AuthLayout'

const INPUT_CLS = 'input-line'
const LABEL_CLS = 'label-line'

export default function LoginPage() {
  const { user, company, accountType, login, signUp } = useAuth()
  const { lang } = useLang()
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
    <AuthLayout
      title={isLogin ? t(lang, 'login.title') : t(lang, 'login.signUpTitle')}
      subtitle={t(lang, 'login.subtitle')}
    >
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className={LABEL_CLS + ' mb-0'}>
                    {t(lang, 'login.passwordLabel')}
                  </label>
                  {isLogin && (
                    <Link to="/forgot-password" className="text-ink-faint text-xs hover:text-ink transition-colors no-underline">
                      {t(lang, 'login.forgotPassword')}
                    </Link>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                  className={INPUT_CLS}
                />
              </div>

              {/* 同意はボタンの直前に置く。登録時点で読める位置にないと
                  「同意のうえ登録した」と言えないため。 */}
              {!isLogin && (
                <p className="text-ink-faint text-xs leading-relaxed mb-4">
                  {t(lang, 'login.consentPrefix')}
                  <Link to="/terms" target="_blank" className="text-seal hover:opacity-70 underline">
                    {t(lang, 'legal.terms')}
                  </Link>
                  {t(lang, 'login.consentAnd')}
                  <Link to="/privacy" target="_blank" className="text-seal hover:opacity-70 underline">
                    {t(lang, 'legal.privacy')}
                  </Link>
                  {t(lang, 'login.consentSuffix')}
                </p>
              )}

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
    </AuthLayout>
  )
}
