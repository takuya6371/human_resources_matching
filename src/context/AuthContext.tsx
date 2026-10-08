import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { mapProfileRow, deriveInitials, toReturnHomeDate } from '../lib/profileMapper'
import type { User, Company, AccountType } from '../types'

interface AuthContextType {
  user: User | null
  company: Company | null
  accountType: AccountType | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, opts?: SignUpOptions) => Promise<{ error: string | null }>
  logout: () => Promise<void>
  resetPasswordRequest: (email: string) => Promise<{ error: string | null }>
  resetPassword: (newPassword: string) => Promise<{ error: string | null }>
  updateProfile: (updates: Partial<User>) => Promise<{ error: string | null }>
  updateCompany: (updates: Partial<Company>) => Promise<{ error: string | null }>
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
  resetPasswordRequest: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
  updateProfile: async () => ({ error: null }),
  updateCompany: async () => ({ error: null }),
  submitForReview: async () => {},
})

async function fetchProfile(userId: string, email: string): Promise<User | null> {
  // admin_note は profile_private にある（企業から読めないようにするため分離。
  // 20260924000000_protect_private_profile_fields.sql を参照）。
  const [{ data: profile }, { data: priv }, { data: langs }, { data: exps }, { data: certs }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('profile_private').select('*').eq('id', userId).maybeSingle(),
    supabase.from('profile_languages').select('*').eq('profile_id', userId).order('sort_order'),
    supabase.from('profile_experiences').select('*').eq('profile_id', userId).order('sort_order'),
    supabase.from('profile_certifications').select('*').eq('profile_id', userId).order('sort_order'),
  ])

  if (!profile) return null

  return {
    ...mapProfileRow(profile, langs ?? [], exps ?? []),
    adminNote: priv?.admin_note ?? undefined,
    // 日本式履歴書で使う項目。本人と管理者しか読めない。
    nameKanaJa: priv?.name_kana_ja ?? undefined,
    phone: priv?.phone ?? undefined,
    dateOfBirth: priv?.date_of_birth ?? undefined,
    gender: priv?.gender ?? undefined,
    postalCode: priv?.postal_code ?? undefined,
    addressLine: priv?.address_line ?? undefined,
    addressKanaJa: priv?.address_kana_ja ?? undefined,
    commuteMinutes: priv?.commute_minutes ?? undefined,
    dependentsCount: priv?.dependents_count ?? undefined,
    hasSpouse: priv?.has_spouse ?? undefined,
    spouseIsDependent: priv?.spouse_is_dependent ?? undefined,
    preferredConditions: priv?.preferred_conditions ?? undefined,
    certifications: (certs ?? []).map(c => ({
      name: c.name, nameJa: c.name_ja ?? undefined, acquiredOn: c.acquired_on ?? undefined,
    })),
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

    // supabase-js はこのコールバックを内部の認証ロックを保持したまま呼ぶ。
    // ここで supabase.* を await すると、そのリクエストが同じロックを取ろうとして
    // デッドロックし、以降のSupabase呼び出しが返らなくなり得る。
    // コールバック自体は同期で終わらせ、実際の読み込みはロックの外へ出す。
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setTimeout(() => { loadAccount(session.user.id, session.user.email ?? '') }, 0)
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
    if (!error) return { error: null }
    // Supabase が500を返したとき message が空や "{}" になることがあり、
    // 画面に "{}" とだけ出て原因が分からなかった。拾えるものを拾う。
    const detail = [error.message, (error as { status?: number }).status]
      .filter(v => v != null && String(v).trim() && String(v) !== '{}')
      .join(' / ')
    return { error: detail || error.name || 'signup_failed' }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setCompany(null)
  }

  // メールにパスワード再設定リンクを送る。アカウントの有無に関わらず常に成功扱いにする
  // （送信元がメールアドレスの実在確認に使われないようにするため）。
  const resetPasswordRequest = async (email: string): Promise<{ error: string | null }> => {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error: null }
  }

  // resetPasswordRequestのリンクを踏むと、SupabaseがURLのハッシュから回復用セッションを
  // 自動的に確立する（onAuthStateChangeでsession付きのイベントが飛んでくる）ため、
  // トークンをこちらで扱う必要はなく、そのセッションに対してパスワードを更新するだけでよい。
  const resetPassword = async (newPassword: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error: error?.message ?? null }
  }

  // 保存は4つの書き込みに分かれる。どれが失敗しても画面に出せるよう、
  // error を握り潰さず呼び出し側へ返す。以前は data だけ分割代入しており、
  // RLS拒否やネットワーク断でも「保存しました」と出ていた。
  const updateProfile = async (updates: Partial<User>): Promise<{ error: string | null }> => {
    if (!user) return { error: 'not_signed_in' }

    const { data: saved, error: profileErr } = await supabase.from('profiles').update({
      avatar_url: updates.avatarUrl,
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
      residence_area: updates.residenceArea,
      dev_experience_years: updates.devExperienceYears,
      years_in_japan: updates.yearsInJapan,
      hobbies: updates.hobbies,
      video_url: updates.videoUrl,
      past_clients: updates.pastClients,
      return_home_on: updates.returnHomeMonth ? toReturnHomeDate(updates.returnHomeMonth) : null,
    }).eq('id', user.id).select('status, published_at').single()
    if (profileErr) return { error: profileErr.message }

    if (updates.languages !== undefined) {
      const { error: delErr } = await supabase.from('profile_languages').delete().eq('profile_id', user.id)
      if (delErr) return { error: delErr.message }
      if (updates.languages.length > 0) {
        const { error: insErr } = await supabase.from('profile_languages').insert(
          updates.languages.map((l, i) => ({
            profile_id: user.id,
            language: l.name,
            level: l.level,
            sort_order: i,
          }))
        )
        if (insErr) return { error: insErr.message }
      }
    }

    if (updates.experience !== undefined) {
      const { error: delErr } = await supabase.from('profile_experiences').delete().eq('profile_id', user.id)
      if (delErr) return { error: delErr.message }
      if (updates.experience.length > 0) {
        const { error: insErr } = await supabase.from('profile_experiences').insert(
          updates.experience.map((e, i) => ({
            profile_id: user.id,
            company_en: e.company,
            company_ja: e.companyJa,
            role_en: e.role,
            role_ja: e.roleJa,
            period: e.period,
            started_on: e.startedOn ?? null,
            ended_on: e.endedOn ?? null,
            is_current: e.isCurrent ?? false,
            desc_en: e.descriptionEn,
            desc_ja: e.descriptionJa,
            sort_order: i,
          }))
        )
        if (insErr) return { error: insErr.message }
      }
    }

    // 履歴書用の項目は profile_private。本人と管理者しか読めない。
    // undefined の項目は送らない（他画面からの部分更新で消さないため）。
    const privateUpdates: Record<string, unknown> = {}
    const priv: [string, unknown][] = [
      ['name_kana_ja', updates.nameKanaJa],
      ['phone', updates.phone],
      ['date_of_birth', updates.dateOfBirth || null],
      ['gender', updates.gender || null],
      ['postal_code', updates.postalCode],
      ['address_line', updates.addressLine],
      ['address_kana_ja', updates.addressKanaJa],
      ['commute_minutes', updates.commuteMinutes],
      ['dependents_count', updates.dependentsCount],
      ['has_spouse', updates.hasSpouse],
      ['spouse_is_dependent', updates.spouseIsDependent],
      ['preferred_conditions', updates.preferredConditions],
    ]
    for (const [col, v] of priv) if (v !== undefined) privateUpdates[col] = v
    if (Object.keys(privateUpdates).length > 0) {
      const { error: privErr } = await supabase
        .from('profile_private').update(privateUpdates).eq('id', user.id)
      if (privErr) return { error: privErr.message }
    }

    if (updates.certifications !== undefined) {
      const { error: delErr } = await supabase
        .from('profile_certifications').delete().eq('profile_id', user.id)
      if (delErr) return { error: delErr.message }
      if (updates.certifications.length > 0) {
        const { error: insErr } = await supabase.from('profile_certifications').insert(
          updates.certifications.map((c, i) => ({
            profile_id: user.id,
            name: c.name,
            name_ja: c.nameJa ?? null,
            acquired_on: c.acquiredOn ?? null,
            sort_order: i,
          }))
        )
        if (insErr) return { error: insErr.message }
      }
    }

    const nameEn = updates.nameEn ?? user.nameEn
    setUser(prev => prev ? {
      ...prev,
      ...updates,
      initials: deriveInitials(nameEn),
      // statusはDBのトリガー（承認済み編集時の自動差し戻し等）でクライアントの
      // 送信値と変わりうるため、実際にDBへ書き込まれた値を正としてマージする。
      // adminNoteはprofile_privateにあり、ここでは変更しないので据え置く。
      status: saved?.status ?? prev.status,
      adminNote: prev.adminNote,
    } : prev)

    return { error: null }
  }

  // updateProfile と同じ理由で error を返す。握り潰すと失敗しても
  // 「保存しました」と出てしまう。
  const updateCompany = async (updates: Partial<Company>): Promise<{ error: string | null }> => {
    if (!company) return { error: 'not_signed_in' }

    const { error: companyErr } = await supabase.from('companies').update({
      name: updates.name,
      name_ja: updates.nameJa,
      description: updates.description,
      industry: updates.industry,
      size: updates.size,
      website: updates.website,
      logo_url: updates.logoUrl,
    }).eq('id', company.id)
    if (companyErr) return { error: companyErr.message }

    setCompany(prev => prev ? { ...prev, ...updates } : prev)
    return { error: null }
  }

  const submitForReview = async () => {
    if (!user) return
    await supabase.rpc('submit_profile_for_review')
    setUser(prev => prev ? { ...prev, status: 'pending' } : prev)
  }

  return (
    <AuthContext.Provider value={{ user, company, accountType, loading, login, signUp, logout, resetPasswordRequest, resetPassword, updateProfile, updateCompany, submitForReview }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
