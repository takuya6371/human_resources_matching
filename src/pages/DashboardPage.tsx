import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import TalentDashboard from '../components/TalentDashboard'
import CompanyDashboard from '../components/CompanyDashboard'

export default function DashboardPage() {
  const { user, company, accountType, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    if (!user && !company) { navigate('/login', { replace: true }); return }
    if (accountType === 'admin') navigate('/admin', { replace: true })
  }, [loading, user, company, accountType, navigate])

  if (loading || (!user && !company) || accountType === 'admin') return null
  if (accountType === 'company' && company) return <CompanyDashboard company={company} />
  if (user) return <TalentDashboard user={user} />
  return null
}
