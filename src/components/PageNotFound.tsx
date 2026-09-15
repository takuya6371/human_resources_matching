import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../App'
import { t } from '../i18n'

export default function PageNotFound() {
  const { user } = useAuth()
  const { lang } = useLang()

  return (
    <div className="min-h-screen line-page flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <p className="font-display text-6xl text-ink-faint">404</p>
        <h1 className="mt-4 font-display text-2xl text-ink">{t(lang, 'page404.title')}</h1>
        <p className="mt-2 text-ink-soft text-sm">{t(lang, 'page404.body')}</p>

        {user?.role === 'admin' && (
          <p className="mt-6 text-xs text-ink-faint border-t border-hairline pt-4">
            {t(lang, 'page404.adminNote')}
          </p>
        )}

        <Link to="/" className="btn-line no-underline inline-flex mt-8">
          {t(lang, 'page404.home')}
        </Link>
      </div>
    </div>
  )
}
