import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../App'
import { t } from '../i18n'

interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
}

// LoginPage.tsx の元々のヘッダー/カード構造を、他の認証系ページ
// (ForgotPassword/ResetPassword)でも使えるように切り出したもの。
export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  const { lang, setLang } = useLang()

  return (
    <div className="min-h-screen line-page flex flex-col">
      <div className="px-6 py-4 flex items-center justify-between border-b border-hairline">
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <span className="font-display font-medium text-lg text-ink tracking-wide uppercase">AfriTalent</span>
        </Link>
        <div className="flex items-center border border-hairline">
          {(['ja', 'en', 'fr'] as const).map((l, i) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${i > 0 ? 'border-l border-hairline' : ''} ${
                lang === l ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-display font-medium text-ink text-3xl tracking-wide mb-2">{title}</h1>
            {subtitle && <p className="text-ink-soft text-sm">{subtitle}</p>}
          </div>

          {children}

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
