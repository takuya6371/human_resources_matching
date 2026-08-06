import { createContext, useContext, useState, useEffect, type Dispatch, type SetStateAction } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import type { Lang } from './types'
import HomePage from './pages/HomePage'
import TalentListPage from './pages/TalentListPage'
import TalentDetailPage from './pages/TalentDetailPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ContactPage from './pages/ContactPage'
import AdminPage from './pages/AdminPage'
import JobListPage from './pages/JobListPage'
import JobDetailPage from './pages/JobDetailPage'
import MyApplicationsPage from './pages/MyApplicationsPage'
import CompanyJobsPage from './pages/CompanyJobsPage'
import JobApplicantsPage from './pages/JobApplicantsPage'

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

export default function App() {
  const [lang, setLang] = useState<Lang>('ja')

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
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/jobs" element={<JobListPage />} />
            <Route path="/jobs/:id" element={<JobDetailPage />} />
            <Route path="/applications" element={<MyApplicationsPage />} />
            <Route path="/company/jobs" element={<CompanyJobsPage />} />
            <Route path="/company/jobs/:id/applicants" element={<JobApplicantsPage />} />
          </Routes>
        </BrowserRouter>
      </LangContext.Provider>
    </AuthProvider>
  )
}
