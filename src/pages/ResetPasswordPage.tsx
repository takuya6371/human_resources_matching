import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../App'
import { t } from '../i18n'
import AuthLayout from '../components/AuthLayout'

export default function ResetPasswordPage() {
  const { user, company, loading, resetPassword } = useAuth()
  const { lang } = useLang()
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // resetPasswordRequestのメールリンクを踏むと、Supabaseがこのページに
  // 回復用セッションを確立した状態で遷移させる。user/companyが取れていれば
  // 有効なリンク、loadingが終わって両方nullならリンクが無効/期限切れ。
  const hasSession = !!user || !!company

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError(t(lang, 'resetPassword.mismatchError'))
      return
    }
    setSubmitting(true)
    setError('')
    const { error: resetError } = await resetPassword(newPassword)
    setSubmitting(false)
    if (resetError) {
      setError(resetError)
      return
    }
    navigate('/login', { replace: true })
  }

  if (loading) {
    return (
      <AuthLayout title={t(lang, 'resetPassword.title')}>
        <div className="line-card p-8 text-center text-ink-soft text-sm">···</div>
      </AuthLayout>
    )
  }

  if (!hasSession) {
    return (
      <AuthLayout title={t(lang, 'resetPassword.invalidTitle')} subtitle={t(lang, 'resetPassword.invalidBody')}>
        <p className="text-center">
          <Link to="/forgot-password" className="btn-line-ghost no-underline">
            {t(lang, 'resetPassword.requestNewLink')}
          </Link>
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title={t(lang, 'resetPassword.title')} subtitle={t(lang, 'resetPassword.subtitle')}>
      <form onSubmit={handleSubmit} className="line-card p-8">
        {error && <div className="mb-5 px-4 py-3 border border-seal text-seal text-sm">{error}</div>}

        <div className="mb-4">
          <label className="label-line">{t(lang, 'resetPassword.newPasswordLabel')}</label>
          <input
            type="password"
            autoFocus
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="••••••••"
            className="input-line"
          />
        </div>

        <div className="mb-6">
          <label className="label-line">{t(lang, 'resetPassword.confirmLabel')}</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="input-line"
          />
        </div>

        <button type="submit" disabled={submitting} className="btn-line w-full justify-center disabled:opacity-50">
          {submitting ? '···' : t(lang, 'resetPassword.submitBtn')}
        </button>
      </form>
    </AuthLayout>
  )
}
