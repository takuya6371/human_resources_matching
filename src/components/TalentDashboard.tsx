import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../App'
import { t } from '../i18n'
import { uploadProfileImage } from '../lib/storage'
import { isSafeHttpUrl } from '../lib/url'
import { fillMissingJapanese, translateToJa } from '../lib/translate'
import type { User, JLPTLevel, LanguageLevel, Language, Experience } from '../types'

const LEVELS: JLPTLevel[] = ['N1', 'N2', 'N3', 'N4', 'N5']
const LANG_LEVELS: LanguageLevel[] = ['Native', 'Fluent', 'Business', 'Conversational', 'Basic']

interface EditForm {
  email: string
  nameEn: string
  nameJa: string
  headlineEn: string
  headlineJa: string
  university: string
  universityJa: string
  faculty: string
  facultyJa: string
  japaneseLevel: JLPTLevel
  openToWork: boolean
  skillsEn: string
  skillsJa: string
  bioEn: string
  bioJa: string
  availableFrom: string
  availableFromJa: string
  languages: Language[]
  experience: Experience[]
  residenceArea: string
  devExperienceYears: string
  yearsInJapan: string
  hobbies: string
  videoUrl: string
  pastClients: string
  avatarUrl: string
}

const INPUT_CLS = 'input-line'
const LABEL_CLS = 'label-line'

const STATUS_COLOR: Record<string, string> = {
  draft: '#B7B2A1',
  pending: '#BA7517',
  approved: '#1D7E5C',
  rejected: '#A6332B',
}

