import React from 'react';
import { Sprout, Activity, Sparkles, Layers, ShieldCheck, UserCheck, LogIn, Lock } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, currentUser, onLogout, getTargetTabForRole }) {
  const getRoleBadgeStyle = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', text: '#fbbf24' };
      case 'consultant':
        return { bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.3)', text: '#38bdf8' };
      case 'researcher':
        return { bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.3)', text: '#c084fc' };
      default:
        return { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', text: '#34d399' };
    }
  };

  const roleStyle = getRoleBadgeStyle(currentUser?.role);

  return (
    <header className="glass-card" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand Logo */}
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: currentUser ? 'pointer' : 'default' }} 
          onClick={() => { if (currentUser && getTargetTabForRole) setActiveTab(getTargetTabForRole(currentUser.role)); }}
        >
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '12px', 
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
          }}>
            <Sprout size={26} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>CropCast</h1>
              <span className="badge badge-emerald">AI Platform</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Yield Prediction & Agricultural Intelligence
            </p>
          </div>
        </div>

        {/* Dynamic Nav: Displayed ONLY when authenticated */}
        {currentUser ? (
          <nav style={{ display: 'flex', gap: '8px', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button
              onClick={() => setActiveTab('predictor')}
              className={activeTab === 'predictor' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <Sparkles size={16} />
              Yield Predictor
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <Activity size={16} />
              Analytics & Trends
            </button>
            <button
              onClick={() => setActiveTab('advisory')}
              className={activeTab === 'advisory' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <Layers size={16} />
              Soil & Advisory
            </button>
            <button
              onClick={() => setActiveTab('auth')}
              className={activeTab === 'auth' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <ShieldCheck size={16} />
              My Account ({currentUser.role})
            </button>
          </nav>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge badge-emerald" style={{ padding: '8px 16px', fontSize: '0.82rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399' }}>
              <Lock size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Root Gateway (/) — Default Opening Login Page
            </span>
          </div>
        )}

        {/* User Account / Auth Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {currentUser ? (
            <>
              <div 
                onClick={() => setActiveTab('auth')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '6px 14px',
                  background: roleStyle.bg,
                  borderRadius: '20px',
                  border: `1px solid ${roleStyle.border}`,
                  cursor: 'pointer'
                }}
              >
                <UserCheck size={16} color={roleStyle.text} />
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', display: 'block', lineHeight: 1.1 }}>
                    {currentUser.full_name ? currentUser.full_name.split(' ')[0] : 'User'}
                  </span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: roleStyle.text, textTransform: 'uppercase' }}>
                    {currentUser.role}
                  </span>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.78rem', background: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => setActiveTab('auth')}
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.82rem' }}
            >
              <LogIn size={15} /> Sign In / Register
            </button>
          )}
        </div>

      </div>
    </header>
  );
}


