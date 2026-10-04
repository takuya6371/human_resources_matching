import { useEffect, useState } from 'react'
import { useLang } from '../App'
import { t } from '../i18n'
import { supabase } from '../lib/supabase'

interface TrustedCompany {
  id: string
  name: string
  logo_url: string | null
  website: string | null
}

// 移植元(bridge-africa-talent/src/components/LogoCarousel.jsx)は、テーブルが
// 空のときに "TokyoTech" "OsakaWorks" といった架空の社名を流していた。
// 6a2eef8 で「実体のないサンプル」を排除した方針に反するため、
// 1件も無いうちは何も描画しない。見出しごと出さない。
export default function TrustedCompanies() {
  const { lang } = useLang()
  const [companies, setCompanies] = useState<TrustedCompany[]>([])

  useEffect(() => {
    supabase.from('trusted_companies')
      .select('id, name, logo_url, website')
      .eq('visible', true).order('sort_order')
      .then(({ data }) => setCompanies(data ?? []))
  }, [])

  if (companies.length === 0) return null

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 border-b border-hairline">
      <div className="max-w-6xl mx-auto">
        <p className="text-ink-faint text-xs uppercase tracking-widest text-center">
          {t(lang, 'home.trustedHeading')}
        </p>
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {companies.map(c => {
            const label = (
              <span className="inline-flex items-center gap-2.5">
                {c.logo_url && (
                  <img src={c.logo_url} alt="" className="h-7 w-7 object-cover border border-hairline" />
                )}
                <span className="font-display text-ink-soft text-base whitespace-nowrap">{c.name}</span>
              </span>
            )
            return (
              <li key={c.id}>
                {c.website
                  ? <a href={c.website} target="_blank" rel="noreferrer" className="no-underline hover:opacity-70">{label}</a>
                  : label}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
