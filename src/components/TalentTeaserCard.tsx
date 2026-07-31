import { Link } from 'react-router-dom'
import { useLang } from '../App'
import { t } from '../i18n'
import type { TalentTeaser } from '../types'

const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  N1: { bg: 'rgba(216,90,48,0.12)', text: '#D85A30' },
  N2: { bg: 'rgba(29,158,117,0.12)', text: '#1D9E75' },
  N3: { bg: 'rgba(83,74,183,0.12)', text: '#7F77DD' },
  N4: { bg: 'rgba(186,117,23,0.12)', text: '#BA7517' },
  N5: { bg: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.5)' },
}

interface Props {
  talent: TalentTeaser
}

// ログイン不要で見える範囲（分野・大学・スキル・日本語レベル等）はそのまま表示し、
// 氏名・写真・自己紹介など個人が特定できる情報だけをぼかして企業ログインへ誘導する。
export default function TalentTeaserCard({ talent }: Props) {
  const { lang } = useLang()
  const skills = lang === 'ja' ? talent.skillsJa : talent.skills
  const field = lang === 'ja' ? talent.fieldJa : talent.field
  const level = LEVEL_COLORS[talent.japaneseLevel] ?? LEVEL_COLORS['N3']

  return (
    <Link to="/login" className="block no-underline group">
      <div className="relative bg-dark-2 rounded-2xl p-6 card-border h-full overflow-hidden transition-all duration-200 group-hover:bg-dark-3 group-hover:border-white/[0.14]">
        <div className="pl-3">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl flex-shrink-0"
                   style={{ background: 'rgba(255,255,255,0.06)', filter: 'blur(6px)' }} />
              <div>
                <div className="w-24 h-3.5 rounded" style={{ background: 'rgba(255,255,255,0.12)', filter: 'blur(4px)' }} />
                <div className="w-16 h-2.5 rounded mt-2" style={{ background: 'rgba(255,255,255,0.08)', filter: 'blur(4px)' }} />
              </div>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-lg"
                  style={{ background: level.bg, color: level.text }}>
              {talent.japaneseLevel}
            </span>
          </div>

          <div className="mb-3">
            <p className="text-white/70 text-sm font-medium">{field}</p>
            <p className="text-white/40 text-xs mt-0.5">{talent.country}</p>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-5">
            {skills.slice(0, 3).map(skill => (
              <span key={skill} className="text-xs px-2.5 py-1 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
                {skill}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
            <span className="text-xs text-white/40">
              {(lang === 'ja' ? talent.availableFromJa : talent.availableFrom) &&
                `${t(lang, 'card.available')}: ${lang === 'ja' ? talent.availableFromJa : talent.availableFrom}`}
            </span>
            <span className="text-xs font-medium text-a-orange group-hover:text-a-orange/80 transition-colors flex items-center gap-1">
              🔒 {t(lang, 'card.locked')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
