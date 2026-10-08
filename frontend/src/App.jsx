import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import { Login, Register, ForgotPassword, ResetPassword } from './pages/AuthPages';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import Settings from './pages/Settings';

const YieldPrediction = React.lazy(() => import('./pages/YieldPrediction'));
const WeatherAnalysis = React.lazy(() => import('./pages/WeatherAnalysis'));
const SoilAnalysis = React.lazy(() => import('./pages/SoilAnalysis'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Recommendations = React.lazy(() => import('./pages/Recommendations'));
const AgriculturalReport = React.lazy(() => import('./pages/AgriculturalReport'));



import { Navigate } from 'react-router-dom';

const RoleBasedRedirect = () => {
  const { user } = useAuth();
  const role = user?.role?.role_name || user?.role;
  if (role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route element={<ProtectedRoute allowedRoles={['admin', 'user', 'farmer']} />}>
            <Route path="/" element={<AppShell />}>
              <Route index element={<RoleBasedRedirect />} />
              <Route path="settings" element={<Settings />} />
              
              {/* Farmer Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'user', 'farmer']} />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="predict" element={<Suspense fallback={<div className="p-8 text-center text-gray-500">Loading Module...</div>}><YieldPrediction /></Suspense>} />
                <Route path="weather" element={<Suspense fallback={<div className="p-8 text-center text-gray-500">Loading Module...</div>}><WeatherAnalysis /></Suspense>} />
                <Route path="soil" element={<Suspense fallback={<div className="p-8 text-center text-gray-500">Loading Module...</div>}><SoilAnalysis /></Suspense>} />
                <Route path="analytics" element={<Suspense fallback={<div className="p-8 text-center text-gray-500">Loading Module...</div>}><Analytics /></Suspense>} />
                <Route path="recommendations" element={<Suspense fallback={<div className="p-8 text-center text-gray-500">Loading Module...</div>}><Recommendations /></Suspense>} />
                <Route path="reports" element={<Suspense fallback={<div className="p-8 text-center text-gray-500">Loading Module...</div>}><AgriculturalReport /></Suspense>} />
              </Route>

              {/* Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="admin" element={<AdminDashboard />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;