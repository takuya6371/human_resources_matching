import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, Building2, ArrowRight, Sparkles } from 'lucide-react'
import Navbar from '../components/Navbar'
import TalentTeaserCard from '../components/TalentTeaserCard'
import JobPreviewCard from '../components/JobPreviewCard'
import Footer from '../components/Footer'
import TrustedCompanies from '../components/TrustedCompanies'
import { useLang } from '../App'
import { t } from '../i18n'
import { supabase } from '../lib/supabase'
import { mapTeaserRow } from '../lib/profileMapper'
import { mapJobRow } from '../lib/jobMapper'
import type { TalentTeaser, Job } from '../types'

export default function HomePage() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [featured, setFeatured] = useState<TalentTeaser[]>([])
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([])

  // トップは未ログインでも開くため、氏名や連絡先を含まない profiles_preview を使う。
  useEffect(() => {
    supabase.from('profiles_preview').select('*').limit(3)
      .then(({ data }) => setFeatured((data ?? []).map(mapTeaserRow)))
  }, [])

  // 求人はもともと未ログインで全文公開なので、一覧ページと同じ生データでよい。
  useEffect(() => {
    supabase.from('jobs').select('*, companies(name, name_ja, logo_url)')
      .eq('status', 'open').order('created_at', { ascending: false }).limit(3)
      .then(({ data }) => setFeaturedJobs((data ?? []).map(mapJobRow)))
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
      <section className="relative isolate overflow-hidden py-20 sm:py-28 px-4 sm:px-6 border-b border-hairline">
        {/* isolate が無いと section が独自のスタッキングコンテキストを作らず、
            -z-10 がページ全体（.line-page の不透明な背景）まで突き抜けて完全に
            見えなくなる。isolate でこの section 内に z-index を閉じ込める。 */}
        <div className="absolute inset-x-0 top-0 h-[220px] -z-10 bg-gradient-to-b from-amber-50/60 via-paper to-paper" />
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 mb-8 text-xs font-medium text-amber-800 tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            {t(lang, 'hero.badge')}
          </span>

          <h1 className="font-display font-medium text-ink leading-[1.05] mb-5 mx-auto"
              style={{ fontSize: 'clamp(40px, 7vw, 76px)', letterSpacing: '0.005em' }}>
            {t(lang, 'hero.tagline').split('\n').map((line, i) => (
              <span key={i} style={{ display: 'block' }}>{line}</span>
            ))}
          </h1>
          <p className="font-display text-ink-soft text-lg sm:text-xl mb-6">
            {t(lang, 'hero.title').split('\n').join(lang === 'ja' ? '' : ' ')}
          </p>
          <p className="text-ink-soft text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            {t(lang, 'hero.subtitle')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <Link to="/login?mode=signup&role=talent"
                  className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-ink text-paper text-sm font-medium hover:bg-seal transition-colors no-underline whitespace-nowrap">
              <Users className="w-4 h-4" />
              {t(lang, 'hero.ctaTalent')}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login?mode=signup&role=company"
                  className="inline-flex items-center gap-2 h-11 px-6 rounded-full border border-ink text-ink text-sm font-medium hover:bg-ink hover:text-paper transition-colors no-underline whitespace-nowrap">
              <Building2 className="w-4 h-4" />
              {t(lang, 'hero.ctaCompany')}
            </Link>
          </div>

          <form onSubmit={handleSearch}
                className="flex items-center gap-0 border-b border-ink w-full max-w-md mx-auto">
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
        </div>
      </section>

      <TrustedCompanies />

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

      {/* Featured jobs — /jobs はもともと未ログインで全文公開なのでボカシ無し */}
      {featuredJobs.length > 0 && (
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 border-t border-hairline">
        <div className="flex items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="font-display font-medium text-ink text-2xl tracking-wide">
              {t(lang, 'home.jobsHeading')}
            </h2>
            <p className="text-ink-soft text-sm mt-1.5">{t(lang, 'home.jobsSub')}</p>
          </div>
          <Link to="/jobs" className="btn-line no-underline whitespace-nowrap">
            {t(lang, 'home.viewAllJobs')}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredJobs.map(job => (
            <JobPreviewCard key={job.id} job={job} />
          ))}
        </div>
      </section>
      )}

      <Footer />
    </div>
  )
}
