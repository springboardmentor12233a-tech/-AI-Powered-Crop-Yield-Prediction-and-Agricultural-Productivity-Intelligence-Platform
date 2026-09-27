import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import YieldPrediction from './pages/YieldPrediction';
import WeatherAnalysis from './pages/WeatherAnalysis';
import SoilAnalysis from './pages/SoilAnalysis';
import Analytics from './pages/Analytics';
import Recommendations from './pages/Recommendations';
import AgriculturalReport from './pages/AgriculturalReport';
import { Login, Register } from './pages/AuthPages';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import Settings from './pages/Settings';



const RoleBasedDashboard = () => {
  const { user } = useAuth();
  const role = user?.role?.role_name || user?.role;
  if (role === 'admin') {
    return <AdminDashboard />;
  }
  return <Dashboard />; // Default to Farmer Dashboard
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<ProtectedRoute allowedRoles={['admin', 'user', 'farmer']} />}>
            <Route path="/" element={<AppShell />}>
              <Route index element={<RoleBasedDashboard />} />
              <Route path="settings" element={<Settings />} />
              
              {/* Farmer Routes */}
              <Route element={<ProtectedRoute allowedRoles={['user', 'farmer']} />}>
                <Route path="predict" element={<YieldPrediction />} />
                <Route path="weather" element={<WeatherAnalysis />} />
                <Route path="soil" element={<SoilAnalysis />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="recommendations" element={<Recommendations />} />
                <Route path="reports" element={<AgriculturalReport />} />
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