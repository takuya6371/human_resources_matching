import { Link } from 'react-router-dom'
import { useLang } from '../App'
import { t } from '../i18n'
import type { Talent } from '../types'

const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  N1: { bg: 'rgba(216,90,48,0.12)', text: '#D85A30' },
  N2: { bg: 'rgba(29,158,117,0.12)', text: '#1D9E75' },
  N3: { bg: 'rgba(83,74,183,0.12)', text: '#7F77DD' },
  N4: { bg: 'rgba(186,117,23,0.12)', text: '#BA7517' },
}

const ACCENT_GRADIENTS = [
  'linear-gradient(180deg, #D85A30 0%, #BA7517 100%)',
  'linear-gradient(180deg, #1D9E75 0%, #639922 100%)',
  'linear-gradient(180deg, #7F77DD 0%, #534AB7 100%)',
  'linear-gradient(180deg, #BA7517 0%, #D85A30 100%)',
]

interface Props {
  talent: Talent
  index: number
  disableLink?: boolean
}

export default function TalentCard({ talent, index, disableLink = false }: Props) {
  const { lang } = useLang()
  const name = lang === 'ja' ? talent.nameJa : talent.nameEn
  const country = lang === 'ja' ? talent.countryJa : talent.country
  const field = lang === 'ja' ? talent.fieldJa : talent.field
  const university = lang === 'ja' ? talent.universityJa : talent.university
  const skills = lang === 'ja' ? talent.skillsJa : talent.skills
  const level = LEVEL_COLORS[talent.japaneseLevel] ?? LEVEL_COLORS['N3']
  const accentGradient = ACCENT_GRADIENTS[index % ACCENT_GRADIENTS.length]

  const inner = (
      <div className={`relative bg-dark-2 rounded-2xl p-6 card-border h-full ${disableLink ? '' : 'transition-all duration-200 group-hover:bg-dark-3 group-hover:border-white/[0.14]'}`}>
        <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background: accentGradient }} />

        <div className="pl-3">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-semibold flex-shrink-0"
                   style={{ background: talent.avatarColor + '22', border: `1px solid ${talent.avatarColor}33`, color: talent.avatarColor }}>
                {talent.initials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium text-base tracking-tight">{name}</p>
                  <span className="text-lg">{talent.flag}</span>
                </div>
                <p className="text-white/50 text-xs mt-0.5">{lang === 'ja' ? talent.headlineJa : talent.headlineEn}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-xs font-medium px-2.5 py-1 rounded-lg"
                    style={{ background: level.bg, color: level.text }}>
                {talent.japaneseLevel}
              </span>
              {talent.openToWork && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-lg"
                      style={{ background: 'rgba(29,158,117,0.12)', color: '#1D9E75' }}>
                  ✓ {t(lang, 'detail.openToWork')}
                </span>
              )}
            </div>
          </div>

          <div className="mb-3">
            <p className="text-white/70 text-sm font-medium">{field}</p>
            <p className="text-white/40 text-xs mt-0.5">{university}</p>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-5">
            {skills.slice(0, 3).map(skill => (
              <span key={skill} className="text-xs px-2.5 py-1 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
                {skill}
              </span>
            ))}
            {skills.length > 3 && (
              <span className="text-xs px-2.5 py-1 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                +{skills.length - 3}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
            <span className="text-xs text-white/40">
              {t(lang, 'card.available')}: {lang === 'ja' ? talent.availableFromJa : talent.availableFrom}
            </span>
            {!disableLink && (
              <span className="text-xs font-medium text-a-orange group-hover:text-a-orange/80 transition-colors">
                {t(lang, 'card.viewProfile')} →
              </span>
            )}
          </div>
        </div>
      </div>
  )

  if (disableLink) return <div>{inner}</div>
  return (
    <Link to={`/talent/${talent.id}`} className="block no-underline group">
      {inner}
    </Link>
  )
}
