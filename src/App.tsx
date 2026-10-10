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
import VerifyEmailPage from './pages/VerifyEmailPage'
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
import StartPage from './pages/StartPage'
import ForCompaniesPage from './pages/ForCompaniesPage'
import ChallengePreviewPage from './pages/ChallengePreviewPage'
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

// 言語の決め方。優先順は URL → 保存値 → ブラウザの言語 → 日本語。
//
// URL を最優先にしているのは、イベントで配るQRやチラシから
// 「英語で開くリンク」を渡せるようにするため。端末が日本語設定の
// 海外人材でも、?lang=en のQRを読めば英語で着地する。
//
// 保存は localStorage。以前は保存すらしておらず、切り替えても
// 再読み込みで日本語に戻っていた。
// プライバシーポリシー第11条はこの保存を前提に書いている。
function readInitialLang(): Lang {
  try {
    const q = new URLSearchParams(window.location.search).get('lang')
    if (q && LANGS.includes(q as Lang)) return q as Lang
  } catch { /* URL が壊れていても続行 */ }
  try {
    const saved = localStorage.getItem(LANG_KEY)
    if (saved && LANGS.includes(saved as Lang)) return saved as Lang
    const nav = navigator.language.slice(0, 2).toLowerCase()
    if (LANGS.includes(nav as Lang)) return nav as Lang
  } catch {
    // プライベートモード等で localStorage が使えなくても動くこと
  }
  return 'ja'
}

// 読み取ったら ?lang= は URL から外す。残したままだと、利用者が画面で
// 言語を切り替えたあと再読み込みしたときに URL 側の指定へ戻ってしまい、
// 操作が効かなくなったように見える。言語は localStorage を正とする。
function stripLangParam() {
  try {
    const url = new URL(window.location.href)
    if (!url.searchParams.has('lang')) return
    url.searchParams.delete('lang')
    const qs = url.searchParams.toString()
    window.history.replaceState({}, '', url.pathname + (qs ? `?${qs}` : '') + url.hash)
  } catch { /* 失敗しても表示には影響しない */ }
}

export default function App() {
  const [lang, setLang] = useState<Lang>(readInitialLang)

  useEffect(() => { stripLangParam() }, [])

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
            <Route path="/verify-email" element={<VerifyEmailPage />} />
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
            <Route path="/start" element={<StartPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/for-companies" element={<ForCompaniesPage />} />
            {/* 構想段階の見本。ナビには出さず、/for-companies からの導線と直接URLのみ */}
            <Route path="/challenges" element={<ChallengePreviewPage />} />
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
