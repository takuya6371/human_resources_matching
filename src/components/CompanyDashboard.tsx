import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../App'
import { t } from '../i18n'
import { uploadProfileImage } from '../lib/storage'
import { isSafeHttpUrl } from '../lib/url'
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

const INPUT_CLS = 'input-line'
const LABEL_CLS = 'label-line'

export default function CompanyDashboard({ company }: { company: Company }) {
  const { logout, updateCompany } = useAuth()
  const { lang, setLang } = useLang()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState<EditForm | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoError, setLogoError] = useState('')

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
    setLogoError('')
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setLogoError('')
    setUploadingLogo(true)
    try {
      const url = await uploadProfileImage(file, company.id)
      setField('logoUrl', url)
    } catch (err) {
      setLogoError(err instanceof Error && err.message === 'FILE_TOO_LARGE'
        ? (lang === 'ja' ? 'ファイルサイズは5MB以下にしてください。' : 'File must be under 5MB.')
        : (lang === 'ja' ? 'アップロードに失敗しました。' : 'Upload failed.'))
    } finally {
      setUploadingLogo(false)
    }
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
    <div className="min-h-screen line-page">
      <nav className="line-page border-b border-hairline sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <span className="font-display font-medium text-lg text-ink tracking-wide uppercase">AfriTalent</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/talents" className="text-ink-soft text-sm hover:text-ink transition-colors no-underline">
              {t(lang, 'nav.talents')}
            </Link>
            <div className="hidden sm:flex items-center border border-hairline">
              <button onClick={() => setLang('ja')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${lang === 'ja' ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'}`}>JA</button>
              <button onClick={() => setLang('en')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer border-l border-hairline ${lang === 'en' ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'}`}>EN</button>
              <button onClick={() => setLang('fr')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer border-l border-hairline ${lang === 'fr' ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'}`}>FR</button>
            </div>
            <button onClick={handleLogout}
                    className="text-ink-soft text-sm hover:text-ink transition-colors cursor-pointer">
              {t(lang, 'dashboard.logout')}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-ink-soft text-sm mb-1">{t(lang, 'dashboard.welcome')}</p>
            <h1 className="font-display font-medium text-ink text-2xl sm:text-3xl tracking-wide">
              {name}
            </h1>
          </div>
          {!editing && (
            <button onClick={startEdit} className="btn-line whitespace-nowrap self-start">
              {t(lang, 'dashboard.editBtn')}
            </button>
          )}
        </div>

        {saved && (
          <div className="mb-6 px-4 py-3 border text-sm flex items-center gap-2"
               style={{ borderColor: '#1D7E5C', color: '#1D7E5C' }}>
            ✓ {t(lang, 'dashboard.savedMsg')}
          </div>
        )}

        {editing && form ? (
          <form onSubmit={handleSave}>
            <section className="line-card p-6 space-y-4">
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
                <div className="flex items-center gap-4 mb-3">
                  {form.logoUrl ? (
                    <img src={form.logoUrl} alt="" className="avatar-line w-16 h-16 text-lg" />
                  ) : (
                    <div className="avatar-line w-16 h-16 text-lg">
                      {initial}
                    </div>
                  )}
                  <label className="btn-line text-xs px-4 py-2 cursor-pointer">
                    {uploadingLogo ? '···' : t(lang, 'dashboard.uploadPhoto')}
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} disabled={uploadingLogo} />
                  </label>
                </div>
                {logoError && <p className="text-xs mb-2 text-seal">{logoError}</p>}
                <input className={INPUT_CLS} value={form.logoUrl} onChange={e => setField('logoUrl', e.target.value)} placeholder="https://" />
              </div>
            </section>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button type="button" onClick={() => setEditing(false)}
                      className="px-6 py-2.5 text-sm text-ink-soft hover:text-ink transition-colors cursor-pointer border border-hairline">
                {t(lang, 'dashboard.cancelBtn')}
              </button>
              <button type="submit" className="btn-line px-8">
                {t(lang, 'dashboard.saveBtn')}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="line-card p-6">
              <div className="flex items-center gap-4">
                {company.logoUrl ? (
                  <img src={company.logoUrl} alt="" className="avatar-line w-20 h-20 text-2xl" />
                ) : (
                  <div className="avatar-line w-20 h-20 text-2xl">
                    {initial}
                  </div>
                )}
                <div>
                  <h2 className="font-display font-medium text-ink text-xl tracking-wide">{name}</h2>
                  {company.email && <p className="text-ink-faint text-xs mt-0.5">{company.email}</p>}
                  {company.industry && <p className="text-ink-soft text-sm mt-0.5">{company.industry}{company.size ? ` · ${company.size}` : ''}</p>}
                </div>
              </div>
            </div>

            {company.description && (
              <section className="line-card p-6">
                <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-3">
                  {t(lang, 'dashboard.companyDescription')}
                </h2>
                <p className="text-ink-soft text-sm leading-relaxed">{company.description}</p>
              </section>
            )}

            {company.website && (
              <section className="line-card p-6">
                <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-3">
                  {t(lang, 'dashboard.companyWebsite')}
                </h2>
                {isSafeHttpUrl(company.website) ? (
                  <a href={company.website} target="_blank" rel="noreferrer" className="text-seal hover:opacity-70 text-sm break-all">
                    {company.website}
                  </a>
                ) : (
                  <span className="text-ink-soft text-sm break-all">{company.website}</span>
                )}
              </section>
            )}

            <div className="line-card p-6">
              <p className="text-ink-faint text-xs mb-3">{t(lang, 'dashboard.editHint')}</p>
              <button onClick={startEdit} className="btn-line w-full justify-center">
                {t(lang, 'dashboard.editBtn')}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
