import { Link } from 'react-router-dom'
import { useLang } from '../App'
import { t, pick } from '../i18n'
import { jobTitle } from '../lib/jobMapper'
import type { Job } from '../types'

interface Props {
  job: Job
}

// ホームの求人プレビュー用。ログイン不要で詳細まで見られるため、
// /jobs の一覧カードと同じ情報量をそのまま見せる（ぼかしなし）。
export default function JobPreviewCard({ job }: Props) {
  const { lang } = useLang()

  return (
    <Link to={`/jobs/${job.id}`} className="block no-underline group">
      <div className="line-card h-full p-6 transition-colors group-hover:border-ink">
        <div className="flex items-center gap-3 mb-4">
          {job.companyLogoUrl ? (
            <img src={job.companyLogoUrl} alt="" className="avatar-line w-10 h-10 text-sm" />
          ) : (
            <div className="avatar-line w-10 h-10 text-sm">
              {(job.companyName ?? '??').slice(0, 2).toUpperCase()}
            </div>
          )}
          <p className="text-ink-soft text-xs">{(lang === 'ja' && job.companyNameJa) ? job.companyNameJa : job.companyName}</p>
        </div>
        <p className="font-display font-medium text-ink text-base mb-2">
          {jobTitle(job, lang)}
        </p>
        <p className="text-ink-soft text-xs mb-5">
          {(pick(lang, job.fieldJa, job.field)) || '—'}
          {job.location && ` · ${job.location}`}
        </p>
        <div className="flex items-center justify-between pt-4 border-t border-hairline">
          <span className="badge-line-ink">{t(lang, `jobs.jobType${job.jobType.charAt(0).toUpperCase()}${job.jobType.slice(1)}`)}</span>
          <span className="text-xs font-medium text-ink group-hover:text-seal transition-colors">
            {t(lang, 'jobs.viewDetail')} →
          </span>
        </div>
      </div>
    </Link>
  )
}
