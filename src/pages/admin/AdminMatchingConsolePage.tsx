import { useEffect, useMemo, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useLang } from '../../App'
import { t } from '../../i18n'
import { supabase } from '../../lib/supabase'
import { mapJobRow, jobTitle } from '../../lib/jobMapper'
import { mapProfileRow, PROFILE_PUBLIC_COLUMNS } from '../../lib/profileMapper'
import type { Job, Talent } from '../../types'

const JLPT_ORDER: Record<string, number> = { N5: 1, N4: 2, N3: 3, N2: 4, N1: 5 }

// AI不使用の決定的なスコアリング(bridgeのMatchingConsole/computeMatchesと同じ考え方の
// 簡易版)。admin向けの手動マッチング支援であり、talent向けの「あなたへのおすすめ」
// 機能(Matches、対象外)とは別物。
function scoreMatch(job: Job, talent: Talent): number {
  let score = 0
  const jobField = (job.field || '').toLowerCase()
  const talentField = (talent.field || '').toLowerCase()
  if (jobField && talentField && (jobField.includes(talentField) || talentField.includes(jobField))) {
    score += 30
  }

  const text = `${job.titleEn} ${job.descriptionEn}`.toLowerCase()
  const skills = (talent.skills || []).map(s => s.toLowerCase())
  const overlap = skills.filter(s => s.length > 1 && text.includes(s))
  score += Math.min(overlap.length * 10, 30)

  if (job.japaneseLevel) {
    const req = JLPT_ORDER[job.japaneseLevel] ?? 0
    const have = JLPT_ORDER[talent.japaneseLevel] ?? 0
    score += have >= req ? 20 : Math.round((have / Math.max(req, 1)) * 10)
  } else {
    score += 10
  }

  return score
}

export default function AdminMatchingConsolePage() {
  const { lang } = useLang()
  const [jobs, setJobs] = useState<Job[]>([])
  const [talents, setTalents] = useState<Talent[]>([])
  const [existing, setExisting] = useState<Set<string>>(new Set())
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)

  async function load() {
    const [{ data: jobRows }, { data: profileRows }, { data: appRows }] = await Promise.all([
      supabase.from('jobs').select('*').eq('status', 'open').order('created_at', { ascending: false }),
      supabase.from('profiles').select(PROFILE_PUBLIC_COLUMNS).eq('status', 'approved'),
      supabase.from('applications').select('job_id, profile_id'),
    ])
    setJobs((jobRows ?? []).map(mapJobRow))
    setTalents((profileRows ?? []).map(r => mapProfileRow(r)))
    setExisting(new Set((appRows ?? []).map(a => `${a.job_id}:${a.profile_id}`)))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const selectedJob = jobs.find(j => j.id === selectedJobId) ?? null

  const ranked = useMemo(() => {
    if (!selectedJob) return []
    return talents
      .map(talent => ({ talent, score: scoreMatch(selectedJob, talent) }))
      .sort((a, b) => b.score - a.score)
  }, [selectedJob, talents])

  async function connect(talentId: string) {
    if (!selectedJob) return
    setConnecting(talentId)
    const { error } = await supabase.from('applications').insert({ job_id: selectedJob.id, profile_id: talentId })
    if (!error) setExisting(prev => new Set(prev).add(`${selectedJob.id}:${talentId}`))
    setConnecting(null)
  }

  if (loading) return <div className="px-6 py-8 lg:px-8 text-ink-faint text-sm">···</div>

  return (
    <div className="px-6 py-8 lg:px-8">
      <h1 className="font-display font-medium text-ink text-2xl tracking-wide">{t(lang, 'adminMatching.title')}</h1>
      <p className="text-ink-soft text-sm mt-1">{t(lang, 'adminMatching.subtitle')}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
        <div className="lg:col-span-1 space-y-2">
          {jobs.length === 0 ? (
            <p className="text-ink-faint text-sm">{t(lang, 'adminMatching.noJobs')}</p>
          ) : jobs.map(job => (
            <button
              key={job.id}
              onClick={() => setSelectedJobId(job.id)}
              className={`w-full text-left line-card p-4 transition-colors ${selectedJobId === job.id ? 'border-ink' : ''}`}
            >
              <p className="text-ink text-sm font-medium">{jobTitle(job, lang)}</p>
              <p className="text-ink-faint text-xs mt-0.5">{job.field}{job.location ? ` · ${job.location}` : ''}</p>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          {!selectedJob ? (
            <div className="line-card p-10 text-center text-ink-faint text-sm">
              {t(lang, 'adminMatching.selectJob')}
            </div>
          ) : (
            <div className="space-y-3">
              {ranked.map(({ talent, score }) => {
                const key = `${selectedJob.id}:${talent.id}`
                const connected = existing.has(key)
                return (
                  <div key={talent.id} className="line-card p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {talent.avatarUrl ? (
                        <img src={talent.avatarUrl} alt="" className="avatar-line w-10 h-10 text-sm flex-shrink-0" />
                      ) : (
                        <div className="avatar-line w-10 h-10 text-sm flex-shrink-0">{talent.initials}</div>
                      )}
                      <div className="min-w-0">
                        <p className="text-ink text-sm font-medium truncate">
                          {lang === 'ja' ? talent.nameJa : talent.nameEn}
                        </p>
                        <p className="text-ink-faint text-xs truncate">
                          {talent.field} · {talent.japaneseLevel}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
                        <Sparkles className="h-3 w-3" /> {score}
                      </span>
                      <button
                        onClick={() => connect(talent.id)}
                        disabled={connected || connecting === talent.id}
                        className="btn-line text-[10px] px-4 py-2 disabled:opacity-50"
                      >
                        {connected ? t(lang, 'adminMatching.connected') : connecting === talent.id ? '···' : t(lang, 'adminMatching.connect')}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
