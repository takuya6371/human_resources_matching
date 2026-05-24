import { Link, useNavigate } from 'react-router-dom'
import { useLang } from '../App'
import { useAuth } from '../context/AuthContext'
import { t } from '../i18n'

export default function Navbar() {
  const { lang, setLang } = useLang()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-dark border-b border-white/[0.06] sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #D85A30 0%, #1D9E75 100%)' }}>
            <span className="text-white font-bold text-xs">AT</span>
          </div>
          <span className="text-white font-medium text-lg tracking-tight">AfriTalent</span>
        </Link>

        <div className="flex items-center gap-7">
          <Link to="/talents" className="text-white/60 text-sm hover:text-white transition-colors no-underline">
            {t(lang, 'nav.talents')}
          </Link>
          <a href="#" className="text-white/60 text-sm hover:text-white transition-colors no-underline">
            {t(lang, 'nav.companies')}
          </a>
          <a href="#" className="text-white/60 text-sm hover:text-white transition-colors no-underline">
            {t(lang, 'nav.about')}
          </a>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-dark-3 rounded-lg p-0.5 border border-white/[0.08]">
            <button onClick={() => setLang('ja')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${lang === 'ja' ? 'bg-white text-dark' : 'text-white/50 hover:text-white/80'}`}>
              JA
            </button>
            <button onClick={() => setLang('en')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${lang === 'en' ? 'bg-white text-dark' : 'text-white/50 hover:text-white/80'}`}>
              EN
            </button>
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg no-underline transition-colors hover:bg-dark-3"
                    style={{ border: '0.5px solid rgba(255,255,255,0.08)' }}>
                <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold"
                     style={{ background: user.avatarColor + '30', color: user.avatarColor }}>
                  {user.initials}
                </div>
                <span className="text-white/70 text-sm">{lang === 'ja' ? user.nameJa : user.nameEn}</span>
              </Link>
              <button onClick={handleLogout}
                      className="text-white/40 text-sm hover:text-white/70 transition-colors cursor-pointer">
                {t(lang, 'dashboard.logout')}
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary text-sm no-underline">
              {t(lang, 'nav.signIn')}
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
