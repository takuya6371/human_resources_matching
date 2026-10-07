import { Link } from 'react-router-dom'
import { useLang } from '../App'
import { t, pick, pickList } from '../i18n'
import FollowButton from './FollowButton'
import InterestButton from './InterestButton'
import type { Talent } from '../types'

interface Props {
  talent: Talent
  index: number
  disableLink?: boolean
}

export default function TalentCard({ talent, disableLink = false }: Props) {
  const { lang } = useLang()
  const name = pick(lang, talent.nameJa, talent.nameEn)
  const country = pick(lang, talent.countryJa, talent.country)
  const field = pick(lang, talent.fieldJa, talent.field)
  const university = pick(lang, talent.universityJa, talent.university)
  const skills = pickList(lang, talent.skillsJa, talent.skills)

  const inner = (
    <>
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
            <p className="text-ink-soft text-xs mt-1">{pick(lang, talent.headlineJa, talent.headlineEn)}</p>
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
          {(pick(lang, talent.availableFromJa, talent.availableFrom)) &&
            `${t(lang, 'card.available')}: ${pick(lang, talent.availableFromJa, talent.availableFrom)}`}
        </span>
        {!disableLink && (
          <span className="text-xs font-medium text-ink group-hover:text-seal transition-colors">
            {t(lang, 'card.viewProfile')} →
          </span>
        )}
      </div>
    </>
  )

  if (disableLink) {
    return (
      <div className="line-card h-full p-6">
        {inner}
      </div>
    )
  }

  return (
    <div className="line-card h-full p-6 transition-colors hover:border-ink group">
      <Link to={`/talent/${talent.id}`} className="block no-underline">
        {inner}
      </Link>
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-hairline">
        <InterestButton toUserId={talent.id} toType="talent" small />
        <FollowButton targetType="talent" targetId={talent.id} small />
      </div>
    </div>
  )
}
