import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Plus, Send } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PostCard from '../components/PostCard'
import FollowButton from '../components/FollowButton'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../App'
import { t } from '../i18n'
import { supabase } from '../lib/supabase'
import { loadPostFeed, type LikeRow, type CommentRow } from '../lib/postFeed'
import type { Post, PostType } from '../types'

const TYPES: { value: PostType; labelKey: string }[] = [
  { value: 'opportunity', labelKey: 'connect.typeOpportunity' },
  { value: 'scholarship', labelKey: 'connect.typeScholarship' },
  { value: 'program', labelKey: 'connect.typeProgram' },
  { value: 'social_problem', labelKey: 'connect.typeSocialProblem' },
]

interface CompanyLite { id: string; name: string; nameJa: string; logoUrl: string; industry: string }

export default function ConnectPage() {
  const { user, company, accountType } = useAuth()
  const { lang } = useLang()
  const selfId = user?.id ?? company?.id ?? null

  const [posts, setPosts] = useState<Post[]>([])
  const [likes, setLikes] = useState<LikeRow[]>([])
  const [comments, setComments] = useState<CommentRow[]>([])
  const [userNames, setUserNames] = useState<Map<string, string>>(new Map())
  const [followedCompanyIds, setFollowedCompanyIds] = useState<Set<string>>(new Set())
  const [companies, setCompanies] = useState<CompanyLite[]>([])
  const [loading, setLoading] = useState(true)

  const [showComposer, setShowComposer] = useState(false)
  const [cType, setCType] = useState<PostType>('opportunity')
  const [cTitle, setCTitle] = useState('')
  const [cBody, setCBody] = useState('')
  const [posting, setPosting] = useState(false)

  async function load() {
    const [feed, { data: companyRows }] = await Promise.all([
      loadPostFeed(lang),
      supabase.from('companies').select('id, name, name_ja, logo_url, industry'),
    ])
    setPosts(feed.posts)
    setLikes(feed.likes)
    setComments(feed.comments)
    setUserNames(feed.userNames)
    setCompanies((companyRows ?? []).map(c => ({ id: c.id, name: c.name ?? '', nameJa: c.name_ja ?? '', logoUrl: c.logo_url ?? '', industry: c.industry ?? '' })))

    if (selfId) {
      const { data: followRows } = await supabase.from('follows').select('target_id').eq('follower_id', selfId).eq('target_type', 'company')
      setFollowedCompanyIds(new Set((followRows ?? []).map(f => f.target_id)))
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [selfId, lang]) // eslint-disable-line react-hooks/exhaustive-deps

  async function createPost() {
    if (!company || !cTitle.trim() || !cBody.trim()) return
    setPosting(true)
    await supabase.from('posts').insert({ company_id: company.id, type: cType, title: cTitle.trim(), body: cBody.trim() })
    setCType('opportunity'); setCTitle(''); setCBody(''); setShowComposer(false)
    await load()
    setPosting(false)
  }

  const followed = companies.filter(c => followedCompanyIds.has(c.id))
  const suggested = companies.filter(c => !followedCompanyIds.has(c.id)).slice(0, 6)

  if (loading) {
    return <div className="min-h-screen line-page flex items-center justify-center text-ink-faint">···</div>
  }

  return (
    <div className="min-h-screen line-page">
      <Navbar />
      <div className="border-b border-hairline">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <h1 className="font-display font-medium text-ink text-3xl tracking-wide">{t(lang, 'connect.title')}</h1>
          <p className="text-ink-soft text-sm mt-2 max-w-xl">{t(lang, 'connect.subtitle')}</p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {accountType === 'company' && company && (
              <div className="mb-6">
                {!showComposer ? (
                  <button onClick={() => setShowComposer(true)} className="btn-line inline-flex items-center gap-2">
                    <Plus className="h-4 w-4" /> {t(lang, 'connect.createPost')}
                  </button>
                ) : (
                  <div className="line-card p-5">
                    <h3 className="font-display text-ink text-base">{t(lang, 'connect.composerTitle')}</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {TYPES.map(ty => (
                        <button
                          key={ty.value}
                          onClick={() => setCType(ty.value)}
                          className={`px-3 py-1.5 text-xs border transition-colors cursor-pointer ${cType === ty.value ? 'bg-ink text-paper border-ink' : 'border-hairline text-ink-soft hover:border-ink'}`}
                        >
                          {t(lang, ty.labelKey)}
                        </button>
                      ))}
                    </div>
                    <input
                      value={cTitle}
                      onChange={e => setCTitle(e.target.value)}
                      placeholder={t(lang, 'connect.titlePlaceholder')}
                      className="input-line mt-3"
                    />
                    <textarea
                      value={cBody}
                      onChange={e => setCBody(e.target.value)}
                      placeholder={t(lang, 'connect.bodyPlaceholder')}
                      rows={4}
                      className="input-line mt-2 resize-none"
                    />
                    <div className="flex gap-2 mt-3">
                      <button onClick={createPost} disabled={posting || !cTitle.trim() || !cBody.trim()} className="btn-line inline-flex items-center gap-2 disabled:opacity-50">
                        {posting ? '···' : <><Send className="h-4 w-4" /> {t(lang, 'connect.publish')}</>}
                      </button>
                      <button onClick={() => setShowComposer(false)} className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] border border-hairline text-ink-soft hover:text-ink transition-colors cursor-pointer">
                        {t(lang, 'connect.cancel')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-4">{t(lang, 'connect.communityFeed')}</h2>
            {posts.length === 0 ? (
              <div className="line-card p-10 text-center text-ink-faint text-sm">
                {t(lang, accountType === 'company' ? 'connect.noPostsCompany' : 'connect.noPosts')}
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    likes={likes.filter(l => l.postId === post.id)}
                    comments={comments.filter(c => c.postId === post.id)}
                    getUserName={(id) => userNames.get(id) ?? '—'}
                    onRefresh={load}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-4">{t(lang, 'connect.followedCompanies')}</h2>
            {followed.length === 0 ? (
              <p className="text-ink-faint text-sm">{t(lang, selfId ? 'connect.noFollows' : 'connect.loginToFollow')}</p>
            ) : (
              <div className="space-y-2">
                {followed.map(c => (
                  <div key={c.id} className="line-card p-3 flex items-center gap-2">
                    <Link to={`/company/${c.id}`} className="flex-1 min-w-0 flex items-center gap-2 no-underline">
                      {c.logoUrl ? <img src={c.logoUrl} alt="" className="avatar-line w-8 h-8" /> : <div className="avatar-line w-8 h-8"><Building2 className="h-3.5 w-3.5" /></div>}
                      <span className="text-ink text-sm truncate">{lang === 'ja' && c.nameJa ? c.nameJa : c.name}</span>
                    </Link>
                    <FollowButton targetType="company" targetId={c.id} small />
                  </div>
                ))}
              </div>
            )}

            <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-4 mt-8">{t(lang, 'connect.suggestedCompanies')}</h2>
            {suggested.length === 0 ? (
              <p className="text-ink-faint text-sm">{t(lang, 'connect.noSuggestions')}</p>
            ) : (
              <div className="space-y-2">
                {suggested.map(c => (
                  <div key={c.id} className="line-card p-3 flex items-center gap-2">
                    <Link to={`/company/${c.id}`} className="flex-1 min-w-0 flex items-center gap-2 no-underline">
                      {c.logoUrl ? <img src={c.logoUrl} alt="" className="avatar-line w-8 h-8" /> : <div className="avatar-line w-8 h-8"><Building2 className="h-3.5 w-3.5" /></div>}
                      <div className="min-w-0">
                        <p className="text-ink text-sm truncate">{lang === 'ja' && c.nameJa ? c.nameJa : c.name}</p>
                        <p className="text-ink-faint text-xs truncate">{c.industry}</p>
                      </div>
                    </Link>
                    <FollowButton targetType="company" targetId={c.id} small />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
