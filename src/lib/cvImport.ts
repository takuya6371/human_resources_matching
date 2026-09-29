import { supabase } from './supabase'
import { callEdgeFunction } from './edgeFunction'
import type { Experience, JLPTLevel, Language, LanguageLevel } from '../types'

// cvs バケットの file_size_limit と parse-cv の MAX_BYTES に合わせる。
const MAX_FILE_SIZE = 8 * 1024 * 1024

// 紙のCVしか持っていない人向けに写真も受け付ける（スマホでは撮影が選択肢に出る）。
// 画像はサーバー側でGeminiに文字起こしさせてから抽出にかける。
const ACCEPTED_EXTENSIONS = ['pdf', 'docx', 'txt', 'png', 'jpg', 'jpeg']
export const CV_FILE_ACCEPT = '.pdf,.docx,.txt,image/png,image/jpeg'

// parse-cv の CV_SCHEMA のうち、プロフィールに反映する部分だけを型にしている。
// strict な json_schema で返るのでキーの存在は保証されるが、値はnull許容。
export interface CvExtraction {
  candidate: {
    full_name: string
    headline: string | null
    summary: string | null
    email: string | null
  }
  languages: { language: string; cefr: string | null; jlpt: string | null; is_native: boolean | null }[]
  education: { institution: string; degree: string | null; field_of_study: string | null }[]
  experience: {
    employer: string
    title: string
    start_date: string | null
    end_date: string | null
    is_current: boolean | null
    summary: string | null
    achievements: string[]
  }[]
  skills: { name: string; canonical: string }[]
  derived: {
    total_years_experience: number | null
    japanese_level: string | null
  }
  extraction_meta: { warnings: string[] }
}

export interface CvFields {
  nameEn?: string
  email?: string
  headlineEn?: string
  bioEn?: string
  university?: string
  faculty?: string
  japaneseLevel?: JLPTLevel
  devExperienceYears?: string
  skillsEn?: string
  languages?: Language[]
  experience?: Experience[]
}

export const CV_FIELD_KEYS = [
  'nameEn', 'email', 'headlineEn', 'bioEn', 'university', 'faculty',
  'japaneseLevel', 'devExperienceYears', 'skillsEn', 'languages', 'experience',
] as const

export type CvFieldKey = typeof CV_FIELD_KEYS[number]

export interface ParseCvResult {
  fields: CvFields
  // schema上は正しいが人間が確認すべき点。レビュー画面にそのまま出す。
  warnings: string[]
}

export async function uploadCv(file: File, ownerId: string): Promise<string> {
  if (file.size > MAX_FILE_SIZE) throw new Error('file_too_large')

  const ext = (file.name.split('.').pop() ?? '').toLowerCase()
  if (!ACCEPTED_EXTENSIONS.includes(ext)) throw new Error('unsupported_type')

  const path = `${ownerId}/cv-${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('cvs').upload(path, file, { upsert: true })
  if (error) throw new Error('upload_failed')

  // parse-cv は cvs/ 接頭辞つきのパスで本人のファイルかを検証する。
  return `cvs/${path}`
}

export async function parseCv(storagePath: string): Promise<ParseCvResult> {
  const { status, data } = await callEdgeFunction<{
    ok?: boolean
    data?: CvExtraction
    error?: string
  }>('parse-cv', { storage_path: storagePath })

  if (status !== 200 || !data?.ok || !data.data) {
    throw new Error(data?.error ?? 'extraction_failed')
  }

  return {
    fields: mapCvToProfileFields(data.data),
    warnings: data.data.extraction_meta.warnings,
  }
}

const CEFR_LEVELS: Record<string, LanguageLevel> = {
  C2: 'Fluent', C1: 'Fluent', B2: 'Business', B1: 'Conversational', A2: 'Basic', A1: 'Basic',
}

const JLPT_LEVELS: Record<string, LanguageLevel> = {
  N1: 'Fluent', N2: 'Business', N3: 'Conversational', N4: 'Basic', N5: 'Basic',
}

function toLanguageLevel(l: CvExtraction['languages'][number]): LanguageLevel {
  if (l.is_native) return 'Native'
  if (l.jlpt && JLPT_LEVELS[l.jlpt]) return JLPT_LEVELS[l.jlpt]
  if (l.cefr && CEFR_LEVELS[l.cefr]) return CEFR_LEVELS[l.cefr]
  return 'Conversational'
}

function formatPeriod(e: CvExtraction['experience'][number], presentLabel: string): string {
  const end = e.is_current ? presentLabel : (e.end_date ?? '')
  return [e.start_date ?? '', end].filter(Boolean).join(' – ')
}

export function mapCvToProfileFields(cv: CvExtraction, presentLabel = 'Present'): CvFields {
  const fields: CvFields = {}

  if (cv.candidate.full_name) fields.nameEn = cv.candidate.full_name
  if (cv.candidate.email) fields.email = cv.candidate.email
  if (cv.candidate.headline) fields.headlineEn = cv.candidate.headline
  if (cv.candidate.summary) fields.bioEn = cv.candidate.summary

  // education は新しい順。最新の学歴を大学・学部に充てる。
  const latest = cv.education[0]
  if (latest?.institution) fields.university = latest.institution
  if (latest?.field_of_study) fields.faculty = latest.field_of_study

  const jlpt = cv.derived.japanese_level
  if (jlpt && jlpt !== 'none') fields.japaneseLevel = jlpt as JLPTLevel

  if (cv.derived.total_years_experience != null) {
    fields.devExperienceYears = String(Math.round(cv.derived.total_years_experience))
  }

  const skills = [...new Set(cv.skills.map(s => s.canonical).filter(Boolean))]
  if (skills.length > 0) fields.skillsEn = skills.join(', ')

  if (cv.languages.length > 0) {
    fields.languages = cv.languages.map(l => ({ name: l.language, level: toLanguageLevel(l) }))
  }

  if (cv.experience.length > 0) {
    fields.experience = cv.experience.map(e => ({
      company: e.employer,
      companyJa: '',
      role: e.title,
      roleJa: '',
      period: formatPeriod(e, presentLabel),
      descriptionEn: [e.summary ?? '', ...e.achievements.map(a => `- ${a}`)].filter(Boolean).join('\n'),
      descriptionJa: '',
    }))
  }

  return fields
}

export function describeCvField(key: CvFieldKey, fields: CvFields): string {
  if (key === 'languages') {
    return (fields.languages ?? []).map(l => `${l.name} (${l.level})`).join(', ')
  }
  if (key === 'experience') {
    return (fields.experience ?? []).map(e => `${e.role} — ${e.company}`).join('\n')
  }
  return fields[key] ?? ''
}
