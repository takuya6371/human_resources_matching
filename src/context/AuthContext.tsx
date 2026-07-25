import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Language, Experience } from '../types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
  submitForReview: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  logout: async () => {},
  updateProfile: async () => {},
  submitForReview: async () => {},
})

const AVATAR_COLORS = ['#D85A30', '#1D9E75', '#7F77DD', '#BA7517', '#2980B9']

function deriveInitials(nameEn: string): string {
  return nameEn.split(' ').map(n => n[0] ?? '').join('').slice(0, 2).toUpperCase() || '??'
}

function deriveAvatarColor(userId: string): string {
  return AVATAR_COLORS[userId.charCodeAt(0) % AVATAR_COLORS.length]
}

async function fetchProfile(userId: string, email: string): Promise<User | null> {
  const [{ data: profile }, { data: langs }, { data: exps }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('profile_languages').select('*').eq('profile_id', userId).order('sort_order'),
    supabase.from('profile_experiences').select('*').eq('profile_id', userId).order('sort_order'),
  ])

  if (!profile) return null

  const languages: Language[] = (langs ?? []).map(l => ({
    name: l.language,
    level: l.level,
  }))

  const experience: Experience[] = (exps ?? []).map(e => ({
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
    email,
    nameEn,
    nameJa: profile.name_ja ?? '',
    country: profile.country ?? '',
    countryJa: profile.country_ja ?? '',
    flag: profile.flag ?? '',
    avatarColor: deriveAvatarColor(profile.id),
    initials: deriveInitials(nameEn),
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
    role: (profile.role as 'talent' | 'company' | 'admin') ?? 'talent',
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const profile = await fetchProfile(session.user.id, session.user.email ?? '')
        setUser(profile)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const profile = await fetchProfile(session.user.id, session.user.email ?? '')
        setUser(profile)
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    if (data.session) {
      const profile = await fetchProfile(data.session.user.id, data.session.user.email ?? '')
      setUser(profile)
    }
    return { error: null }
  }

  const signUp = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error?.message ?? null }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return

    await supabase.from('profiles').update({
      name_en: updates.nameEn,
      name_ja: updates.nameJa,
      headline_en: updates.headlineEn,
      headline_ja: updates.headlineJa,
      university_en: updates.university,
      university_ja: updates.universityJa,
      faculty_en: updates.faculty,
      faculty_ja: updates.facultyJa,
      japanese_level: updates.japaneseLevel,
      open_to_work: updates.openToWork,
      skills: updates.skills,
      skills_ja: updates.skillsJa,
      bio_en: updates.bioEn,
      bio_ja: updates.bioJa,
      available_from: updates.availableFrom || null,
      available_from_ja: updates.availableFromJa,
    }).eq('id', user.id)

    if (updates.languages !== undefined) {
      await supabase.from('profile_languages').delete().eq('profile_id', user.id)
      if (updates.languages.length > 0) {
        await supabase.from('profile_languages').insert(
          updates.languages.map((l, i) => ({
            profile_id: user.id,
            language: l.name,
            level: l.level,
            sort_order: i,
          }))
        )
      }
    }

    if (updates.experience !== undefined) {
      await supabase.from('profile_experiences').delete().eq('profile_id', user.id)
      if (updates.experience.length > 0) {
        await supabase.from('profile_experiences').insert(
          updates.experience.map((e, i) => ({
            profile_id: user.id,
            company_en: e.company,
            company_ja: e.companyJa,
            role_en: e.role,
            role_ja: e.roleJa,
            period: e.period,
            desc_en: e.descriptionEn,
            desc_ja: e.descriptionJa,
            sort_order: i,
          }))
        )
      }
    }

    const nameEn = updates.nameEn ?? user.nameEn
    setUser(prev => prev ? {
      ...prev,
      ...updates,
      initials: deriveInitials(nameEn),
    } : prev)
  }

  const submitForReview = async () => {
    if (!user) return
    await supabase.rpc('submit_profile_for_review')
    setUser(prev => prev ? { ...prev, status: 'pending' } : prev)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signUp, logout, updateProfile, submitForReview }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
