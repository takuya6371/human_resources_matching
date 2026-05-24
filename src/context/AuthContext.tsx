import { createContext, useContext, useState, type ReactNode } from 'react'
import type { User } from '../types'

const MOCK_USER: User = {
  id: 'demo-user',
  nameEn: 'Kofi Acheampong',
  nameJa: 'コフィ・アチャンポン',
  country: 'Ghana',
  countryJa: 'ガーナ',
  flag: '🇬🇭',
  avatarColor: '#1D9E75',
  initials: 'KA',
  field: 'IT',
  fieldJa: 'IT・ソフトウェア開発',
  university: 'University of Tokyo',
  universityJa: '東京大学',
  faculty: 'Graduate School of Engineering',
  facultyJa: '工学系研究科',
  degree: 'M.Eng',
  graduationYear: 2026,
  japaneseLevel: 'N2',
  skills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL'],
  skillsJa: ['JavaScript', 'React', 'Node.js', 'PostgreSQL'],
  headlineEn: 'Full-Stack Engineer · University of Tokyo · Available April 2026',
  headlineJa: 'フルスタックエンジニア · 東京大学 · 2026年4月〜',
  openToWork: true,
  languages: [
    { name: 'English', level: 'Native' },
    { name: 'Twi', level: 'Native' },
    { name: 'Japanese', level: 'Business' },
  ],
  experience: [
    {
      company: 'Mercari, Inc.',
      companyJa: '株式会社メルカリ',
      role: 'Software Engineer Intern',
      roleJa: 'ソフトウェアエンジニアインターン',
      period: '2025.06 – 2025.09',
      descriptionEn: 'Developed new features for the marketplace platform using React and Go. Improved page load time by 25% through code splitting and lazy loading.',
      descriptionJa: 'ReactとGoを使用してマーケットプレイスの新機能を開発。コード分割と遅延ロードによりページ読み込み時間を25%改善。',
    },
  ],
  bioEn: 'Software engineer from Accra, Ghana. Specializing in full-stack web development with a focus on building scalable applications. Passionate about using technology to solve African challenges.',
  bioJa: 'ガーナのアクラ出身のソフトウェアエンジニア。スケーラブルなフルスタックWeb開発を専門とし、アフリカの課題解決に技術を活かすことに情熱を持っています。',
  availableFrom: '2026-04-01',
  availableFromJa: '2026年4月〜',
  email: 'kofi@example.com',
}

interface AuthContextType {
  user: User | null
  login: () => void
  logout: () => void
  updateProfile: (updates: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  updateProfile: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = () => setUser(MOCK_USER)
  const logout = () => setUser(null)
  const updateProfile = (updates: Partial<User>) =>
    setUser(prev => (prev ? { ...prev, ...updates } : prev))

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
