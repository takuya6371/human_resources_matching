import { Link } from 'react-router-dom'
import { Users, Building2, ArrowRight } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useLang } from '../App'
import { t } from '../i18n'

// QRコードの遷移先。イベント会場で読み取った人が最初に見る画面なので、
// 迷わせない。/login に直接飛ばすとログインフォームが出てしまい、
// 未登録者が「新規登録」に切り替えてさらに種別を選ぶ必要があった。
// ここで種別を選ばせ、/login?mode=signup&role=... に渡す。
const CHOICES = [
  { role: 'talent', icon: Users, accent: true },
  { role: 'company', icon: Building2, accent: false },
] as const

export default function StartPage() {
  const { lang } = useLang()

  return (
    <div className="min-h-screen line-page flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center">
        <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-20">

          <div className="text-center">
            <h1 className="font-display font-medium text-ink text-3xl sm:text-4xl leading-tight">
              {t(lang, 'start.title')}
            </h1>
            <p className="mt-4 text-ink-soft text-base leading-relaxed">
              {t(lang, 'start.lead')}
            </p>
          </div>

          <div className="mt-10 sm:mt-14 grid gap-5 sm:grid-cols-2">
            {CHOICES.map(({ role, icon: Icon, accent }) => (
              <Link
                key={role}
                to={`/login?mode=signup&role=${role}`}
                className={`group block no-underline p-7 sm:p-8 border transition-colors
                            ${accent
                              ? 'bg-ink border-ink hover:opacity-90'
                              : 'line-card hover:border-ink'}`}
              >
                <Icon className={`h-7 w-7 ${accent ? 'text-paper' : 'text-ink'}`} />
                <h2 className={`mt-5 font-display text-xl ${accent ? 'text-paper' : 'text-ink'}`}>
                  {t(lang, `start.${role}Title`)}
                </h2>
                <p className={`mt-2 text-sm leading-relaxed ${accent ? 'text-paper/70' : 'text-ink-soft'}`}>
                  {t(lang, `start.${role}Desc`)}
                </p>
                <span className={`mt-6 inline-flex items-center gap-2 text-sm
                                  ${accent ? 'text-paper' : 'text-seal'}`}>
                  {t(lang, `start.${role}Cta`)}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>

          <p className="mt-10 text-center text-ink-soft text-sm">
            {t(lang, 'start.haveAccount')}{' '}
            <Link to="/login" className="text-seal hover:opacity-70">{t(lang, 'nav.signIn')}</Link>
          </p>

        </div>
      </main>
      <Footer />
    </div>
  )
}
