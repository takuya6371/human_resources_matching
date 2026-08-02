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
import { mapProfileRow, mapTeaserRow, PROFILE_PUBLIC_COLUMNS } from '../lib/profileMapper'
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
          .select(PROFILE_PUBLIC_COLUMNS)
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
    <div className="min-h-screen line-page">
      <Navbar />

      <div className="border-b border-hairline">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <h1 className="font-display font-medium text-ink text-3xl tracking-wide mb-2">
            {t(lang, 'list.heading')}
          </h1>
          <p className="text-ink-soft text-sm mb-6">{t(lang, 'list.subheading')}</p>

          <div className="flex items-center gap-0 border-b border-ink w-full sm:max-w-md">
            <input
              type="text"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder={t(lang, 'hero.searchPlaceholder')}
              className="bg-transparent border-none outline-none text-ink text-sm py-3 flex-1 placeholder-ink-faint min-w-0"
            />
            {search && (
              <button onClick={() => handleSearchChange('')}
                      className="text-ink-faint hover:text-ink transition-colors cursor-pointer text-xs px-2">
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {!hasFullAccess && (
          <div className="p-6 mb-8 border border-seal flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-ink text-sm font-medium mb-1">{t(lang, 'gate.title')}</p>
              <p className="text-ink-soft text-xs leading-relaxed max-w-xl">{t(lang, 'gate.subtitle')}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link to="/login" className="btn-line no-underline whitespace-nowrap">
                {t(lang, 'gate.signInBtn')}
              </Link>
            </div>
          </div>
        )}

        <div className="space-y-3 mb-8">
          <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">
            <span className="text-ink-faint text-xs font-medium uppercase tracking-wider pt-1.5 w-24 flex-shrink-0">
              {t(lang, 'list.filterField')}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveField(null)}
                className={`px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer border ${
                  !activeField ? 'bg-ink text-paper border-ink' : 'border-hairline text-ink-soft hover:border-ink hover:text-ink'
                }`}
              >
                {t(lang, 'list.filterAll')}
              </button>
              {FIELDS.map(f => (
                <button key={f}
                  onClick={() => setActiveField(activeField === f ? null : f)}
                  className={`px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer border ${
                    activeField === f ? 'bg-ink text-paper border-ink' : 'border-hairline text-ink-soft hover:border-ink hover:text-ink'
                  }`}
                >
                  {lang === 'ja' ? FIELDS_JA[f] : f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">
            <span className="text-ink-faint text-xs font-medium uppercase tracking-wider pt-1.5 w-24 flex-shrink-0">
              {t(lang, 'list.filterLevel')}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {LEVELS.map(l => (
                <button key={l}
                  onClick={() => setActiveLevel(activeLevel === l ? null : l)}
                  className={`px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer border ${
                    activeLevel === l ? 'bg-ink text-paper border-ink' : 'border-hairline text-ink-soft hover:border-ink hover:text-ink'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {AREAS.some(area => areaSource.some(t => t.residenceArea === area)) && (
            <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">
              <span className="text-ink-faint text-xs font-medium uppercase tracking-wider pt-1.5 w-24 flex-shrink-0">
                {t(lang, 'list.filterResidence')}
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {AREAS.map(area => {
                  const hasData = areaSource.some(t => t.residenceArea === area)
                  if (!hasData) return null
                  return (
                    <button key={area}
                      onClick={() => setActiveArea(activeArea === area ? null : area)}
                      className={`px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer border ${
                        activeArea === area ? 'bg-ink text-paper border-ink' : 'border-hairline text-ink-soft hover:border-ink hover:text-ink'
                      }`}
                    >
                      {area}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-hairline mt-2">
            <button
              onClick={() => setOpenToWorkOnly(o => !o)}
              className={`px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 border ${
                openToWorkOnly ? 'bg-ink text-paper border-ink' : 'border-hairline text-ink-soft hover:border-ink hover:text-ink'
              }`}
            >
              {t(lang, 'list.filterOpenToWork')}
            </button>

            {hasFilters && (
              <button onClick={clearAll}
                      className="px-3.5 py-1.5 text-xs text-ink-faint hover:text-seal transition-colors cursor-pointer">
                {t(lang, 'list.clearAll')}
              </button>
            )}
          </div>
        </div>

        <p className="text-ink-faint text-xs mb-5" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {resultCount} {t(lang, 'list.resultCount')}
        </p>

        {loading ? (
          <div className="text-center py-20 text-ink-faint">···</div>
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
          <div className="text-center py-20 text-ink-faint">
            <p className="text-lg font-display">{t(lang, 'list.noResults')}</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
