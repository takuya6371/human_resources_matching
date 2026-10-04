import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useLang } from '../../App'
import { t } from '../../i18n'
import { supabase } from '../../lib/supabase'

interface TrustedCompany {
  id: string
  name: string
  logo_url: string | null
  website: string | null
  sort_order: number
  visible: boolean
}

const EMPTY: Omit<TrustedCompany, 'id'> = {
  name: '', logo_url: '', website: '', sort_order: 0, visible: true,
}

const INPUT_CLS = 'input-line'
const LABEL_CLS = 'label-line'

// trusted_companies は Phase 1c でテーブルだけ作られ、読む画面も書く画面も
// 無いまま放置されていた。トップの TrustedCompanies が読み手、ここが書き手。
export default function AdminTrustedCompaniesPage() {
  const { lang } = useLang()
  const [rows, setRows] = useState<TrustedCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<TrustedCompany | (Omit<TrustedCompany, 'id'> & { id?: undefined }) | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('trusted_companies').select('*').order('sort_order')
    setRows((data as TrustedCompany[]) ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function save() {
    if (!editing) return
    setSaving(true)
    if (editing.id) {
      const { id, ...updates } = editing
      await supabase.from('trusted_companies').update(updates).eq('id', id)
    } else {
      const { id: _unused, ...toInsert } = editing
      await supabase.from('trusted_companies').insert(toInsert)
    }
    await load()
    setEditing(null)
    setSaving(false)
  }

  async function del(c: TrustedCompany) {
    await supabase.from('trusted_companies').delete().eq('id', c.id)
    await load()
  }

  async function toggleVisible(c: TrustedCompany) {
    await supabase.from('trusted_companies').update({ visible: !c.visible }).eq('id', c.id)
    await load()
  }

  if (loading) return <div className="px-6 py-8 lg:px-8 text-ink-faint text-sm">···</div>

  return (
    <div className="px-6 py-8 lg:px-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display font-medium text-ink text-2xl tracking-wide">{t(lang, 'adminTrusted.title')}</h1>
        <button onClick={() => setEditing({ ...EMPTY })} className="btn-line inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> {t(lang, 'adminTrusted.add')}
        </button>
      </div>
      <p className="text-ink-soft text-sm mb-6">{t(lang, 'adminTrusted.sub')}</p>

      {editing && (
        <div className="line-card p-6 mb-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>{t(lang, 'adminTrusted.name')}</label>
              <input className={INPUT_CLS} value={editing.name}
                     onChange={e => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <label className={LABEL_CLS}>{t(lang, 'adminTrusted.order')}</label>
              <input className={INPUT_CLS} type="number" value={editing.sort_order}
                     onChange={e => setEditing({ ...editing, sort_order: Number(e.target.value) || 0 })} />
            </div>
            <div>
              <label className={LABEL_CLS}>{t(lang, 'adminTrusted.logoUrl')}</label>
              <input className={INPUT_CLS} value={editing.logo_url ?? ''} placeholder="https://"
                     onChange={e => setEditing({ ...editing, logo_url: e.target.value })} />
            </div>
            <div>
              <label className={LABEL_CLS}>{t(lang, 'adminTrusted.website')}</label>
              <input className={INPUT_CLS} value={editing.website ?? ''} placeholder="https://"
                     onChange={e => setEditing({ ...editing, website: e.target.value })} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" checked={editing.visible} className="accent-ink"
                   onChange={e => setEditing({ ...editing, visible: e.target.checked })} />
            {t(lang, 'adminTrusted.visible')}
          </label>
          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={saving || !editing.name} className="btn-line disabled:opacity-50">
              {saving ? '···' : t(lang, 'adminTrusted.save')}
            </button>
            <button onClick={() => setEditing(null)}
                    className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] border border-hairline text-ink-soft hover:text-ink transition-colors cursor-pointer">
              {t(lang, 'dashboard.cancelBtn')}
            </button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-ink-faint text-sm">{t(lang, 'adminTrusted.empty')}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(c => (
            <div key={c.id} className={`line-card p-4 ${!c.visible ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3">
                {c.logo_url
                  ? <img src={c.logo_url} alt="" className="avatar-line w-12 h-12" />
                  : <div className="avatar-line w-12 h-12">{(c.name || '?').slice(0, 2).toUpperCase()}</div>}
                <div className="flex-1 min-w-0">
                  <p className="text-ink font-medium text-sm truncate">{c.name}</p>
                  <p className="text-ink-faint text-xs truncate">{c.website || '—'}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2 text-xs">
                <button onClick={() => setEditing(c)} className="btn-line-ghost">{t(lang, 'adminTrusted.edit')}</button>
                <button onClick={() => toggleVisible(c)} className="btn-line-ghost">
                  {c.visible ? t(lang, 'adminTrusted.hide') : t(lang, 'adminTrusted.show')}
                </button>
                <button onClick={() => del(c)} className="text-ink-faint hover:text-seal transition-colors cursor-pointer">
                  {t(lang, 'adminTrusted.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
