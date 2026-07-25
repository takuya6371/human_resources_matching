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
  avatarColor: string
  initials: string
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
