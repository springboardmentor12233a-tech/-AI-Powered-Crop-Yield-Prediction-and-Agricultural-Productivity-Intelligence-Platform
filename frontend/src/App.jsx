import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Trees,
  Landmark,
  LogOut,
  User,
  Menu,
  X,
  ShieldCheck,
  Database,
  BrainCircuit,
  TrendingUp,
  Bot,
  Users,
  RefreshCw,
  Sparkles
} from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AnalyticsPage from './pages/Analytics';
import ChatbotPage from './pages/Chatbot';
import FarmManagement from './pages/FarmManagement';
import CropManagement from './pages/CropManagement';
import DatasetPage from './pages/Dataset';
import YieldPrediction from './pages/YieldPrediction';
import ChatbotDrawer from './components/ChatbotDrawer';

// Durable Protected Route wrapper component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7faf4] flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center">
          <RefreshCw className="animate-spin text-brand-600" size={24} />
        </div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Verifying YieldSense AI Session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Admin-Only Route wrapper component
const AdminRoute = ({ children }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7faf4] flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="animate-spin text-brand-600" size={24} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role !== 'Administrator') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public/Auth Gatekeeper Route: redirects logged-in users away from /login or /register
const AuthGate = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7faf4] flex flex-col items-center justify-center">
        <RefreshCw className="animate-spin text-brand-600" size={24} />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Sidebar Layout wrapper
const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const userName = user?.name || 'Farmer User';
  const userRole = role || 'Farmer';
  const isAdmin = userRole === 'Administrator';

  // Role-specific navigation items
  const menuItems = isAdmin
    ? [
        { name: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard },
        { name: 'User Management', path: '/admin/users', icon: Users },
        { name: 'Agricultural Analytics', path: '/analytics', icon: TrendingUp },
        { name: 'Predict Yield', path: '/predict', icon: BrainCircuit },
        { name: 'All Farms', path: '/farms', icon: Landmark },
        { name: 'All Crops', path: '/crops', icon: Trees },
        { name: 'AI Chatbot', path: '/chatbot', icon: Bot },
        { name: 'Dataset', path: '/dataset', icon: Database },
      ]
    : [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Predict Yield', path: '/predict', icon: BrainCircuit },
        { name: 'Analytics', path: '/analytics', icon: TrendingUp },
        { name: 'My Farms', path: '/farms', icon: Landmark },
        { name: 'My Crops', path: '/crops', icon: Trees },
        { name: 'AI Assistant', path: '/chatbot', icon: Bot },
        { name: 'Dataset', path: '/dataset', icon: Database },
      ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#f7faf4] overflow-hidden">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-[#e3ecd9] flex-shrink-0">
        <div className="flex items-center gap-3 px-6 h-16 border-b border-[#e3ecd9]">
          <span className="text-2xl">🌾</span>
          <div>
            <h1 className="font-bold text-lg text-brand-850 leading-tight">YieldSense AI</h1>
            <span className="text-xs text-slate-500 font-medium">Agricultural Forecasting</span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path === '/admin' && location.pathname === '/' && isAdmin);

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-600/10'
                    : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'
                }`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile section */}
        <div className="p-4 border-t border-[#e3ecd9] bg-slate-50/50">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-full ${isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-brand-100 text-brand-600'}`}>
              <User size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 truncate">{userName}</p>
              <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500 font-medium">
                <ShieldCheck size={12} className={isAdmin ? 'text-purple-600' : 'text-brand-500'} />
                <span className={isAdmin ? 'text-purple-700 font-semibold' : ''}>{userRole}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm font-medium transition-all duration-200"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile nav header */}
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <header className="flex items-center justify-between px-6 h-16 bg-white border-b border-[#e3ecd9] md:hidden">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌾</span>
            <span className="font-bold text-lg text-slate-800">YieldSense AI</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <aside className="relative flex flex-col w-4/5 max-w-sm bg-white h-full shadow-2xl p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🌾</span>
                  <span className="font-bold text-lg text-slate-800">YieldSense AI</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="pt-6 border-t border-[#e3ecd9]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-full bg-brand-100 text-brand-600">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{userName}</p>
                    <p className="text-xs text-slate-500 font-medium">{userRole}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm font-medium transition-all"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#f7faf4] relative">
          {children}
          {/* Floating Chatbot Assistant Component */}
          <ChatbotDrawer />
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              <AuthGate>
                <Login />
              </AuthGate>
            }
          />
          <Route
            path="/register"
            element={
              <AuthGate>
                <Register />
              </AuthGate>
            }
          />

          <Route
            path="/dataset"
            element={
              <ProtectedRoute>
                <Layout>
                  <DatasetPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </AdminRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <Layout>
                  <AdminUsers />
                </Layout>
              </AdminRoute>
            }
          />

          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Layout>
                  <AnalyticsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/chatbot"
            element={
              <ProtectedRoute>
                <Layout>
                  <ChatbotPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/predict"
            element={
              <ProtectedRoute>
                <Layout>
                  <YieldPrediction />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/farms"
            element={
              <ProtectedRoute>
                <Layout>
                  <FarmManagement />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/crops"
            element={
              <ProtectedRoute>
                <Layout>
                  <CropManagement />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
