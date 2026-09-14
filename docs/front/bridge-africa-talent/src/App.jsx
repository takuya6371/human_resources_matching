import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/i18n';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
// Add page imports here
import Home from '@/pages/Home';
import HowItWorks from '@/pages/HowItWorks';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';
import Jobs from '@/pages/Jobs';
import TalentBrowse from '@/pages/TalentBrowse';
import GetStarted from '@/pages/GetStarted';
import TalentOnboarding from '@/pages/TalentOnboarding';
import TalentDashboard from '@/pages/TalentDashboard';
import TalentProfile from '@/pages/TalentProfile';
import CompanyOnboarding from '@/pages/CompanyOnboarding';
import CompanyDashboard from '@/pages/CompanyDashboard';
import CompanyProfile from '@/pages/CompanyProfile';
import PostJob from '@/pages/PostJob';
import AdminLayout from '@/components/AdminLayout';
import AdminHome from '@/pages/admin/AdminHome';
import TalentReview from '@/pages/admin/TalentReview';
import CompanyReview from '@/pages/admin/CompanyReview';
import JobModeration from '@/pages/admin/JobModeration';
import MatchingConsole from '@/pages/admin/MatchingConsole';
import Analytics from '@/pages/admin/Analytics';
import Messages from '@/pages/Messages';
import Checkout from '@/pages/Checkout';
import Blogs from '@/pages/Blogs';
import BlogPost from '@/pages/BlogPost';
import Assessments from '@/pages/Assessments';
import Connect from '@/pages/Connect';
import Matches from '@/pages/Matches';
import Challenges from '@/pages/Challenges';
import ChallengeDetail from '@/pages/ChallengeDetail';
import CompanyChallengeManage from '@/pages/CompanyChallengeManage';
import AdminTeam from '@/pages/admin/Team';
import TalentPublicProfile from '@/pages/TalentPublicProfile';
import CompanyPublicProfile from '@/pages/CompanyPublicProfile';
import Notifications from '@/pages/Notifications';
import Saved from '@/pages/Saved';
import Newsfeed from '@/pages/Newsfeed';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/talents" element={<TalentBrowse />} />
        <Route path="/blog" element={<Blogs />} />
        <Route path="/blog/:id" element={<BlogPost />} />
        <Route path="/connect" element={<Connect />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/challenges/:id" element={<ChallengeDetail />} />
        <Route path="/talent/:id" element={<TalentPublicProfile />} />
        <Route path="/company/:id" element={<CompanyPublicProfile />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/get-started" element={<GetStarted />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route path="/talent/onboarding" element={<TalentOnboarding />} />
          <Route path="/assessments" element={<Assessments />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/company/challenge/:id" element={<CompanyChallengeManage />} />
          <Route path="/talent/dashboard" element={<TalentDashboard />} />
          <Route path="/talent/profile" element={<TalentProfile />} />
          <Route path="/company/onboarding" element={<CompanyOnboarding />} />
          <Route path="/company/dashboard" element={<CompanyDashboard />} />
          <Route path="/company/profile" element={<CompanyProfile />} />
          <Route path="/company/post-job" element={<PostJob />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/newsfeed" element={<Newsfeed />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminHome />} />
            <Route path="/admin/talents" element={<TalentReview />} />
            <Route path="/admin/companies" element={<CompanyReview />} />
            <Route path="/admin/jobs" element={<JobModeration />} />
            <Route path="/admin/matching" element={<MatchingConsole />} />
            <Route path="/admin/analytics" element={<Analytics />} />
            <Route path="/admin/team" element={<AdminTeam />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <LanguageProvider>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
        </LanguageProvider>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App