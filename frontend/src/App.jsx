import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import YieldPrediction from './pages/YieldPrediction';
import WeatherAnalysis from './pages/WeatherAnalysis';
import SoilAnalysis from './pages/SoilAnalysis';
import Analytics from './pages/Analytics';
import Recommendations from './pages/Recommendations';
import AgriculturalReport from './pages/AgriculturalReport';
import { Login, Register } from './pages/AuthPages';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

function Settings() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
      <p className="text-slate-600">Application settings.</p>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<AppShell />}>
              <Route index element={<Dashboard />} />
              <Route path="predict" element={<YieldPrediction />} />
              <Route path="weather" element={<WeatherAnalysis />} />
              <Route path="soil" element={<SoilAnalysis />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="recommendations" element={<Recommendations />} />
              <Route path="reports" element={<AgriculturalReport />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;