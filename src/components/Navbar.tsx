import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, MessageSquare, ChevronDown } from 'lucide-react'
import { useLang } from '../App'
import { useAuth } from '../context/AuthContext'
import { t, pick } from '../i18n'
import { supabase } from '../lib/supabase'
import type { Lang } from '../types'

// バーに常時出すのは主要導線だけに絞っている。以前は未ログインで6本、
// 人材ログイン時は8本を md:(768px) から横一列に並べており、1344px でも
// 「人材一/覧」「テス/ト太/郎」のように語中で折り返していた。
// 二次的な導線（保存済み・応募状況・求人管理・管理・お問い合わせ・言語）は
// アカウントメニューへ送り、メッセージと通知はアイコンにした。
const LINK_CLS = 'text-ink-soft text-sm hover:text-ink transition-colors no-underline whitespace-nowrap'
const MENU_ITEM_CLS = 'block px-4 py-2.5 text-sm text-ink-soft hover:text-ink hover:bg-paper no-underline whitespace-nowrap text-left w-full'

const LANG_LABEL: Record<Lang, string> = { ja: '日本語', en: 'English', fr: 'Français' }

export default function Navbar() {
  const { lang, setLang } = useLang()
  const { user, company, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const accountRef = useRef<HTMLDivElement>(null)
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

  // メニュー外のクリックと Esc で閉じる。開きっぱなしは誤操作のもと。
  // Esc はハンバーガー側にも効かせる（開いたまま戻れないと詰む）。
  useEffect(() => {
    if (!accountOpen && !menuOpen) return
    function onDown(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setAccountOpen(false); setMenuOpen(false) }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [accountOpen, menuOpen])

  const isAdmin = user?.role === 'admin'
  const loggedIn = Boolean(user || company)
  const companyInitial = company?.name ? company.name.slice(0, 2).toUpperCase() : '??'
  const accountLabel = isAdmin ? t(lang, 'nav.admin') : user ? (pick(lang, user.nameJa, user.nameEn)) : company?.name
  const userLink = isAdmin ? '/admin' : '/dashboard'

  async function handleLogout() {
    await logout()
    navigate('/')
    setMenuOpen(false)
    setAccountOpen(false)
  }

  function closeAll() { setMenuOpen(false); setAccountOpen(false) }

  // バーに出す主要導線。未ログインは獲得動線、ログイン後は使う画面。
  const primary: { to: string; label: string }[] = [
    { to: '/talents', label: t(lang, 'nav.talents') },
    { to: '/jobs', label: t(lang, 'nav.jobs') },
    { to: '/connect', label: t(lang, 'nav.connect') },
    ...(user ? [{ to: '/board', label: t(lang, 'nav.board') }] : []),
    ...(!loggedIn ? [
      { to: '/for-companies', label: t(lang, 'nav.companies') },
      { to: '/how-it-works', label: t(lang, 'nav.howItWorks') },
      // 未ログインではアカウントメニューが無いので、問い合わせはバーに残す。
      // 企業からの連絡はここが入口になる。
      { to: '/contact', label: t(lang, 'nav.contact') },
    ] : []),
  ]

  // アカウントメニューに送る二次的な導線。
  const secondary: { to: string; label: string }[] = [
    { to: userLink, label: isAdmin ? t(lang, 'nav.admin') : t(lang, 'nav.dashboard') },
    ...(loggedIn ? [{ to: '/saved', label: t(lang, 'nav.saved') }] : []),
    ...(user && user.role === 'talent' ? [{ to: '/applications', label: t(lang, 'nav.myApplications') }] : []),
    ...(company ? [{ to: '/company/jobs', label: t(lang, 'nav.manageJobs') }] : []),
    { to: '/contact', label: t(lang, 'nav.contact') },
  ]

  const avatar = user
    ? (!isAdmin && user.avatarUrl
        ? <img src={user.avatarUrl} alt="" className="avatar-line w-7 h-7" />
        : <div className="avatar-line w-7 h-7 text-[10px]" style={isAdmin ? { color: '#A6332B' } : undefined}>
            {isAdmin ? '✦' : user.initials}
          </div>)
    : (company?.logoUrl
        ? <img src={company.logoUrl} alt="" className="avatar-line w-7 h-7" />
        : <div className="avatar-line w-7 h-7 text-[10px]">{companyInitial}</div>)

  return (
    <nav className="line-page border-b border-hairline sticky top-0 z-50 backdrop-blur-sm" style={{ backgroundColor: 'rgba(250,248,244,0.92)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">

        <Link to="/" className="flex items-center no-underline shrink-0" onClick={closeAll}>
          <span className="font-display font-medium text-lg text-ink tracking-wide uppercase whitespace-nowrap">
            NeBonga Link
          </span>
        </Link>

        {/* 主要導線。1024px 未満はハンバーガーへ畳む */}
        <div className="hidden lg:flex items-center gap-7 min-w-0">
          {primary.map(l => (
            <Link key={l.to} to={l.to} className={LINK_CLS}>{l.label}</Link>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {loggedIn && (
            <>
              <Link to="/messages" className="relative text-ink-soft hover:text-ink transition-colors p-1"
                    aria-label={t(lang, 'nav.messages')}>
                <MessageSquare className="w-5 h-5" />
                {unreadMessages > 0 && <span className="absolute top-0 right-0 h-2 w-2 bg-seal" />}
              </Link>
              <Link to="/notifications" className="relative text-ink-soft hover:text-ink transition-colors p-1"
                    aria-label={t(lang, 'nav.notifications')}>
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-seal text-paper text-[9px] font-semibold leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            </>
          )}

          {/* アカウントメニュー。未ログインでも言語切替の受け皿として使う */}
          <div className="relative" ref={accountRef}>
            {loggedIn ? (
              <button onClick={() => setAccountOpen(o => !o)}
                      className="hidden lg:flex items-center gap-2 pl-1.5 pr-2 py-1 border border-hairline hover:border-ink transition-colors cursor-pointer max-w-[12rem]">
                {avatar}
                <span className="text-ink text-sm truncate">{accountLabel}</span>
                <ChevronDown className="w-3.5 h-3.5 text-ink-faint shrink-0" />
              </button>
            ) : (
              <div className="hidden lg:flex items-center gap-3">
                <button onClick={() => setAccountOpen(o => !o)}
                        className="flex items-center gap-1 px-2 py-1.5 border border-hairline hover:border-ink transition-colors cursor-pointer text-ink-soft text-xs whitespace-nowrap">
                  {lang.toUpperCase()}
                  <ChevronDown className="w-3 h-3" />
                </button>
                <Link to="/login" className="btn-line no-underline whitespace-nowrap">{t(lang, 'nav.signIn')}</Link>
              </div>
            )}

            {accountOpen && (
              <div className="absolute right-0 top-full mt-2 min-w-[13rem] border border-hairline line-page shadow-sm z-50">
                {loggedIn && (
                  <>
                    {secondary.map(l => (
                      <Link key={l.to} to={l.to} className={MENU_ITEM_CLS} onClick={closeAll}>{l.label}</Link>
                    ))}
                    <div className="border-t border-hairline" />
                  </>
                )}

                <p className="px-4 pt-3 pb-1 text-ink-faint text-[10px] uppercase tracking-widest">
                  {t(lang, 'nav.language')}
                </p>
                {(['ja', 'en', 'fr'] as Lang[]).map(l => (
                  <button key={l} onClick={() => { setLang(l); setAccountOpen(false) }}
                          className={`${MENU_ITEM_CLS} cursor-pointer ${lang === l ? 'text-ink font-medium' : ''}`}>
                    {LANG_LABEL[l]}
                  </button>
                ))}

                {loggedIn && (
                  <>
                    <div className="border-t border-hairline" />
                    <button onClick={handleLogout} className={`${MENU_ITEM_CLS} cursor-pointer`}>
                      {t(lang, 'dashboard.logout')}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            className="lg:hidden flex flex-col gap-1.5 p-1.5 cursor-pointer"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="menu"
            aria-expanded={menuOpen}
          >
            <span className={`block w-5 h-px bg-ink transition-all duration-200 origin-center ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
            <span className={`block w-5 h-px bg-ink transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-px bg-ink transition-all duration-200 origin-center ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 1024px 未満。バーに出していない項目もここには全部出す */}
      {menuOpen && (
        <div className="lg:hidden border-t border-hairline px-4 sm:px-6 py-3 flex flex-col line-page max-h-[calc(100vh-4rem)] overflow-y-auto">
          {loggedIn && (
            <Link to={userLink} onClick={closeAll}
                  className="flex items-center gap-2.5 py-3 no-underline border-b border-hairline mb-2">
              {avatar}
              <span className="text-ink text-sm truncate">{accountLabel}</span>
            </Link>
          )}

          {primary.map(l => (
            <Link key={l.to} to={l.to} className={`${LINK_CLS} py-2.5`} onClick={closeAll}>{l.label}</Link>
          ))}
          {loggedIn && secondary.filter(l => l.to !== userLink).map(l => (
            <Link key={l.to} to={l.to} className={`${LINK_CLS} py-2.5`} onClick={closeAll}>{l.label}</Link>
          ))}
          {!loggedIn && (
            <Link to="/contact" className={`${LINK_CLS} py-2.5`} onClick={closeAll}>{t(lang, 'nav.contact')}</Link>
          )}

          <div className="flex items-center border border-hairline w-fit mt-3">
            {(['ja', 'en', 'fr'] as Lang[]).map((l, i) => (
              <button key={l} onClick={() => setLang(l)}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer
                                  ${i > 0 ? 'border-l border-hairline' : ''}
                                  ${lang === l ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'}`}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-hairline">
            {loggedIn ? (
              <button onClick={handleLogout} className="text-ink-soft text-sm hover:text-ink cursor-pointer py-1">
                {t(lang, 'dashboard.logout')}
              </button>
            ) : (
              <Link to="/login" className="btn-line no-underline inline-block" onClick={closeAll}>
                {t(lang, 'nav.signIn')}
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
