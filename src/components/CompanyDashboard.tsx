import { useEffect, useRef, useState } from 'react'
import Navbar from './Navbar'
import EmailVerificationNotice from './EmailVerificationNotice'
import Footer from './Footer'
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
  const { updateCompany } = useAuth()
  const { lang } = useLang()
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const resultRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    if (saved || saveError) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [saved, saveError])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    if (saving) return
    setSaving(true)
    setSaveError('')
    try {
      const { error } = await updateCompany(form)
      if (error) { setSaveError(error); return }
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  function setField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm(f => f ? { ...f, [key]: value } : f)
  }


  const initial = company.name ? company.name.slice(0, 2).toUpperCase() : '??'

  return (
    <div className="min-h-screen line-page">
      {/* 人材側と同じ理由: 保存ボタンがフォーム最下部にあり、
          ボタンの文字だけでは処理中だと分からない。 */}
      {saving && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center"
             style={{ backgroundColor: 'rgba(250,248,244,0.86)' }}
             role="status" aria-live="polite">
          <div className="flex flex-col items-center gap-4">
            <span className="block h-8 w-8 border-2 border-hairline border-t-ink rounded-full animate-spin" />
            <p className="text-ink text-sm">{t(lang, 'dashboard.saving')}</p>
          </div>
        </div>
      )}
      <Navbar />
      <EmailVerificationNotice />

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

        <div ref={resultRef} className="scroll-mt-24">
        {saved && (
          <div className="mb-6 px-4 py-3 border text-sm flex items-center gap-2"
               style={{ borderColor: '#1D7E5C', color: '#1D7E5C' }}>
            ✓ {t(lang, 'dashboard.savedMsg')}
          </div>
        )}
        {saveError && (
          <div className="mb-6 px-4 py-3 border border-seal text-seal text-sm" role="alert">
            <p className="font-medium">{t(lang, 'dashboard.saveFailed')}</p>
            <p className="mt-1 text-xs break-all opacity-80">{saveError}</p>
          </div>
        )}
        </div>

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
              <button type="submit" disabled={saving}
                      className="btn-line px-8 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? t(lang, 'dashboard.saving') : t(lang, 'dashboard.saveBtn')}
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
      <Footer />
    </div>
  )
}
