import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../App'
import { t } from '../i18n'
import { supabase } from '../lib/supabase'

interface Reply { id: string; authorId: string; authorName: string; isAdmin: boolean; body: string; createdAt: string }
interface Thread { id: string; authorId: string; authorName: string; title: string; body: string; createdAt: string; replies: Reply[] }

// 相談は人材と運営だけの場。企業から見えるとビザや帰国の本音が書けなくなるため、
// RLSで企業を弾いている（20260922000000_talent_board.sql）。画面側でも企業には出さない。
export default function BoardPage() {
  const { user, accountType, loading: authLoading } = useAuth()
  const { lang } = useLang()
  const navigate = useNavigate()

  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user || accountType === 'company') { navigate('/'); return }
    load()
  }, [authLoading, user, accountType])

  async function load() {
    const [{ data: threadRows }, { data: replyRows }] = await Promise.all([
      supabase.from('board_threads').select('*, profiles!board_threads_author_id_fkey(name_en, name_ja, role)').order('created_at', { ascending: false }),
      supabase.from('board_replies').select('*, profiles!board_replies_author_id_fkey(name_en, name_ja, role)').order('created_at'),
    ])

    const name = (p: any) => (lang === 'ja' ? p?.name_ja : p?.name_en) || p?.name_en || t(lang, 'board.anonymous')

    const replies = (replyRows ?? []).map(r => ({
      id: r.id, authorId: r.author_id, authorName: name(r.profiles),
      isAdmin: r.profiles?.role === 'admin', body: r.body, createdAt: r.created_at,
    }))

    setThreads((threadRows ?? []).map(row => ({
      id: row.id, authorId: row.author_id, authorName: name(row.profiles),
      title: row.title, body: row.body, createdAt: row.created_at,
      replies: replies.filter(r => (replyRows ?? []).find(x => x.id === r.id)?.thread_id === row.id),
    })))
    setLoading(false)
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !title.trim() || !body.trim()) return
    setPosting(true)
    await supabase.from('board_threads').insert({ author_id: user.id, title: title.trim(), body: body.trim() })
    setTitle(''); setBody('')
    await load()
    setPosting(false)
  }

  async function handleReply(threadId: string) {
    if (!user || !replyBody.trim()) return
    await supabase.from('board_replies').insert({ thread_id: threadId, author_id: user.id, body: replyBody.trim() })
    setReplyBody('')
    await load()
  }

  async function handleDelete(id: string, kind: 'thread' | 'reply') {
    await supabase.from(kind === 'thread' ? 'board_threads' : 'board_replies').delete().eq('id', id)
    await load()
  }

  if (authLoading || loading) return <div className="min-h-screen line-page" />

  return (
    <div className="min-h-screen line-page flex flex-col">
      <Navbar />
      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1">
        <h1 className="font-display font-medium text-ink text-2xl sm:text-3xl mb-2">{t(lang, 'board.title')}</h1>
        <p className="text-ink-soft text-sm mb-8">{t(lang, 'board.subtitle')}</p>

        <form onSubmit={handlePost} className="line-card p-6 mb-8">
          <label className="label-line">{t(lang, 'board.titleLabel')}</label>
          <input className="input-line mb-4" value={title} onChange={e => setTitle(e.target.value)}
                 placeholder={t(lang, 'board.titlePlaceholder')} maxLength={200} />
          <label className="label-line">{t(lang, 'board.bodyLabel')}</label>
          <textarea className="input-line resize-none mb-4" rows={4} value={body}
                    onChange={e => setBody(e.target.value)} placeholder={t(lang, 'board.bodyPlaceholder')} maxLength={4000} />
          <button type="submit" disabled={posting || !title.trim() || !body.trim()}
                  className="btn-line disabled:opacity-40 disabled:cursor-not-allowed">
            {posting ? '···' : t(lang, 'board.postBtn')}
          </button>
        </form>

        {threads.length === 0 ? (
          <p className="text-ink-soft text-sm text-center py-10">{t(lang, 'board.empty')}</p>
        ) : (
          <div className="space-y-4">
            {threads.map(th => (
              <section key={th.id} className="line-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-ink font-medium">{th.title}</h2>
                    <p className="text-ink-faint text-xs mt-1">
                      {th.authorName} · {new Date(th.createdAt).toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-US')}
                    </p>
                  </div>
                  {(th.authorId === user?.id || accountType === 'admin') && (
                    <button onClick={() => handleDelete(th.id, 'thread')}
                            className="text-xs text-ink-faint hover:text-seal shrink-0">{t(lang, 'board.delete')}</button>
                  )}
                </div>
                <p className="text-ink-soft text-sm mt-3 whitespace-pre-line leading-relaxed">{th.body}</p>

                {th.replies.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-hairline space-y-4">
                    {th.replies.map(r => (
                      <div key={r.id} className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs">
                            <span className="text-ink font-medium">{r.authorName}</span>
                            {r.isAdmin && <span className="badge-line ml-2 text-[10px]">{t(lang, 'board.adminBadge')}</span>}
                          </p>
                          <p className="text-ink-soft text-sm mt-1 whitespace-pre-line leading-relaxed">{r.body}</p>
                        </div>
                        {(r.authorId === user?.id || accountType === 'admin') && (
                          <button onClick={() => handleDelete(r.id, 'reply')}
                                  className="text-xs text-ink-faint hover:text-seal shrink-0">{t(lang, 'board.delete')}</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-hairline">
                  {openId === th.id ? (
                    <>
                      <textarea className="input-line resize-none mb-3" rows={3} value={replyBody}
                                onChange={e => setReplyBody(e.target.value)}
                                placeholder={t(lang, 'board.replyPlaceholder')} maxLength={4000} />
                      <div className="flex gap-2">
                        <button onClick={() => handleReply(th.id)} disabled={!replyBody.trim()}
                                className="btn-line text-xs px-4 py-2 disabled:opacity-40">{t(lang, 'board.replyBtn')}</button>
                        <button onClick={() => { setOpenId(null); setReplyBody('') }}
                                className="btn-line-ghost text-xs px-4 py-2">{t(lang, 'dashboard.cancelBtn')}</button>
                      </div>
                    </>
                  ) : (
                    <button onClick={() => { setOpenId(th.id); setReplyBody('') }}
                            className="text-sm text-seal hover:opacity-70">{t(lang, 'board.replyOpen')}</button>
                  )}
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
