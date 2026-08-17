import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useLang } from '../App'
import { useAuth } from '../context/AuthContext'
import { t } from '../i18n'
import { supabase } from '../lib/supabase'
import { mapJobRow, jobTitle } from '../lib/jobMapper'
import { fillMissingJapanese } from '../lib/translate'
import { FIELDS, FIELDS_JA, LEVELS, COMPENSATION_LABEL_KEY } from '../lib/constants'
import type { Job, JLPTLevel, JobStatus, JobType } from '../types'

interface EditForm {
  titleEn: string
  titleJa: string
  descriptionEn: string
  descriptionJa: string
  field: string
  japaneseLevel: JLPTLevel | ''
  jobType: JobType
  remoteOk: boolean
  employmentType: string
  salaryRange: string
  duration: string
  deliverables: string
  location: string
  status: JobStatus
}

const EMPTY_FORM: EditForm = {
  titleEn: '', titleJa: '', descriptionEn: '', descriptionJa: '',
  field: '', japaneseLevel: '', jobType: 'employment', remoteOk: false,
  employmentType: '', salaryRange: '', duration: '', deliverables: '', location: '',
  status: 'draft',
}

const STATUS_COLOR: Record<JobStatus, string> = {
  draft: '#B7B2A1',
  open: '#1D7E5C',
  closed: '#8A8577',
}

