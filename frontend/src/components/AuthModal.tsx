import React, { useState } from 'react';
import { X, UserCheck, Shield } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { username: string; role: string; email: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [username, setUsername] = useState('farmer');
  const [password, setPassword] = useState('farmer123');
  const [role, setRole] = useState('Farmer');

  if (!isOpen) return null;

  const setPreset = (userType: 'farmer' | 'agronomist' | 'admin') => {
    if (userType === 'farmer') {
      setUsername('farmer');
      setPassword('farmer123');
      setRole('Farmer');
    } else if (userType === 'agronomist') {
      setUsername('agronomist');
      setPassword('agro123');
      setRole('Agronomist');
    } else {
      setUsername('admin');
      setPassword('admin123');
      setRole('Admin');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess({
      username: username || 'demo_user',
      role,
      email: `${username}@yieldsense.ai`
    });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '2rem', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem'
          }}>
            <Shield size={24} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>YieldSense AI Authentication</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Role-Based Access Control (RBAC) System</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: 'rgba(255,255,255,0.04)', padding: '0.25rem', borderRadius: '8px' }}>
          {(['farmer', 'agronomist', 'admin'] as const).map(u => (
            <button
              key={u}
              type="button"
              onClick={() => setPreset(u)}
              style={{
                flex: 1,
                padding: '0.4rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                textTransform: 'capitalize',
                background: username === u ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                color: username === u ? '#34d399' : 'var(--text-muted)',
                border: username === u ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent'
              }}
            >
              Demo {u}
            </button>
          ))}
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="input-control"
              style={{ width: '100%' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-control"
              style={{ width: '100%' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>Role Context</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="input-control"
              style={{ width: '100%', background: '#121a29' }}
            >
              <option value="Farmer">Farmer</option>
              <option value="Agronomist">Agronomist</option>
              <option value="Admin">Administrator</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" style={{ justifyContent: 'center', marginTop: '0.5rem' }}>
            <UserCheck size={18} />
            Authenticate & Launch Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};
