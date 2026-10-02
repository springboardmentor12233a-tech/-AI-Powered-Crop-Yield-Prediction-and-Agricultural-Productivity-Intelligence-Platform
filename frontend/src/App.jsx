import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StatCard from './components/StatCard';
import PredictorForm from './components/PredictorForm';
import AnalyticsChart from './components/AnalyticsChart';
import InsightsPanel from './components/InsightsPanel';
import LoginPage from './components/LoginPage';

import { Sprout, TrendingUp, CloudRain, ShieldAlert, Cpu, Sparkles, UserCheck, ShieldCheck } from 'lucide-react';

export default function App() {
  // Auth State
  const [token, setToken] = useState(() => localStorage.getItem('cropcast_token') || '');
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('cropcast_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  // Enforced Role-Based Redirect Mapping:
  // Farmer -> Yield Predictor / Advisory Dashboard ('predictor')
  // Consultant -> Reports & Analytics ('analytics')
  // Researcher -> Data Insights ('advisory')
  // Admin -> User Management Console ('auth')
  const getTargetTabForRole = (roleStr) => {
    const r = roleStr?.toLowerCase() || '';
    if (r === 'farmer') return 'predictor';
    if (r === 'consultant') return 'analytics';
    if (r === 'researcher') return 'advisory';
    if (r === 'admin') return 'auth';
    return 'auth';
  };

  // Default Route -> Login Page ('auth') as the root (/) screen when website opens
  const [activeTab, setActiveTab] = useState(() => {
    const savedUserStr = localStorage.getItem('cropcast_user');
    const hash = window.location.hash.replace('#', '');

    if (savedUserStr) {
      try {
        const u = JSON.parse(savedUserStr);
        if (u && u.role) {
          if (hash && ['predictor', 'analytics', 'advisory', 'auth'].includes(hash)) {
            return hash;
          }
          return getTargetTabForRole(u.role);
        }
      } catch (e) {}
    }
    return 'auth'; // Default root route (/): Login Page!
  });

  // Sync URL hash / location with activeTab
  useEffect(() => {
    if (activeTab === 'auth') {
      window.history.replaceState(null, '', '/');
    } else {
      window.history.replaceState(null, '', `/#${activeTab}`);
    }
  }, [activeTab]);

  const handleLoginSuccess = (newToken, userObj) => {
    setToken(newToken);
    setCurrentUser(userObj);
    localStorage.setItem('cropcast_token', newToken);
    localStorage.setItem('cropcast_user', JSON.stringify(userObj));

    // Enforce automatic role-based redirect after login
    const targetTab = getTargetTabForRole(userObj?.role);
    setActiveTab(targetTab);
  };

  const handleLogout = () => {
    setToken('');
    setCurrentUser(null);
    localStorage.removeItem('cropcast_token');
    localStorage.removeItem('cropcast_user');
    setActiveTab('auth'); // Return to root Login Page (/) as default screen!
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Top Navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={currentUser}
        onLogout={handleLogout}
        getTargetTabForRole={getTargetTabForRole}
      />

      {/* Main Container */}
      <main style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '24px' }}>

        {/* Hero Banner (Only shown for authenticated users on workspace tabs) */}
        {currentUser && activeTab !== 'auth' && (
          <div className="glass-card" style={{ padding: '24px 32px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.06) 50%, rgba(15, 23, 42, 0.8) 100%)', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span className="badge badge-emerald"><Sparkles size={12} /> Next-Gen AgTech</span>
                <span className="badge badge-cyan" style={{ textTransform: 'none' }}>
                  <ShieldCheck size={12} /> Authenticated as {currentUser.full_name} ({currentUser.role})
                </span>
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                AI Crop Yield & Intelligence Workspace
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '650px' }}>
                Leveraging machine learning models trained on regional soil composition, historical rainfall data, and seasonal climate telemetry to forecast accurate crop yields.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-primary" onClick={() => setActiveTab('predictor')}>
                <Sprout size={18} /> Forecast Yield
              </button>
            </div>
          </div>
        )}

        {/* Top Key Statistics Grid (Only shown for authenticated workspace tabs) */}
        {currentUser && activeTab !== 'auth' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <StatCard
              title="Avg Yield Forecast"
              value="4.85"
              unit="T/ha"
              trend="+12.4%"
              icon={Sprout}
              color="#10b981"
              description="VS 2023 seasonal benchmark"
            />
            <StatCard
              title="Model Accuracy"
              value="94.8%"
              unit=""
              trend="+1.2%"
              icon={Cpu}
              color="#06b6d4"
              description="RandomForest & XGBoost ensemble"
            />
            <StatCard
              title="Predicted Rainfall"
              value="650"
              unit="mm"
              trend="+5.0%"
              icon={CloudRain}
              color="#38bdf8"
              description="Optimal monsoon forecast"
            />
            <StatCard
              title="Climate Risk Score"
              value="Low"
              unit="(12%)"
              trend="-3.5%"
              icon={ShieldAlert}
              color="#f59e0b"
              description="Favorable growth index"
            />
          </div>
        )}

        {/* Dynamic Screen View: Defaults to Root Standalone Login Page (/) */}
        {(!currentUser || activeTab === 'auth') && (
          <LoginPage 
            currentUser={currentUser} 
            token={token} 
            onLoginSuccess={handleLoginSuccess} 
            onLogout={handleLogout} 
          />
        )}

        {currentUser && activeTab === 'predictor' && <PredictorForm />}
        {currentUser && activeTab === 'analytics' && <AnalyticsChart />}
        {currentUser && activeTab === 'advisory' && <InsightsPanel />}

      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(7, 10, 17, 0.8)', padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', margin: 0 }}>
          © 2026 <strong>CropCast</strong> — AI-Powered Crop Yield Prediction & Agricultural Productivity Intelligence Platform. Built with React.js & Vite.
        </p>
      </footer>

    </div>
  );
}


