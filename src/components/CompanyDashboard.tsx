import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../App'
import { t } from '../i18n'
import type { Company } from '../types'

interface EditForm {
  name: string
  nameJa: string
  description: string
  industry: string
  size: string
  website: string
  logoUrl: string
}

const INPUT_CLS = 'w-full bg-dark-3 border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 outline-none focus:border-a-orange/40 transition-colors'
const LABEL_CLS = 'block text-white/40 text-xs font-medium mb-1.5 uppercase tracking-wider'

export default function CompanyDashboard({ company }: { company: Company }) {
  const { logout, updateCompany } = useAuth()
  const { lang, setLang } = useLang()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState<EditForm | null>(null)

  const name = lang === 'ja' && company.nameJa ? company.nameJa : company.name

  function startEdit() {
    setForm({
      name: company.name,
      nameJa: company.nameJa,
      description: company.description,
      industry: company.industry,
      size: company.size,
      website: company.website,
      logoUrl: company.logoUrl,
    })
    setEditing(true)
    setSaved(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    await updateCompany(form)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function setField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm(f => f ? { ...f, [key]: value } : f)
  }

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const initial = company.name ? company.name.slice(0, 2).toUpperCase() : '??'

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
          <div className="flex items-center gap-3">
            <Link to="/talents" className="text-white/60 text-sm hover:text-white transition-colors no-underline">
              {t(lang, 'nav.talents')}
            </Link>
            <div className="flex items-center bg-dark-3 rounded-lg p-0.5 border border-white/[0.08]">
              <button onClick={() => setLang('ja')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${lang === 'ja' ? 'bg-white text-dark' : 'text-white/50 hover:text-white/80'}`}>JA</button>
              <button onClick={() => setLang('en')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${lang === 'en' ? 'bg-white text-dark' : 'text-white/50 hover:text-white/80'}`}>EN</button>
              <button onClick={() => setLang('fr')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${lang === 'fr' ? 'bg-white text-dark' : 'text-white/50 hover:text-white/80'}`}>FR</button>
            </div>
            <button onClick={handleLogout}
                    className="text-white/40 text-sm hover:text-white/70 transition-colors cursor-pointer">
              {t(lang, 'dashboard.logout')}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-white/40 text-sm mb-1">{t(lang, 'dashboard.welcome')}</p>
            <h1 className="text-2xl sm:text-3xl font-medium text-white tracking-tight" style={{ letterSpacing: '-0.02em' }}>
              {name}
            </h1>
          </div>
          {!editing && (
            <button onClick={startEdit} className="btn-primary flex items-center gap-2 whitespace-nowrap self-start">
              ✏️ {t(lang, 'dashboard.editBtn')}
            </button>
          )}
        </div>

        {saved && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
               style={{ background: 'rgba(29,158,117,0.12)', color: '#1D9E75', border: '0.5px solid rgba(29,158,117,0.2)' }}>
            ✓ {t(lang, 'dashboard.savedMsg')}
          </div>
        )}

        {editing && form ? (
          <form onSubmit={handleSave}>
            <section className="bg-dark-2 rounded-2xl p-6 card-border space-y-4">
              <div>
                <label className={LABEL_CLS}>{t(lang, 'dashboard.companyName')}</label>
                <input className={INPUT_CLS} value={form.name} onChange={e => setField('name', e.target.value)} />
              </div>
              <div>
                <label className={LABEL_CLS}>{t(lang, 'dashboard.companyNameJa')}</label>
                <input className={INPUT_CLS} value={form.nameJa} onChange={e => setField('nameJa', e.target.value)} />
              </div>
              <div>
                <label className={LABEL_CLS}>{t(lang, 'dashboard.companyDescription')}</label>
                <textarea className={`${INPUT_CLS} resize-none`} rows={4} value={form.description}
                          onChange={e => setField('description', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLS}>{t(lang, 'dashboard.companyIndustry')}</label>
                  <input className={INPUT_CLS} value={form.industry} onChange={e => setField('industry', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL_CLS}>{t(lang, 'dashboard.companySize')}</label>
                  <input className={INPUT_CLS} value={form.size} onChange={e => setField('size', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={LABEL_CLS}>{t(lang, 'dashboard.companyWebsite')}</label>
                <input className={INPUT_CLS} value={form.website} onChange={e => setField('website', e.target.value)} placeholder="https://" />
              </div>
              <div>
                <label className={LABEL_CLS}>{t(lang, 'dashboard.companyLogoUrl')}</label>
                <input className={INPUT_CLS} value={form.logoUrl} onChange={e => setField('logoUrl', e.target.value)} placeholder="https://" />
              </div>
            </section>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button type="button" onClick={() => setEditing(false)}
                      className="px-6 py-2.5 rounded-xl text-sm text-white/50 hover:text-white/80 transition-colors cursor-pointer bg-dark-3 border border-white/[0.08]">
                {t(lang, 'dashboard.cancelBtn')}
              </button>
              <button type="submit" className="btn-primary px-8">
                {t(lang, 'dashboard.saveBtn')}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="relative bg-dark-2 rounded-2xl p-6 card-border overflow-hidden">
              <div className="relative flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-semibold flex-shrink-0"
                     style={{ background: 'rgba(29,158,117,0.15)', border: '1.5px solid rgba(29,158,117,0.3)', color: '#1D9E75' }}>
                  {initial}
                </div>
                <div>
                  <h2 className="text-xl font-medium text-white tracking-tight">{name}</h2>
                  {company.email && <p className="text-white/30 text-xs mt-0.5">{company.email}</p>}
                  {company.industry && <p className="text-white/40 text-sm mt-0.5">{company.industry}{company.size ? ` · ${company.size}` : ''}</p>}
                </div>
              </div>
            </div>

            {company.description && (
              <section className="bg-dark-2 rounded-2xl p-6 card-border">
                <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">
                  {t(lang, 'dashboard.companyDescription')}
                </h2>
                <p className="text-white/70 text-sm leading-relaxed">{company.description}</p>
              </section>
            )}

            {company.website && (
              <section className="bg-dark-2 rounded-2xl p-6 card-border">
                <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">
                  {t(lang, 'dashboard.companyWebsite')}
                </h2>
                <a href={company.website} target="_blank" rel="noreferrer" className="text-a-orange hover:opacity-80 text-sm break-all">
                  {company.website}
                </a>
              </section>
            )}

            <div className="bg-dark-2 rounded-2xl p-6 card-border">
              <p className="text-white/40 text-xs mb-3">{t(lang, 'dashboard.editHint')}</p>
              <button onClick={startEdit} className="w-full btn-primary text-center py-2.5">
                ✏️ {t(lang, 'dashboard.editBtn')}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
