import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { mapProfileRow, deriveInitials } from '../lib/profileMapper'
import type { User, Company, AccountType } from '../types'

interface AuthContextType {
  user: User | null
  company: Company | null
  accountType: AccountType | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, opts?: SignUpOptions) => Promise<{ error: string | null }>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
  submitForReview: () => Promise<void>
}

interface SignUpOptions {
  role: 'talent' | 'company'
  companyName?: string
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  company: null,
  accountType: null,
  loading: true,
  login: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  logout: async () => {},
  updateProfile: async () => {},
  submitForReview: async () => {},
})

async function fetchProfile(userId: string, email: string): Promise<User | null> {
  const [{ data: profile }, { data: langs }, { data: exps }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('profile_languages').select('*').eq('profile_id', userId).order('sort_order'),
    supabase.from('profile_experiences').select('*').eq('profile_id', userId).order('sort_order'),
  ])

  if (!profile) return null

  return {
    ...mapProfileRow(profile, langs ?? [], exps ?? []),
    email,
    role: (profile.role as 'talent' | 'company' | 'admin') ?? 'talent',
  }
}

async function fetchCompany(userId: string, email: string): Promise<Company | null> {
  const { data: company } = await supabase.from('companies').select('*').eq('id', userId).single()
  if (!company) return null

  return {
    id: company.id,
    email,
    name: company.name ?? '',
    nameJa: company.name_ja ?? '',
    description: company.description ?? '',
    industry: company.industry ?? '',
    size: company.size ?? '',
    website: company.website ?? '',
    logoUrl: company.logo_url ?? '',
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  const accountType: AccountType | null = user ? user.role : company ? 'company' : null

  async function loadAccount(userId: string, email: string) {
    const profile = await fetchProfile(userId, email)
    if (profile) {
      setUser(profile)
      setCompany(null)
      return
    }
    const companyAccount = await fetchCompany(userId, email)
    setUser(null)
    setCompany(companyAccount)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        await loadAccount(session.user.id, session.user.email ?? '')
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await loadAccount(session.user.id, session.user.email ?? '')
      } else {
        setUser(null)
        setCompany(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    if (data.session) {
      await loadAccount(data.session.user.id, data.session.user.email ?? '')
    }
    return { error: null }
  }

  const signUp = async (email: string, password: string, opts?: SignUpOptions): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: opts?.role ?? 'talent',
          company_name: opts?.companyName,
        },
      },
    })
    return { error: error?.message ?? null }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setCompany(null)
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
    <AuthContext.Provider value={{ user, company, accountType, loading, login, signUp, logout, updateProfile, submitForReview }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
