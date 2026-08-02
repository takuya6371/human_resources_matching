export type Lang = 'en' | 'ja' | 'fr'
export type JLPTLevel = 'N1' | 'N2' | 'N3' | 'N4' | 'N5'
export type LanguageLevel = 'Native' | 'Fluent' | 'Business' | 'Conversational' | 'Basic'
export type ProfileStatus = 'draft' | 'pending' | 'approved' | 'rejected'

export interface Language {
  name: string
  level: LanguageLevel
}

export interface Experience {
  company: string
  companyJa: string
  role: string
  roleJa: string
  period: string
  descriptionEn: string
  descriptionJa: string
}

export interface Talent {
  id: string
  nameEn: string
  nameJa: string
  country: string
  countryJa: string
  flag: string
  initials: string
  avatarUrl?: string
  field: string
  fieldJa: string
  university: string
  universityJa: string
  faculty: string
  facultyJa: string
  degree: string
  graduationYear: number
  japaneseLevel: JLPTLevel
  skills: string[]
  skillsJa: string[]
  bioEn: string
  bioJa: string
  availableFrom: string
  availableFromJa: string
  headlineEn: string
  headlineJa: string
  openToWork: boolean
  languages: Language[]
  experience: Experience[]
  // 追加フィールド（議事録 2026-07-10）
  status: ProfileStatus
  adminNote?: string
  residenceArea?: string
  devExperienceYears?: number
  pastClients: string[]
  yearsInJapan?: number
  hobbies?: string
  videoUrl?: string
}

export interface User extends Talent {
  email?: string
  role: 'talent' | 'company' | 'admin'
}

export type AccountType = 'talent' | 'company' | 'admin'

export interface Company {
  id: string
  email?: string
  name: string
  nameJa: string
  description: string
  industry: string
  size: string
  website: string
  logoUrl: string
}

// profiles_teaser ビューが返す、未ログイン/人材アカウント向けの安全なカラムのみのサブセット
export interface TalentTeaser {
  id: string
  field: string
  fieldJa: string
  country: string
  countryJa: string
  flag: string
  japaneseLevel: JLPTLevel
  skills: string[]
  skillsJa: string[]
  openToWork: boolean
  university: string
  faculty: string
  degree: string
  graduationYear: number
  residenceArea?: string
  availableFrom: string
  availableFromJa: string
  status: ProfileStatus
}
