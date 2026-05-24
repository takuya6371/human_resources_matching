import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import TalentCard from '../components/TalentCard'
import Footer from '../components/Footer'
import talentsData from '../data/talents.json'
import { useLang } from '../App'
import { t } from '../i18n'
import type { Talent } from '../types'

const talents = talentsData as Talent[]

const FIELDS = ['IT', 'Business', 'Engineering', 'Data'] as const
const FIELDS_JA: Record<string, string> = {
  IT: 'IT・エンジニアリング',
  Business: 'ビジネス',
  Engineering: '工学',
  Data: 'データ',
}
const LEVELS = ['N1', 'N2', 'N3'] as const

export default function TalentListPage() {
  const { lang } = useLang()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [activeField, setActiveField] = useState<string | null>(null)
  const [activeLevel, setActiveLevel] = useState<string | null>(null)

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) setSearch(q)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    handleSearchChange('')
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return talents.filter(talent => {
      const name = (lang === 'ja' ? talent.nameJa : talent.nameEn).toLowerCase()
      const skillsArr = lang === 'ja' ? talent.skillsJa : talent.skills
      const matchSearch = !query ||
        name.includes(query) ||
        skillsArr.some(s => s.toLowerCase().includes(query))
      const matchField = !activeField || talent.field === activeField
      const matchLevel = !activeLevel || talent.japaneseLevel === activeLevel
      return matchSearch && matchField && matchLevel
    })
  }, [search, activeField, activeLevel, lang])

  const hasFilters = !!(activeField || activeLevel || search)

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
        <div className="flex items-center gap-2 flex-wrap mb-8">
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

          <div className="w-px h-4 bg-white/[0.08]" />

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

          {hasFilters && (
            <>
              <div className="w-px h-4 bg-white/[0.08]" />
              <button onClick={clearAll}
                      className="px-3.5 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer bg-dark-3 border border-white/[0.08]">
                {t(lang, 'list.clearAll')}
              </button>
            </>
          )}
        </div>

        <p className="text-white/30 text-xs mb-5">
          {filtered.length} {t(lang, 'list.resultCount')}
        </p>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((talent, i) => (
              <TalentCard key={talent.id} talent={talent} index={i} />
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