export default function TalentDashboard({ user }: { user: User }) {
  const { logout, updateProfile, submitForReview } = useAuth()
  const { lang, setLang } = useLang()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<EditForm | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState('')

  const name = lang === 'ja' ? user.nameJa : user.nameEn
  const skills = lang === 'ja' ? user.skillsJa : user.skills
  const bio = lang === 'ja' ? user.bioJa : user.bioEn

  function startEdit() {
    setForm({
      email: user.email ?? '',
      nameEn: user.nameEn,
      nameJa: user.nameJa,
      headlineEn: user.headlineEn,
      headlineJa: user.headlineJa,
      university: user.university,
      universityJa: user.universityJa,
      faculty: user.faculty,
      facultyJa: user.facultyJa,
      japaneseLevel: user.japaneseLevel,
      openToWork: user.openToWork,
      skillsEn: user.skills.join(', '),
      skillsJa: user.skillsJa.join(', '),
      bioEn: user.bioEn,
      bioJa: user.bioJa,
      availableFrom: user.availableFrom,
      availableFromJa: user.availableFromJa,
      languages: user.languages,
      experience: user.experience,
      residenceArea: user.residenceArea ?? '',
      devExperienceYears: user.devExperienceYears != null ? String(user.devExperienceYears) : '',
      yearsInJapan: user.yearsInJapan != null ? String(user.yearsInJapan) : '',
      hobbies: user.hobbies ?? '',
      videoUrl: user.videoUrl ?? '',
      pastClients: (user.pastClients ?? []).join(', '),
      avatarUrl: user.avatarUrl ?? '',
    })
    setEditing(true)
    setSaved(false)
    setAvatarError('')
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setAvatarError('')
    setUploadingAvatar(true)
    try {
      const url = await uploadProfileImage(file, user.id)
      setField('avatarUrl', url)
    } catch (err) {
      setAvatarError(err instanceof Error && err.message === 'FILE_TOO_LARGE'
        ? (lang === 'ja' ? 'ファイルサイズは5MB以下にしてください。' : 'File must be under 5MB.')
        : (lang === 'ja' ? 'アップロードに失敗しました。' : 'Upload failed.'))
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return

    const [headlineJa, bioJa] = await fillMissingJapanese([
      { en: form.headlineEn, ja: form.headlineJa },
      { en: form.bioEn, ja: form.bioJa },
    ])

    const skillsEnArr = form.skillsEn.split(',').map(s => s.trim()).filter(Boolean)
    const skillsJaArrInput = form.skillsJa.split(',').map(s => s.trim()).filter(Boolean)
    const skillsJaArr = skillsJaArrInput.length > 0
      ? skillsJaArrInput
      : (skillsEnArr.length > 0 ? await translateToJa(skillsEnArr) : [])

    const updates: Partial<User> = {
      email: form.email,
      nameEn: form.nameEn,
      nameJa: form.nameJa,
      headlineEn: form.headlineEn,
      headlineJa,
      university: form.university,
      universityJa: form.universityJa,
      faculty: form.faculty,
      facultyJa: form.facultyJa,
      japaneseLevel: form.japaneseLevel,
      openToWork: form.openToWork,
      skills: skillsEnArr,
      skillsJa: skillsJaArr,
      bioEn: form.bioEn,
      bioJa,
      availableFrom: form.availableFrom,
      availableFromJa: form.availableFromJa,
      languages: form.languages,
      experience: form.experience,
      residenceArea: form.residenceArea || undefined,
      devExperienceYears: form.devExperienceYears ? Number(form.devExperienceYears) : undefined,
      yearsInJapan: form.yearsInJapan ? Number(form.yearsInJapan) : undefined,
      hobbies: form.hobbies || undefined,
      videoUrl: form.videoUrl || undefined,
      pastClients: form.pastClients.split(',').map(s => s.trim()).filter(Boolean),
      avatarUrl: form.avatarUrl || undefined,
    }
    await updateProfile(updates)
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

  async function handleSubmitForReview() {
    setSubmitting(true)
    await submitForReview()
    setSubmitting(false)
  }

  const hasAdditionalInfo = !!(user.residenceArea || user.devExperienceYears || user.yearsInJapan || user.hobbies || user.videoUrl || (user.pastClients && user.pastClients.length > 0))
  const statusColor = STATUS_COLOR[user.status] ?? STATUS_COLOR.draft

  return (
    <div className="min-h-screen line-page">
      <nav className="line-page border-b border-hairline sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <span className="font-display font-medium text-lg text-ink tracking-wide uppercase">AfriTalent</span>
          </Link>
          <div className="flex items-center gap-3">
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-ink-soft text-sm mb-1">{t(lang, 'dashboard.welcome')}</p>
            <h1 className="font-display font-medium text-ink text-2xl sm:text-3xl tracking-wide">
              {name} {user.flag}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="space-y-5">
                <section className="line-card p-6">
                  <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-5">
                    {t(lang, 'dashboard.sectionBasic')}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className={LABEL_CLS}>{t(lang, 'dashboard.photo')}</label>
                      <div className="flex items-center gap-4">
                        {form.avatarUrl ? (
                          <img src={form.avatarUrl} alt="" className="avatar-line w-16 h-16 text-lg" />
                        ) : (
                          <div className="avatar-line w-16 h-16 text-lg">
                            {user.initials}
                          </div>
                        )}
                        <label className="btn-line text-xs px-4 py-2 cursor-pointer">
                          {uploadingAvatar ? '···' : t(lang, 'dashboard.uploadPhoto')}
                          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploadingAvatar} />
                        </label>
                      </div>
                      {avatarError && <p className="text-xs mt-2 text-seal">{avatarError}</p>}
                    </div>
                    <div>
                      <label className={LABEL_CLS}>{t(lang, 'dashboard.email')}</label>
                      <input className={INPUT_CLS} type="email" value={form.email}
                             onChange={e => setField('email', e.target.value)}
                             placeholder="your@email.com" />
                    </div>
                    {([
                      ['nameEn', 'dashboard.nameEn'],
                      ['nameJa', 'dashboard.nameJa'],
                      ['headlineEn', 'dashboard.headlineEn'],
                      ['headlineJa', 'dashboard.headlineJa'],
                      ['availableFrom', 'dashboard.availableFrom'],
                      ['availableFromJa', 'dashboard.availableFromJa'],
                    ] as const).map(([key, labelKey]) => (
                      <div key={key}>
                        <label className={LABEL_CLS}>{t(lang, labelKey)}</label>
                        <input className={INPUT_CLS} value={form[key]}
                               onChange={e => setField(key, e.target.value)}
                               placeholder={key === 'headlineJa' ? t(lang, 'jobs.autoTranslateHint') : undefined} />
                      </div>
                    ))}
                    <div>
                      <label className={LABEL_CLS}>{t(lang, 'dashboard.japaneseLevel')}</label>
                      <select className={INPUT_CLS} value={form.japaneseLevel}
                              onChange={e => setField('japaneseLevel', e.target.value as JLPTLevel)}>
                        {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="openToWork" checked={form.openToWork}
                             onChange={e => setField('openToWork', e.target.checked)}
                             className="w-4 h-4 accent-ink cursor-pointer" />
                      <label htmlFor="openToWork" className="text-ink-soft text-sm cursor-pointer">
                        {t(lang, 'detail.openToWork')}
                      </label>
                    </div>
                  </div>
                </section>

                <section className="line-card p-6">
                  <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-5">
                    {t(lang, 'dashboard.sectionEducation')}
                  </h2>
                  <div className="space-y-4">
                    {([
                      ['university', 'dashboard.universityEn'],
                      ['universityJa', 'dashboard.universityJa'],
                      ['faculty', 'dashboard.facultyEn'],
                      ['facultyJa', 'dashboard.facultyJa'],
                    ] as const).map(([key, labelKey]) => (
                      <div key={key}>
                        <label className={LABEL_CLS}>{t(lang, labelKey)}</label>
                        <input className={INPUT_CLS} value={form[key]}
                               onChange={e => setField(key, e.target.value)} />
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="space-y-5">
                <section className="line-card p-6">
                  <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-5">
                    {t(lang, 'dashboard.sectionSkills')}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className={LABEL_CLS}>{t(lang, 'dashboard.skillsEn')}</label>
                      <input className={INPUT_CLS} value={form.skillsEn}
                             onChange={e => setField('skillsEn', e.target.value)} placeholder="React, Python, SQL" />
                      <p className="text-ink-faint text-xs mt-1">{t(lang, 'dashboard.skillsHint')}</p>
                    </div>
                    <div>
                      <label className={LABEL_CLS}>{t(lang, 'dashboard.skillsJa')}</label>
                      <input className={INPUT_CLS} value={form.skillsJa}
                             onChange={e => setField('skillsJa', e.target.value)} placeholder={t(lang, 'jobs.autoTranslateHint')} />
                    </div>
                  </div>
                </section>

                <section className="line-card p-6">
                  <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-5">
                    {t(lang, 'dashboard.sectionBio')}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className={LABEL_CLS}>{t(lang, 'dashboard.bioEn')}</label>
                      <textarea className={`${INPUT_CLS} resize-none`} rows={4}
                                value={form.bioEn} onChange={e => setField('bioEn', e.target.value)} />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>{t(lang, 'dashboard.bioJa')}</label>
                      <textarea className={`${INPUT_CLS} resize-none`} rows={4}
                                value={form.bioJa} onChange={e => setField('bioJa', e.target.value)}
                                placeholder={t(lang, 'jobs.autoTranslateHint')} />
                    </div>
                  </div>
                </section>

                <section className="line-card p-6">
                  <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-5">
                    {t(lang, 'dashboard.sectionAdditional')}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className={LABEL_CLS}>{t(lang, 'dashboard.residenceArea')}</label>
                      <input className={INPUT_CLS} value={form.residenceArea}
                             onChange={e => setField('residenceArea', e.target.value)} placeholder="Tokyo" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={LABEL_CLS}>{t(lang, 'dashboard.devExperienceYears')}</label>
                        <input className={INPUT_CLS} type="number" min="0" value={form.devExperienceYears}
                               onChange={e => setField('devExperienceYears', e.target.value)} />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>{t(lang, 'dashboard.yearsInJapan')}</label>
                        <input className={INPUT_CLS} type="number" min="0" value={form.yearsInJapan}
                               onChange={e => setField('yearsInJapan', e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className={LABEL_CLS}>{t(lang, 'dashboard.hobbies')}</label>
                      <input className={INPUT_CLS} value={form.hobbies}
                             onChange={e => setField('hobbies', e.target.value)} />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>{t(lang, 'dashboard.videoUrl')}</label>
                      <input className={INPUT_CLS} value={form.videoUrl}
                             onChange={e => setField('videoUrl', e.target.value)} placeholder="https://" />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>{t(lang, 'dashboard.pastClients')}</label>
                      <input className={INPUT_CLS} value={form.pastClients}
                             onChange={e => setField('pastClients', e.target.value)} />
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Languages */}
            <section className="line-card p-6 mt-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest">
                  {t(lang, 'detail.languages')}
                </h2>
                <button type="button"
                        onClick={() => setField('languages', [...form.languages, { name: '', level: 'Conversational' }])}
                        className="btn-line-ghost cursor-pointer">
                  + {lang === 'ja' ? '追加' : 'Add'}
                </button>
              </div>
              <div className="space-y-2">
                {form.languages.map((l, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input className={`${INPUT_CLS} flex-1`} value={l.name}
                           onChange={e => { const next = [...form.languages]; next[i] = { ...next[i], name: e.target.value }; setField('languages', next) }}
                           placeholder={lang === 'ja' ? '言語名' : 'Language'} />
                    <select className={`${INPUT_CLS} !w-40 flex-shrink-0`} value={l.level}
                            onChange={e => { const next = [...form.languages]; next[i] = { ...next[i], level: e.target.value as LanguageLevel }; setField('languages', next) }}>
                      {LANG_LEVELS.map(lv => <option key={lv} value={lv}>{lv}</option>)}
                    </select>
                    <button type="button"
                            onClick={() => setField('languages', form.languages.filter((_, j) => j !== i))}
                            className="text-ink-faint hover:text-seal transition-colors cursor-pointer px-2">✕</button>
                  </div>
                ))}
              </div>
            </section>

            {/* Experience */}
            <section className="line-card p-6 mt-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest">
                  {t(lang, 'detail.experience')}
                </h2>
                <button type="button"
                        onClick={() => setField('experience', [...form.experience, { company: '', companyJa: '', role: '', roleJa: '', period: '', descriptionEn: '', descriptionJa: '' }])}
                        className="btn-line-ghost cursor-pointer">
                  + {lang === 'ja' ? '追加' : 'Add'}
                </button>
              </div>
              <div className="space-y-6">
                {form.experience.map((exp, i) => (
                  <div key={i} className={`space-y-3 ${i > 0 ? 'pt-6 border-t border-hairline' : ''}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-ink-soft text-xs font-medium">{lang === 'ja' ? `経験 ${i + 1}` : `Experience ${i + 1}`}</p>
                      <button type="button"
                              onClick={() => setField('experience', form.experience.filter((_, j) => j !== i))}
                              className="text-ink-faint hover:text-seal transition-colors cursor-pointer text-xs">
                        {lang === 'ja' ? '削除' : 'Remove'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className={LABEL_CLS}>{lang === 'ja' ? '会社名（英語）' : 'Company (EN)'}</label>
                        <input className={INPUT_CLS} value={exp.company}
                               onChange={e => { const next = [...form.experience]; next[i] = { ...next[i], company: e.target.value }; setField('experience', next) }} />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>{lang === 'ja' ? '会社名（日本語）' : 'Company (JA)'}</label>
                        <input className={INPUT_CLS} value={exp.companyJa}
                               onChange={e => { const next = [...form.experience]; next[i] = { ...next[i], companyJa: e.target.value }; setField('experience', next) }} />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>{lang === 'ja' ? '役職（英語）' : 'Role (EN)'}</label>
                        <input className={INPUT_CLS} value={exp.role}
                               onChange={e => { const next = [...form.experience]; next[i] = { ...next[i], role: e.target.value }; setField('experience', next) }} />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>{lang === 'ja' ? '役職（日本語）' : 'Role (JA)'}</label>
                        <input className={INPUT_CLS} value={exp.roleJa}
                               onChange={e => { const next = [...form.experience]; next[i] = { ...next[i], roleJa: e.target.value }; setField('experience', next) }} />
                      </div>
                      <div className="col-span-2">
                        <label className={LABEL_CLS}>{lang === 'ja' ? '期間' : 'Period'}</label>
                        <input className={INPUT_CLS} value={exp.period} placeholder="2024.06 – 2024.09"
                               onChange={e => { const next = [...form.experience]; next[i] = { ...next[i], period: e.target.value }; setField('experience', next) }} />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>{lang === 'ja' ? '業務内容（英語）' : 'Description (EN)'}</label>
                        <textarea className={`${INPUT_CLS} resize-none`} rows={3} value={exp.descriptionEn}
                                  onChange={e => { const next = [...form.experience]; next[i] = { ...next[i], descriptionEn: e.target.value }; setField('experience', next) }} />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>{lang === 'ja' ? '業務内容（日本語）' : 'Description (JA)'}</label>
                        <textarea className={`${INPUT_CLS} resize-none`} rows={3} value={exp.descriptionJa}
                                  onChange={e => { const next = [...form.experience]; next[i] = { ...next[i], descriptionJa: e.target.value }; setField('experience', next) }} />
                      </div>
                    </div>
                  </div>
                ))}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <div className="line-card p-6">
                <div className="flex items-center gap-4">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="avatar-line w-20 h-20 text-2xl" />
                  ) : (
                    <div className="avatar-line w-20 h-20 text-2xl">
                      {user.initials}
                    </div>
                  )}
                  <div>
                    <h2 className="font-display font-medium text-ink text-xl tracking-wide">{name}</h2>
                    <p className="text-ink-soft text-sm mt-0.5">
                      {lang === 'ja' ? user.countryJa : user.country} · {lang === 'ja' ? user.fieldJa : user.field}
                    </p>
                    {user.email && (
                      <p className="text-ink-faint text-xs mt-0.5">{user.email}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="badge-line">{user.japaneseLevel}</span>
                      {(lang === 'ja' ? user.availableFromJa : user.availableFrom) && (
                        <span className="badge-line-ink">
                          {lang === 'ja' ? user.availableFromJa : user.availableFrom}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <section className="line-card p-6">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest">
                      {t(lang, 'dashboard.statusLabel')}
                    </h2>
                    <span className="text-xs font-medium uppercase tracking-wide pb-[2px]"
                          style={{ color: statusColor, borderBottom: `1.5px solid ${statusColor}` }}>
                      {t(lang, `dashboard.status${user.status.charAt(0).toUpperCase()}${user.status.slice(1)}`)}
                    </span>
                  </div>
                  {(user.status === 'draft' || user.status === 'rejected') && (
                    <button onClick={handleSubmitForReview} disabled={submitting}
                            className="btn-line text-xs px-4 py-2 disabled:opacity-50">
                      {submitting ? '···' : t(lang, user.status === 'rejected' ? 'dashboard.resubmit' : 'dashboard.submitForReview')}
                    </button>
                  )}
                </div>
                {(user.status === 'draft' || user.status === 'pending') && (
                  <p className="text-ink-faint text-xs mt-2 leading-relaxed">{t(lang, 'dashboard.submitForReviewHint')}</p>
                )}
                {user.status === 'rejected' && user.adminNote && (
                  <p className="text-ink-soft text-xs mt-2 leading-relaxed">
                    <span className="text-ink-faint">{t(lang, 'dashboard.adminNote')}: </span>"{user.adminNote}"
                  </p>
                )}
              </section>

              <section className="line-card p-6">
                <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-3">
                  {t(lang, 'detail.bio')}
                </h2>
                <p className="text-ink-soft text-sm leading-relaxed">{bio}</p>
              </section>

              <section className="line-card p-6">
                <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-3">
                  {t(lang, 'detail.skills')}
                </h2>
                <p className="text-ink-soft text-sm">{skills.join(' · ')}</p>
              </section>

              {hasAdditionalInfo && (
                <section className="line-card p-6">
                  <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-3">
                    {t(lang, 'dashboard.sectionAdditional')}
                  </h2>
                  <div className="space-y-2 text-sm">
                    {user.residenceArea && (
                      <p className="text-ink-soft"><span className="text-ink-faint">{t(lang, 'dashboard.residenceArea')}: </span>{user.residenceArea}</p>
                    )}
                    {user.devExperienceYears != null && (
                      <p className="text-ink-soft"><span className="text-ink-faint">{t(lang, 'dashboard.devExperienceYears')}: </span>{user.devExperienceYears}</p>
                    )}
                    {user.yearsInJapan != null && (
                      <p className="text-ink-soft"><span className="text-ink-faint">{t(lang, 'dashboard.yearsInJapan')}: </span>{user.yearsInJapan}</p>
                    )}
                    {user.hobbies && (
                      <p className="text-ink-soft"><span className="text-ink-faint">{t(lang, 'dashboard.hobbies')}: </span>{user.hobbies}</p>
                    )}
                    {user.videoUrl && (
                      <p className="text-ink-soft">
                        <span className="text-ink-faint">{t(lang, 'dashboard.videoUrl')}: </span>
                        {isSafeHttpUrl(user.videoUrl) ? (
                          <a href={user.videoUrl} target="_blank" rel="noreferrer" className="text-seal hover:opacity-70 break-all">{user.videoUrl}</a>
                        ) : (
                          <span className="break-all">{user.videoUrl}</span>
                        )}
                      </p>
                    )}
                    {user.pastClients && user.pastClients.length > 0 && (
                      <p className="text-ink-soft"><span className="text-ink-faint">{t(lang, 'dashboard.pastClients')}: </span>{user.pastClients.join(', ')}</p>
                    )}
                  </div>
                </section>
              )}
            </div>

            <div className="space-y-5">
              <section className="line-card p-6">
                <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-4">
                  {t(lang, 'detail.education')}
                </h2>
                <div>
                  <p className="text-ink text-sm font-medium leading-snug">
                    {lang === 'ja' ? user.universityJa : user.university}
                  </p>
                  <p className="text-ink-soft text-xs mt-1">
                    {lang === 'ja' ? user.facultyJa : user.faculty}
                  </p>
                  <p className="text-ink-faint text-xs mt-0.5">{user.degree} · {user.graduationYear}</p>
                </div>
              </section>

              <div className="line-card p-6">
                <p className="text-ink-faint text-xs mb-3">{t(lang, 'dashboard.editHint')}</p>
                <button onClick={startEdit} className="btn-line w-full justify-center">
                  {t(lang, 'dashboard.editBtn')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
