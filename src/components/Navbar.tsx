import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useLang } from '../App'
import { useAuth } from '../context/AuthContext'
import { t } from '../i18n'
import { supabase } from '../lib/supabase'

export default function Navbar() {
  const { lang, setLang } = useLang()
  const { user, company, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const selfId = user?.id ?? company?.id ?? null

  useEffect(() => {
    if (!selfId) { setUnreadCount(0); return }

    async function refresh() {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', selfId)
        .eq('read', false)
      setUnreadCount(count ?? 0)
    }
    refresh()

    const channel = supabase
      .channel(`navbar-notifications-${selfId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${selfId}` }, refresh)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selfId])

  useEffect(() => {
    if (!selfId) { setUnreadMessages(0); return }

    async function refresh() {
      const { data: myThreads } = await supabase
        .from('threads')
        .select('id')
        .or(`talent_id.eq.${selfId},company_id.eq.${selfId}`)
      const ids = (myThreads ?? []).map(th => th.id)
      if (ids.length === 0) { setUnreadMessages(0); return }
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('thread_id', ids)
        .eq('read', false)
        .or(`from_user_id.is.null,from_user_id.neq.${selfId}`)
      setUnreadMessages(count ?? 0)
    }
    refresh()

    const channel = supabase
      .channel(`navbar-messages-${selfId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, refresh)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selfId])

  const isAdmin = user?.role === 'admin'
  const companyInitial = company?.name ? company.name.slice(0, 2).toUpperCase() : '??'
  const accountLabel = isAdmin ? t(lang, 'nav.admin') : user ? (lang === 'ja' ? user.nameJa : user.nameEn) : company?.name
  const userLink = isAdmin ? '/admin' : '/dashboard'

  async function handleLogout() {
    await logout()
    navigate('/')
    setMenuOpen(false)
  }

  return (
    <nav className="line-page border-b border-hairline sticky top-0 z-50 backdrop-blur-sm" style={{ backgroundColor: 'rgba(250,248,244,0.92)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 no-underline" onClick={() => setMenuOpen(false)}>
          <span className="font-display font-medium text-lg text-ink tracking-wide uppercase">AfriTalent</span>
        </Link>

        {/* desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/talents" className="text-ink-soft text-sm hover:text-ink transition-colors no-underline">
            {t(lang, 'nav.talents')}
          </Link>
          <Link to="/jobs" className="text-ink-soft text-sm hover:text-ink transition-colors no-underline">
            {t(lang, 'nav.jobs')}
          </Link>
          <Link to="/connect" className="text-ink-soft text-sm hover:text-ink transition-colors no-underline">
            {t(lang, 'nav.connect')}
          </Link>
          {(user || company) && (
            <Link to="/saved" className="text-ink-soft text-sm hover:text-ink transition-colors no-underline">
              {t(lang, 'nav.saved')}
            </Link>
          )}
          {(user || company) && (
            <Link to="/messages" className="text-ink-soft text-sm hover:text-ink transition-colors no-underline inline-flex items-center gap-1.5">
              {t(lang, 'nav.messages')}
              {unreadMessages > 0 && <span className="h-1.5 w-1.5 bg-seal" />}
            </Link>
          )}
          {user && user.role === 'talent' && (
            <Link to="/applications" className="text-ink-soft text-sm hover:text-ink transition-colors no-underline">
              {t(lang, 'nav.myApplications')}
            </Link>
          )}
          {company && (
            <Link to="/company/jobs" className="text-ink-soft text-sm hover:text-ink transition-colors no-underline">
              {t(lang, 'nav.manageJobs')}
            </Link>
          )}
          <Link to="/contact" className="text-ink-soft text-sm hover:text-ink transition-colors no-underline">
            {t(lang, 'nav.contact')}
          </Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className="text-ink-soft text-sm hover:text-ink transition-colors no-underline">
              {t(lang, 'nav.admin')}
            </Link>
          )}
        </div>

        {/* right side */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center border border-hairline">
            <button onClick={() => setLang('ja')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${lang === 'ja' ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'}`}>
              JA
            </button>
            <button onClick={() => setLang('en')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer border-l border-hairline ${lang === 'en' ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'}`}>
              EN
            </button>
            <button onClick={() => setLang('fr')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer border-l border-hairline ${lang === 'fr' ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'}`}>
              FR
            </button>
          </div>

          {(user || company) && (
            <Link to="/notifications" className="relative text-ink-soft hover:text-ink transition-colors" aria-label="Notifications">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-seal text-paper text-[9px] font-semibold leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* desktop auth */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link to={userLink}
                      className="flex items-center gap-2 px-3 py-1.5 no-underline transition-colors border border-hairline hover:border-ink">
                  {!isAdmin && user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="avatar-line w-6 h-6" />
                  ) : (
                    <div className="avatar-line w-6 h-6 text-[10px]"
                         style={isAdmin ? { color: '#A6332B' } : undefined}>
                      {isAdmin ? '✦' : user.initials}
                    </div>
                  )}
                  <span className="text-ink text-sm">{accountLabel}</span>
                </Link>
                <button onClick={handleLogout}
                        className="text-ink-soft text-sm hover:text-ink transition-colors cursor-pointer">
                  {t(lang, 'dashboard.logout')}
                </button>
              </>
            ) : company ? (
              <>
                <Link to="/dashboard"
                      className="flex items-center gap-2 px-3 py-1.5 no-underline transition-colors border border-hairline hover:border-ink">
                  {company?.logoUrl ? (
                    <img src={company.logoUrl} alt="" className="avatar-line w-6 h-6" />
                  ) : (
                    <div className="avatar-line w-6 h-6 text-[10px]">
                      {companyInitial}
                    </div>
                  )}
                  <span className="text-ink text-sm">{accountLabel}</span>
                </Link>
                <button onClick={handleLogout}
                        className="text-ink-soft text-sm hover:text-ink transition-colors cursor-pointer">
                  {t(lang, 'dashboard.logout')}
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-line no-underline">
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
            <span className={`block w-5 h-px bg-ink transition-all duration-200 origin-center ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
            <span className={`block w-5 h-px bg-ink transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-px bg-ink transition-all duration-200 origin-center ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
          </button>
        </div>
      </div>

      {/* mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-hairline px-4 py-4 flex flex-col gap-3 line-page">
          <Link to="/talents" className="text-ink-soft text-sm py-2 no-underline hover:text-ink"
                onClick={() => setMenuOpen(false)}>
            {t(lang, 'nav.talents')}
          </Link>
          <Link to="/jobs" className="text-ink-soft text-sm py-2 no-underline hover:text-ink"
                onClick={() => setMenuOpen(false)}>
            {t(lang, 'nav.jobs')}
          </Link>
          <Link to="/connect" className="text-ink-soft text-sm py-2 no-underline hover:text-ink"
                onClick={() => setMenuOpen(false)}>
            {t(lang, 'nav.connect')}
          </Link>
          {(user || company) && (
            <Link to="/saved" className="text-ink-soft text-sm py-2 no-underline hover:text-ink"
                  onClick={() => setMenuOpen(false)}>
              {t(lang, 'nav.saved')}
            </Link>
          )}
          {(user || company) && (
            <Link to="/messages" className="text-ink-soft text-sm py-2 no-underline hover:text-ink flex items-center gap-2"
                  onClick={() => setMenuOpen(false)}>
              {t(lang, 'nav.messages')}
              {unreadMessages > 0 && <span className="h-2 w-2 bg-seal" />}
            </Link>
          )}
          {user && user.role === 'talent' && (
            <Link to="/applications" className="text-ink-soft text-sm py-2 no-underline hover:text-ink"
                  onClick={() => setMenuOpen(false)}>
              {t(lang, 'nav.myApplications')}
            </Link>
          )}
          {company && (
            <Link to="/company/jobs" className="text-ink-soft text-sm py-2 no-underline hover:text-ink"
                  onClick={() => setMenuOpen(false)}>
              {t(lang, 'nav.manageJobs')}
            </Link>
          )}
          <Link to="/contact" className="text-ink-soft text-sm py-2 no-underline hover:text-ink"
                onClick={() => setMenuOpen(false)}>
            {t(lang, 'nav.contact')}
          </Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className="text-ink-soft text-sm py-2 no-underline hover:text-ink"
                  onClick={() => setMenuOpen(false)}>
              {t(lang, 'nav.admin')}
            </Link>
          )}
          <div className="flex items-center gap-2 sm:hidden">
            {(['ja', 'en', 'fr'] as const).map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={`px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${lang === l ? 'bg-ink text-paper border-ink' : 'border-hairline text-ink-soft'}`}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="pt-2 border-t border-hairline">
            {user ? (
              <div className="flex flex-col gap-3">
                <Link to={userLink}
                      className="flex items-center gap-2 py-2 no-underline"
                      onClick={() => setMenuOpen(false)}>
                  {!isAdmin && user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="avatar-line w-6 h-6" />
                  ) : (
                    <div className="avatar-line w-6 h-6 text-[10px]"
                         style={isAdmin ? { color: '#A6332B' } : undefined}>
                      {isAdmin ? '✦' : user.initials}
                    </div>
                  )}
                  <span className="text-ink text-sm">{accountLabel}</span>
                </Link>
                <button onClick={handleLogout}
                        className="text-left text-ink-soft text-sm hover:text-ink transition-colors cursor-pointer py-2">
                  {t(lang, 'dashboard.logout')}
                </button>
              </div>
            ) : company ? (
              <div className="flex flex-col gap-3">
                <Link to="/dashboard"
                      className="flex items-center gap-2 py-2 no-underline"
                      onClick={() => setMenuOpen(false)}>
                  {company?.logoUrl ? (
                    <img src={company.logoUrl} alt="" className="avatar-line w-6 h-6" />
                  ) : (
                    <div className="avatar-line w-6 h-6 text-[10px]">
                      {companyInitial}
                    </div>
                  )}
                  <span className="text-ink text-sm">{accountLabel}</span>
                </Link>
                <button onClick={handleLogout}
                        className="text-left text-ink-soft text-sm hover:text-ink transition-colors cursor-pointer py-2">
                  {t(lang, 'dashboard.logout')}
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-line no-underline"
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
