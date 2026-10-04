import { supabase } from './supabase'
import { mapPostRow } from './postMapper'
import type { Lang, Post } from '../types'

export interface LikeRow { id: string; postId: string; userId: string }
export interface CommentRow {
  id: string
  postId: string
  userId: string
  userType: 'talent' | 'company'
  body: string
  parentCommentId?: string
  createdAt: string
}

export interface PostFeed {
  posts: Post[]
  likes: LikeRow[]
  comments: CommentRow[]
  /** コメント投稿者の表示名。人材と企業が混在するため両方から引く。 */
  userNames: Map<string, string>
}

const EMPTY: PostFeed = { posts: [], likes: [], comments: [], userNames: new Map() }

// 投稿・いいね・コメント・コメント投稿者名の読み込み。ConnectPage（全社）と
// CompanyPublicProfilePage（1社）が同じものを必要とするため、ここに出した。
// companyId を渡すとその企業の投稿だけに絞る。
export async function loadPostFeed(lang: Lang, companyId?: string): Promise<PostFeed> {
  let query = supabase
    .from('posts')
    .select('*, companies(name, name_ja, logo_url)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50)
  if (companyId) query = query.eq('company_id', companyId)

  const { data: postRows } = await query
  const posts = (postRows ?? []).map(mapPostRow)
  const postIds = posts.map(p => p.id)
  if (postIds.length === 0) return { ...EMPTY, userNames: new Map() }

  const [{ data: likeRows }, { data: commentRows }] = await Promise.all([
    supabase.from('likes').select('id, post_id, user_id').in('post_id', postIds),
    supabase.from('comments')
      .select('id, post_id, user_id, user_type, body, parent_comment_id, created_at')
      .in('post_id', postIds).order('created_at'),
  ])

  const likes: LikeRow[] = (likeRows ?? []).map(r => ({ id: r.id, postId: r.post_id, userId: r.user_id }))
  const comments: CommentRow[] = (commentRows ?? []).map(r => ({
    id: r.id, postId: r.post_id, userId: r.user_id, userType: r.user_type, body: r.body,
    parentCommentId: r.parent_comment_id ?? undefined, createdAt: r.created_at,
  }))

  const userNames = new Map<string, string>()
  const commenterIds = Array.from(new Set(comments.map(c => c.userId)))
  if (commenterIds.length > 0) {
    const [{ data: profileRows }, { data: companyRows }] = await Promise.all([
      supabase.from('profiles').select('id, name_en, name_ja').in('id', commenterIds),
      supabase.from('companies').select('id, name, name_ja').in('id', commenterIds),
    ])
    for (const p of profileRows ?? []) userNames.set(p.id, lang === 'ja' && p.name_ja ? p.name_ja : p.name_en)
    for (const c of companyRows ?? []) userNames.set(c.id, lang === 'ja' && c.name_ja ? c.name_ja : c.name)
  }

  return { posts, likes, comments, userNames }
}
