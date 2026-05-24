import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../App'
import { t } from '../i18n'
import type { User, JLPTLevel, LanguageLevel, Language, Experience } from '../types'

const LEVELS: JLPTLevel[] = ['N1', 'N2', 'N3', 'N4', 'N5']

const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  N1: { bg: 'rgba(216,90,48,0.12)', text: '#D85A30' },
  N2: { bg: 'rgba(29,158,117,0.12)', text: '#1D9E75' },
  N3: { bg: 'rgba(83,74,183,0.12)', text: '#7F77DD' },
  N4: { bg: 'rgba(186,117,23,0.12)', text: '#BA7517' },
  N5: { bg: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.5)' },
}

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
}

const INPUT_CLS = 'w-full bg-dark-3 border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 outline-none focus:border-a-orange/40 transition-colors'
const LABEL_CLS = 'block text-white/40 text-xs font-medium mb-1.5 uppercase tracking-wider'

export default function DashboardPage() {
  const { user, logout, updateProfile } = useAuth()
  const { lang, setLang } = useLang()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState<EditForm | null>(null)

  if (!user) {
    navigate('/login')
    return null
  }

  const level = LEVEL_COLORS[user.japaneseLevel] ?? LEVEL_COLORS['N3']
  const name = lang === 'ja' ? user.nameJa : user.nameEn
  const skills = lang === 'ja' ? user.skillsJa : user.skills
  const bio = lang === 'ja' ? user.bioJa : user.bioEn

  function startEdit() {
    setForm({
      email: user!.email ?? '',
      nameEn: user!.nameEn,
      nameJa: user!.nameJa,
      headlineEn: user!.headlineEn,
      headlineJa: user!.headlineJa,
      university: user!.university,
      universityJa: user!.universityJa,
      faculty: user!.faculty,
      facultyJa: user!.facultyJa,
      japaneseLevel: user!.japaneseLevel,
      openToWork: user!.openToWork,
      skillsEn: user!.skills.join(', '),
      skillsJa: user!.skillsJa.join(', '),
      bioEn: user!.bioEn,
      bioJa: user!.bioJa,
      availableFrom: user!.availableFrom,
      availableFromJa: user!.availableFromJa,
      languages: user!.languages,
      experience: user!.experience,
    })
    setEditing(true)
    setSaved(false)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    const updates: Partial<User> = {
      email: form.email,
      nameEn: form.nameEn,
      nameJa: form.nameJa,
      headlineEn: form.headlineEn,
      headlineJa: form.headlineJa,
      university: form.university,
      universityJa: form.universityJa,
      faculty: form.faculty,
      facultyJa: form.facultyJa,
      japaneseLevel: form.japaneseLevel,
      openToWork: form.openToWork,
      skills: form.skillsEn.split(',').map(s => s.trim()).filter(Boolean),
      skillsJa: form.skillsJa.split(',').map(s => s.trim()).filter(Boolean),
      bioEn: form.bioEn,
      bioJa: form.bioJa,
      availableFrom: form.availableFrom,
      availableFromJa: form.availableFromJa,
      languages: form.languages,
      experience: form.experience,
    }
    updateProfile(updates)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function setField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm(f => f ? { ...f, [key]: value } : f)
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-dark">
      <nav className="bg-dark border-b border-white/[0.06] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #D85A30 0%, #1D9E75 100%)' }}>
              <span className="text-white font-bold text-xs">AT</span>
            </div>
            <span className="text-white font-medium text-lg tracking-tight">AfriTalent</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-dark-3 rounded-lg p-0.5 border border-white/[0.08]">
              <button onClick={() => setLang('ja')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${lang === 'ja' ? 'bg-white text-dark' : 'text-white/50 hover:text-white/80'}`}>JA</button>
              <button onClick={() => setLang('en')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${lang === 'en' ? 'bg-white text-dark' : 'text-white/50 hover:text-white/80'}`}>EN</button>
            </div>
            <button onClick={handleLogout}
                    className="text-white/40 text-sm hover:text-white/70 transition-colors cursor-pointer">
              {t(lang, 'dashboard.logout')}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-white/40 text-sm mb-1">{t(lang, 'dashboard.welcome')}</p>
            <h1 className="text-3xl font-medium text-white tracking-tight" style={{ letterSpacing: '-0.02em' }}>
              {name} {user.flag}
            </h1>
          </div>
          {!editing && (
            <button onClick={startEdit} className="btn-primary flex items-center gap-2">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="space-y-5">
                <section className="bg-dark-2 rounded-2xl p-6 card-border">
                  <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-5">
                    {t(lang, 'dashboard.sectionBasic')}
                  </h2>
                  <div className="space-y-4">
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
                               onChange={e => setField(key, e.target.value)} />
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
                             className="w-4 h-4 accent-a-green cursor-pointer" />
                      <label htmlFor="openToWork" className="text-white/60 text-sm cursor-pointer">
                        {t(lang, 'detail.openToWork')}
                      </label>
                    </div>
                  </div>
                </section>

                <section className="bg-dark-2 rounded-2xl p-6 card-border">
                  <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-5">
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
                <section className="bg-dark-2 rounded-2xl p-6 card-border">
                  <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-5">
                    {t(lang, 'dashboard.sectionSkills')}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className={LABEL_CLS}>{t(lang, 'dashboard.skillsEn')}</label>
                      <input className={INPUT_CLS} value={form.skillsEn}
                             onChange={e => setField('skillsEn', e.target.value)} placeholder="React, Python, SQL" />
                      <p className="text-white/25 text-xs mt-1">{t(lang, 'dashboard.skillsHint')}</p>
                    </div>
                    <div>
                      <label className={LABEL_CLS}>{t(lang, 'dashboard.skillsJa')}</label>
                      <input className={INPUT_CLS} value={form.skillsJa}
                             onChange={e => setField('skillsJa', e.target.value)} placeholder="React, Python, SQL" />
                    </div>
                  </div>
                </section>

                <section className="bg-dark-2 rounded-2xl p-6 card-border">
                  <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-5">
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
                                value={form.bioJa} onChange={e => setField('bioJa', e.target.value)} />
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Languages */}
            <section className="bg-dark-2 rounded-2xl p-6 card-border mt-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest">
                  {t(lang, 'detail.languages')}
                </h2>
                <button type="button"
                        onClick={() => setField('languages', [...form.languages, { name: '', level: 'Conversational' }])}
                        className="text-xs text-a-orange hover:opacity-80 transition-opacity cursor-pointer">
                  + {lang === 'ja' ? '追加' : 'Add'}
                </button>
              </div>
              <div className="space-y-2">
                {form.languages.map((l, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input className={`${INPUT_CLS} flex-1`} value={l.name}
                           onChange={e => { const next = [...form.languages]; next[i] = { ...next[i], name: e.target.value }; setField('languages', next) }}
                           placeholder={lang === 'ja' ? '言語名' : 'Language'} />
                    <select className={`${INPUT_CLS} w-40`} value={l.level}
                            onChange={e => { const next = [...form.languages]; next[i] = { ...next[i], level: e.target.value as LanguageLevel }; setField('languages', next) }}>
                      {LANG_LEVELS.map(lv => <option key={lv} value={lv}>{lv}</option>)}
                    </select>
                    <button type="button"
                            onClick={() => setField('languages', form.languages.filter((_, j) => j !== i))}
                            className="text-white/30 hover:text-white/60 transition-colors cursor-pointer px-2">✕</button>
                  </div>
                ))}
              </div>
            </section>

            {/* Experience */}
            <section className="bg-dark-2 rounded-2xl p-6 card-border mt-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest">
                  {t(lang, 'detail.experience')}
                </h2>
                <button type="button"
                        onClick={() => setField('experience', [...form.experience, { company: '', companyJa: '', role: '', roleJa: '', period: '', descriptionEn: '', descriptionJa: '' }])}
                        className="text-xs text-a-orange hover:opacity-80 transition-opacity cursor-pointer">
                  + {lang === 'ja' ? '追加' : 'Add'}
                </button>
              </div>
              <div className="space-y-6">
                {form.experience.map((exp, i) => (
                  <div key={i} className={`space-y-3 ${i > 0 ? 'pt-6 border-t border-white/[0.06]' : ''}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-white/50 text-xs font-medium">{lang === 'ja' ? `経験 ${i + 1}` : `Experience ${i + 1}`}</p>
                      <button type="button"
                              onClick={() => setField('experience', form.experience.filter((_, j) => j !== i))}
                              className="text-white/30 hover:text-white/60 transition-colors cursor-pointer text-xs">
                        {lang === 'ja' ? '削除' : 'Remove'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
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
                      className="px-6 py-2.5 rounded-xl text-sm text-white/50 hover:text-white/80 transition-colors cursor-pointer bg-dark-3 border border-white/[0.08]">
                {t(lang, 'dashboard.cancelBtn')}
              </button>
              <button type="submit" className="btn-primary px-8">
                {t(lang, 'dashboard.saveBtn')}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <div className="relative bg-dark-2 rounded-2xl p-6 card-border overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
                     style={{ background: `radial-gradient(circle, ${user.avatarColor}15 0%, transparent 70%)` }} />
                <div className="relative flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-semibold flex-shrink-0"
                       style={{ background: user.avatarColor + '22', border: `1.5px solid ${user.avatarColor}40`, color: user.avatarColor }}>
                    {user.initials}
                  </div>
                  <div>
                    <h2 className="text-xl font-medium text-white tracking-tight">{name}</h2>
                    <p className="text-white/40 text-sm mt-0.5">
                      {lang === 'ja' ? user.countryJa : user.country} · {lang === 'ja' ? user.fieldJa : user.field}
                    </p>
                    {user.email && (
                      <p className="text-white/30 text-xs mt-0.5">{user.email}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                            style={{ background: level.bg, color: level.text }}>
                        🇯🇵 {user.japaneseLevel}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg text-xs"
                            style={{ background: 'rgba(29,158,117,0.1)', color: '#1D9E75' }}>
                        ✓ {lang === 'ja' ? user.availableFromJa : user.availableFrom}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <section className="bg-dark-2 rounded-2xl p-6 card-border">
                <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">
                  {t(lang, 'detail.bio')}
                </h2>
                <p className="text-white/70 text-sm leading-relaxed">{bio}</p>
              </section>

              <section className="bg-dark-2 rounded-2xl p-6 card-border">
                <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">
                  {t(lang, 'detail.skills')}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map(s => (
                    <span key={s} className="px-3.5 py-1.5 rounded-xl text-sm font-medium"
                          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.75)', border: '0.5px solid rgba(255,255,255,0.1)' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-5">
              <section className="bg-dark-2 rounded-2xl p-6 card-border">
                <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">
                  {t(lang, 'detail.education')}
                </h2>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                       style={{ background: 'rgba(83,74,183,0.15)' }}>
                    <span className="text-lg">🎓</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium leading-snug">
                      {lang === 'ja' ? user.universityJa : user.university}
                    </p>
                    <p className="text-white/40 text-xs mt-1">
                      {lang === 'ja' ? user.facultyJa : user.faculty}
                    </p>
                    <p className="text-white/30 text-xs mt-0.5">{user.degree} · {user.graduationYear}</p>
                  </div>
                </div>
              </section>

              <div className="bg-dark-2 rounded-2xl p-6 card-border">
                <p className="text-white/40 text-xs mb-3">{t(lang, 'dashboard.editHint')}</p>
                <button onClick={startEdit} className="w-full btn-primary text-center py-2.5">
                  ✏️ {t(lang, 'dashboard.editBtn')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
