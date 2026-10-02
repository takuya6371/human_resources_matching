import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import TalentTeaserCard from '../components/TalentTeaserCard'
import Footer from '../components/Footer'
import { useLang } from '../App'
import { t } from '../i18n'
import { supabase } from '../lib/supabase'
import { mapTeaserRow } from '../lib/profileMapper'
import type { TalentTeaser } from '../types'

export default function HomePage() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [featured, setFeatured] = useState<TalentTeaser[]>([])

  // トップは未ログインでも開くため、氏名や連絡先を含まない profiles_preview を使う。
  useEffect(() => {
    supabase.from('profiles_preview').select('*').limit(3)
      .then(({ data }) => setFeatured((data ?? []).map(mapTeaserRow)))
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = search.trim()
    navigate(q ? `/talents?q=${encodeURIComponent(q)}` : '/talents')
  }

  return (
    <div className="min-h-screen line-page">
      <Navbar />

      {/* Hero */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 border-b border-hairline">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 border border-seal mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-seal flex-shrink-0" />
            <span className="text-xs font-medium text-seal tracking-wide">
              {t(lang, 'hero.badge')}
            </span>
          </div>

          <h1 className="font-display font-medium text-ink leading-[1.05] mb-6"
              style={{ fontSize: 'clamp(36px, 6vw, 68px)', letterSpacing: '0.005em', maxWidth: '18ch' }}>
            {t(lang, 'hero.title').split('\n').map((line, i) => (
              <span key={i} style={{ display: 'block' }}>{line}</span>
            ))}
          </h1>
          <p className="text-ink-soft text-base sm:text-lg max-w-xl mb-10 leading-relaxed">
            {t(lang, 'hero.subtitle')}
          </p>

          <form onSubmit={handleSearch}
                className="flex items-center gap-0 border-b border-ink w-full max-w-md">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t(lang, 'hero.searchPlaceholder')}
              className="bg-transparent border-none outline-none text-ink text-sm py-3 flex-1 placeholder-ink-faint min-w-0"
            />
            <button type="submit" className="btn-line whitespace-nowrap">
              {t(lang, 'hero.searchBtn')}
            </button>
          </form>

          <Link to="/login" className="inline-block mt-8 text-sm text-seal hover:opacity-70 no-underline border-b border-seal pb-0.5">
            {t(lang, 'hero.registerCta')} →
          </Link>
        </div>
      </section>

      {/* Featured talents — 登録者がいないうちは見出しごと出さない */}
      {featured.length > 0 && (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="flex items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="font-display font-medium text-ink text-2xl tracking-wide">
              {t(lang, 'home.featuredHeading')}
            </h2>
            <p className="text-ink-soft text-sm mt-1.5">{t(lang, 'home.featuredSub')}</p>
          </div>
          <Link to="/talents" className="btn-line no-underline whitespace-nowrap">
            {t(lang, 'home.viewAll')}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featured.map(talent => (
            <TalentTeaserCard key={talent.id} talent={talent} />
          ))}
        </div>
      </main>
      )}

      <Footer />
    </div>
  )
}
