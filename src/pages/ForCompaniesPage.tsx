import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useLang } from '../App'
import { t } from '../i18n'
import { challengeDemo } from '../content/challengeDemo'

const REASONS = ['inJapan', 'reviewed', 'language', 'afterReturn'] as const
const CAN_DO = ['post', 'search', 'message', 'manage'] as const

// nav.companies は3言語とも定義されていたのに、リンク先のページが
// 存在しなかった。書いてあることは実装に合わせる。とくに、
// 在留資格の確認・企業審査・成果報酬はいずれも未実装なので謳わない。
export default function ForCompaniesPage() {
  const { lang } = useLang()
  const demo = challengeDemo(lang)

  return (
    <div className="min-h-screen line-page flex flex-col">
      <Navbar />
      <main className="flex-1">

        <section className="py-16 sm:py-24 px-4 sm:px-6 border-b border-hairline">
          <div className="max-w-6xl mx-auto">
            <span className="badge-line-ink text-[11px]">{t(lang, 'forCompanies.badge')}</span>
            <h1 className="mt-6 font-display font-medium text-ink text-3xl sm:text-5xl leading-tight">
              {/* 改行位置は文言側で持つ（HomePage の hero.title と同じ扱い） */}
              {t(lang, 'forCompanies.title').split('\n').map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))}
            </h1>
            <p className="mt-4 max-w-2xl text-ink-soft text-base leading-relaxed">
              {t(lang, 'forCompanies.lead')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login?mode=signup&role=company" className="btn-line no-underline">{t(lang, 'forCompanies.cta')}</Link>
              <Link to="/talents" className="btn-line-ghost no-underline">{t(lang, 'forCompanies.browseCta')}</Link>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 px-4 sm:px-6 border-b border-hairline">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-display text-ink text-xl sm:text-2xl">{t(lang, 'forCompanies.whyHeading')}</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {REASONS.map(r => (
                <div key={r} className="line-card p-6">
                  <h3 className="text-ink font-medium text-sm">{t(lang, `forCompanies.why.${r}Title`)}</h3>
                  <p className="mt-2 text-ink-soft text-sm leading-relaxed">{t(lang, `forCompanies.why.${r}Desc`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 px-4 sm:px-6 border-b border-hairline">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-display text-ink text-xl sm:text-2xl">{t(lang, 'forCompanies.canDoHeading')}</h2>
            <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {CAN_DO.map((c, i) => (
                <li key={c} className="line-card p-6">
                  <span className="font-display text-ink-faint text-sm tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="mt-3 text-ink font-medium text-sm">{t(lang, `forCompanies.canDo.${c}Title`)}</h3>
                  <p className="mt-2 text-ink-soft text-sm leading-relaxed">{t(lang, `forCompanies.canDo.${c}Desc`)}</p>
                </li>
              ))}
            </ol>
            <p className="mt-8 text-sm">
              <Link to="/how-it-works" className="text-seal hover:opacity-70">
                {t(lang, 'forCompanies.seeFlow')}
              </Link>
            </p>
          </div>
        </section>

        {/* まだ作っていない機能の予告。見せたい相手（企業）がいるこのページにだけ置く。
            文言は src/content/challengeDemo.ts 側に持たせてある（i18n.ts に入れるのは
            正式に作るときでよく、いまは構想段階のため）。 */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 border-b border-hairline">
          <div className="max-w-6xl mx-auto">
            <div className="line-card p-8 sm:p-10">
              <span className="badge-line-ink text-[11px]">{demo.teaserBadge}</span>
              <h2 className="mt-5 font-display text-ink text-xl sm:text-2xl">{demo.teaserTitle}</h2>
              <p className="mt-3 max-w-2xl text-ink-soft text-sm leading-relaxed">{demo.teaserBody}</p>
              <p className="mt-6 text-sm">
                <Link to="/challenges" className="text-seal hover:opacity-70">{demo.teaserLink}</Link>
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="line-card p-8 sm:p-10">
              <h2 className="font-display text-ink text-xl">{t(lang, 'forCompanies.priceHeading')}</h2>
              <p className="mt-3 text-ink-soft text-sm leading-relaxed max-w-2xl">
                {t(lang, 'forCompanies.priceBody')}
              </p>
              <p className="mt-4 text-ink-faint text-xs leading-relaxed max-w-2xl">
                {t(lang, 'forCompanies.priceNote')}
              </p>
              <div className="mt-8">
                <Link to="/login?mode=signup&role=company" className="btn-line no-underline">{t(lang, 'forCompanies.cta')}</Link>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}
