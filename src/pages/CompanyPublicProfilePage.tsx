import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import FollowButton from '../components/FollowButton'
import MessageButton from '../components/MessageButton'
import SaveButton from '../components/SaveButton'
import PostCard from '../components/PostCard'
import { useLang } from '../App'
import { useAuth } from '../context/AuthContext'
import { t } from '../i18n'
import { supabase } from '../lib/supabase'
import { mapJobRow, jobTitle } from '../lib/jobMapper'
import { isSafeHttpUrl } from '../lib/url'
import { loadPostFeed, type PostFeed } from '../lib/postFeed'
import type { Company, Job } from '../types'

export default function CompanyPublicProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { lang } = useLang()
  const { accountType, user } = useAuth()
  const [company, setCompany] = useState<Company | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  // 計画書201行目が「Connect/Saved の完了後に足す」としたまま残っていた分。
  const [feed, setFeed] = useState<PostFeed>({ posts: [], likes: [], comments: [], userNames: new Map() })

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    setNotFound(false)

    async function load() {
      const [{ data: companyRow }, { data: jobRows }, postFeed] = await Promise.all([
        supabase.from('companies').select('*').eq('id', id).maybeSingle(),
        supabase.from('jobs').select('*').eq('company_id', id).eq('status', 'open').order('created_at', { ascending: false }),
        loadPostFeed(lang, id),
      ])
      if (cancelled) return
      if (!companyRow) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setCompany({
        id: companyRow.id,
        email: '',
        name: companyRow.name ?? '',
        nameJa: companyRow.name_ja ?? '',
        description: companyRow.description ?? '',
        industry: companyRow.industry ?? '',
        size: companyRow.size ?? '',
        website: companyRow.website ?? '',
        logoUrl: companyRow.logo_url ?? '',
      })
      setJobs((jobRows ?? []).map(mapJobRow))
      setFeed(postFeed)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [id, lang])

  if (loading) {
    return (
      <div className="min-h-screen line-page flex items-center justify-center text-ink-faint">···</div>
    )
  }

  if (notFound || !company) {
    return (
      <div className="min-h-screen line-page">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <p className="text-ink-soft text-lg mb-4">{t(lang, 'companyProfile.notFound')}</p>
          <Link to="/jobs" className="btn-line-ghost no-underline">{t(lang, 'companyProfile.back')}</Link>
        </main>
        <Footer />
      </div>
    )
  }

  const name = lang === 'ja' && company.nameJa ? company.nameJa : company.name
  const initial = (company.name || '??').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen line-page">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link to="/jobs" className="inline-flex items-center text-ink-soft text-sm hover:text-ink transition-colors no-underline mb-8">
          {t(lang, 'companyProfile.back')}
        </Link>

        <div className="line-card mb-6">
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-5 sm:gap-6">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt="" className="avatar-line w-20 h-20 sm:w-24 sm:h-24 text-2xl sm:text-3xl" />
            ) : (
              <div className="avatar-line w-20 h-20 sm:w-24 sm:h-24 text-2xl sm:text-3xl">{initial}</div>
            )}
            <div className="flex-1">
              <h1 className="font-display font-medium text-ink text-2xl sm:text-3xl tracking-wide mb-1">{name}</h1>
              {company.industry && (
                <p className="text-ink-soft text-sm sm:text-base mb-4">
                  {company.industry}{company.size ? ` · ${company.size}` : ''}
                </p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <FollowButton targetType="company" targetId={company.id} small />
                <SaveButton itemType="company" itemId={company.id} small />
                {accountType === 'talent' && user && (
                  <MessageButton talentId={user.id} companyId={company.id} small />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {company.description && (
              <section className="line-card p-6">
                <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-4">
                  {t(lang, 'companyProfile.about')}
                </h2>
                <p className="text-ink text-sm leading-relaxed">{company.description}</p>
              </section>
            )}

            <section className="line-card p-6">
              <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-4">
                {t(lang, 'companyProfile.openPositions')}
              </h2>
              {jobs.length === 0 ? (
                <p className="text-ink-faint text-sm">{t(lang, 'companyProfile.noOpenPositions')}</p>
              ) : (
                <div className="space-y-3">
                  {jobs.map(job => (
                    <Link
                      key={job.id}
                      to={`/jobs/${job.id}`}
                      className="block no-underline group border-b border-hairline last:border-b-0 pb-3 last:pb-0"
                    >
                      <p className="text-ink text-sm font-medium group-hover:text-seal transition-colors">
                        {jobTitle(job, lang)}
                      </p>
                      <p className="text-ink-faint text-xs mt-0.5">
                        {(lang === 'ja' ? job.fieldJa : job.field) || '—'}
                        {job.location && ` · ${job.location}`}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {feed.posts.length > 0 && (
              <section>
                <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-4 px-1">
                  {t(lang, 'companyProfile.posts')}
                </h2>
                <div className="space-y-4">
                  {feed.posts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      likes={feed.likes.filter(l => l.postId === post.id)}
                      comments={feed.comments.filter(c => c.postId === post.id)}
                      getUserName={(uid) => feed.userNames.get(uid) ?? '—'}
                      onRefresh={() => { loadPostFeed(lang, id).then(setFeed) }}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          {company.website && (
            <div className="space-y-5">
              <section className="line-card p-6">
                <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-3">
                  {t(lang, 'companyProfile.website')}
                </h2>
                {isSafeHttpUrl(company.website) ? (
                  <a href={company.website} target="_blank" rel="noreferrer" className="text-seal hover:opacity-70 text-sm break-all">
                    {company.website}
                  </a>
                ) : (
                  <span className="text-ink-soft text-sm break-all">{company.website}</span>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
