import React from 'react';
import { Sprout, BarChart3, Database, UserCheck, RefreshCw, Cpu, CloudRain, Layers, Brain } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: { username: string; role: string; email: string };
  onOpenAuthModal: () => void;
  onRefreshData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuthModal,
  onRefreshData
}) => {
  return (
    <header className="header-bar">
      {/* Brand Logo */}
      <div className="brand-logo">
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #1b5e3f 100%)',
          padding: '8px',
          borderRadius: '10px',
          display: 'flex',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
        }}>
          <Sprout size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', lineHeight: 1 }}>
            <span className="gradient-text-green">YieldSense</span>
            <span style={{ color: '#ffffff', fontWeight: 800 }}>AI</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '3px', letterSpacing: '0.02em' }}>
            Agricultural Productivity Intelligence
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={15} />
          KPI Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'predict' ? 'active' : ''}`}
          onClick={() => setActiveTab('predict')}
        >
          <Cpu size={15} />
          Yield Predictor
        </button>
        <button
          className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          <Brain size={15} />
          AI Directives
        </button>
        <button
          className={`tab-btn ${activeTab === 'weather' ? 'active' : ''}`}
          onClick={() => setActiveTab('weather')}
        >
          <CloudRain size={15} />
          Weather Analytics
        </button>
        <button
          className={`tab-btn ${activeTab === 'soil' ? 'active' : ''}`}
          onClick={() => setActiveTab('soil')}
        >
          <Layers size={15} />
          Soil Analysis
        </button>
        <button
          className={`tab-btn ${activeTab === 'dataset' ? 'active' : ''}`}
          onClick={() => setActiveTab('dataset')}
        >
          <Database size={15} />
          Dataset Explorer
        </button>
        <button
          className={`tab-btn ${activeTab === 'eda' ? 'active' : ''}`}
          onClick={() => setActiveTab('eda')}
        >
          <BarChart3 size={15} />
          EDA Analytics
        </button>
      </nav>

      {/* Action Buttons & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={onRefreshData}
          title="Refresh Data"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            padding: '0.55rem',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
        >
          <RefreshCw size={16} />
        </button>

        <button
          onClick={onOpenAuthModal}
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#34d399',
            padding: '0.45rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            transition: 'all 0.2s ease'
          }}
        >
          <UserCheck size={15} />
          <span>{currentUser.username}</span>
          <span style={{
            background: 'rgba(16, 185, 129, 0.25)',
            color: '#a7f3d0',
            padding: '0.1rem 0.45rem',
            borderRadius: '9999px',
            fontSize: '0.7rem'
          }}>
            {currentUser.role}
          </span>
        </button>
      </div>
    </header>
  );
};