export default function CompanyJobsPage() {
  const { lang } = useLang()
  const { company, accountType, loading } = useAuth()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<Job[]>([])
  const [fetching, setFetching] = useState(true)
  const [mode, setMode] = useState<'list' | 'edit'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<EditForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && accountType !== 'company') navigate('/')
  }, [loading, accountType, navigate])

  useEffect(() => {
    if (company) loadJobs()
  }, [company])

  async function loadJobs() {
    if (!company) return
    setFetching(true)
    const { data } = await supabase
      .from('jobs')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })
    setJobs((data ?? []).map(mapJobRow))
    setFetching(false)
  }

  function startCreate() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setMode('edit')
  }

  function startEdit(job: Job) {
    setForm({
      titleEn: job.titleEn, titleJa: job.titleJa,
      descriptionEn: job.descriptionEn, descriptionJa: job.descriptionJa,
      field: job.field, japaneseLevel: job.japaneseLevel ?? '',
      jobType: job.jobType, remoteOk: job.remoteOk,
      employmentType: job.employmentType, salaryRange: job.salaryRange,
      duration: job.duration ?? '', deliverables: job.deliverables ?? '', location: job.location,
      status: job.status,
    })
    setEditingId(job.id)
    setMode('edit')
  }

  function setField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!company) return
    setSaving(true)

    const [titleJa, descriptionJa] = await fillMissingJapanese([
      { en: form.titleEn, ja: form.titleJa },
      { en: form.descriptionEn, ja: form.descriptionJa },
    ])

    const payload = {
      title_en: form.titleEn,
      title_ja: titleJa,
      description_en: form.descriptionEn,
      description_ja: descriptionJa,
      field: form.field,
      field_ja: form.field ? FIELDS_JA[form.field] : '',
      japanese_level: form.japaneseLevel || null,
      job_type: form.jobType,
      remote_ok: form.remoteOk,
      employment_type: form.employmentType,
      salary_range: form.salaryRange,
      duration: form.duration || null,
      deliverables: form.deliverables || null,
      location: form.location,
      status: form.status,
    }

    if (editingId) {
      await supabase.from('jobs').update(payload).eq('id', editingId)
    } else {
      await supabase.from('jobs').insert({ ...payload, company_id: company.id })
    }

    setSaving(false)
    setMode('list')
    await loadJobs()
  }

  async function handleDelete(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id)
      return
    }
    await supabase.from('jobs').delete().eq('id', id)
    setConfirmDeleteId(null)
    await loadJobs()
  }

  if (loading || accountType !== 'company') return null

  return (
    <div className="min-h-screen line-page flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-medium text-ink text-3xl tracking-wide mb-2">
              {t(lang, 'jobs.manageHeading')}
            </h1>
            <p className="text-ink-soft text-sm">{t(lang, 'jobs.manageSub')}</p>
          </div>
          {mode === 'list' && (
            <button onClick={startCreate} className="btn-line whitespace-nowrap self-start">
              {t(lang, 'jobs.createBtn')}
            </button>
          )}
        </div>

        {mode === 'edit' ? (
          <form onSubmit={handleSave} className="line-card p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-line">{t(lang, 'jobs.titleEnLabel')}</label>
                <input className="input-line" value={form.titleEn} onChange={e => setField('titleEn', e.target.value)} required />
              </div>
              <div>
                <label className="label-line">{t(lang, 'jobs.titleJaLabel')}</label>
                <input className="input-line" value={form.titleJa} onChange={e => setField('titleJa', e.target.value)}
                       placeholder={t(lang, 'jobs.autoTranslateHint')} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-line">{t(lang, 'jobs.descEnLabel')}</label>
                <textarea className="input-line resize-none" rows={5} value={form.descriptionEn} onChange={e => setField('descriptionEn', e.target.value)} />
              </div>
              <div>
                <label className="label-line">{t(lang, 'jobs.descJaLabel')}</label>
                <textarea className="input-line resize-none" rows={5} value={form.descriptionJa} onChange={e => setField('descriptionJa', e.target.value)}
                          placeholder={t(lang, 'jobs.autoTranslateHint')} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label-line">{t(lang, 'jobs.fieldLabel')}</label>
                <select className="input-line" value={form.field} onChange={e => setField('field', e.target.value)}>
                  <option value="">—</option>
                  {FIELDS.map(f => <option key={f} value={f}>{lang === 'ja' ? FIELDS_JA[f] : f}</option>)}
                </select>
              </div>
              <div>
                <label className="label-line">{t(lang, 'jobs.japaneseLevelLabel')}</label>
                <select className="input-line" value={form.japaneseLevel} onChange={e => setField('japaneseLevel', e.target.value as JLPTLevel | '')}>
                  <option value="">—</option>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="label-line">{t(lang, 'jobs.statusLabel')}</label>
                <select className="input-line" value={form.status} onChange={e => setField('status', e.target.value as JobStatus)}>
                  <option value="draft">{t(lang, 'jobs.statusDraft')}</option>
                  <option value="open">{t(lang, 'jobs.statusOpen')}</option>
                  <option value="closed">{t(lang, 'jobs.statusClosed')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-line">{t(lang, 'jobs.jobTypeLabel')}</label>
                <select className="input-line" value={form.jobType} onChange={e => setField('jobType', e.target.value as JobType)}>
                  <option value="employment">{t(lang, 'jobs.jobTypeEmployment')}</option>
                  <option value="staffing">{t(lang, 'jobs.jobTypeStaffing')}</option>
                  <option value="project">{t(lang, 'jobs.jobTypeProject')}</option>
                </select>
              </div>
              <div className="flex items-end pb-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={form.remoteOk} onChange={e => setField('remoteOk', e.target.checked)}
                         className="w-4 h-4 accent-ink cursor-pointer" />
                  <span className="text-ink-soft text-sm">{t(lang, 'jobs.remoteOkOption')}</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label-line">{t(lang, 'jobs.employmentTypeLabel')}</label>
                <input className="input-line" value={form.employmentType} onChange={e => setField('employmentType', e.target.value)}
                       placeholder={t(lang, 'jobs.employmentTypePlaceholder')} />
              </div>
              <div>
                <label className="label-line">{t(lang, COMPENSATION_LABEL_KEY[form.jobType])}</label>
                <input className="input-line" value={form.salaryRange} onChange={e => setField('salaryRange', e.target.value)}
                       placeholder={t(lang, 'jobs.salaryRangePlaceholder')} />
              </div>
              <div>
                <label className="label-line">{t(lang, 'jobs.locationLabel')}</label>
                <input className="input-line" value={form.location} onChange={e => setField('location', e.target.value)} placeholder="東京都" />
              </div>
            </div>

            {form.jobType !== 'employment' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-line">{t(lang, 'jobs.durationLabel')}</label>
                  <input className="input-line" value={form.duration} onChange={e => setField('duration', e.target.value)}
                         placeholder={t(lang, 'jobs.durationPlaceholder')} />
                </div>
                {form.jobType === 'project' && (
                  <div>
                    <label className="label-line">{t(lang, 'jobs.deliverablesLabel')}</label>
                    <input className="input-line" value={form.deliverables} onChange={e => setField('deliverables', e.target.value)}
                           placeholder={t(lang, 'jobs.deliverablesPlaceholder')} />
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => setMode('list')}
                      className="px-6 py-2.5 text-sm text-ink-soft hover:text-ink transition-colors cursor-pointer border border-hairline">
                {t(lang, 'jobs.cancelBtn')}
              </button>
              <button type="submit" disabled={saving} className="btn-line px-8 disabled:opacity-50">
                {saving ? '···' : t(lang, 'jobs.saveBtn')}
              </button>
            </div>
          </form>
        ) : fetching ? (
          <p className="text-ink-faint text-sm">···</p>
        ) : jobs.length === 0 ? (
          <div className="line-card p-10 text-center">
            <p className="text-ink-faint text-sm">{t(lang, 'jobs.noJobs')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <div key={job.id} className="line-card p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-ink font-medium">{jobTitle(job, lang)}</span>
                      <span className="text-xs font-medium uppercase tracking-wide pb-[2px]"
                            style={{ color: STATUS_COLOR[job.status], borderBottom: `1.5px solid ${STATUS_COLOR[job.status]}` }}>
                        {t(lang, `jobs.status${job.status.charAt(0).toUpperCase()}${job.status.slice(1)}`)}
                      </span>
                    </div>
                    <p className="text-ink-faint text-xs">
                      {t(lang, `jobs.jobType${job.jobType.charAt(0).toUpperCase()}${job.jobType.slice(1)}`)}
                      {job.remoteOk && ` · ${t(lang, 'jobs.remoteOkLabel')}`}
                      {' · '}{(lang === 'ja' ? job.fieldJa : job.field) || '—'} · {job.location || '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Link to={`/company/jobs/${job.id}/applicants`} className="btn-line-ghost no-underline">
                      {t(lang, 'jobs.viewApplicantsBtn')}
                    </Link>
                    <button onClick={() => startEdit(job)} className="btn-line-ghost cursor-pointer">
                      {t(lang, 'jobs.editBtn')}
                    </button>
                    <button onClick={() => handleDelete(job.id)}
                            className={`text-xs transition-colors cursor-pointer ${confirmDeleteId === job.id ? 'text-seal font-medium' : 'text-ink-faint hover:text-seal'}`}>
                      {confirmDeleteId === job.id ? t(lang, 'jobs.confirmDelete') : t(lang, 'jobs.deleteBtn')}
                    </button>
                    {confirmDeleteId === job.id && (
                      <button onClick={() => setConfirmDeleteId(null)} className="text-ink-faint hover:text-ink text-xs transition-colors cursor-pointer">
                        {t(lang, 'jobs.cancelBtn')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
