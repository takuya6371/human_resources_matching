import { useEffect, useState } from 'react'
import { useLang } from '../../App'
import { t } from '../../i18n'
import { supabase } from '../../lib/supabase'
import type { ApplicationStatus } from '../../types'

const STATUSES: ApplicationStatus[] = ['submitted', 'reviewing', 'accepted', 'rejected', 'withdrawn']

const STATUS_COLOR: Record<ApplicationStatus, string> = {
  submitted: '#8A8577',
  reviewing: '#BA7517',
  accepted: '#1D7E5C',
  rejected: '#A6332B',
  withdrawn: '#B7B2A1',
}

export default function AdminAnalyticsPage() {
  const { lang } = useLang()
  const [counts, setCounts] = useState<Record<ApplicationStatus, number> | null>(null)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    supabase.from('applications').select('status').then(({ data }) => {
      const rows = data ?? []
      const c = { submitted: 0, reviewing: 0, accepted: 0, rejected: 0, withdrawn: 0 } as Record<ApplicationStatus, number>
      for (const row of rows) {
        const s = row.status as ApplicationStatus
        if (s in c) c[s]++
      }
      setCounts(c)
      setTotal(rows.length)
    })
  }, [])

  if (!counts) return <div className="px-6 py-8 lg:px-8 text-ink-faint text-sm">···</div>

  const acceptedRate = total ? Math.round((counts.accepted / total) * 100) : 0
  const reviewingRate = total ? Math.round((counts.reviewing / total) * 100) : 0

  return (
    <div className="px-6 py-8 lg:px-8">
      <h1 className="font-display font-medium text-ink text-2xl tracking-wide">{t(lang, 'adminAnalytics.title')}</h1>
      <p className="text-ink-soft text-sm mt-1">{t(lang, 'adminAnalytics.subtitle')}</p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="line-card p-5">
          <p className="font-display text-3xl text-ink">{total}</p>
          <p className="text-ink-soft text-sm mt-1">{t(lang, 'adminAnalytics.totalApplications')}</p>
        </div>
        <div className="line-card p-5">
          <p className="font-display text-3xl text-ink">{acceptedRate}%</p>
          <p className="text-ink-soft text-sm mt-1">{t(lang, 'adminAnalytics.acceptedRate')}</p>
        </div>
        <div className="line-card p-5">
          <p className="font-display text-3xl text-ink">{reviewingRate}%</p>
          <p className="text-ink-soft text-sm mt-1">{t(lang, 'adminAnalytics.reviewingRate')}</p>
        </div>
      </div>

      <section className="line-card p-6 mt-5">
        <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-5">
          {t(lang, 'adminAnalytics.byStatus')}
        </h2>
        <div className="space-y-4">
          {STATUSES.map(s => {
            const n = counts[s]
            const pct = total ? Math.round((n / total) * 100) : 0
            return (
              <div key={s}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-ink-soft">{t(lang, `adminAnalytics.status_${s}`)}</span>
                  <span className="text-ink-faint text-xs">{n} · {pct}%</span>
                </div>
                <div className="h-1.5 bg-hairline w-full">
                  <div className="h-1.5" style={{ width: `${pct}%`, backgroundColor: STATUS_COLOR[s] }} />
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
