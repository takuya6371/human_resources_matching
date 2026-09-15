import type { ChatMessage, MessageKind, Thread, ThreadStatus } from '../types'

export function mapThreadRow(row: Record<string, any>): Thread {
  return {
    id: row.id,
    talentId: row.talent_id,
    companyId: row.company_id,
    status: (row.status ?? 'open') as ThreadStatus,
    supportRequested: row.support_requested ?? false,
    strikeCount: row.strike_count ?? 0,
    flaggedBy: row.flagged_by ?? undefined,
    flaggedCategory: row.flagged_category ?? undefined,
    flaggedQuote: row.flagged_quote ?? undefined,
    flaggedReason: row.flagged_reason ?? undefined,
    flaggedAt: row.flagged_at ?? undefined,
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? row.created_at ?? '',
  }
}

export function mapMessageRow(row: Record<string, any>): ChatMessage {
  return {
    id: row.id,
    threadId: row.thread_id,
    fromUserId: row.from_user_id ?? undefined,
    kind: (row.kind ?? 'chat') as MessageKind,
    text: row.text ?? '',
    translation: row.translation ?? undefined,
    read: row.read ?? false,
    createdAt: row.created_at ?? '',
  }
}
