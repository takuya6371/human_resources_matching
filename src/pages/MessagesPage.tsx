import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Send, ShieldAlert, LifeBuoy } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../App'
import { t } from '../i18n'
import { supabase } from '../lib/supabase'
import { screen } from '../lib/moderation'
import { callEdgeFunction } from '../lib/edgeFunction'
import { mapThreadRow, mapMessageRow } from '../lib/messageMapper'
import type { ChatMessage, Lang, Thread } from '../types'

export default function MessagesPage() {
  const { accountType, user, company, loading: authLoading } = useAuth()
  const { lang } = useLang()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const selfId = user?.id ?? company?.id ?? null
  const isTalent = accountType === 'talent'

  const [threads, setThreads] = useState<Thread[]>([])
  const [names, setNames] = useState<Map<string, string>>(new Map())
  const [unreadThreadIds, setUnreadThreadIds] = useState<Set<string>>(new Set())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingThreads, setLoadingThreads] = useState(true)

  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [blockedNotice, setBlockedNotice] = useState<{ reason: string; strikeCount: number } | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!selfId) { navigate('/login'); return }
    loadThreads()
  }, [authLoading, selfId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selfId) return
    const talentParam = searchParams.get('talent')
    const companyParam = searchParams.get('company')
    if (!talentParam || !companyParam) return
    findOrCreateThread(talentParam, companyParam).then(id => {
      if (id) setSelectedId(id)
      setSearchParams({}, { replace: true })
    })
  }, [selfId, searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selfId) return
    const channel = supabase
      .channel(`messages-list-${selfId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => loadThreads())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'threads' }, () => loadThreads())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selfId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedId) { setMessages([]); return }
    loadMessages(selectedId)
    markRead(selectedId)
    const channel = supabase
      .channel(`thread-${selectedId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `thread_id=eq.${selectedId}` },
        () => { loadMessages(selectedId); markRead(selectedId) })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadThreads() {
    if (!selfId) return
    const { data } = await supabase
      .from('threads')
      .select('*')
      .eq(isTalent ? 'talent_id' : 'company_id', selfId)
      .order('updated_at', { ascending: false })
    const mapped = (data ?? []).map(mapThreadRow)
    setThreads(mapped)
    setLoadingThreads(false)

    const otherIds = Array.from(new Set(mapped.map(th => isTalent ? th.companyId : th.talentId)))
    if (otherIds.length > 0) {
      if (isTalent) {
        const { data: rows } = await supabase.from('companies').select('id, name, name_ja').in('id', otherIds)
        setNames(new Map((rows ?? []).map(r => [r.id, lang === 'ja' && r.name_ja ? r.name_ja : r.name])))
      } else {
        const { data: rows } = await supabase.from('profiles').select('id, name_en, name_ja').in('id', otherIds)
        setNames(new Map((rows ?? []).map(r => [r.id, lang === 'ja' && r.name_ja ? r.name_ja : r.name_en])))
      }
    }

    const ids = mapped.map(th => th.id)
    if (ids.length > 0) {
      const { data: unreadRows } = await supabase
        .from('messages')
        .select('thread_id')
        .in('thread_id', ids)
        .eq('read', false)
        .or(`from_user_id.is.null,from_user_id.neq.${selfId}`)
      setUnreadThreadIds(new Set((unreadRows ?? []).map(r => r.thread_id)))
    } else {
      setUnreadThreadIds(new Set())
    }
  }

  async function findOrCreateThread(talentId: string, companyId: string): Promise<string | null> {
    const { data: existing } = await supabase
      .from('threads').select('id').eq('talent_id', talentId).eq('company_id', companyId).maybeSingle()
    if (existing) { await loadThreads(); return existing.id }
    const { data: created } = await supabase
      .from('threads').insert({ talent_id: talentId, company_id: companyId }).select('id').single()
    await loadThreads()
    return created?.id ?? null
  }

  async function loadMessages(threadId: string) {
    const { data } = await supabase.from('messages').select('*').eq('thread_id', threadId).order('created_at')
    setMessages((data ?? []).map(mapMessageRow))
  }

  async function markRead(threadId: string) {
    if (!selfId) return
    await supabase.from('messages').update({ read: true })
      .eq('thread_id', threadId).eq('read', false)
      .or(`from_user_id.is.null,from_user_id.neq.${selfId}`)
    setUnreadThreadIds(prev => { const next = new Set(prev); next.delete(threadId); return next })
  }

  const selectedThread = threads.find(th => th.id === selectedId) ?? null

  const preview = useMemo(() => {
    if (!text.trim()) return null
    const recent = messages.filter(m => m.kind === 'chat' && m.fromUserId === selfId).slice(-4).map(m => m.text)
    return screen(text, { recent })
  }, [text, messages, selfId])

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || !selectedId || sending || selectedThread?.status === 'flagged') return
    setSending(true)
    setBlockedNotice(null)
    const { data } = await callEdgeFunction<{ message?: any; error?: string; reason?: string; strikeCount?: number }>(
      'send-message', { threadId: selectedId, text: trimmed }
    )
    if (data?.message) {
      setMessages(prev => [...prev, mapMessageRow(data.message)])
      setText('')
    } else if (data?.error === 'blocked') {
      setBlockedNotice({ reason: data.reason ?? '', strikeCount: data.strikeCount ?? 0 })
    } else if (data?.error === 'thread_flagged') {
      await loadThreads()
    }
    setSending(false)
  }

  async function requestSupport() {
    if (!selectedId) return
    await supabase.from('threads').update({ support_requested: true }).eq('id', selectedId)
    await loadThreads()
    await loadMessages(selectedId)
  }

  if (authLoading || loadingThreads) {
    return <div className="min-h-screen line-page flex items-center justify-center text-ink-faint">···</div>
  }

  return (
    <div className="min-h-screen line-page flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col min-h-0">
        <h1 className="font-display font-medium text-ink text-2xl sm:text-3xl tracking-wide mb-6">
          {t(lang, 'messages.title')}
        </h1>

        <div className="line-card flex-1 min-h-[60vh] grid grid-cols-1 md:grid-cols-3 overflow-hidden">
          {/* thread list */}
          <div className={`md:col-span-1 border-r border-hairline overflow-y-auto ${selectedId ? 'hidden md:block' : ''}`}>
            {threads.length === 0 ? (
              <p className="p-6 text-ink-faint text-sm">{t(lang, 'messages.empty')}</p>
            ) : (
              threads.map(th => {
                const otherId = isTalent ? th.companyId : th.talentId
                const name = names.get(otherId) ?? '—'
                const unread = unreadThreadIds.has(th.id)
                return (
                  <button
                    key={th.id}
                    onClick={() => setSelectedId(th.id)}
                    className={`w-full text-left px-4 py-3.5 border-b border-hairline flex items-center gap-3 transition-colors cursor-pointer ${
                      selectedId === th.id ? 'bg-ink text-paper' : 'hover:bg-paper'
                    }`}
                  >
                    <div className="avatar-line w-8 h-8 flex-shrink-0 text-[10px]">{(name || '??').slice(0, 2).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${selectedId === th.id ? 'text-paper' : 'text-ink'}`}>{name}</p>
                      {th.status === 'flagged' && (
                        <span className="text-[10px] uppercase tracking-wide text-seal">
                          {t(lang, 'messages.flaggedBadge')}
                        </span>
                      )}
                    </div>
                    {unread && <span className="h-2 w-2 flex-shrink-0 bg-seal" />}
                  </button>
                )
              })
            )}
          </div>

          {/* conversation */}
          <div className={`md:col-span-2 flex flex-col min-h-0 ${selectedId ? '' : 'hidden md:flex'}`}>
            {!selectedThread ? (
              <div className="flex-1 flex items-center justify-center text-ink-faint text-sm p-6">
                {t(lang, 'messages.emptyThread')}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 px-4 py-3 border-b border-hairline flex-shrink-0">
                  <button onClick={() => setSelectedId(null)} className="md:hidden text-ink-soft hover:text-ink cursor-pointer">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <p className="flex-1 text-ink text-sm font-medium truncate">
                    {names.get(isTalent ? selectedThread.companyId : selectedThread.talentId) ?? '—'}
                  </p>
                  {selectedThread.status === 'open' && !selectedThread.supportRequested && (
                    <button onClick={requestSupport} className="inline-flex items-center gap-1.5 text-ink-faint hover:text-ink transition-colors cursor-pointer text-[11px]">
                      <LifeBuoy className="h-3.5 w-3.5" /> {t(lang, 'messages.requestSupport')}
                    </button>
                  )}
                  {selectedThread.supportRequested && (
                    <span className="text-[11px] text-ink-faint">{t(lang, 'messages.supportRequested')}</span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                  {messages.map(m => (
                    <MessageBubble key={m.id} message={m} isMine={m.fromUserId === selfId} lang={lang} />
                  ))}
                </div>

                <div className="border-t border-hairline p-3 flex-shrink-0">
                  {selectedThread.status === 'flagged' ? (
                    <p className="text-seal text-xs flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5" /> {t(lang, 'messages.threadFlagged')}
                    </p>
                  ) : (
                    <>
                      {preview?.verdict === 'block' && (
                        <p className="text-seal text-xs mb-2">
                          {t(lang, 'messages.warningContains').replace('{reason}', preview.reason)}
                        </p>
                      )}
                      {blockedNotice && (
                        <p className="text-seal text-xs mb-2">
                          {t(lang, 'messages.blocked').replace('{reason}', blockedNotice.reason)}{' '}
                          {t(lang, 'messages.strikeWarning').replace('{count}', String(blockedNotice.strikeCount))}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <textarea
                          value={text}
                          onChange={e => setText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                          placeholder={t(lang, 'messages.placeholder')}
                          rows={1}
                          className="input-line flex-1 resize-none"
                        />
                        <button
                          onClick={handleSend}
                          disabled={sending || !text.trim()}
                          className="btn-line inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Send className="h-3.5 w-3.5" /> {t(lang, 'messages.send')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function MessageBubble({ message, isMine, lang }: { message: ChatMessage; isMine: boolean; lang: Lang }) {
  if (message.kind !== 'chat') {
    return (
      <div className="text-center">
        <p className="inline-block text-xs text-ink-soft bg-paper border border-hairline px-3 py-2 max-w-md">
          {lang === 'ja' && message.translation ? message.translation : message.text}
        </p>
      </div>
    )
  }

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] px-3.5 py-2.5 text-sm ${isMine ? 'bg-ink text-paper' : 'border border-hairline text-ink'}`}>
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
        {message.translation && (
          <p className={`text-[11px] mt-1 whitespace-pre-wrap break-words ${isMine ? 'text-paper/70' : 'text-ink-faint'}`}>
            {message.translation}
          </p>
        )}
      </div>
    </div>
  )
}
