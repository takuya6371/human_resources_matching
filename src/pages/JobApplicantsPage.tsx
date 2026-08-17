import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useLang } from '../App'
import { useAuth } from '../context/AuthContext'
import { t } from '../i18n'
import { supabase } from '../lib/supabase'
import { mapJobRow, mapApplicationRow, jobTitle } from '../lib/jobMapper'
import type { Job, Application, ApplicationStatus } from '../types'

const STATUS_COLOR: Record<ApplicationStatus, string> = {
  submitted: '#BA7517',
  reviewing: '#7F77DD',
  accepted: '#1D7E5C',
  rejected: '#A6332B',
  withdrawn: '#B7B2A1',
}

const UPDATABLE_STATUSES: ApplicationStatus[] = ['reviewing', 'accepted', 'rejected']

export default function JobApplicantsPage() {
  const { id } = useParams<{ id: string }>()
  const { lang } = useLang()
  const { company, accountType, loading } = useAuth()
  const navigate = useNavigate()
  const [job, setJob] = useState<Job | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [fetching, setFetching] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && accountType !== 'company') navigate('/')
  }, [loading, accountType, navigate])

  useEffect(() => {
    if (company && id) load()
  }, [company, id])

  async function load() {
    if (!id) return
    setFetching(true)
    const [{ data: jobRow }, { data: appRows }] = await Promise.all([
      supabase.from('jobs').select('*').eq('id', id).single(),
      supabase.from('applications').select('*, profiles(name_en, name_ja, avatar_url, field, field_ja, japanese_level)').eq('job_id', id).order('created_at', { ascending: false }),
    ])
    setJob(jobRow ? mapJobRow(jobRow) : null)
    setApplications((appRows ?? []).map(mapApplicationRow))
    setFetching(false)
  }

  async function updateStatus(appId: string, status: ApplicationStatus) {
    setUpdatingId(appId)
    await supabase.from('applications').update({ status }).eq('id', appId)
    await load()
    setUpdatingId(null)
  }

  if (loading || accountType !== 'company') return null

  return (
    <div className="min-h-screen line-page flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10">
        <Link to="/company/jobs" className="text-ink-faint text-sm hover:text-ink transition-colors no-underline">
          {t(lang, 'jobs.backToManage')}
        </Link>

        <h1 className="font-display font-medium text-ink text-3xl tracking-wide mt-3 mb-1">
          {t(lang, 'jobs.applicantsHeading')}
        </h1>
        {job && (
          <p className="text-ink-soft text-sm mb-8">{jobTitle(job, lang)}</p>
        )}

        {fetching ? (
          <p className="text-ink-faint text-sm">···</p>
        ) : applications.length === 0 ? (
          <div className="line-card p-10 text-center">
            <p className="text-ink-faint text-sm">{t(lang, 'jobs.noApplicants')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map(app => (
              <div key={app.id} className="line-card p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-ink font-medium">{app.talentNameEn}</span>
                      <span className="text-ink-soft text-sm">{app.talentNameJa}</span>
                      <span className="text-xs font-medium uppercase tracking-wide pb-[2px]"
                            style={{ color: STATUS_COLOR[app.status], borderBottom: `1.5px solid ${STATUS_COLOR[app.status]}` }}>
                        {t(lang, `jobs.status${app.status.charAt(0).toUpperCase()}${app.status.slice(1)}`)}
                      </span>
                    </div>
                    <p className="text-ink-faint text-xs mb-2">
                      {new Date(app.createdAt).toLocaleString(lang === 'ja' ? 'ja-JP' : 'en-US')}
                    </p>
                    {app.coverMessage && (
                      <p className="text-ink-soft text-sm leading-relaxed whitespace-pre-wrap">{app.coverMessage}</p>
                    )}
                  </div>
                  <Link to={`/talent/${app.profileId}`} target="_blank" className="btn-line-ghost no-underline whitespace-nowrap">
                    {t(lang, 'jobs.viewApplicantProfile')}
                  </Link>
                </div>

                {app.status !== 'withdrawn' && (
                  <div className="mt-4 pt-4 border-t border-hairline flex items-center gap-2 flex-wrap">
                    <span className="text-ink-faint text-xs uppercase tracking-wider">{t(lang, 'jobs.updateStatusLabel')}</span>
                    {UPDATABLE_STATUSES.map(s => (
                      <button key={s} onClick={() => updateStatus(app.id, s)}
                              disabled={updatingId === app.id || app.status === s}
                              className={`px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer border disabled:opacity-40 disabled:cursor-default ${
                                app.status === s ? 'bg-ink text-paper border-ink' : 'border-hairline text-ink-soft hover:border-ink hover:text-ink'
                              }`}>
                        {t(lang, `jobs.status${s.charAt(0).toUpperCase()}${s.slice(1)}`)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
