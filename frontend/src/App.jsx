import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage          from './pages/LoginPage'
import RegisterPage       from './pages/RegisterPage'
import DashboardPage      from './pages/DashboardPage'
import PredictPage        from './pages/PredictPage'
import HistoryPage        from './pages/HistoryPage'
import ChatbotPage        from './pages/ChatbotPage'
import ProductivityPage   from './pages/ProductivityPage'
import RecommendationPage from './pages/RecommendationPage'
import ResourcesPage      from './pages/ResourcesPage'
import RiskPage           from './pages/RiskPage'
import Layout             from './components/Layout'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('ys_token')
  return token ? children : <Navigate to="/login" replace />
}

function Wrap({ Page }) {
  return (
    <ProtectedRoute>
      <Layout><Page /></Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Core (M1 / M2) */}
      <Route path="/"        element={<Wrap Page={DashboardPage} />} />
      <Route path="/predict" element={<Wrap Page={PredictPage} />} />

      {/* New Features */}
      <Route path="/history" element={<Wrap Page={HistoryPage} />} />
      <Route path="/chatbot" element={<Wrap Page={ChatbotPage} />} />

      {/* Milestone 3 */}
      <Route path="/productivity"   element={<Wrap Page={ProductivityPage} />} />
      <Route path="/recommendation" element={<Wrap Page={RecommendationPage} />} />
      <Route path="/resources"      element={<Wrap Page={ResourcesPage} />} />
      <Route path="/risk"           element={<Wrap Page={RiskPage} />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
