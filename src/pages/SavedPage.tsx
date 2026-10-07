import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Briefcase, Rss, User, Building2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../App'
import { t, pick } from '../i18n'
import { supabase } from '../lib/supabase'
import type { SavedItemType } from '../types'

interface SavedRow { id: string; itemType: SavedItemType; itemId: string }
interface ResolvedItem { savedId: string; title: string; meta?: string; imageUrl?: string; link: string }

const GROUPS: { type: SavedItemType; icon: typeof Briefcase; labelKey: string }[] = [
  { type: 'job', icon: Briefcase, labelKey: 'saved.jobs' },
  { type: 'post', icon: Rss, labelKey: 'saved.posts' },
  { type: 'talent', icon: User, labelKey: 'saved.talents' },
  { type: 'company', icon: Building2, labelKey: 'saved.companies' },
]

export default function SavedPage() {
  const { user, company, loading: authLoading } = useAuth()
  const { lang } = useLang()
  const navigate = useNavigate()
  const selfId = user?.id ?? company?.id ?? null

  const [items, setItems] = useState<Record<SavedItemType, ResolvedItem[]>>({ job: [], post: [], talent: [], company: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!selfId) { navigate('/login'); return }
    load()
  }, [authLoading, selfId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    if (!selfId) return
    setLoading(true)
    const { data: savedRows } = await supabase
      .from('saved_items')
      .select('id, item_type, item_id')
      .eq('user_id', selfId)
      .order('created_at', { ascending: false })

    const rows = ((savedRows ?? []) as any[]).map(r => ({ id: r.id, itemType: r.item_type, itemId: r.item_id } as SavedRow))
    const byType: Record<SavedItemType, SavedRow[]> = { job: [], post: [], talent: [], company: [] }
    for (const r of rows) byType[r.itemType].push(r)

    const resolved: Record<SavedItemType, ResolvedItem[]> = { job: [], post: [], talent: [], company: [] }

    if (byType.job.length > 0) {
      const ids = byType.job.map(r => r.itemId)
      const { data } = await supabase.from('jobs').select('id, title_en, title_ja, companies(name, name_ja)').in('id', ids)
      for (const row of data ?? []) {
        const saved = byType.job.find(r => r.itemId === row.id)
        if (!saved) continue
        resolved.job.push({
          savedId: saved.id,
          title: (pick(lang, row.title_ja, row.title_en)) || row.title_en || row.title_ja,
          meta: lang === 'ja' ? (row as any).companies?.name_ja || (row as any).companies?.name : (row as any).companies?.name,
          link: `/jobs/${row.id}`,
        })
      }
    }

    if (byType.post.length > 0) {
      const ids = byType.post.map(r => r.itemId)
      const { data } = await supabase.from('posts').select('id, title, companies(name, name_ja)').in('id', ids)
      for (const row of data ?? []) {
        const saved = byType.post.find(r => r.itemId === row.id)
        if (!saved) continue
        resolved.post.push({
          savedId: saved.id,
          title: row.title,
          meta: lang === 'ja' ? (row as any).companies?.name_ja || (row as any).companies?.name : (row as any).companies?.name,
          link: '/connect',
        })
      }
    }

    if (byType.talent.length > 0) {
      const ids = byType.talent.map(r => r.itemId)
      const { data } = await supabase.from('profiles').select('id, name_en, name_ja, field, field_ja, avatar_url').in('id', ids)
      for (const row of data ?? []) {
        const saved = byType.talent.find(r => r.itemId === row.id)
        if (!saved) continue
        resolved.talent.push({
          savedId: saved.id,
          title: (pick(lang, row.name_ja, row.name_en)) || row.name_en,
          meta: pick(lang, row.field_ja, row.field),
          imageUrl: row.avatar_url ?? undefined,
          link: `/talent/${row.id}`,
        })
      }
    }

    if (byType.company.length > 0) {
      const ids = byType.company.map(r => r.itemId)
      const { data } = await supabase.from('companies').select('id, name, name_ja, industry, logo_url').in('id', ids)
      for (const row of data ?? []) {
        const saved = byType.company.find(r => r.itemId === row.id)
        if (!saved) continue
        resolved.company.push({
          savedId: saved.id,
          title: (pick(lang, row.name_ja, row.name)) || row.name,
          meta: row.industry ?? undefined,
          imageUrl: row.logo_url ?? undefined,
          link: `/company/${row.id}`,
        })
      }
    }

    setItems(resolved)
    setLoading(false)
  }

  async function remove(savedId: string) {
    await supabase.from('saved_items').delete().eq('id', savedId)
    load()
  }

  if (authLoading || loading) {
    return <div className="min-h-screen line-page flex items-center justify-center text-ink-faint">···</div>
  }

  const isEmpty = GROUPS.every(g => items[g.type].length === 0)

  return (
    <div className="min-h-screen line-page">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="font-display font-medium text-ink text-3xl tracking-wide mb-8">{t(lang, 'saved.title')}</h1>

        {isEmpty ? (
          <div className="line-card p-10 text-center text-ink-faint text-sm">{t(lang, 'saved.empty')}</div>
        ) : (
          <div className="space-y-8">
            {GROUPS.map(g => items[g.type].length > 0 && (
              <section key={g.type}>
                <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
                  <g.icon className="h-3.5 w-3.5" /> {t(lang, g.labelKey)}
                </h2>
                <div className="space-y-2">
                  {items[g.type].map(item => (
                    <div key={item.savedId} className="line-card p-4 flex items-center gap-3">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="avatar-line w-10 h-10 flex-shrink-0" />
                      ) : (
                        <div className="avatar-line w-10 h-10 flex-shrink-0"><g.icon className="h-4 w-4" /></div>
                      )}
                      <Link to={item.link} className="flex-1 min-w-0 no-underline">
                        <p className="text-ink text-sm font-medium truncate">{item.title}</p>
                        {item.meta && <p className="text-ink-faint text-xs truncate">{item.meta}</p>}
                      </Link>
                      <button onClick={() => remove(item.savedId)} className="text-ink-faint hover:text-seal transition-colors cursor-pointer text-xs flex-shrink-0">
                        {t(lang, 'saved.remove')}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
