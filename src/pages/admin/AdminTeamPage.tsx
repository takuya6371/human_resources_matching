import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useLang } from '../../App'
import { t } from '../../i18n'
import { supabase } from '../../lib/supabase'

interface TeamMember {
  id: string
  name: string
  photo: string | null
  position: string
  bio: string | null
  location: string | null
  linkedin: string | null
  website: string | null
  display_order: number
  active: boolean
}

const EMPTY: Omit<TeamMember, 'id'> = {
  name: '', photo: '', position: '', bio: '', location: '', linkedin: '', website: '', display_order: 0, active: true,
}

const INPUT_CLS = 'input-line'
const LABEL_CLS = 'label-line'

export default function AdminTeamPage() {
  const { lang } = useLang()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<TeamMember | (Omit<TeamMember, 'id'> & { id?: undefined }) | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('team_members').select('*').order('display_order')
    setMembers((data as TeamMember[]) ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function save() {
    if (!editing) return
    setSaving(true)
    if (editing.id) {
      const { id, ...updates } = editing
      await supabase.from('team_members').update(updates).eq('id', id)
    } else {
      const { id: _unused, ...toInsert } = editing
      await supabase.from('team_members').insert(toInsert)
    }
    await load()
    setEditing(null)
    setSaving(false)
  }

  async function del(m: TeamMember) {
    await supabase.from('team_members').delete().eq('id', m.id)
    await load()
  }

  async function toggleActive(m: TeamMember) {
    await supabase.from('team_members').update({ active: !m.active }).eq('id', m.id)
    await load()
  }

  if (loading) return <div className="px-6 py-8 lg:px-8 text-ink-faint text-sm">···</div>

  return (
    <div className="px-6 py-8 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-medium text-ink text-2xl tracking-wide">{t(lang, 'adminTeam.title')}</h1>
        <button onClick={() => setEditing({ ...EMPTY })} className="btn-line inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> {t(lang, 'adminTeam.add')}
        </button>
      </div>

      {editing && (
        <div className="line-card p-6 mb-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>{t(lang, 'adminTeam.name')}</label>
              <input className={INPUT_CLS} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <label className={LABEL_CLS}>{t(lang, 'adminTeam.position')}</label>
              <input className={INPUT_CLS} value={editing.position} onChange={e => setEditing({ ...editing, position: e.target.value })} />
            </div>
            <div>
              <label className={LABEL_CLS}>{t(lang, 'adminTeam.photoUrl')}</label>
              <input className={INPUT_CLS} value={editing.photo ?? ''} onChange={e => setEditing({ ...editing, photo: e.target.value })} placeholder="https://" />
            </div>
            <div>
              <label className={LABEL_CLS}>{t(lang, 'adminTeam.location')}</label>
              <input className={INPUT_CLS} value={editing.location ?? ''} onChange={e => setEditing({ ...editing, location: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL_CLS}>{t(lang, 'adminTeam.bio')}</label>
              <textarea className={`${INPUT_CLS} resize-none`} rows={2} value={editing.bio ?? ''} onChange={e => setEditing({ ...editing, bio: e.target.value })} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" checked={editing.active} onChange={e => setEditing({ ...editing, active: e.target.checked })} className="accent-ink" />
            {t(lang, 'adminTeam.visible')}
          </label>
          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={saving || !editing.name || !editing.position} className="btn-line disabled:opacity-50">
              {saving ? '···' : t(lang, 'adminTeam.save')}
            </button>
            <button onClick={() => setEditing(null)} className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] border border-hairline text-ink-soft hover:text-ink transition-colors cursor-pointer">
              {t(lang, 'dashboard.cancelBtn')}
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {members.map(m => (
          <div key={m.id} className={`line-card p-4 ${!m.active ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-3">
              {m.photo ? (
                <img src={m.photo} alt="" className="avatar-line w-12 h-12" />
              ) : (
                <div className="avatar-line w-12 h-12">{(m.name || '?').slice(0, 2).toUpperCase()}</div>
              )}
              <div className="flex-1">
                <p className="text-ink font-medium text-sm">{m.name}</p>
                <p className="text-ink-faint text-xs">{m.position}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2 text-xs">
              <button onClick={() => setEditing(m)} className="btn-line-ghost">{t(lang, 'adminTeam.edit')}</button>
              <button onClick={() => toggleActive(m)} className="btn-line-ghost">
                {m.active ? t(lang, 'adminTeam.hide') : t(lang, 'adminTeam.show')}
              </button>
              <button onClick={() => del(m)} className="text-ink-faint hover:text-seal transition-colors cursor-pointer">
                {t(lang, 'adminTeam.delete')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
