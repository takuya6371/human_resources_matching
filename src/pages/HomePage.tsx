import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import TalentCard from '../components/TalentCard'
import Footer from '../components/Footer'
import talentsData from '../data/talents.json'
import { useLang } from '../App'
import { t } from '../i18n'
import type { Talent } from '../types'

const FEATURED = (talentsData as Talent[]).slice(0, 3)

export default function HomePage() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = search.trim()
    navigate(q ? `/talents?q=${encodeURIComponent(q)}` : '/talents')
  }

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-6"
               style={{ background: 'linear-gradient(180deg, #0A0A0A 0%, #141414 100%)' }}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(216,90,48,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(29,158,117,0.12) 0%, transparent 70%)' }} />
        <div className="absolute top-16 right-24 w-20 h-20 border border-a-orange/20 rounded-full pointer-events-none"
             style={{ transform: 'rotate(15deg)' }} />
        <div className="absolute bottom-16 left-24 w-14 h-14 rounded-xl pointer-events-none"
             style={{ background: 'linear-gradient(135deg, rgba(29,158,117,0.15) 0%, transparent 100%)', transform: 'rotate(-20deg)' }} />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-6"
               style={{ background: 'rgba(29,158,117,0.08)', border: '0.5px solid rgba(29,158,117,0.3)' }}>
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                    style={{ background: '#1D9E75' }} />
              <span className="relative inline-flex rounded-full h-2 w-2"
                    style={{ background: '#1D9E75' }} />
            </span>
            <span className="text-xs font-medium"
                  style={{ color: 'rgba(255,255,255,0.75)' }}>
              {t(lang, 'hero.badge').split('×').map((part, i) => (
                <span key={i}>
                  {i > 0 && <span style={{ color: '#1D9E75', margin: '0 0.2em' }}>×</span>}
                  {part}
                </span>
              ))}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-medium text-white leading-tight mb-4"
              style={{ letterSpacing: '-0.03em', maxWidth: '700px' }}>
            {t(lang, 'hero.title').split('\n').map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {i === 1
                  ? <span style={{ background: 'linear-gradient(135deg, #D85A30 0%, #1D9E75 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{line}</span>
                  : line}
              </span>
            ))}
          </h1>
          <p className="text-white/60 text-base sm:text-lg max-w-xl mb-10 leading-relaxed">
            {t(lang, 'hero.subtitle')}
          </p>

          <form onSubmit={handleSearch}
                className="flex items-center gap-2 bg-white/95 rounded-xl px-2 py-2 w-full max-w-md backdrop-blur-sm">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t(lang, 'hero.searchPlaceholder')}
              className="bg-transparent border-none outline-none text-dark text-sm px-3 flex-1 placeholder-gray-400 min-w-0"
            />
            <button type="submit" className="btn-primary whitespace-nowrap">
              {t(lang, 'hero.searchBtn')}
            </button>
          </form>

          <div className="flex gap-8 sm:gap-12 mt-12">
            {([
              ['5', 'hero.stats.talents'],
              ['12+', 'hero.stats.companies'],
              ['4', 'hero.stats.countries'],
            ] as const).map(([val, key]) => (
              <div key={key}>
                <p className="text-white text-3xl font-medium" style={{ letterSpacing: '-0.02em' }}>{val}</p>
                <p className="text-white/50 text-sm mt-1">{t(lang, key)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured talents ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-medium text-white tracking-tight" style={{ letterSpacing: '-0.02em' }}>
              {t(lang, 'home.featuredHeading')}
            </h2>
            <p className="text-white/40 text-sm mt-1">{t(lang, 'home.featuredSub')}</p>
          </div>
          <Link to="/talents" className="btn-primary no-underline whitespace-nowrap">
            {t(lang, 'home.viewAll')}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURED.map((talent, i) => (
            <TalentCard key={talent.id} talent={talent} index={i} disableLink />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}
