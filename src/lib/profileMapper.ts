import type { Experience, Language, Talent, TalentTeaser } from '../types'

// 企業/管理者が一覧・詳細で閲覧する profiles の列を明示的に限定する。
// email・admin_note（管理者の内部審査メモ）はUI上どこにも表示していないが、
// select('*') のままだとAPIレスポンスのJSON上には流れてしまい、企業アカウントが
// ネットワークタブを見れば直接メールアドレスや審査メモを読めてしまう。
// そのため一覧・詳細ページ（企業/管理者向け）では常にこの列だけを取得する。
export const PROFILE_PUBLIC_COLUMNS = [
  'id', 'name_en', 'name_ja', 'country', 'country_ja', 'flag', 'avatar_url',
  'field', 'field_ja', 'university_en', 'university_ja', 'faculty_en', 'faculty_ja',
  'degree', 'graduation_year', 'japanese_level', 'skills', 'skills_ja',
  'bio_en', 'bio_ja', 'available_from', 'available_from_ja', 'open_to_work',
  'headline_en', 'headline_ja', 'status', 'residence_area', 'dev_experience_years',
  'past_clients', 'years_in_japan', 'hobbies', 'video_url',
].join(', ')

export function deriveInitials(nameEn: string): string {
  return nameEn.split(' ').map(n => n[0] ?? '').join('').slice(0, 2).toUpperCase() || '??'
}

// `profiles` テーブルの1行（+ 関連する言語・職務経験）を Talent 形状にマップする。
// 企業アカウント・管理者・本人がフルデータを取得したときに使う。
export function mapProfileRow(
  profile: Record<string, any>,
  langs: Record<string, any>[] = [],
  exps: Record<string, any>[] = []
): Talent {
  const languages: Language[] = langs.map(l => ({
    name: l.language,
    level: l.level,
  }))

  const experience: Experience[] = exps.map(e => ({
    company: e.company_en ?? '',
    companyJa: e.company_ja ?? '',
    role: e.role_en ?? '',
    roleJa: e.role_ja ?? '',
    period: e.period ?? '',
    descriptionEn: e.desc_en ?? '',
    descriptionJa: e.desc_ja ?? '',
  }))

  const nameEn = profile.name_en ?? ''

  return {
    id: profile.id,
    nameEn,
    nameJa: profile.name_ja ?? '',
    country: profile.country ?? '',
    countryJa: profile.country_ja ?? '',
    flag: profile.flag ?? '',
    initials: deriveInitials(nameEn),
    avatarUrl: profile.avatar_url ?? undefined,
    field: profile.field ?? '',
    fieldJa: profile.field_ja ?? '',
    university: profile.university_en ?? '',
    universityJa: profile.university_ja ?? '',
    faculty: profile.faculty_en ?? '',
    facultyJa: profile.faculty_ja ?? '',
    degree: profile.degree ?? '',
    graduationYear: profile.graduation_year ?? new Date().getFullYear(),
    japaneseLevel: profile.japanese_level ?? 'N3',
    skills: profile.skills ?? [],
    skillsJa: profile.skills_ja ?? [],
    bioEn: profile.bio_en ?? '',
    bioJa: profile.bio_ja ?? '',
    availableFrom: profile.available_from ?? '',
    availableFromJa: profile.available_from_ja ?? '',
    openToWork: profile.open_to_work ?? true,
    headlineEn: profile.headline_en ?? '',
    headlineJa: profile.headline_ja ?? '',
    languages,
    experience,
    status: profile.status ?? 'draft',
    adminNote: profile.admin_note ?? undefined,
    residenceArea: profile.residence_area ?? undefined,
    devExperienceYears: profile.dev_experience_years ?? undefined,
    pastClients: profile.past_clients ?? [],
    yearsInJapan: profile.years_in_japan ?? undefined,
    hobbies: profile.hobbies ?? undefined,
    videoUrl: profile.video_url ?? undefined,
  }
}

// `profiles_teaser` ビューの1行を TalentTeaser 形状にマップする。
// 未ログイン・人材アカウントが見る、氏名・連絡先・自己紹介を含まない安全なサブセット。
export function mapTeaserRow(row: Record<string, any>): TalentTeaser {
  return {
    id: row.id,
    field: row.field ?? '',
    fieldJa: row.field_ja ?? '',
    country: row.country ?? '',
    countryJa: row.country_ja ?? '',
    flag: row.flag ?? '',
    japaneseLevel: row.japanese_level ?? 'N3',
    skills: row.skills ?? [],
    skillsJa: row.skills_ja ?? [],
    openToWork: row.open_to_work ?? true,
    university: row.university_en ?? '',
    faculty: row.faculty_en ?? '',
    degree: row.degree ?? '',
    graduationYear: row.graduation_year ?? new Date().getFullYear(),
    residenceArea: row.residence_area ?? undefined,
    availableFrom: row.available_from ?? '',
    availableFromJa: row.available_from_ja ?? '',
    status: row.status ?? 'approved',
  }
}
