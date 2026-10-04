import { useEffect } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { LayoutDashboard, Users, Sparkles, BarChart3, LogOut, Home, Flag, Building2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// CompanyReview/JobModerationは、企業承認・求人審査ワークフローが
// 現行プロダクトに存在しないため導入していない(要相談の上で見送り)。
const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/talents', label: 'Talent Review', icon: Users },
  { to: '/admin/matching', label: 'Matching Console', icon: Sparkles },
  { to: '/admin/moderation', label: 'Moderation', icon: Flag },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/team', label: 'Team', icon: Users },
  { to: '/admin/trusted', label: 'Partner Companies', icon: Building2 },
]

export default function AdminLayout() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate('/', { replace: true })
  }, [loading, user, isAdmin, navigate])

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  if (loading || !isAdmin) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-hairline border-t-ink" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl line-page">
      <aside className="hidden w-60 shrink-0 border-r border-hairline md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-hairline px-5">
          <span className="font-display uppercase tracking-wide text-ink text-sm">Admin</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                  isActive ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'
                }`
              }
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-hairline p-3">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 text-sm text-ink-soft hover:text-ink transition-colors">
            <Home className="h-4 w-4" /> Back to site
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-ink-soft hover:text-ink transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="flex gap-1 overflow-x-auto border-b border-hairline px-3 py-2 md:hidden">
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-1.5 border px-3 py-1.5 text-xs ${
                  isActive ? 'bg-ink text-paper border-ink' : 'border-hairline text-ink-soft'
                }`
              }
            >
              <n.icon className="h-3.5 w-3.5" /> {n.label}
            </NavLink>
          ))}
        </div>
        <Outlet />
      </div>
    </div>
  )
}
