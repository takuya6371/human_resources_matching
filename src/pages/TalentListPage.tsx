import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import TalentCard from '../components/TalentCard'
import TalentTeaserCard from '../components/TalentTeaserCard'
import Footer from '../components/Footer'
import { useLang } from '../App'
import { useAuth } from '../context/AuthContext'
import { t } from '../i18n'
import { supabase } from '../lib/supabase'
import { mapProfileRow, mapTeaserRow } from '../lib/profileMapper'
import type { Talent, TalentTeaser } from '../types'

const FIELDS = ['IT', 'Business', 'Engineering', 'Data'] as const
const FIELDS_JA: Record<string, string> = {
  IT: 'IT・エンジニアリング',
  Business: 'ビジネス',
  Engineering: '工学',
  Data: 'データ',
}
const LEVELS = ['N1', 'N2', 'N3', 'N4', 'N5'] as const
const AREAS = ['東京都', '大阪府', '京都府', '神奈川県', '愛知県', '福岡県'] as const

export default function TalentListPage() {
  const { lang } = useLang()
  const { accountType } = useAuth()
  const hasFullAccess = accountType === 'company' || accountType === 'admin'
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [activeField, setActiveField] = useState<string | null>(null)
  const [activeLevel, setActiveLevel] = useState<string | null>(null)
  const [activeArea, setActiveArea] = useState<string | null>(null)
  const [openToWorkOnly, setOpenToWorkOnly] = useState(false)
  const [talents, setTalents] = useState<Talent[]>([])
  const [teasers, setTeasers] = useState<TalentTeaser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) setSearch(q)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function load() {
      if (hasFullAccess) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
        if (!cancelled) setTalents((data ?? []).map(row => mapProfileRow(row)))
      } else {
        const { data } = await supabase
          .from('profiles_preview')
          .select('*')
          .order('id')
        if (!cancelled) setTeasers((data ?? []).map(mapTeaserRow))
      }
      if (!cancelled) setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [hasFullAccess])

  function handleSearchChange(value: string) {
    setSearch(value)
    if (value.trim()) {
      setSearchParams({ q: value.trim() }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }

  function clearAll() {
    setActiveField(null)
    setActiveLevel(null)
    setActiveArea(null)
    setOpenToWorkOnly(false)
    handleSearchChange('')
  }

  const filteredTalents = useMemo(() => {
    if (!hasFullAccess) return []
    const query = search.trim().toLowerCase()
    return talents.filter(talent => {
      const name = (lang === 'ja' ? talent.nameJa : talent.nameEn).toLowerCase()
      const skillsArr = lang === 'ja' ? talent.skillsJa : talent.skills
      const matchSearch = !query ||
        name.includes(query) ||
        skillsArr.some(s => s.toLowerCase().includes(query))
      const matchField = !activeField || talent.field === activeField
      const matchLevel = !activeLevel || talent.japaneseLevel === activeLevel
      const matchArea = !activeArea || talent.residenceArea === activeArea
      const matchOpenToWork = !openToWorkOnly || talent.openToWork
      return matchSearch && matchField && matchLevel && matchArea && matchOpenToWork
    })
  }, [hasFullAccess, talents, search, activeField, activeLevel, activeArea, openToWorkOnly, lang])

  const filteredTeasers = useMemo(() => {
    if (hasFullAccess) return []
    const query = search.trim().toLowerCase()
    return teasers.filter(talent => {
      const skillsArr = lang === 'ja' ? talent.skillsJa : talent.skills
      const matchSearch = !query || skillsArr.some(s => s.toLowerCase().includes(query))
      const matchField = !activeField || talent.field === activeField
      const matchLevel = !activeLevel || talent.japaneseLevel === activeLevel
      const matchArea = !activeArea || talent.residenceArea === activeArea
      const matchOpenToWork = !openToWorkOnly || talent.openToWork
      return matchSearch && matchField && matchLevel && matchArea && matchOpenToWork
    })
  }, [hasFullAccess, teasers, search, activeField, activeLevel, activeArea, openToWorkOnly, lang])

  const resultCount = hasFullAccess ? filteredTalents.length : filteredTeasers.length
  const areaSource: { residenceArea?: string }[] = hasFullAccess ? talents : teasers
  const hasFilters = !!(activeField || activeLevel || activeArea || openToWorkOnly || search)

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />

      <div className="border-b border-white/[0.06]"
           style={{ background: 'linear-gradient(180deg, #0F0F0F 0%, #141414 100%)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <h1 className="text-3xl font-medium text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
            {t(lang, 'list.heading')}
          </h1>
          <p className="text-white/40 text-sm mb-6">{t(lang, 'list.subheading')}</p>

          <div className="flex items-center gap-2 bg-dark-3 rounded-xl px-3 py-2 w-full sm:max-w-sm"
               style={{ border: '0.5px solid rgba(255,255,255,0.1)' }}>
            <span className="text-white/30 text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder={t(lang, 'hero.searchPlaceholder')}
              className="bg-transparent border-none outline-none text-white text-sm flex-1 placeholder-white/25"
            />
            {search && (
              <button onClick={() => handleSearchChange('')}
                      className="text-white/30 hover:text-white/60 transition-colors cursor-pointer text-xs">
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {!hasFullAccess && (
          <div className="rounded-2xl p-6 mb-8 card-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
               style={{ background: 'linear-gradient(135deg, rgba(216,90,48,0.08) 0%, rgba(29,158,117,0.08) 100%)' }}>
            <div>
              <p className="text-white text-sm font-medium mb-1">{t(lang, 'gate.title')}</p>
              <p className="text-white/50 text-xs leading-relaxed max-w-xl">{t(lang, 'gate.subtitle')}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link to="/login" className="btn-primary text-sm no-underline whitespace-nowrap">
                {t(lang, 'gate.signInBtn')}
              </Link>
            </div>
          </div>
        )}

        <div className="space-y-3 mb-8">
          <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">
            <span className="text-white/30 text-xs font-medium uppercase tracking-wider pt-1.5 w-24 flex-shrink-0">
              {t(lang, 'list.filterField')}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveField(null)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  !activeField ? 'bg-white text-dark' : 'bg-dark-3 text-white/60 hover:text-white border border-white/[0.08]'
                }`}
              >
                {t(lang, 'list.filterAll')}
              </button>
              {FIELDS.map(f => (
                <button key={f}
                  onClick={() => setActiveField(activeField === f ? null : f)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeField === f ? 'bg-a-orange text-white' : 'bg-dark-3 text-white/60 hover:text-white border border-white/[0.08]'
                  }`}
                >
                  {lang === 'ja' ? FIELDS_JA[f] : f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">
            <span className="text-white/30 text-xs font-medium uppercase tracking-wider pt-1.5 w-24 flex-shrink-0">
              {t(lang, 'list.filterLevel')}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {LEVELS.map(l => (
                <button key={l}
                  onClick={() => setActiveLevel(activeLevel === l ? null : l)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeLevel === l ? 'bg-a-green text-white' : 'bg-dark-3 text-white/60 hover:text-white border border-white/[0.08]'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {AREAS.some(area => areaSource.some(t => t.residenceArea === area)) && (
            <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">
              <span className="text-white/30 text-xs font-medium uppercase tracking-wider pt-1.5 w-24 flex-shrink-0">
                {t(lang, 'list.filterResidence')}
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {AREAS.map(area => {
                  const hasData = areaSource.some(t => t.residenceArea === area)
                  if (!hasData) return null
                  return (
                    <button key={area}
                      onClick={() => setActiveArea(activeArea === area ? null : area)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        activeArea === area ? 'bg-white/20 text-white' : 'bg-dark-3 text-white/60 hover:text-white border border-white/[0.08]'
                      }`}
                    >
                      {area}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-white/[0.06] mt-1">
            <button
              onClick={() => setOpenToWorkOnly(o => !o)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1 mt-2 ${
                openToWorkOnly ? 'bg-a-green text-white' : 'bg-dark-3 text-white/60 hover:text-white border border-white/[0.08]'
              }`}
            >
              ✓ {t(lang, 'list.filterOpenToWork')}
            </button>

            {hasFilters && (
              <button onClick={clearAll}
                      className="px-3.5 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer bg-dark-3 border border-white/[0.08] mt-2">
                {t(lang, 'list.clearAll')}
              </button>
            )}
          </div>
        </div>

        <p className="text-white/30 text-xs mb-5">
          {resultCount} {t(lang, 'list.resultCount')}
        </p>

        {loading ? (
          <div className="text-center py-20 text-white/30">…</div>
        ) : resultCount > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hasFullAccess
              ? filteredTalents.map((talent, i) => (
                  <TalentCard key={talent.id} talent={talent} index={i} />
                ))
              : filteredTeasers.map(talent => (
                  <TalentTeaserCard key={talent.id} talent={talent} />
                ))}
          </div>
        ) : (
          <div className="text-center py-20 text-white/30">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg">{t(lang, 'list.noResults')}</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
