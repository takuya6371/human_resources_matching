import { Link } from 'react-router-dom'
import { useLang } from '../App'
import { t } from '../i18n'
import type { Talent } from '../types'

interface Props {
  talent: Talent
  index: number
  disableLink?: boolean
}

export default function TalentCard({ talent, disableLink = false }: Props) {
  const { lang } = useLang()
  const name = lang === 'ja' ? talent.nameJa : talent.nameEn
  const country = lang === 'ja' ? talent.countryJa : talent.country
  const field = lang === 'ja' ? talent.fieldJa : talent.field
  const university = lang === 'ja' ? talent.universityJa : talent.university
  const skills = lang === 'ja' ? talent.skillsJa : talent.skills

  const inner = (
      <div className={`line-card h-full p-6 ${disableLink ? '' : 'transition-colors group-hover:border-ink'}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {talent.avatarUrl ? (
              <img src={talent.avatarUrl} alt="" className="avatar-line w-14 h-14 text-lg" />
            ) : (
              <div className="avatar-line w-14 h-14 text-lg">
                {talent.initials}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <p className="font-display font-medium text-ink text-base">{name}</p>
                <span className="text-base leading-none">{talent.flag}</span>
              </div>
              <p className="text-ink-soft text-xs mt-1">{lang === 'ja' ? talent.headlineJa : talent.headlineEn}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className="badge-line">{talent.japaneseLevel}</span>
            {talent.openToWork && (
              <span className="badge-line-ink">{t(lang, 'detail.openToWork')}</span>
            )}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-ink text-sm">{field} · {country}</p>
          <p className="text-ink-faint text-xs mt-1">{university}</p>
        </div>

        <p className="text-xs text-ink-soft mb-5">
          {skills.slice(0, 3).join(' · ')}
          {skills.length > 3 && <span className="text-ink-faint"> +{skills.length - 3}</span>}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-hairline">
          <span className="text-xs text-ink-faint">
            {(lang === 'ja' ? talent.availableFromJa : talent.availableFrom) &&
              `${t(lang, 'card.available')}: ${lang === 'ja' ? talent.availableFromJa : talent.availableFrom}`}
          </span>
          {!disableLink && (
            <span className="text-xs font-medium text-ink group-hover:text-seal transition-colors">
              {t(lang, 'card.viewProfile')} →
            </span>
          )}
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
