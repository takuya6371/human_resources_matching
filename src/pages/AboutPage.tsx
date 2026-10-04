import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useLang } from '../App'
import { t } from '../i18n'
import { supabase } from '../lib/supabase'

interface TeamMember {
  id: string
  name: string
  photo: string | null
  position: string
  bio: string | null
  location: string | null
  linkedin: string | null
  website: string | null
}

const VALUES = ['curated', 'human', 'reviewed', 'language'] as const

// 移植元(docs/front/bridge-africa-talent/src/pages/About.jsx)はチーム4名を
// ソースコードに直接書いていたが、こちらは team_members テーブルを正とする。
// 管理画面(AdminTeamPage)から編集でき、anon でも読める。
export default function AboutPage() {
  const { lang } = useLang()
  const [team, setTeam] = useState<TeamMember[]>([])

  useEffect(() => {
    supabase.from('team_members').select('*')
      .eq('active', true).order('display_order')
      .then(({ data }) => setTeam(data ?? []))
  }, [])

  return (
    <div className="min-h-screen line-page flex flex-col">
      <Navbar />
      <main className="flex-1">

        <section className="py-16 sm:py-24 px-4 sm:px-6 border-b border-hairline">
          <div className="max-w-6xl mx-auto">
            <span className="badge-line-ink text-[11px]">{t(lang, 'about.badge')}</span>
            <h1 className="mt-6 font-display font-medium text-ink text-3xl sm:text-5xl leading-tight">
              {t(lang, 'about.title')}
            </h1>
            <p className="mt-4 max-w-2xl text-ink-soft text-base leading-relaxed">
              {t(lang, 'about.lead')}
            </p>
          </div>
        </section>

        <section className="py-16 sm:py-20 px-4 sm:px-6 border-b border-hairline">
          <div className="max-w-6xl mx-auto grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <h2 className="font-display text-ink text-xl sm:text-2xl">{t(lang, 'about.missionHeading')}</h2>
              <p className="mt-4 text-ink-soft text-sm leading-relaxed">{t(lang, 'about.missionP1')}</p>
              <p className="mt-4 text-ink-soft text-sm leading-relaxed">{t(lang, 'about.missionP2')}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/login" className="btn-line no-underline">{t(lang, 'about.joinTalent')}</Link>
                <Link to="/talents" className="btn-line-ghost no-underline">{t(lang, 'about.joinCompany')}</Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {VALUES.map(v => (
                <div key={v} className="line-card p-6">
                  <h3 className="text-ink font-medium text-sm">{t(lang, `about.values.${v}Title`)}</h3>
                  <p className="mt-2 text-ink-soft text-sm leading-relaxed">{t(lang, `about.values.${v}Desc`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 px-4 sm:px-6 border-b border-hairline">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl">
              <h2 className="font-display text-ink text-xl sm:text-2xl">{t(lang, 'about.teamHeading')}</h2>
              <p className="mt-3 text-ink-soft text-sm">{t(lang, 'about.teamSub')}</p>
            </div>

            {team.length === 0 ? (
              <p className="mt-10 text-ink-faint text-sm">{t(lang, 'about.teamEmpty')}</p>
            ) : (
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {team.map(m => (
                  <div key={m.id} className="line-card p-6 text-center">
                    <div className="mx-auto h-24 w-24 overflow-hidden rounded-full bg-paper border border-hairline">
                      {m.photo
                        ? <img src={m.photo} alt={m.name} className="h-full w-full object-cover" />
                        : <div className="flex h-full items-center justify-center font-display text-ink-faint text-2xl">
                            {m.name.charAt(0).toUpperCase()}
                          </div>}
                    </div>
                    <h3 className="mt-4 text-ink font-medium text-sm">{m.name}</h3>
                    <p className="mt-0.5 text-seal text-xs">{m.position}</p>
                    {m.bio && <p className="mt-2 text-ink-soft text-xs leading-relaxed">{m.bio}</p>}
                    {m.location && <p className="mt-2 text-ink-faint text-xs">{m.location}</p>}
                    {(m.linkedin || m.website) && (
                      <div className="mt-3 flex justify-center gap-4">
                        {m.linkedin && (
                          <a href={m.linkedin} target="_blank" rel="noreferrer"
                             className="text-ink-faint text-xs hover:text-ink">LinkedIn</a>
                        )}
                        {m.website && (
                          <a href={m.website} target="_blank" rel="noreferrer"
                             className="text-ink-faint text-xs hover:text-ink">Web</a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="line-card p-8">
                <h3 className="font-display text-ink text-lg">{t(lang, 'about.forTalentTitle')}</h3>
                <p className="mt-3 text-ink-soft text-sm leading-relaxed">{t(lang, 'about.forTalentDesc')}</p>
              </div>
              <div className="p-8 bg-ink">
                <h3 className="font-display text-paper text-lg">{t(lang, 'about.forCompanyTitle')}</h3>
                <p className="mt-3 text-paper/70 text-sm leading-relaxed">{t(lang, 'about.forCompanyDesc')}</p>
              </div>
            </div>
            <div className="mt-10 text-center">
              <Link to="/login" className="btn-line no-underline">{t(lang, 'about.finalCta')}</Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}
