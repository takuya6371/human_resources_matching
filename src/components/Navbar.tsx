import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLang } from '../App'
import { useAuth } from '../context/AuthContext'
import { t } from '../i18n'

export default function Navbar() {
  const { lang, setLang } = useLang()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/')
    setMenuOpen(false)
  }

  return (
    <nav className="bg-dark border-b border-white/[0.06] sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 no-underline" onClick={() => setMenuOpen(false)}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #D85A30 0%, #1D9E75 100%)' }}>
            <span className="text-white font-bold text-xs">AT</span>
          </div>
          <span className="text-white font-medium text-lg tracking-tight">AfriTalent</span>
        </Link>

        {/* desktop nav links */}
        <div className="hidden md:flex items-center gap-7">
          <Link to="/talents" className="text-white/60 text-sm hover:text-white transition-colors no-underline">
            {t(lang, 'nav.talents')}
          </Link>
          <Link to="/contact" className="text-white/60 text-sm hover:text-white transition-colors no-underline">
            {t(lang, 'nav.contact')}
          </Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className="text-white/60 text-sm hover:text-white transition-colors no-underline">
              {t(lang, 'nav.admin')}
            </Link>
          )}
        </div>

        {/* right side */}
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
            <button onClick={() => setLang('fr')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${lang === 'fr' ? 'bg-white text-dark' : 'text-white/50 hover:text-white/80'}`}>
              FR
            </button>
          </div>

          {/* desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
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
              </>
            ) : (
              <Link to="/login" className="btn-primary text-sm no-underline">
                {t(lang, 'nav.signIn')}
              </Link>
            )}
          </div>

          {/* hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-1.5 cursor-pointer"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="menu"
          >
            <span className={`block w-5 h-px bg-white/60 transition-all duration-200 origin-center ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
            <span className={`block w-5 h-px bg-white/60 transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-px bg-white/60 transition-all duration-200 origin-center ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
          </button>
        </div>
      </div>

      {/* mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/[0.06] px-4 py-4 flex flex-col gap-3 bg-dark">
          <Link to="/talents" className="text-white/70 text-sm py-2 no-underline hover:text-white"
                onClick={() => setMenuOpen(false)}>
            {t(lang, 'nav.talents')}
          </Link>
          <Link to="/contact" className="text-white/70 text-sm py-2 no-underline hover:text-white"
                onClick={() => setMenuOpen(false)}>
            {t(lang, 'nav.contact')}
          </Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className="text-white/70 text-sm py-2 no-underline hover:text-white"
                  onClick={() => setMenuOpen(false)}>
              {t(lang, 'nav.admin')}
            </Link>
          )}
          <div className="pt-2 border-t border-white/[0.06]">
            {user ? (
              <div className="flex flex-col gap-3">
                <Link to="/dashboard"
                      className="flex items-center gap-2 py-2 no-underline"
                      onClick={() => setMenuOpen(false)}>
                  <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold"
                       style={{ background: user.avatarColor + '30', color: user.avatarColor }}>
                    {user.initials}
                  </div>
                  <span className="text-white/70 text-sm">{lang === 'ja' ? user.nameJa : user.nameEn}</span>
                </Link>
                <button onClick={handleLogout}
                        className="text-left text-white/40 text-sm hover:text-white/70 transition-colors cursor-pointer py-2">
                  {t(lang, 'dashboard.logout')}
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary text-sm no-underline inline-block"
                    onClick={() => setMenuOpen(false)}>
                {t(lang, 'nav.signIn')}
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
