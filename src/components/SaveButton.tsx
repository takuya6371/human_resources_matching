import { useEffect, useState } from 'react'
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { SavedItemType } from '../types'

interface Props {
  itemType: SavedItemType
  itemId: string
  small?: boolean
}

export default function SaveButton({ itemType, itemId, small }: Props) {
  const { user, company } = useAuth()
  const selfId = user?.id ?? company?.id ?? null
  const [savedId, setSavedId] = useState<string | null | undefined>(undefined)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!selfId) { setSavedId(null); return }
    let cancelled = false
    supabase
      .from('saved_items')
      .select('id')
      .eq('user_id', selfId)
      .eq('item_type', itemType)
      .eq('item_id', itemId)
      .maybeSingle()
      .then(({ data }) => { if (!cancelled) setSavedId(data?.id ?? null) })
    return () => { cancelled = true }
  }, [selfId, itemType, itemId])

  async function toggle() {
    if (!selfId) return
    setBusy(true)
    if (savedId) {
      await supabase.from('saved_items').delete().eq('id', savedId)
      setSavedId(null)
    } else {
      const { data } = await supabase
        .from('saved_items')
        .insert({ user_id: selfId, item_type: itemType, item_id: itemId })
        .select('id')
        .single()
      setSavedId(data?.id ?? null)
    }
    setBusy(false)
  }

  const size = small ? 'h-8 w-8' : 'h-10 w-10'

  if (!selfId) return null

  return (
    <button
      onClick={toggle}
      disabled={busy || savedId === undefined}
      aria-label="Save"
      className={`inline-flex ${size} items-center justify-center border border-hairline hover:border-ink transition-colors cursor-pointer disabled:opacity-50`}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin text-ink-faint" />
      ) : savedId ? (
        <BookmarkCheck className="h-4 w-4 text-seal" />
      ) : (
        <Bookmark className="h-4 w-4 text-ink-faint" />
      )}
    </button>
  )
}
