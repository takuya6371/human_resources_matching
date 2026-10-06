import { Link } from 'react-router-dom'
import { useLang } from '../App'
import { t } from '../i18n'

export default function Footer() {
  const { lang } = useLang()
  return (
    <footer className="border-t border-hairline py-10 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center gap-3 sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="font-display uppercase tracking-wide text-ink text-sm">NeBonga Link</span>
          <span className="text-ink-faint text-xs">·</span>
          <span className="text-ink-soft text-sm">{t(lang, 'footer.tagline')}</span>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link to="/about" className="text-ink-soft text-xs hover:text-ink">{t(lang, 'nav.about')}</Link>
            <Link to="/how-it-works" className="text-ink-soft text-xs hover:text-ink">{t(lang, 'nav.howItWorks')}</Link>
            <Link to="/terms" className="text-ink-soft text-xs hover:text-ink">{t(lang, 'legal.terms')}</Link>
            <Link to="/privacy" className="text-ink-soft text-xs hover:text-ink">{t(lang, 'legal.privacy')}</Link>
          </div>
          <p className="text-ink-faint text-xs">{t(lang, 'footer.rights')}</p>
        </div>
      </div>
    </footer>
  )
}
