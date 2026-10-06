import { createContext, useContext, useState, useEffect, type Dispatch, type SetStateAction } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import type { Lang } from './types'
import HomePage from './pages/HomePage'
import TalentListPage from './pages/TalentListPage'
import TalentDetailPage from './pages/TalentDetailPage'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import ContactPage from './pages/ContactPage'
import JobListPage from './pages/JobListPage'
import JobDetailPage from './pages/JobDetailPage'
import MyApplicationsPage from './pages/MyApplicationsPage'
import CompanyJobsPage from './pages/CompanyJobsPage'
import JobApplicantsPage from './pages/JobApplicantsPage'
import CompanyPublicProfilePage from './pages/CompanyPublicProfilePage'
import ConnectPage from './pages/ConnectPage'
import BoardPage from './pages/BoardPage'
import SavedPage from './pages/SavedPage'
import NotificationsPage from './pages/NotificationsPage'
import MessagesPage from './pages/MessagesPage'
import AboutPage from './pages/AboutPage'
import ForCompaniesPage from './pages/ForCompaniesPage'
import HowItWorksPage from './pages/HowItWorksPage'
import LegalPage from './pages/LegalPage'
import PageNotFound from './components/PageNotFound'
import AdminLayout from './components/AdminLayout'
import AdminHomePage from './pages/admin/AdminHomePage'
import AdminTalentReviewPage from './pages/admin/AdminTalentReviewPage'
import AdminTeamPage from './pages/admin/AdminTeamPage'
import AdminTrustedCompaniesPage from './pages/admin/AdminTrustedCompaniesPage'
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage'
import AdminMatchingConsolePage from './pages/admin/AdminMatchingConsolePage'
import AdminModerationPage from './pages/admin/AdminModerationPage'

interface LangContextType {
  lang: Lang
  setLang: Dispatch<SetStateAction<Lang>>
}

export const LangContext = createContext<LangContextType>({ lang: 'ja', setLang: () => {} })
export const useLang = () => useContext(LangContext)

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

const LANGS: Lang[] = ['en', 'ja', 'fr']
const LANG_KEY = 'nebonga-link.lang'

// 言語は保存していなかったため、英語や仏語に切り替えても再読み込みで
// 日本語に戻っていた。日本語を読めない利用者には毎回切り替えが必要になる。
// プライバシーポリシー第11条もこの保存を前提に書いている。
function readStoredLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY)
    if (saved && LANGS.includes(saved as Lang)) return saved as Lang
    // 保存が無ければブラウザの言語を見る。該当しなければ日本語。
    const nav = navigator.language.slice(0, 2).toLowerCase()
    if (LANGS.includes(nav as Lang)) return nav as Lang
  } catch {
    // プライベートモード等で localStorage が使えなくても動くこと
  }
  return 'ja'
}

export default function App() {
  const [lang, setLang] = useState<Lang>(readStoredLang)

  useEffect(() => {
    try { localStorage.setItem(LANG_KEY, lang) } catch { /* 保存できなくても続行 */ }
    document.documentElement.lang = lang
  }, [lang])

  return (
    <AuthProvider>
      <LangContext.Provider value={{ lang, setLang }}>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/talents" element={<TalentListPage />} />
            <Route path="/talent/:id" element={<TalentDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminHomePage />} />
              <Route path="talents" element={<AdminTalentReviewPage />} />
              <Route path="matching" element={<AdminMatchingConsolePage />} />
              <Route path="moderation" element={<AdminModerationPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="team" element={<AdminTeamPage />} />
              <Route path="trusted" element={<AdminTrustedCompaniesPage />} />
            </Route>
            <Route path="/jobs" element={<JobListPage />} />
            <Route path="/jobs/:id" element={<JobDetailPage />} />
            <Route path="/applications" element={<MyApplicationsPage />} />
            <Route path="/company/jobs" element={<CompanyJobsPage />} />
            <Route path="/company/jobs/:id/applicants" element={<JobApplicantsPage />} />
            <Route path="/company/:id" element={<CompanyPublicProfilePage />} />
            <Route path="/connect" element={<ConnectPage />} />
            <Route path="/board" element={<BoardPage />} />
            <Route path="/saved" element={<SavedPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/for-companies" element={<ForCompaniesPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/terms" element={<LegalPage doc="terms" />} />
            <Route path="/privacy" element={<LegalPage doc="privacy" />} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </BrowserRouter>
      </LangContext.Provider>
    </AuthProvider>
  )
}
