import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../App'
import { t } from '../i18n'

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
    <div className="min-h-screen bg-dark flex flex-col"
         style={{ background: 'linear-gradient(135deg, #0A0A0A 0%, #141414 50%, #0A0A0A 100%)' }}>
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/[0.06]">
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #D85A30 0%, #1D9E75 100%)' }}>
            <span className="text-white font-bold text-xs">AT</span>
          </div>
          <span className="text-white font-medium text-lg tracking-tight">AfriTalent</span>
        </Link>
        <div className="flex items-center bg-dark-3 rounded-lg p-0.5 border border-white/[0.08]">
          <button onClick={() => setLang('ja')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${lang === 'ja' ? 'bg-white text-dark' : 'text-white/50 hover:text-white/80'}`}>
            JA
          </button>
          <button onClick={() => setLang('en')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${lang === 'en' ? 'bg-white text-dark' : 'text-white/50 hover:text-white/80'}`}>
            EN
          </button>
          <button onClick={() => setLang('fr')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${lang === 'fr' ? 'bg-white text-dark' : 'text-white/50 hover:text-white/80'}`}>
            FR
          </button>
        </div>
      </div>

      <div className="absolute top-20 right-0 w-80 h-80 rounded-full pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(216,90,48,0.08) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(29,158,117,0.08) 0%, transparent 70%)' }} />

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-medium text-white tracking-tight mb-2" style={{ letterSpacing: '-0.02em' }}>
              {isLogin ? t(lang, 'login.title') : t(lang, 'login.signUpTitle')}
            </h1>
            <p className="text-white/40 text-sm">{t(lang, 'login.subtitle')}</p>
          </div>

          {signedUp ? (
            <div className="bg-dark-2 rounded-2xl p-8 text-center" style={{ border: '0.5px solid rgba(255,255,255,0.08)' }}>
              <p className="text-2xl mb-3">✓</p>
              <p className="text-white/70 text-sm">{t(lang, 'login.signedUpMsg')}</p>
              <button onClick={() => { setMode('login'); setSignedUp(false) }}
                      className="mt-5 text-a-orange text-sm hover:opacity-80 cursor-pointer">
                {t(lang, 'login.goToLogin')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-dark-2 rounded-2xl p-8"
                  style={{ border: '0.5px solid rgba(255,255,255,0.08)' }}>
              {error && (
                <div className="mb-5 px-4 py-3 rounded-xl text-sm"
                     style={{ background: 'rgba(216,90,48,0.1)', color: '#D85A30', border: '0.5px solid rgba(216,90,48,0.2)' }}>
                  {error}
                </div>
              )}

              {!isLogin && (
                <div className="mb-4">
                  <label className="block text-white/50 text-xs font-medium mb-2 uppercase tracking-wider">
                    {t(lang, 'login.accountTypeLabel')}
                  </label>
                  <div className="flex items-center bg-dark-3 rounded-xl p-1 border border-white/[0.08]">
                    <button type="button" onClick={() => { setSignUpType('talent'); setError('') }}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${signUpType === 'talent' ? 'bg-white text-dark' : 'text-white/50 hover:text-white/80'}`}>
                      {t(lang, 'login.accountTypeTalent')}
                    </button>
                    <button type="button" onClick={() => { setSignUpType('company'); setError('') }}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${signUpType === 'company' ? 'bg-white text-dark' : 'text-white/50 hover:text-white/80'}`}>
                      {t(lang, 'login.accountTypeCompany')}
                    </button>
                  </div>
                </div>
              )}

              {!isLogin && signUpType === 'company' && (
                <div className="mb-4">
                  <label className="block text-white/50 text-xs font-medium mb-2 uppercase tracking-wider">
                    {t(lang, 'login.companyNameLabel')}
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => { setCompanyName(e.target.value); setError('') }}
                    placeholder={t(lang, 'login.companyNamePlaceholder')}
                    className="w-full bg-dark-3 border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none focus:border-a-orange/40 transition-colors"
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-white/50 text-xs font-medium mb-2 uppercase tracking-wider">
                  {t(lang, 'login.emailLabel')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  placeholder={t(lang, 'login.emailPlaceholder')}
                  className="w-full bg-dark-3 border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none focus:border-a-orange/40 transition-colors"
                />
              </div>

              <div className="mb-6">
                <label className="block text-white/50 text-xs font-medium mb-2 uppercase tracking-wider">
                  {t(lang, 'login.passwordLabel')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                  className="w-full bg-dark-3 border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none focus:border-a-orange/40 transition-colors"
                />
              </div>

              <button type="submit" disabled={submitting}
                      className="w-full py-3 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90 cursor-pointer disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #D85A30 0%, #BA7517 100%)' }}>
                {submitting ? '...' : (isLogin ? t(lang, 'login.submitBtn') : t(lang, 'login.signUpBtn'))}
              </button>

              <p className="text-center text-white/30 text-xs mt-5">
                {isLogin ? t(lang, 'login.noAccount') : t(lang, 'login.hasAccount')}
                {' '}
                <button type="button"
                        onClick={() => { setMode(isLogin ? 'signup' : 'login'); setError('') }}
                        className="text-a-orange hover:opacity-80 cursor-pointer underline">
                  {isLogin ? t(lang, 'login.signUpLink') : t(lang, 'login.signInLink')}
                </button>
              </p>
            </form>
          )}

          <p className="text-center mt-5">
            <Link to="/" className="text-white/30 text-sm hover:text-white/50 transition-colors no-underline">
              ← {t(lang, 'login.backToTop')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
