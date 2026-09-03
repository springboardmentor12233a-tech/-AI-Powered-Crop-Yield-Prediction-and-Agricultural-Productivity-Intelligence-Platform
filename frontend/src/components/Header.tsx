import React from 'react';
import { Sprout, BarChart3, Database, FileText, UserCheck, RefreshCw, Cpu, CloudRain, Layers } from 'lucide-react';

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
      <div className="brand-logo">
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
          padding: '8px',
          borderRadius: '10px',
          display: 'flex'
        }}>
          <Sprout size={24} color="#ffffff" />
        </div>
        <div>
          <span className="gradient-text-green">YieldSense</span>
          <span style={{ color: '#ffffff', marginLeft: '4px' }}>AI</span>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.02em' }}>
            Agricultural Productivity Intelligence
          </div>
        </div>
      </div>

      <nav className="nav-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} />
          KPI Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'predict' ? 'active' : ''}`}
          onClick={() => setActiveTab('predict')}
        >
          <Cpu size={16} />
          Yield Predictor
        </button>
        <button
          className={`tab-btn ${activeTab === 'weather' ? 'active' : ''}`}
          onClick={() => setActiveTab('weather')}
        >
          <CloudRain size={16} />
          Weather Analytics
        </button>
        <button
          className={`tab-btn ${activeTab === 'soil' ? 'active' : ''}`}
          onClick={() => setActiveTab('soil')}
        >
          <Layers size={16} />
          Soil Analysis
        </button>
        <button
          className={`tab-btn ${activeTab === 'dataset' ? 'active' : ''}`}
          onClick={() => setActiveTab('dataset')}
        >
          <Database size={16} />
          Dataset Explorer
        </button>
        <button
          className={`tab-btn ${activeTab === 'eda' ? 'active' : ''}`}
          onClick={() => setActiveTab('eda')}
        >
          <BarChart3 size={16} />
          EDA Analytics
        </button>
        <button
          className={`tab-btn ${activeTab === 'architecture' ? 'active' : ''}`}
          onClick={() => setActiveTab('architecture')}
        >
          <FileText size={16} />
          Milestone 1 Architecture
        </button>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={onRefreshData}
          title="Refresh Data"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            padding: '0.5rem',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={16} />
        </button>

        <button
          onClick={onOpenAuthModal}
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            padding: '0.45rem 0.9rem',
            color: '#34d399',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 600,
            fontSize: '0.82rem',
            cursor: 'pointer'
          }}
        >
          <UserCheck size={16} />
          <span>{currentUser.username}</span>
          <span className="badge badge-green" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>
            {currentUser.role}
          </span>
        </button>
      </div>
    </header>
  );
};
