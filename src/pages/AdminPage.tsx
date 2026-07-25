import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../App'
import { t } from '../i18n'
import { supabase } from '../lib/supabase'

type TabType = 'pending' | 'all'

interface ProfileRow {
  id: string
  name_en: string
  name_ja: string
  email: string
  country: string
  field: string
  japanese_level: string
  status: string
  admin_note: string | null
  created_at: string
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label_en: string; label_ja: string }> = {
  draft:    { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', label_en: 'Draft', label_ja: '下書き' },
  pending:  { bg: 'rgba(186,117,23,0.15)', color: '#BA7517', label_en: 'Pending', label_ja: '審査待ち' },
  approved: { bg: 'rgba(29,158,117,0.15)', color: '#1D9E75', label_en: 'Approved', label_ja: '承認済み' },
  rejected: { bg: 'rgba(216,90,48,0.15)', color: '#D85A30', label_en: 'Rejected', label_ja: '差し戻し' },
}

export default function AdminPage() {
  const { user, loading } = useAuth()
  const { lang } = useLang()
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabType>('pending')
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [fetching, setFetching] = useState(true)
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({})
  const [processing, setProcessing] = useState<string | null>(null)

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate('/')
  }, [loading, user, isAdmin, navigate])

  useEffect(() => {
    if (!isAdmin) return
    fetchProfiles()
  }, [tab, isAdmin])

  async function fetchProfiles() {
    setFetching(true)
    const query = supabase
      .from('profiles')
      .select('id, name_en, name_ja, email, country, field, japanese_level, status, admin_note, created_at')
      .order('created_at', { ascending: false })

    if (tab === 'pending') query.eq('status', 'pending')

    const { data } = await query
    setProfiles((data as ProfileRow[]) ?? [])
    setFetching(false)
  }

  async function handleApprove(id: string) {
    setProcessing(id)
    await supabase.rpc('review_profile', { target_id: id, new_status: 'approved', note: null })
    await fetchProfiles()
    setProcessing(null)
  }

  async function handleReject(id: string) {
    setProcessing(id)
    await supabase.rpc('review_profile', {
      target_id: id,
      new_status: 'rejected',
      note: rejectNote[id] || null,
    })
    await fetchProfiles()
    setProcessing(null)
  }

  if (loading) return null
  if (!user || !isAdmin) return null

  const displayed = profiles

  return (
    <div className="min-h-screen bg-dark">
      <nav className="bg-dark border-b border-white/[0.06] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #D85A30 0%, #1D9E75 100%)' }}>
              <span className="text-white font-bold text-xs">AT</span>
            </div>
            <span className="text-white font-medium text-lg tracking-tight">AfriTalent</span>
          </Link>
          <span className="text-white/40 text-sm">{t(lang, 'admin.title')}</span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-medium text-white mb-6" style={{ letterSpacing: '-0.02em' }}>
          {t(lang, 'admin.title')}
        </h1>

        {/* タブ */}
        <div className="flex gap-2 mb-6">
          {(['pending', 'all'] as TabType[]).map(tabKey => (
            <button key={tabKey} onClick={() => setTab(tabKey)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      tab === tabKey ? 'bg-white text-dark' : 'text-white/50 hover:text-white/80 bg-dark-3 border border-white/[0.08]'
                    }`}>
              {t(lang, tabKey === 'pending' ? 'admin.pendingTab' : 'admin.allTab')}
            </button>
          ))}
        </div>

        {fetching ? (
          <p className="text-white/30 text-sm">Loading...</p>
        ) : displayed.length === 0 ? (
          <div className="bg-dark-2 rounded-2xl p-10 text-center" style={{ border: '0.5px solid rgba(255,255,255,0.06)' }}>
            <p className="text-white/30 text-sm">{t(lang, 'admin.noItems')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayed.map(p => {
              const st = STATUS_STYLE[p.status] ?? STATUS_STYLE.draft
              const isPending = p.status === 'pending'
              return (
                <div key={p.id} className="bg-dark-2 rounded-2xl p-5"
                     style={{ border: '0.5px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">{p.name_en}</span>
                        <span className="text-white/40 text-sm">{p.name_ja}</span>
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium"
                              style={{ background: st.bg, color: st.color }}>
                          {lang === 'ja' ? st.label_ja : st.label_en}
                        </span>
                      </div>
                      <p className="text-white/40 text-xs">
                        {p.email} · {p.country} · {p.field} · {p.japanese_level}
                      </p>
                      {p.admin_note && (
                        <p className="text-white/30 text-xs mt-1 italic">"{p.admin_note}"</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link to={`/talent/${p.id}`} target="_blank"
                            className="px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white/80 no-underline transition-colors"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)' }}>
                        {t(lang, 'card.viewProfile')}
                      </Link>
                    </div>
                  </div>

                  {isPending && (
                    <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row gap-2 items-start">
                      <input
                        className="flex-1 bg-dark-3 border border-white/[0.08] rounded-xl px-3 py-2 text-white text-xs placeholder-white/20 outline-none focus:border-a-orange/40 transition-colors"
                        placeholder={t(lang, 'admin.notePlaceholder')}
                        value={rejectNote[p.id] ?? ''}
                        onChange={e => setRejectNote(prev => ({ ...prev, [p.id]: e.target.value }))}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(p.id)}
                                disabled={processing === p.id}
                                className="px-4 py-2 rounded-xl text-xs font-medium text-white transition-opacity hover:opacity-90 cursor-pointer disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #1D9E75, #147a5a)' }}>
                          {processing === p.id ? '...' : t(lang, 'admin.approve')}
                        </button>
                        <button onClick={() => handleReject(p.id)}
                                disabled={processing === p.id}
                                className="px-4 py-2 rounded-xl text-xs font-medium text-white transition-opacity hover:opacity-90 cursor-pointer disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #D85A30, #BA7517)' }}>
                          {processing === p.id ? '...' : t(lang, 'admin.reject')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
