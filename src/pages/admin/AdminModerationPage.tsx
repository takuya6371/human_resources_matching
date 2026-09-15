import { useEffect, useState } from 'react'
import { ShieldAlert, LifeBuoy, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react'
import { useLang } from '../../App'
import { t } from '../../i18n'
import { supabase } from '../../lib/supabase'
import { callEdgeFunction } from '../../lib/edgeFunction'
import { mapThreadRow } from '../../lib/messageMapper'
import type { Thread } from '../../types'

export default function AdminModerationPage() {
  const { lang } = useLang()
  const [threads, setThreads] = useState<Thread[]>([])
  const [names, setNames] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    const { data } = await supabase
      .from('threads')
      .select('*')
      .or('status.eq.flagged,support_requested.eq.true')
      .order('flagged_at', { ascending: false, nullsFirst: false })
    const mapped = (data ?? []).map(mapThreadRow)
    setThreads(mapped)

    const talentIds = Array.from(new Set(mapped.map(th => th.talentId)))
    const companyIds = Array.from(new Set(mapped.map(th => th.companyId)))
    const [{ data: profileRows }, { data: companyRows }] = await Promise.all([
      talentIds.length ? supabase.from('profiles').select('id, name_en, name_ja').in('id', talentIds) : Promise.resolve({ data: [] }),
      companyIds.length ? supabase.from('companies').select('id, name, name_ja').in('id', companyIds) : Promise.resolve({ data: [] }),
    ])
    const map = new Map<string, string>()
    for (const p of profileRows ?? []) map.set(p.id, lang === 'ja' && p.name_ja ? p.name_ja : p.name_en)
    for (const c of companyRows ?? []) map.set(c.id, lang === 'ja' && c.name_ja ? c.name_ja : c.name)
    setNames(map)
    setLoading(false)
  }
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function act(threadId: string, action: 'release' | 'release_warning' | 'wipe') {
    if (action === 'wipe' && !window.confirm(t(lang, 'adminModeration.wipeConfirm'))) return
    setBusyId(threadId)
    await callEdgeFunction('moderate-thread', { threadId, action })
    await load()
    setBusyId(null)
  }

  if (loading) return <div className="px-6 py-8 lg:px-8 text-ink-faint text-sm">···</div>

  return (
    <div className="px-6 py-8 lg:px-8">
      <h1 className="font-display font-medium text-ink text-2xl tracking-wide">{t(lang, 'adminModeration.title')}</h1>
      <p className="text-ink-soft text-sm mt-1">{t(lang, 'adminModeration.subtitle')}</p>

      {threads.length === 0 ? (
        <div className="line-card p-10 text-center text-ink-faint text-sm mt-6">
          {t(lang, 'adminModeration.empty')}
        </div>
      ) : (
        <div className="space-y-4 mt-6">
          {threads.map(th => (
            <div key={th.id} className="line-card p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-ink text-sm font-medium">
                    {names.get(th.talentId) ?? '—'} ⇄ {names.get(th.companyId) ?? '—'}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap mt-1.5">
                    <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 border ${
                      th.status === 'flagged' ? 'border-seal text-seal' : 'border-hairline text-ink-faint'
                    }`}>
                      {th.status === 'flagged' ? t(lang, 'adminModeration.statusFlagged') : t(lang, 'adminModeration.statusOpen')}
                    </span>
                    {th.supportRequested && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-ink-faint">
                        <LifeBuoy className="h-3 w-3" /> {t(lang, 'adminModeration.supportRequestedLabel')}
                      </span>
                    )}
                    {th.flaggedBy && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-ink-faint">
                        <ShieldAlert className="h-3 w-3" />
                        {th.flaggedBy === 'model' ? t(lang, 'adminModeration.flaggedByModel') : t(lang, 'adminModeration.flaggedByRules')}
                      </span>
                    )}
                  </div>
                </div>

                {th.status === 'flagged' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => act(th.id, 'release')}
                      disabled={busyId === th.id}
                      className="btn-line text-[10px] px-3 py-2 inline-flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> {t(lang, 'adminModeration.release')}
                    </button>
                    <button
                      onClick={() => act(th.id, 'release_warning')}
                      disabled={busyId === th.id}
                      className="border border-hairline text-ink hover:border-ink text-[10px] px-3 py-2 inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" /> {t(lang, 'adminModeration.releaseWarning')}
                    </button>
                    <button
                      onClick={() => act(th.id, 'wipe')}
                      disabled={busyId === th.id}
                      className="border border-hairline text-seal hover:border-seal text-[10px] px-3 py-2 inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> {t(lang, 'adminModeration.wipe')}
                    </button>
                  </div>
                )}
              </div>

              {th.flaggedQuote && (
                <div className="mt-3 pt-3 border-t border-hairline">
                  <p className="text-ink-faint text-xs uppercase tracking-wide">{t(lang, 'adminModeration.quote')}</p>
                  <p className="text-ink text-sm mt-1 whitespace-pre-wrap break-words">{th.flaggedQuote}</p>
                  {th.flaggedReason && (
                    <p className="text-ink-soft text-xs mt-1.5">{t(lang, 'adminModeration.reason')}: {th.flaggedReason}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
