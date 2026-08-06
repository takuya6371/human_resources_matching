import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useLang } from '../App'
import { t } from '../i18n'
import { supabase } from '../lib/supabase'
import { mapJobRow } from '../lib/jobMapper'
import { FIELDS, FIELDS_JA } from '../lib/constants'
import type { Job } from '../types'

export default function JobListPage() {
  const { lang } = useLang()
  const [search, setSearch] = useState('')
  const [activeField, setActiveField] = useState<string | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data } = await supabase
        .from('jobs')
        .select('*, companies(name, name_ja, logo_url)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
      if (!cancelled) {
        setJobs((data ?? []).map(mapJobRow))
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return jobs.filter(job => {
      const title = (lang === 'ja' ? job.titleJa : job.titleEn).toLowerCase()
      const matchSearch = !query || title.includes(query) || job.field.toLowerCase().includes(query)
      const matchField = !activeField || job.field === activeField
      return matchSearch && matchField
    })
  }, [jobs, search, activeField, lang])

  return (
    <div className="min-h-screen line-page">
      <Navbar />

      <div className="border-b border-hairline">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <h1 className="font-display font-medium text-ink text-3xl tracking-wide mb-2">
            {t(lang, 'jobs.heading')}
          </h1>
          <p className="text-ink-soft text-sm mb-6">{t(lang, 'jobs.subheading')}</p>

          <div className="flex items-center gap-0 border-b border-ink w-full sm:max-w-md">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t(lang, 'jobs.searchPlaceholder')}
              className="bg-transparent border-none outline-none text-ink text-sm py-3 flex-1 placeholder-ink-faint min-w-0"
            />
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex items-center gap-2 flex-wrap mb-8">
          <button
            onClick={() => setActiveField(null)}
            className={`px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer border ${
              !activeField ? 'bg-ink text-paper border-ink' : 'border-hairline text-ink-soft hover:border-ink hover:text-ink'
            }`}
          >
            {t(lang, 'list.filterAll')}
          </button>
          {FIELDS.map(f => (
            <button key={f}
              onClick={() => setActiveField(activeField === f ? null : f)}
              className={`px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer border ${
                activeField === f ? 'bg-ink text-paper border-ink' : 'border-hairline text-ink-soft hover:border-ink hover:text-ink'
              }`}
            >
              {lang === 'ja' ? FIELDS_JA[f] : f}
            </button>
          ))}
        </div>

        <p className="text-ink-faint text-xs mb-5" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {filtered.length} {t(lang, 'jobs.resultCount')}
        </p>

        {loading ? (
          <div className="text-center py-20 text-ink-faint">···</div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(job => (
              <Link key={job.id} to={`/jobs/${job.id}`} className="block no-underline group">
                <div className="line-card h-full p-6 transition-colors group-hover:border-ink">
                  <div className="flex items-center gap-3 mb-4">
                    {job.companyLogoUrl ? (
                      <img src={job.companyLogoUrl} alt="" className="avatar-line w-10 h-10 text-sm" />
                    ) : (
                      <div className="avatar-line w-10 h-10 text-sm">
                        {(job.companyName ?? '??').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <p className="text-ink-soft text-xs">{(lang === 'ja' && job.companyNameJa) ? job.companyNameJa : job.companyName}</p>
                  </div>
                  <p className="font-display font-medium text-ink text-base mb-2">
                    {lang === 'ja' ? job.titleJa : job.titleEn}
                  </p>
                  <p className="text-ink-soft text-xs mb-4">
                    {(lang === 'ja' ? job.fieldJa : job.field) || '—'}
                    {job.location && ` · ${job.location}`}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-hairline">
                    <span className="text-xs text-ink-faint">{job.employmentType || '—'}</span>
                    <span className="text-xs font-medium text-ink group-hover:text-seal transition-colors">
                      {t(lang, 'jobs.viewDetail')} →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-ink-faint">
            <p className="text-lg font-display">{t(lang, 'jobs.noResults')}</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
