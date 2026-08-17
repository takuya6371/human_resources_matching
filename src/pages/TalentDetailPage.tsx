import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useLang } from '../App'
import { useAuth } from '../context/AuthContext'
import { t } from '../i18n'
import { supabase } from '../lib/supabase'
import { mapProfileRow, mapTeaserRow, PROFILE_PUBLIC_COLUMNS } from '../lib/profileMapper'
import { isSafeHttpUrl } from '../lib/url'
import type { Talent, TalentTeaser } from '../types'

const LEVEL_LABELS: Record<string, { en: string; ja: string; fr: string }> = {
  N1: { en: 'Highest level', ja: '最上位レベル', fr: 'Niveau supérieur' },
  N2: { en: 'Business proficient', ja: 'ビジネス対応可', fr: 'Maîtrise professionnelle' },
  N3: { en: 'Conversational', ja: '日常会話レベル', fr: 'Niveau conversationnel' },
}

const BLUR_BLOCK = { background: 'rgba(28,27,24,0.08)', filter: 'blur(4px)' }

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
        // ステータスによる絞り込みはRLSに委ねる（承認済み or 自分の求人への応募者は
        // 企業から閲覧可能、管理者は全件閲覧可能）。ここでアプリ側から追加で絞ると
        // RLSより厳しくなってしまう。
        const query = supabase.from('profiles').select(PROFILE_PUBLIC_COLUMNS).eq('id', id)

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
    return <div className="min-h-screen line-page" />
  }

  if (notFound) {
    return (
      <div className="min-h-screen line-page flex items-center justify-center">
        <div className="text-center">
          <p className="text-ink-soft text-lg mb-4">{t(lang, 'detail.notFound')}</p>
          <Link to="/talents" className="text-seal hover:opacity-70 text-sm no-underline">
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
    const levelLabel = LEVEL_LABELS[talent.japaneseLevel]

    return (
      <div className="min-h-screen line-page">
        <Navbar />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <Link to="/talents" className="inline-flex items-center text-ink-soft text-sm hover:text-ink transition-colors no-underline mb-8">
            {t(lang, 'detail.back')}
          </Link>

          {/* profile header */}
          <div className="line-card mb-6">
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-5 sm:gap-6">
              {talent.avatarUrl ? (
                <img src={talent.avatarUrl} alt="" className="avatar-line w-20 h-20 sm:w-24 sm:h-24 text-2xl sm:text-3xl" />
              ) : (
                <div className="avatar-line w-20 h-20 sm:w-24 sm:h-24 text-2xl sm:text-3xl">
                  {talent.initials}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="font-display font-medium text-ink text-2xl sm:text-3xl tracking-wide">
                    {name}
                  </h1>
                  <span className="text-2xl leading-none">{talent.flag}</span>
                </div>
                <p className="text-ink-soft text-sm sm:text-base mb-4">{country} · {field}</p>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="badge-line">{talent.japaneseLevel}</span>
                  <span className="badge-line-ink">{talent.degree} · {talent.graduationYear}</span>
                  {availableFrom && <span className="badge-line-ink">{availableFrom}</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <section className="line-card p-6">
                <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-4">
                  {t(lang, 'detail.bio')}
                </h2>
                <p className="text-ink text-sm leading-relaxed">{bio}</p>
              </section>

              <section className="line-card p-6">
                <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-4">
                  {t(lang, 'detail.skills')}
                </h2>
                <p className="text-sm text-ink-soft">{skills.join(' · ')}</p>
              </section>

              {(talent.residenceArea || talent.devExperienceYears != null || talent.yearsInJapan != null || talent.hobbies || talent.videoUrl || (talent.pastClients && talent.pastClients.length > 0)) && (
                <section className="line-card p-6">
                  <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-4">
                    {t(lang, 'dashboard.sectionAdditional')}
                  </h2>
                  <div className="space-y-2 text-sm">
                    {talent.residenceArea && (
                      <p className="text-ink"><span className="text-ink-faint">{t(lang, 'dashboard.residenceArea')}: </span>{talent.residenceArea}</p>
                    )}
                    {talent.devExperienceYears != null && (
                      <p className="text-ink"><span className="text-ink-faint">{t(lang, 'dashboard.devExperienceYears')}: </span>{talent.devExperienceYears}</p>
                    )}
                    {talent.yearsInJapan != null && (
                      <p className="text-ink"><span className="text-ink-faint">{t(lang, 'dashboard.yearsInJapan')}: </span>{talent.yearsInJapan}</p>
                    )}
                    {talent.hobbies && (
                      <p className="text-ink"><span className="text-ink-faint">{t(lang, 'dashboard.hobbies')}: </span>{talent.hobbies}</p>
                    )}
                    {talent.videoUrl && (
                      <p className="text-ink">
                        <span className="text-ink-faint">{t(lang, 'dashboard.videoUrl')}: </span>
                        {isSafeHttpUrl(talent.videoUrl) ? (
                          <a href={talent.videoUrl} target="_blank" rel="noreferrer" className="text-seal hover:opacity-70 break-all">{talent.videoUrl}</a>
                        ) : (
                          <span className="break-all">{talent.videoUrl}</span>
                        )}
                      </p>
                    )}
                    {talent.pastClients && talent.pastClients.length > 0 && (
                      <p className="text-ink"><span className="text-ink-faint">{t(lang, 'dashboard.pastClients')}: </span>{talent.pastClients.join(', ')}</p>
                    )}
                  </div>
                </section>
              )}

              {talent.experience.length > 0 && (
                <section className="line-card p-6">
                  <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-4">
                    {t(lang, 'detail.experience')}
                  </h2>
                  <div className="space-y-5">
                    {talent.experience.map((exp, i) => (
                      <div key={i} className={i > 0 ? 'pt-5 border-t border-hairline' : ''}>
                        <p className="text-ink text-sm font-medium">
                          {lang === 'ja' ? exp.roleJa : exp.role}
                        </p>
                        <p className="text-ink-soft text-xs mt-0.5">
                          {lang === 'ja' ? exp.companyJa : exp.company}
                        </p>
                        <p className="text-ink-faint text-xs mt-0.5">{exp.period}</p>
                        <p className="text-ink-soft text-sm mt-2 leading-relaxed">
                          {lang === 'ja' ? exp.descriptionJa : exp.descriptionEn}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="space-y-5">
              <section className="line-card p-6">
                <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-4">
                  {t(lang, 'detail.languages')}
                </h2>
                <div className="space-y-2">
                  {talent.languages.map(lang_ => (
                    <div key={lang_.name} className="flex items-center justify-between">
                      <span className="text-ink text-sm">{lang_.name}</span>
                      <span className="badge-line-ink">{lang_.level}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="line-card p-6">
                <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-4">
                  {t(lang, 'detail.education')}
                </h2>
                <p className="text-ink text-sm font-medium leading-snug">{university}</p>
                <p className="text-ink-soft text-xs mt-1">{faculty}</p>
                <p className="text-ink-faint text-xs mt-0.5">{talent.degree} · {talent.graduationYear}</p>
              </section>

              <section className="line-card p-6">
                <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-4">
                  {t(lang, 'detail.japanese')}
                </h2>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-semibold border border-seal text-seal flex-shrink-0">
                    {talent.japaneseLevel}
                  </div>
                  <div>
                    <p className="text-ink text-sm">JLPT {talent.japaneseLevel}</p>
                    {levelLabel && (
                      <p className="text-ink-faint text-xs mt-0.5">
                        {levelLabel[lang] ?? levelLabel.en}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <div className="p-6 border border-seal">
                <p className="text-ink-soft text-sm mb-4 leading-relaxed">
                  {t(lang, 'detail.contactHint')}
                </p>
                <button className="w-full btn-line justify-center py-3">
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

  return (
    <div className="min-h-screen line-page">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link to="/talents" className="inline-flex items-center text-ink-soft text-sm hover:text-ink transition-colors no-underline mb-8">
          {t(lang, 'detail.back')}
        </Link>

        <div className="line-card mb-6">
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-5 sm:gap-6">
            <div className="avatar-line w-20 h-20 sm:w-24 sm:h-24" style={BLUR_BLOCK} />
            <div className="flex-1">
              <div className="w-40 h-6 mb-2" style={BLUR_BLOCK} />
              <p className="text-ink-soft text-sm sm:text-base mb-4">{teaser.country} · {field}</p>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="badge-line">{teaser.japaneseLevel}</span>
                <span className="badge-line-ink">{teaser.degree} · {teaser.graduationYear}</span>
                {availableFrom && <span className="badge-line-ink">{availableFrom}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 mb-6 border border-seal text-center">
          <p className="text-ink text-sm font-medium mb-1">{t(lang, 'gate.detailTitle')}</p>
          <p className="text-ink-soft text-xs leading-relaxed max-w-md mx-auto mb-5">{t(lang, 'gate.detailSubtitle')}</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link to="/login" className="btn-line no-underline">
              {t(lang, 'gate.signInBtn')}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <section className="line-card p-6">
              <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-4">
                {t(lang, 'detail.bio')}
              </h2>
              <div className="space-y-2">
                <div className="w-full h-3" style={BLUR_BLOCK} />
                <div className="w-5/6 h-3" style={BLUR_BLOCK} />
                <div className="w-2/3 h-3" style={BLUR_BLOCK} />
              </div>
            </section>

            <section className="line-card p-6">
              <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-4">
                {t(lang, 'detail.skills')}
              </h2>
              <p className="text-sm text-ink-soft">{skills.join(' · ')}</p>
            </section>

            <section className="line-card p-6">
              <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-4">
                {t(lang, 'detail.experience')}
              </h2>
              <div className="space-y-2">
                <div className="w-1/2 h-3" style={BLUR_BLOCK} />
                <div className="w-2/3 h-3" style={BLUR_BLOCK} />
              </div>
            </section>
          </div>

          <div className="space-y-5">
            <section className="line-card p-6">
              <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-4">
                {t(lang, 'detail.education')}
              </h2>
              <p className="text-ink text-sm font-medium leading-snug">{teaser.university}</p>
              <p className="text-ink-soft text-xs mt-1">{teaser.faculty}</p>
              <p className="text-ink-faint text-xs mt-0.5">{teaser.degree} · {teaser.graduationYear}</p>
            </section>

            <section className="line-card p-6">
              <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-4">
                {t(lang, 'detail.japanese')}
              </h2>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-semibold border border-seal text-seal flex-shrink-0">
                  {teaser.japaneseLevel}
                </div>
                <p className="text-ink text-sm">JLPT {teaser.japaneseLevel}</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
