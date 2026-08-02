import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../App'
import { t } from '../i18n'
import { supabase } from '../lib/supabase'

type TabType = 'pending' | 'all' | 'inquiries'

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

interface InquiryRow {
  id: string
  name: string
  company: string | null
  email: string
  inquiry_type: string | null
  message: string
  created_at: string
}

const STATUS_STYLE: Record<string, { color: string; label_en: string; label_ja: string }> = {
  draft:    { color: '#B7B2A1', label_en: 'Draft', label_ja: '下書き' },
  pending:  { color: '#BA7517', label_en: 'Pending', label_ja: '審査待ち' },
  approved: { color: '#1D7E5C', label_en: 'Approved', label_ja: '承認済み' },
  rejected: { color: '#A6332B', label_en: 'Rejected', label_ja: '差し戻し' },
}

const INPUT_CLS = 'bg-paper border border-hairline px-3 py-2 text-ink text-xs placeholder-ink-faint outline-none focus:border-ink transition-colors'

export default function AdminPage() {
  const { user, loading, logout } = useAuth()
  const { lang } = useLang()
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabType>('pending')
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [inquiries, setInquiries] = useState<InquiryRow[]>([])
  const [fetching, setFetching] = useState(true)
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({})
  const [processing, setProcessing] = useState<string | null>(null)

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate('/')
  }, [loading, user, isAdmin, navigate])

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  useEffect(() => {
    if (!isAdmin) return
    if (tab === 'inquiries') {
      fetchInquiries()
    } else {
      fetchProfiles()
    }
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

  async function fetchInquiries() {
    setFetching(true)
    const { data } = await supabase
      .from('inquiries')
      .select('id, name, company, email, inquiry_type, message, created_at')
      .order('created_at', { ascending: false })
    setInquiries((data as InquiryRow[]) ?? [])
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
    <div className="min-h-screen line-page">
      <nav className="line-page border-b border-hairline sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <span className="font-display font-medium text-lg text-ink tracking-wide uppercase">AfriTalent</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-ink-soft text-sm">{t(lang, 'admin.title')}</span>
            <button onClick={handleLogout}
                    className="text-ink-soft text-sm hover:text-ink transition-colors cursor-pointer">
              {t(lang, 'dashboard.logout')}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <h1 className="font-display font-medium text-ink text-3xl tracking-wide mb-6">
          {t(lang, 'admin.title')}
        </h1>

        {/* タブ */}
        <div className="flex gap-2 mb-8">
          {(['pending', 'all', 'inquiries'] as TabType[]).map(tabKey => (
            <button key={tabKey} onClick={() => setTab(tabKey)}
                    className={`px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer border ${
                      tab === tabKey ? 'bg-ink text-paper border-ink' : 'border-hairline text-ink-soft hover:border-ink hover:text-ink'
                    }`}>
              {t(lang, tabKey === 'pending' ? 'admin.pendingTab' : tabKey === 'all' ? 'admin.allTab' : 'admin.inquiriesTab')}
            </button>
          ))}
        </div>

        {fetching ? (
          <p className="text-ink-faint text-sm">···</p>
        ) : tab === 'inquiries' ? (
          inquiries.length === 0 ? (
            <div className="line-card p-10 text-center">
              <p className="text-ink-faint text-sm">{t(lang, 'admin.noInquiries')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {inquiries.map(inq => (
                <div key={inq.id} className="line-card p-5">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-ink font-medium">{inq.name}</span>
                    {inq.company && <span className="text-ink-soft text-sm">{inq.company}</span>}
                    {inq.inquiry_type && (
                      <span className="badge-line-ink">{inq.inquiry_type}</span>
                    )}
                  </div>
                  <p className="text-ink-faint text-xs mb-2">{inq.email} · {new Date(inq.created_at).toLocaleString(lang === 'ja' ? 'ja-JP' : 'en-US')}</p>
                  <p className="text-ink-soft text-sm leading-relaxed whitespace-pre-wrap">{inq.message}</p>
                </div>
              ))}
            </div>
          )
        ) : displayed.length === 0 ? (
          <div className="line-card p-10 text-center">
            <p className="text-ink-faint text-sm">{t(lang, 'admin.noItems')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayed.map(p => {
              const st = STATUS_STYLE[p.status] ?? STATUS_STYLE.draft
              const isPending = p.status === 'pending'
              return (
                <div key={p.id} className="line-card p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-ink font-medium">{p.name_en}</span>
                        <span className="text-ink-soft text-sm">{p.name_ja}</span>
                        <span className="text-xs font-medium uppercase tracking-wide pb-[2px]"
                              style={{ color: st.color, borderBottom: `1.5px solid ${st.color}` }}>
                          {lang === 'ja' ? st.label_ja : st.label_en}
                        </span>
                      </div>
                      <p className="text-ink-faint text-xs">
                        {p.email} · {p.country} · {p.field} · {p.japanese_level}
                      </p>
                      {p.admin_note && (
                        <p className="text-ink-faint text-xs mt-1 italic">"{p.admin_note}"</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link to={`/talent/${p.id}`} target="_blank"
                            className="btn-line-ghost no-underline">
                        {t(lang, 'card.viewProfile')}
                      </Link>
                    </div>
                  </div>

                  {isPending && (
                    <div className="mt-4 pt-4 border-t border-hairline flex flex-col sm:flex-row gap-2 items-start">
                      <input
                        className={`flex-1 ${INPUT_CLS}`}
                        placeholder={t(lang, 'admin.notePlaceholder')}
                        value={rejectNote[p.id] ?? ''}
                        onChange={e => setRejectNote(prev => ({ ...prev, [p.id]: e.target.value }))}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(p.id)}
                                disabled={processing === p.id}
                                className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-paper transition-colors cursor-pointer disabled:opacity-50"
                                style={{ backgroundColor: '#1D7E5C' }}>
                          {processing === p.id ? '···' : t(lang, 'admin.approve')}
                        </button>
                        <button onClick={() => handleReject(p.id)}
                                disabled={processing === p.id}
                                className="btn-line px-4 py-2 text-xs disabled:opacity-50">
                          {processing === p.id ? '···' : t(lang, 'admin.reject')}
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
