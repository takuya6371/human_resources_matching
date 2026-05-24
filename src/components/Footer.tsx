import { useLang } from '../App'
import { t } from '../i18n'

export default function Footer() {
  const { lang } = useLang()
  return (
    <footer className="border-t border-white/[0.06] py-10 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center gap-3 sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #D85A30 0%, #1D9E75 100%)' }}>
            <span className="text-white font-bold text-[9px]">AT</span>
          </div>
          <span className="text-white/40 text-sm">{t(lang, 'footer.tagline')}</span>
        </div>
        <p className="text-white/30 text-xs">{t(lang, 'footer.rights')}</p>
      </div>
    </footer>
  )
}
