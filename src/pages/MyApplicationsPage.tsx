import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useLang } from '../App'
import { useAuth } from '../context/AuthContext'
import { t } from '../i18n'
import { supabase } from '../lib/supabase'
import { mapApplicationRow } from '../lib/jobMapper'
import type { Application, ApplicationStatus } from '../types'

const STATUS_COLOR: Record<ApplicationStatus, string> = {
  submitted: '#BA7517',
  reviewing: '#7F77DD',
  accepted: '#1D7E5C',
  rejected: '#A6332B',
  withdrawn: '#B7B2A1',
}

export default function MyApplicationsPage() {
  const { lang } = useLang()
  const { user, accountType, loading } = useAuth()
  const navigate = useNavigate()
  const [applications, setApplications] = useState<Application[]>([])
  const [fetching, setFetching] = useState(true)
  const [confirmWithdrawId, setConfirmWithdrawId] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && accountType !== 'talent') navigate('/')
  }, [loading, accountType, navigate])

  useEffect(() => {
    if (user) load()
  }, [user])

  async function load() {
    if (!user) return
    setFetching(true)
    const { data } = await supabase
      .from('applications')
      .select('*, jobs(*, companies(name, name_ja, logo_url))')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
    setApplications((data ?? []).map(mapApplicationRow))
    setFetching(false)
  }

  async function handleWithdraw(id: string) {
    if (confirmWithdrawId !== id) {
      setConfirmWithdrawId(id)
      return
    }
    await supabase.from('applications').update({ status: 'withdrawn' }).eq('id', id)
    setConfirmWithdrawId(null)
    await load()
  }

  if (loading || accountType !== 'talent') return null

  return (
    <div className="min-h-screen line-page flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10">
        <h1 className="font-display font-medium text-ink text-3xl tracking-wide mb-2">
          {t(lang, 'jobs.myApplicationsHeading')}
        </h1>
        <p className="text-ink-soft text-sm mb-8">{t(lang, 'jobs.myApplicationsSub')}</p>

        {fetching ? (
          <p className="text-ink-faint text-sm">···</p>
        ) : applications.length === 0 ? (
          <div className="line-card p-10 text-center">
            <p className="text-ink-faint text-sm mb-4">{t(lang, 'jobs.myApplicationsEmpty')}</p>
            <Link to="/jobs" className="btn-line no-underline inline-block">
              {t(lang, 'nav.jobs')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map(app => {
              const job = app.job
              const companyName = job ? ((lang === 'ja' && job.companyNameJa) ? job.companyNameJa : job.companyName) : ''
              return (
                <div key={app.id} className="line-card p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {job && (
                          <Link to={`/jobs/${job.id}`} className="text-ink font-medium no-underline hover:text-seal transition-colors">
                            {lang === 'ja' ? job.titleJa : job.titleEn}
                          </Link>
                        )}
                        <span className="text-xs font-medium uppercase tracking-wide pb-[2px]"
                              style={{ color: STATUS_COLOR[app.status], borderBottom: `1.5px solid ${STATUS_COLOR[app.status]}` }}>
                          {t(lang, `jobs.status${app.status.charAt(0).toUpperCase()}${app.status.slice(1)}`)}
                        </span>
                      </div>
                      <p className="text-ink-faint text-xs">
                        {companyName} · {new Date(app.createdAt).toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-US')}
                      </p>
                    </div>
                    {(app.status === 'submitted' || app.status === 'reviewing') && (
                      <button onClick={() => handleWithdraw(app.id)}
                              className={`text-xs whitespace-nowrap transition-colors cursor-pointer ${confirmWithdrawId === app.id ? 'text-seal font-medium' : 'text-ink-faint hover:text-seal'}`}>
                        {confirmWithdrawId === app.id ? t(lang, 'jobs.withdrawConfirm') : t(lang, 'jobs.withdrawBtn')}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
