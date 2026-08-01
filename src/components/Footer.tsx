import { useLang } from '../App'
import { t } from '../i18n'

export default function Footer() {
  const { lang } = useLang()
  return (
    <footer className="border-t border-hairline py-10 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center gap-3 sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="font-display uppercase tracking-wide text-ink text-sm">AfriTalent</span>
          <span className="text-ink-faint text-xs">·</span>
          <span className="text-ink-soft text-sm">{t(lang, 'footer.tagline')}</span>
        </div>
        <p className="text-ink-faint text-xs">{t(lang, 'footer.rights')}</p>
      </div>
    </footer>
  )
}
