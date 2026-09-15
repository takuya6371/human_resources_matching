import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, UserPlus, Heart, MessageCircle, CornerDownRight, Megaphone } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../App'
import { t } from '../i18n'
import { supabase } from '../lib/supabase'
import { mapNotificationRow } from '../lib/postMapper'
import type { AppNotification, NotificationType } from '../types'

const ICONS: Partial<Record<NotificationType, typeof Bell>> = {
  follow: UserPlus, like: Heart, comment: MessageCircle, reply: CornerDownRight, platform: Megaphone,
}

const TEXT_KEY: Partial<Record<NotificationType, string>> = {
  follow: 'notifications.textFollow',
  like: 'notifications.textLike',
  comment: 'notifications.textComment',
  reply: 'notifications.textReply',
}

export default function NotificationsPage() {
  const { user, company, loading: authLoading } = useAuth()
  const { lang } = useLang()
  const navigate = useNavigate()
  const selfId = user?.id ?? company?.id ?? null

  const [items, setItems] = useState<AppNotification[]>([])
  const [names, setNames] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!selfId) { navigate('/login'); return }
    load()
  }, [authLoading, selfId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    if (!selfId) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', selfId)
      .order('created_at', { ascending: false })
      .limit(100)
    const mapped = (data ?? []).map(mapNotificationRow)
    setItems(mapped)

    const actorIds = Array.from(new Set(mapped.map(n => n.actorId).filter((id): id is string => !!id)))
    if (actorIds.length > 0) {
      const [{ data: profileRows }, { data: companyRows }] = await Promise.all([
        supabase.from('profiles').select('id, name_en, name_ja').in('id', actorIds),
        supabase.from('companies').select('id, name, name_ja').in('id', actorIds),
      ])
      const map = new Map<string, string>()
      for (const p of profileRows ?? []) map.set(p.id, lang === 'ja' && p.name_ja ? p.name_ja : p.name_en)
      for (const c of companyRows ?? []) map.set(c.id, lang === 'ja' && c.name_ja ? c.name_ja : c.name)
      setNames(map)
    }
    setLoading(false)
  }

  async function markAllRead() {
    const unread = items.filter(n => !n.read)
    if (unread.length === 0) return
    await supabase.from('notifications').update({ read: true }).in('id', unread.map(n => n.id))
    load()
  }

  async function open(n: AppNotification) {
    if (!n.read) {
      await supabase.from('notifications').update({ read: true }).eq('id', n.id)
      load()
    }
  }

  function linkFor(n: AppNotification): string | null {
    if (n.type === 'follow' && n.targetType && n.targetId) {
      return n.targetType === 'company' ? `/company/${n.targetId}` : `/talent/${n.targetId}`
    }
    if (n.targetType === 'post') return '/connect'
    if (n.targetType === 'talent' && n.targetId) return `/talent/${n.targetId}`
    if (n.targetType === 'company' && n.targetId) return `/company/${n.targetId}`
    return null
  }

  function text(n: AppNotification): string {
    const key = TEXT_KEY[n.type]
    if (!key) return n.title
    const name = n.actorId ? (names.get(n.actorId) ?? '—') : '—'
    return t(lang, key).replace('{name}', name)
  }

  if (authLoading || loading) {
    return <div className="min-h-screen line-page flex items-center justify-center text-ink-faint">···</div>
  }

  return (
    <div className="min-h-screen line-page">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display font-medium text-ink text-3xl tracking-wide flex items-center gap-2">
            <Bell className="h-6 w-6" /> {t(lang, 'notifications.title')}
          </h1>
          <button onClick={markAllRead} className="inline-flex items-center gap-1.5 text-ink-soft hover:text-ink transition-colors cursor-pointer text-sm">
            <CheckCheck className="h-4 w-4" /> {t(lang, 'notifications.markAllRead')}
          </button>
        </div>

        {items.length === 0 ? (
          <div className="line-card p-10 text-center text-ink-faint text-sm">{t(lang, 'notifications.empty')}</div>
        ) : (
          <div className="space-y-2">
            {items.map(n => {
              const Icon = ICONS[n.type] ?? Bell
              const to = linkFor(n)
              const inner = (
                <div className={`flex items-start gap-3 p-4 border transition-colors ${n.read ? 'border-hairline' : 'border-seal bg-seal/5'}`}>
                  <div className="avatar-line w-9 h-9 flex-shrink-0"><Icon className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-ink text-sm">{text(n)}</p>
                    <p className="text-ink-faint text-xs mt-1">{new Date(n.createdAt).toLocaleString(lang === 'ja' ? 'ja-JP' : 'en-US')}</p>
                  </div>
                  {!n.read && <span className="mt-1.5 h-2 w-2 flex-shrink-0 bg-seal" />}
                </div>
              )
              return to ? (
                <Link key={n.id} to={to} onClick={() => open(n)} className="block no-underline">{inner}</Link>
              ) : (
                <div key={n.id} onClick={() => open(n)} className="cursor-pointer">{inner}</div>
              )
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
