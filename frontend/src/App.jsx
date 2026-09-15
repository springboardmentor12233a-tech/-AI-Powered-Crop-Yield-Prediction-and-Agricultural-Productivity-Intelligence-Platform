import React, { useState } from 'react';
import Navbar from './components/Navbar';
import StatCard from './components/StatCard';
import PredictorForm from './components/PredictorForm';
import AnalyticsChart from './components/AnalyticsChart';
import InsightsPanel from './components/InsightsPanel';

import { Sprout, TrendingUp, CloudRain, ShieldAlert, Cpu, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('predictor');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '24px' }}>
        
        {/* Banner Hero */}
        <div className="glass-card" style={{ padding: '24px 32px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.06) 50%, rgba(15, 23, 42, 0.8) 100%)', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-emerald"><Sparkles size={12} /> Next-Gen AgTech</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Punjab & North Region Cluster</span>
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

        {/* Top Key Statistics Grid */}
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

        {/* Dynamic Tab Content */}
        {activeTab === 'predictor' && <PredictorForm />}
        {activeTab === 'analytics' && <AnalyticsChart />}
        {activeTab === 'advisory' && <InsightsPanel />}

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
