import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Building2, CornerDownRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../App'
import { t } from '../i18n'
import { supabase } from '../lib/supabase'
import SaveButton from './SaveButton'
import type { Lang, Post } from '../types'

interface LikeRow { id: string; userId: string }
interface CommentRow { id: string; userId: string; userType: 'talent' | 'company'; body: string; parentCommentId?: string; createdAt: string }

const TYPE_LABEL: Record<Post['type'], string> = {
  opportunity: 'connect.typeOpportunity',
  scholarship: 'connect.typeScholarship',
  program: 'connect.typeProgram',
  social_problem: 'connect.typeSocialProblem',
}

interface Props {
  post: Post
  likes: LikeRow[]
  comments: CommentRow[]
  getUserName: (userId: string, userType: 'talent' | 'company') => string
  onRefresh: () => void
}

export default function PostCard({ post, likes, comments, getUserName, onRefresh }: Props) {
  const { user, company } = useAuth()
  const { lang } = useLang()
  const selfId = user?.id ?? company?.id ?? null
  const [showComments, setShowComments] = useState(false)
  const [comment, setComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [busy, setBusy] = useState(false)

  const myLike = selfId ? likes.find(l => l.userId === selfId) : undefined
  const topLevel = comments.filter(c => !c.parentCommentId)
  const repliesOf = (id: string) => comments.filter(c => c.parentCommentId === id)

  async function toggleLike() {
    if (!selfId) return
    setBusy(true)
    if (myLike) {
      await supabase.from('likes').delete().eq('id', myLike.id)
    } else {
      await supabase.from('likes').insert({ post_id: post.id, user_id: selfId })
    }
    onRefresh()
    setBusy(false)
  }

  async function submitComment(parent: string | null) {
    if (!selfId) return
    const body = parent ? replyText : comment
    if (!body.trim()) return
    setBusy(true)
    await supabase.from('comments').insert({
      post_id: post.id,
      user_id: selfId,
      user_type: user ? 'talent' : 'company',
      body: body.trim(),
      parent_comment_id: parent,
    })
    if (parent) { setReplyText(''); setReplyTo(null) } else setComment('')
    setShowComments(true)
    onRefresh()
    setBusy(false)
  }

  async function deleteComment(id: string) {
    await supabase.from('comments').delete().eq('id', id)
    onRefresh()
  }

  const companyName = lang === 'ja' && post.companyNameJa ? post.companyNameJa : post.companyName

  return (
    <div className="line-card p-5">
      <Link to={`/company/${post.companyId}`} className="flex items-center gap-3 no-underline group">
        {post.companyLogoUrl ? (
          <img src={post.companyLogoUrl} alt="" className="avatar-line w-10 h-10" />
        ) : (
          <div className="avatar-line w-10 h-10"><Building2 className="h-4 w-4" /></div>
        )}
        <div>
          <p className="text-ink text-sm font-medium group-hover:text-seal transition-colors">{companyName}</p>
          <span className="badge-line-ink">{t(lang, TYPE_LABEL[post.type])}</span>
        </div>
      </Link>

      <h3 className="font-display text-ink text-lg mt-3">{post.title}</h3>
      <p className="text-ink-soft text-sm mt-1 whitespace-pre-wrap">{post.body}</p>
      {post.imageUrl && (
        <div className="mt-3 aspect-video overflow-hidden bg-hairline">
          <img src={post.imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-hairline flex items-center gap-4 text-sm">
        <button
          onClick={toggleLike}
          disabled={busy || !selfId}
          className={`inline-flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50 ${myLike ? 'text-seal' : 'text-ink-soft hover:text-ink'}`}
        >
          <Heart className={`h-4 w-4 ${myLike ? 'fill-current' : ''}`} /> {likes.length}
        </button>
        <button
          onClick={() => setShowComments(s => !s)}
          className="inline-flex items-center gap-1.5 text-ink-soft hover:text-ink transition-colors cursor-pointer"
        >
          <MessageCircle className="h-4 w-4" /> {comments.length}
        </button>
        <div className="ml-auto">
          <SaveButton itemType="post" itemId={post.id} small />
        </div>
      </div>

      {!selfId && <p className="text-ink-faint text-xs mt-3">{t(lang, 'connect.loginToInteract')}</p>}

      {showComments && (
        <div className="mt-3 space-y-3">
          {topLevel.map(c => (
            <div key={c.id} className="space-y-2">
              <CommentBubble
                comment={c}
                name={getUserName(c.userId, c.userType)}
                canDelete={selfId === c.userId}
                onDelete={() => deleteComment(c.id)}
                onReply={selfId ? () => { setReplyTo(c.id); setReplyText('') } : undefined}
                lang={lang}
              />
              {repliesOf(c.id).map(r => (
                <div key={r.id} className="ml-6">
                  <CommentBubble
                    comment={r}
                    name={getUserName(r.userId, r.userType)}
                    canDelete={selfId === r.userId}
                    onDelete={() => deleteComment(r.id)}
                    lang={lang}
                  />
                </div>
              ))}
              {replyTo === c.id && (
                <div className="ml-6 flex items-center gap-2">
                  <input
                    autoFocus
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submitComment(c.id)}
                    placeholder={t(lang, 'connect.replyPlaceholder')}
                    className="input-line flex-1"
                  />
                  <button onClick={() => submitComment(c.id)} disabled={busy || !replyText.trim()} className="btn-line text-[10px] px-4 py-2.5 disabled:opacity-50">
                    {t(lang, 'connect.reply')}
                  </button>
                </div>
              )}
            </div>
          ))}
          {selfId && (
            <div className="flex items-center gap-2">
              <input
                value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitComment(null)}
                placeholder={t(lang, 'connect.commentPlaceholder')}
                className="input-line flex-1"
              />
              <button onClick={() => submitComment(null)} disabled={busy || !comment.trim()} className="btn-line text-[10px] px-4 py-2.5 disabled:opacity-50">
                {t(lang, 'connect.reply')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CommentBubble({
  comment, name, canDelete, onDelete, onReply, lang,
}: {
  comment: CommentRow
  name: string
  canDelete: boolean
  onDelete: () => void
  onReply?: () => void
  lang: Lang
}) {
  return (
    <div className="bg-hairline/30 p-3">
      <div className="flex items-center justify-between">
        <p className="text-ink text-xs font-medium">{name}</p>
        {canDelete && (
          <button onClick={onDelete} className="text-ink-faint hover:text-seal transition-colors cursor-pointer text-xs">
            {t(lang, 'connect.deleteComment')}
          </button>
        )}
      </div>
      <p className="text-ink-soft text-sm mt-0.5">{comment.body}</p>
      {onReply && (
        <button onClick={onReply} className="mt-1 inline-flex items-center gap-1 text-ink-faint hover:text-ink transition-colors cursor-pointer text-[11px]">
          <CornerDownRight className="h-3 w-3" /> {t(lang, 'connect.reply')}
        </button>
      )}
    </div>
  )
}
