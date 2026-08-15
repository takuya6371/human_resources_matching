import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useLang } from '../App'
import { useAuth } from '../context/AuthContext'
import { t } from '../i18n'
import { supabase } from '../lib/supabase'
import { mapJobRow } from '../lib/jobMapper'
import { FIELDS_JA, COMPENSATION_LABEL_KEY } from '../lib/constants'
import type { Job, ApplicationStatus } from '../types'

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { lang } = useLang()
  const { user, accountType } = useAuth()

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus | null>(null)
  const [coverMessage, setCoverMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [applyError, setApplyError] = useState('')

  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('jobs')
        .select('*, companies(name, name_ja, logo_url)')
        .eq('id', id)
        .single()
      if (cancelled) return
      if (!data) { setNotFound(true); setLoading(false); return }
      setJob(mapJobRow(data))
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    if (!id || !user) return
    let cancelled = false
    async function loadApplication() {
      const { data } = await supabase.from('applications').select('status').eq('job_id', id).eq('profile_id', user!.id).maybeSingle()
      if (!cancelled) setApplicationStatus(data?.status ?? null)
    }
    loadApplication()
    return () => { cancelled = true }
  }, [id, user])

  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !id) return
    setSubmitting(true)
    setApplyError('')
    const { error } = await supabase.from('applications').insert({
      job_id: id,
      profile_id: user.id,
      cover_message: coverMessage.trim(),
    })
    if (error) {
      setApplyError(error.message)
      setSubmitting(false)
      return
    }
    setApplicationStatus('submitted')
    setSubmitting(false)
  }

  if (loading) {
    return <div className="min-h-screen line-page" />
  }

  if (notFound || !job) {
    return (
      <div className="min-h-screen line-page flex items-center justify-center">
        <div className="text-center">
          <p className="text-ink-soft text-lg mb-4">{t(lang, 'jobs.notFound')}</p>
          <Link to="/jobs" className="text-seal hover:opacity-70 text-sm no-underline">
            {t(lang, 'jobs.backToJobs')}
          </Link>
        </div>
      </div>
    )
  }

  const companyName = (lang === 'ja' && job.companyNameJa) ? job.companyNameJa : job.companyName

  return (
    <div className="min-h-screen line-page">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <Link to="/jobs" className="text-ink-faint text-sm hover:text-ink transition-colors no-underline">
          {t(lang, 'jobs.backToJobs')}
        </Link>

        <div className="line-card p-6 mt-3 mb-6">
          <div className="flex items-center gap-3 mb-4">
            {job.companyLogoUrl ? (
              <img src={job.companyLogoUrl} alt="" className="avatar-line w-12 h-12" />
            ) : (
              <div className="avatar-line w-12 h-12">
                {(job.companyName ?? '??').slice(0, 2).toUpperCase()}
              </div>
            )}
            <p className="text-ink-soft text-sm">{companyName}</p>
          </div>
          <h1 className="font-display font-medium text-ink text-2xl sm:text-3xl tracking-wide mb-3">
            {lang === 'ja' ? job.titleJa : job.titleEn}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="badge-line-ink">{t(lang, `jobs.jobType${job.jobType.charAt(0).toUpperCase()}${job.jobType.slice(1)}`)}</span>
            {job.remoteOk && <span className="badge-line-ink">{t(lang, 'jobs.remoteOkLabel')}</span>}
            {job.japaneseLevel && <span className="badge-line">{job.japaneseLevel}</span>}
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-ink-soft">
            {job.field && <span>{lang === 'ja' ? (job.fieldJa || FIELDS_JA[job.field]) : job.field}</span>}
            {job.employmentType && <span>{job.employmentType}</span>}
            {job.location && <span>{job.location}</span>}
            {job.salaryRange && <span>{t(lang, COMPENSATION_LABEL_KEY[job.jobType])}: {job.salaryRange}</span>}
            {job.duration && <span>{t(lang, 'jobs.durationLabel')}: {job.duration}</span>}
          </div>
          {job.deliverables && (
            <p className="text-ink-soft text-xs mt-3 pt-3 border-t border-hairline">
              <span className="text-ink-faint">{t(lang, 'jobs.deliverablesLabel')}: </span>{job.deliverables}
            </p>
          )}
        </div>

        {(job.descriptionEn || job.descriptionJa) && (
          <div className="line-card p-6 mb-6">
            <p className="text-ink-soft text-sm leading-relaxed whitespace-pre-wrap">
              {(lang === 'ja' ? job.descriptionJa : job.descriptionEn) || (lang === 'ja' ? job.descriptionEn : job.descriptionJa)}
            </p>
          </div>
        )}

        <div className="line-card p-6">
          {accountType === 'talent' ? (
            applicationStatus ? (
              <div className="text-center py-4">
                <p className="text-ink font-medium mb-1">
                  {t(lang, 'jobs.alreadyApplied')}
                </p>
                <p className="text-ink-faint text-xs">
                  {t(lang, `jobs.status${applicationStatus.charAt(0).toUpperCase()}${applicationStatus.slice(1)}`)}
                </p>
              </div>
            ) : (
              <form onSubmit={handleApply}>
                <h2 className="font-display font-medium text-ink text-lg mb-3">{t(lang, 'jobs.applyModalTitle')}</h2>
                {applyError && (
                  <div className="mb-4 px-4 py-3 border border-seal text-seal text-sm">{applyError}</div>
                )}
                <label className="label-line">{t(lang, 'jobs.coverMessageLabel')}</label>
                <textarea className="input-line resize-none mb-4" rows={5} value={coverMessage}
                          onChange={e => setCoverMessage(e.target.value)}
                          placeholder={t(lang, 'jobs.coverMessagePlaceholder')} />
                <button type="submit" disabled={submitting} className="btn-line w-full justify-center disabled:opacity-50">
                  {submitting ? '···' : t(lang, 'jobs.submitApplication')}
                </button>
              </form>
            )
          ) : (
            <div className="text-center py-4">
              <p className="text-ink-soft text-sm mb-3">{t(lang, 'jobs.loginToApply')}</p>
              <Link to="/login" className="btn-line no-underline inline-block">
                {t(lang, 'nav.signIn')}
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
