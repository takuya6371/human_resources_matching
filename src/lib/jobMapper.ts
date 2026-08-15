import type { Application, Job } from '../types'

export function mapJobRow(row: Record<string, any>): Job {
  return {
    id: row.id,
    companyId: row.company_id,
    companyName: row.companies?.name ?? undefined,
    companyNameJa: row.companies?.name_ja ?? undefined,
    companyLogoUrl: row.companies?.logo_url ?? undefined,
    titleEn: row.title_en ?? '',
    titleJa: row.title_ja ?? '',
    descriptionEn: row.description_en ?? '',
    descriptionJa: row.description_ja ?? '',
    field: row.field ?? '',
    fieldJa: row.field_ja ?? '',
    japaneseLevel: row.japanese_level ?? undefined,
    jobType: row.job_type ?? 'employment',
    remoteOk: row.remote_ok ?? false,
    employmentType: row.employment_type ?? '',
    salaryRange: row.salary_range ?? '',
    duration: row.duration ?? undefined,
    deliverables: row.deliverables ?? undefined,
    location: row.location ?? '',
    status: row.status ?? 'draft',
    createdAt: row.created_at ?? '',
  }
}

export function mapApplicationRow(row: Record<string, any>): Application {
  return {
    id: row.id,
    jobId: row.job_id,
    profileId: row.profile_id,
    status: row.status ?? 'submitted',
    coverMessage: row.cover_message ?? '',
    createdAt: row.created_at ?? '',
    job: row.jobs ? mapJobRow(row.jobs) : undefined,
    talentNameEn: row.profiles?.name_en ?? undefined,
    talentNameJa: row.profiles?.name_ja ?? undefined,
  }
}
