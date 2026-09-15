import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../App'
import { t } from '../i18n'
import AuthLayout from '../components/AuthLayout'

export default function ForgotPasswordPage() {
  const { resetPasswordRequest } = useAuth()
  const { lang } = useLang()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    await resetPasswordRequest(email.trim())
    setSubmitting(false)
    setSent(true)
  }

  return (
    <AuthLayout title={t(lang, 'forgotPassword.title')} subtitle={t(lang, 'forgotPassword.subtitle')}>
      <div className="line-card p-8">
        {sent ? (
          <p className="text-ink-soft text-sm text-center">{t(lang, 'forgotPassword.sentMsg')}</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="label-line">{t(lang, 'forgotPassword.emailLabel')}</label>
              <input
                type="email"
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-line"
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-line w-full justify-center disabled:opacity-50">
              {submitting ? '···' : t(lang, 'forgotPassword.submitBtn')}
            </button>
          </form>
        )}
      </div>
      <p className="text-center mt-5">
        <Link to="/login" className="text-ink-faint text-sm hover:text-ink transition-colors no-underline">
          {t(lang, 'forgotPassword.backToLogin')}
        </Link>
      </p>
    </AuthLayout>
  )
}
