import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Building2, Briefcase, FileText, ArrowRight } from 'lucide-react'
import { useLang } from '../../App'
import { t } from '../../i18n'
import { supabase } from '../../lib/supabase'

interface Stats {
  talents: number
  pendingTalents: number
  companies: number
  jobs: number
  openJobs: number
  applications: number
  accepted: number
}

async function count(table: string, filter?: [string, string]) {
  let query = supabase.from(table).select('*', { count: 'exact', head: true })
  if (filter) query = query.eq(filter[0], filter[1])
  const { count: n } = await query
  return n ?? 0
}

export default function AdminHomePage() {
  const { lang } = useLang()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    Promise.all([
      count('profiles'),
      count('profiles', ['status', 'pending']),
      count('companies'),
      count('jobs'),
      count('jobs', ['status', 'open']),
      count('applications'),
      count('applications', ['status', 'accepted']),
    ]).then(([talents, pendingTalents, companies, jobs, openJobs, applications, accepted]) => {
      setStats({ talents, pendingTalents, companies, jobs, openJobs, applications, accepted })
    })
  }, [])

  if (!stats) return <div className="px-6 py-8 lg:px-8 text-ink-faint text-sm">···</div>

  const cards = [
    { icon: Users, label: t(lang, 'adminHome.talents'), total: stats.talents, sub: `${stats.pendingTalents} ${t(lang, 'adminHome.pendingReview')}`, link: '/admin/talents' },
    { icon: Building2, label: t(lang, 'adminHome.companies'), total: stats.companies, sub: '', link: '/company/jobs' },
    { icon: Briefcase, label: t(lang, 'adminHome.jobs'), total: stats.jobs, sub: `${stats.openJobs} ${t(lang, 'adminHome.open')}`, link: '/jobs' },
    { icon: FileText, label: t(lang, 'adminHome.applications'), total: stats.applications, sub: `${stats.accepted} ${t(lang, 'adminHome.accepted')}`, link: '/admin/analytics' },
  ]

  return (
    <div className="px-6 py-8 lg:px-8">
      <h1 className="font-display font-medium text-ink text-2xl tracking-wide">{t(lang, 'adminHome.title')}</h1>
      <p className="text-ink-soft text-sm mt-1">{t(lang, 'adminHome.subtitle')}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(c => (
          <Link key={c.label} to={c.link} className="line-card p-5 no-underline group transition-colors hover:border-ink">
            <c.icon className="h-5 w-5 text-ink-faint" />
            <p className="mt-3 font-display text-3xl text-ink">{c.total}</p>
            <p className="text-sm text-ink font-medium">{c.label}</p>
            {c.sub && <p className="mt-1 text-xs text-ink-faint">{c.sub}</p>}
            <span className="mt-3 inline-flex items-center gap-1 text-xs text-ink-soft group-hover:text-seal transition-colors">
              {t(lang, 'adminHome.manage')} <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
