import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useLang } from '../App'
import { useAuth } from '../context/AuthContext'
import { t } from '../i18n'
import { supabase } from '../lib/supabase'
import { mapProfileRow, mapTeaserRow } from '../lib/profileMapper'
import type { Talent, TalentTeaser } from '../types'

const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  N1: { bg: 'rgba(216,90,48,0.12)', text: '#D85A30' },
  N2: { bg: 'rgba(29,158,117,0.12)', text: '#1D9E75' },
  N3: { bg: 'rgba(83,74,183,0.12)', text: '#7F77DD' },
  N4: { bg: 'rgba(186,117,23,0.12)', text: '#BA7517' },
  N5: { bg: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.5)' },
}

const LEVEL_LABELS: Record<string, { en: string; ja: string; fr: string }> = {
  N1: { en: 'Highest level', ja: '最上位レベル', fr: 'Niveau supérieur' },
  N2: { en: 'Business proficient', ja: 'ビジネス対応可', fr: 'Maîtrise professionnelle' },
  N3: { en: 'Conversational', ja: '日常会話レベル', fr: 'Niveau conversationnel' },
}

const BLUR_BLOCK = { background: 'rgba(255,255,255,0.08)', filter: 'blur(5px)' }

export default function TalentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { lang } = useLang()
  const { accountType } = useAuth()
  const hasFullAccess = accountType === 'company' || accountType === 'admin'

  const [talent, setTalent] = useState<Talent | null>(null)
  const [teaser, setTeaser] = useState<TalentTeaser | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    setNotFound(false)
    setTalent(null)
    setTeaser(null)

    async function load() {
      if (hasFullAccess) {
        // 企業アカウントは承認済みのみ。管理者は審査目的でどのステータスでも閲覧できる必要がある
        // （RLS自体はis_admin()で全ステータスの読み取りを許可しているので、ここで絞るとRLSより厳しくなってしまう）。
        let query = supabase.from('profiles').select('*').eq('id', id)
        if (accountType === 'company') query = query.eq('status', 'approved')

        const [{ data: profile }, { data: langs }, { data: exps }] = await Promise.all([
          query.single(),
          supabase.from('profile_languages').select('*').eq('profile_id', id).order('sort_order'),
          supabase.from('profile_experiences').select('*').eq('profile_id', id).order('sort_order'),
        ])
        if (cancelled) return
        if (!profile) { setNotFound(true); setLoading(false); return }
        setTalent(mapProfileRow(profile, langs ?? [], exps ?? []))
      } else {
        const { data } = await supabase.from('profiles_preview').select('*').eq('id', id).single()
        if (cancelled) return
        if (!data) { setNotFound(true); setLoading(false); return }
        setTeaser(mapTeaserRow(data))
      }
      if (!cancelled) setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [id, hasFullAccess, accountType])

  if (loading) {
    return <div className="min-h-screen bg-dark" />
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/40 text-lg mb-4">{t(lang, 'detail.notFound')}</p>
          <Link to="/talents" className="text-a-orange hover:opacity-80 text-sm no-underline">
            {t(lang, 'detail.back')}
          </Link>
        </div>
      </div>
    )
  }

  if (hasFullAccess && talent) {
    const name = lang === 'ja' ? talent.nameJa : talent.nameEn
    const country = lang === 'ja' ? talent.countryJa : talent.country
    const field = lang === 'ja' ? talent.fieldJa : talent.field
    const university = lang === 'ja' ? talent.universityJa : talent.university
    const faculty = lang === 'ja' ? talent.facultyJa : talent.faculty
    const skills = lang === 'ja' ? talent.skillsJa : talent.skills
    const bio = lang === 'ja' ? talent.bioJa : talent.bioEn
    const availableFrom = lang === 'ja' ? talent.availableFromJa : talent.availableFrom
    const level = LEVEL_COLORS[talent.japaneseLevel] ?? LEVEL_COLORS['N3']
    const levelLabel = LEVEL_LABELS[talent.japaneseLevel]

    return (
      <div className="min-h-screen bg-dark">
        <Navbar />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <Link to="/talents" className="inline-flex items-center text-white/40 text-sm hover:text-white/70 transition-colors no-underline mb-8">
            {t(lang, 'detail.back')}
          </Link>

          {/* profile header */}
          <div className="relative rounded-2xl overflow-hidden mb-6 card-border"
               style={{ background: 'linear-gradient(135deg, #141414 0%, #1C1C1C 100%)' }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none opacity-50"
                 style={{ background: `radial-gradient(circle, ${talent.avatarColor}20 0%, transparent 70%)` }} />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none opacity-30"
                 style={{ background: 'radial-gradient(circle, rgba(29,158,117,0.15) 0%, transparent 70%)' }} />

            <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-5 sm:gap-6">
              {talent.avatarUrl ? (
                <img src={talent.avatarUrl} alt="" className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-semibold flex-shrink-0"
                     style={{ background: talent.avatarColor + '20', border: `1.5px solid ${talent.avatarColor}40`, color: talent.avatarColor }}>
                  {talent.initials}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-medium text-white tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                    {name}
                  </h1>
                  <span className="text-2xl">{talent.flag}</span>
                </div>
                <p className="text-white/50 text-sm sm:text-base mb-4">{country} · {field}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-3 py-1.5 rounded-lg text-sm font-semibold"
                        style={{ background: level.bg, color: level.text }}>
                    🇯🇵 {talent.japaneseLevel}
                  </span>
                  <span className="px-3 py-1.5 rounded-lg text-sm"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
                    {talent.degree} · {talent.graduationYear}
                  </span>
                  {availableFrom && (
                    <span className="px-3 py-1.5 rounded-lg text-sm"
                          style={{ background: 'rgba(29,158,117,0.1)', color: '#1D9E75' }}>
                      ✓ {availableFrom}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <section className="bg-dark-2 rounded-2xl p-6 card-border">
                <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">
                  {t(lang, 'detail.bio')}
                </h2>
                <p className="text-white/80 text-sm leading-relaxed">{bio}</p>
              </section>

              <section className="bg-dark-2 rounded-2xl p-6 card-border">
                <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">
                  {t(lang, 'detail.skills')}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map(skill => (
                    <span key={skill} className="px-3.5 py-1.5 rounded-xl text-sm font-medium"
                          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.75)', border: '0.5px solid rgba(255,255,255,0.1)' }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </section>

              {(talent.residenceArea || talent.devExperienceYears != null || talent.yearsInJapan != null || talent.hobbies || talent.videoUrl || (talent.pastClients && talent.pastClients.length > 0)) && (
                <section className="bg-dark-2 rounded-2xl p-6 card-border">
                  <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">
                    {t(lang, 'dashboard.sectionAdditional')}
                  </h2>
                  <div className="space-y-2 text-sm">
                    {talent.residenceArea && (
                      <p className="text-white/70"><span className="text-white/40">{t(lang, 'dashboard.residenceArea')}: </span>{talent.residenceArea}</p>
                    )}
                    {talent.devExperienceYears != null && (
                      <p className="text-white/70"><span className="text-white/40">{t(lang, 'dashboard.devExperienceYears')}: </span>{talent.devExperienceYears}</p>
                    )}
                    {talent.yearsInJapan != null && (
                      <p className="text-white/70"><span className="text-white/40">{t(lang, 'dashboard.yearsInJapan')}: </span>{talent.yearsInJapan}</p>
                    )}
                    {talent.hobbies && (
                      <p className="text-white/70"><span className="text-white/40">{t(lang, 'dashboard.hobbies')}: </span>{talent.hobbies}</p>
                    )}
                    {talent.videoUrl && (
                      <p className="text-white/70">
                        <span className="text-white/40">{t(lang, 'dashboard.videoUrl')}: </span>
                        <a href={talent.videoUrl} target="_blank" rel="noreferrer" className="text-a-orange hover:opacity-80 break-all">{talent.videoUrl}</a>
                      </p>
                    )}
                    {talent.pastClients && talent.pastClients.length > 0 && (
                      <p className="text-white/70"><span className="text-white/40">{t(lang, 'dashboard.pastClients')}: </span>{talent.pastClients.join(', ')}</p>
                    )}
                  </div>
                </section>
              )}

              {talent.experience.length > 0 && (
                <section className="bg-dark-2 rounded-2xl p-6 card-border">
                  <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">
                    {t(lang, 'detail.experience')}
                  </h2>
                  <div className="space-y-5">
                    {talent.experience.map((exp, i) => (
                      <div key={i} className={i > 0 ? 'pt-5 border-t border-white/[0.06]' : ''}>
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                               style={{ background: 'rgba(186,117,23,0.12)' }}>
                            <span className="text-base">💼</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-white text-sm font-medium">
                              {lang === 'ja' ? exp.roleJa : exp.role}
                            </p>
                            <p className="text-white/50 text-xs mt-0.5">
                              {lang === 'ja' ? exp.companyJa : exp.company}
                            </p>
                            <p className="text-white/30 text-xs mt-0.5">{exp.period}</p>
                            <p className="text-white/60 text-sm mt-2 leading-relaxed">
                              {lang === 'ja' ? exp.descriptionJa : exp.descriptionEn}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="space-y-5">
              <section className="bg-dark-2 rounded-2xl p-6 card-border">
                <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">
                  {t(lang, 'detail.languages')}
                </h2>
                <div className="space-y-2">
                  {talent.languages.map(lang_ => (
                    <div key={lang_.name} className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">{lang_.name}</span>
                      <span className="text-xs px-2.5 py-1 rounded-lg"
                            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
                        {lang_.level}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-dark-2 rounded-2xl p-6 card-border">
                <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">
                  {t(lang, 'detail.education')}
                </h2>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                       style={{ background: 'rgba(83,74,183,0.15)' }}>
                    <span className="text-lg">🎓</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium leading-snug">{university}</p>
                    <p className="text-white/40 text-xs mt-1">{faculty}</p>
                    <p className="text-white/30 text-xs mt-0.5">{talent.degree} · {talent.graduationYear}</p>
                  </div>
                </div>
              </section>

              <section className="bg-dark-2 rounded-2xl p-6 card-border">
                <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">
                  {t(lang, 'detail.japanese')}
                </h2>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold"
                       style={{ background: level.bg, color: level.text }}>
                    {talent.japaneseLevel}
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">JLPT {talent.japaneseLevel}</p>
                    {levelLabel && (
                      <p className="text-white/30 text-xs mt-0.5">
                        {levelLabel[lang] ?? levelLabel.en}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <div className="rounded-2xl p-6 card-border"
                   style={{ background: 'linear-gradient(135deg, rgba(216,90,48,0.08) 0%, rgba(29,158,117,0.08) 100%)' }}>
                <p className="text-white/70 text-sm mb-4 leading-relaxed">
                  {t(lang, 'detail.contactHint')}
                </p>
                <button className="w-full btn-primary text-center py-3">
                  {t(lang, 'detail.contact')}
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // ── ゲート表示（未ログイン・人材アカウント）: 個人特定情報のみぼかす ──
  if (!teaser) return null
  const field = lang === 'ja' ? teaser.fieldJa : teaser.field
  const skills = lang === 'ja' ? teaser.skillsJa : teaser.skills
  const availableFrom = lang === 'ja' ? teaser.availableFromJa : teaser.availableFrom
  const level = LEVEL_COLORS[teaser.japaneseLevel] ?? LEVEL_COLORS['N3']

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link to="/talents" className="inline-flex items-center text-white/40 text-sm hover:text-white/70 transition-colors no-underline mb-8">
          {t(lang, 'detail.back')}
        </Link>

        <div className="relative rounded-2xl overflow-hidden mb-6 card-border"
             style={{ background: 'linear-gradient(135deg, #141414 0%, #1C1C1C 100%)' }}>
          <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-5 sm:gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex-shrink-0" style={BLUR_BLOCK} />
            <div className="flex-1">
              <div className="w-40 h-6 rounded mb-2" style={BLUR_BLOCK} />
              <p className="text-white/50 text-sm sm:text-base mb-4">{teaser.country} · {field}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1.5 rounded-lg text-sm font-semibold"
                      style={{ background: level.bg, color: level.text }}>
                  🇯🇵 {teaser.japaneseLevel}
                </span>
                <span className="px-3 py-1.5 rounded-lg text-sm"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
                  {teaser.degree} · {teaser.graduationYear}
                </span>
                {availableFrom && (
                  <span className="px-3 py-1.5 rounded-lg text-sm"
                        style={{ background: 'rgba(29,158,117,0.1)', color: '#1D9E75' }}>
                    ✓ {availableFrom}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-6 sm:p-8 mb-6 card-border text-center"
             style={{ background: 'linear-gradient(135deg, rgba(216,90,48,0.08) 0%, rgba(29,158,117,0.08) 100%)' }}>
          <p className="text-2xl mb-2">🔒</p>
          <p className="text-white text-sm font-medium mb-1">{t(lang, 'gate.detailTitle')}</p>
          <p className="text-white/50 text-xs leading-relaxed max-w-md mx-auto mb-5">{t(lang, 'gate.detailSubtitle')}</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link to="/login" className="btn-primary text-sm no-underline">
              {t(lang, 'gate.signInBtn')}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <section className="bg-dark-2 rounded-2xl p-6 card-border">
              <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">
                {t(lang, 'detail.bio')}
              </h2>
              <div className="space-y-2">
                <div className="w-full h-3 rounded" style={BLUR_BLOCK} />
                <div className="w-5/6 h-3 rounded" style={BLUR_BLOCK} />
                <div className="w-2/3 h-3 rounded" style={BLUR_BLOCK} />
              </div>
            </section>

            <section className="bg-dark-2 rounded-2xl p-6 card-border">
              <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">
                {t(lang, 'detail.skills')}
              </h2>
              <div className="flex flex-wrap gap-2">
                {skills.map(skill => (
                  <span key={skill} className="px-3.5 py-1.5 rounded-xl text-sm font-medium"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.75)', border: '0.5px solid rgba(255,255,255,0.1)' }}>
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            <section className="bg-dark-2 rounded-2xl p-6 card-border">
              <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">
                {t(lang, 'detail.experience')}
              </h2>
              <div className="space-y-2">
                <div className="w-1/2 h-3 rounded" style={BLUR_BLOCK} />
                <div className="w-2/3 h-3 rounded" style={BLUR_BLOCK} />
              </div>
            </section>
          </div>

          <div className="space-y-5">
            <section className="bg-dark-2 rounded-2xl p-6 card-border">
              <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">
                {t(lang, 'detail.education')}
              </h2>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                     style={{ background: 'rgba(83,74,183,0.15)' }}>
                  <span className="text-lg">🎓</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium leading-snug">{teaser.university}</p>
                  <p className="text-white/40 text-xs mt-1">{teaser.faculty}</p>
                  <p className="text-white/30 text-xs mt-0.5">{teaser.degree} · {teaser.graduationYear}</p>
                </div>
              </div>
            </section>

            <section className="bg-dark-2 rounded-2xl p-6 card-border">
              <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">
                {t(lang, 'detail.japanese')}
              </h2>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold"
                     style={{ background: level.bg, color: level.text }}>
                  {teaser.japaneseLevel}
                </div>
                <p className="text-white/70 text-sm">JLPT {teaser.japaneseLevel}</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
