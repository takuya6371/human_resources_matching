import { Link } from 'react-router-dom'
import { useLang } from '../App'
import { t } from '../i18n'
import type { TalentTeaser } from '../types'

interface Props {
  talent: TalentTeaser
}

// ログイン不要で見える範囲（分野・大学・スキル・日本語レベル等）はそのまま表示し、
// 氏名・写真・自己紹介など個人が特定できる情報だけをぼかして企業ログインへ誘導する。
export default function TalentTeaserCard({ talent }: Props) {
  const { lang } = useLang()
  const skills = lang === 'ja' ? talent.skillsJa : talent.skills
  const field = lang === 'ja' ? talent.fieldJa : talent.field

  return (
    <Link to="/login" className="block no-underline group">
      <div className="line-card h-full p-6 transition-colors group-hover:border-ink">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="avatar-line w-14 h-14"
                 style={{ background: 'rgba(28,27,24,0.05)', filter: 'blur(5px)' }} />
            <div>
              <div className="w-24 h-3.5" style={{ background: 'rgba(28,27,24,0.14)', filter: 'blur(3px)' }} />
              <div className="w-16 h-2.5 mt-2" style={{ background: 'rgba(28,27,24,0.08)', filter: 'blur(3px)' }} />
            </div>
          </div>
          <span className="badge-line">{talent.japaneseLevel}</span>
        </div>

        <div className="mb-4">
          <p className="text-ink text-sm">{field}</p>
          <p className="text-ink-faint text-xs mt-1">{talent.country}</p>
        </div>

        <p className="text-xs text-ink-soft mb-5">{skills.slice(0, 3).join(' · ')}</p>

        <div className="flex items-center justify-between pt-4 border-t border-hairline">
          <span className="text-xs text-ink-faint">
            {(lang === 'ja' ? talent.availableFromJa : talent.availableFrom) &&
              `${t(lang, 'card.available')}: ${lang === 'ja' ? talent.availableFromJa : talent.availableFrom}`}
          </span>
          <span className="text-xs font-medium text-seal group-hover:opacity-70 transition-opacity flex items-center gap-1">
            {t(lang, 'card.locked')}
          </span>
        </div>
      </div>
    </Link>
  )
}
