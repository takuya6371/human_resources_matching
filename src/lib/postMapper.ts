import type { AppNotification, NotificationType, Post, PostComment, PostType } from '../types'

export function mapPostRow(row: Record<string, any>): Post {
  return {
    id: row.id,
    companyId: row.company_id,
    type: (row.type ?? 'opportunity') as PostType,
    title: row.title ?? '',
    body: row.body ?? '',
    imageUrl: row.image_url ?? undefined,
    videoUrl: row.video_url ?? undefined,
    status: row.status ?? 'active',
    createdAt: row.created_at ?? '',
    companyName: row.companies?.name ?? undefined,
    companyNameJa: row.companies?.name_ja ?? undefined,
    companyLogoUrl: row.companies?.logo_url ?? undefined,
  }
}

export function mapCommentRow(row: Record<string, any>): PostComment {
  return {
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    userType: row.user_type ?? 'talent',
    body: row.body ?? '',
    parentCommentId: row.parent_comment_id ?? undefined,
    createdAt: row.created_at ?? '',
  }
}

export function mapNotificationRow(row: Record<string, any>): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    actorId: row.actor_id ?? undefined,
    actorType: row.actor_type ?? undefined,
    type: row.type as NotificationType,
    title: row.title ?? '',
    body: row.body ?? undefined,
    targetType: row.target_type ?? undefined,
    targetId: row.target_id ?? undefined,
    read: row.read ?? false,
    createdAt: row.created_at ?? '',
  }
}
