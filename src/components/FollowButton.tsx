import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../App'
import { t } from '../i18n'
import { supabase } from '../lib/supabase'

interface Props {
  targetType: 'talent' | 'company'
  targetId: string
  small?: boolean
}

export default function FollowButton({ targetType, targetId, small }: Props) {
  const { user, company, accountType } = useAuth()
  const { lang } = useLang()
  const selfId = user?.id ?? company?.id ?? null
  const isSelf = accountType === targetType && selfId === targetId

  const [followId, setFollowId] = useState<string | null | undefined>(undefined)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!selfId || isSelf) { setFollowId(null); return }
    let cancelled = false
    supabase
      .from('follows')
      .select('id')
      .eq('follower_id', selfId)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .maybeSingle()
      .then(({ data }) => { if (!cancelled) setFollowId(data?.id ?? null) })
    return () => { cancelled = true }
  }, [selfId, isSelf, targetType, targetId])

  if (isSelf) return null

  async function toggle() {
    if (!selfId) return
    setBusy(true)
    if (followId) {
      await supabase.from('follows').delete().eq('id', followId)
      setFollowId(null)
    } else {
      const { data } = await supabase
        .from('follows')
        .insert({ follower_id: selfId, target_type: targetType, target_id: targetId })
        .select('id')
        .single()
      setFollowId(data?.id ?? null)
    }
    setBusy(false)
  }

  const sizeCls = small ? 'text-[10px] px-3 py-1.5' : 'text-[11px] px-6 py-3'

  if (!selfId) {
    return (
      <Link
        to="/login"
        className={`inline-flex items-center gap-1.5 border border-hairline text-ink-soft hover:text-ink hover:border-ink transition-colors font-semibold uppercase tracking-[0.1em] no-underline ${sizeCls}`}
      >
        {t(lang, 'follow.follow')}
      </Link>
    )
  }

  return (
    <button
      onClick={toggle}
      disabled={busy || followId === undefined}
      className={`inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.1em] transition-colors cursor-pointer disabled:opacity-50 ${sizeCls} ${
        followId ? 'border border-hairline text-ink hover:border-seal hover:text-seal' : 'btn-line'
      }`}
    >
      {busy ? '···' : followId ? t(lang, 'follow.following') : t(lang, 'follow.follow')}
    </button>
  )
}
