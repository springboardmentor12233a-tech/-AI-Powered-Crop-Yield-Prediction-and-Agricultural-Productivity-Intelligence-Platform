import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Mail, 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  Sparkles, 
  Sprout, 
  FileSpreadsheet, 
  FlaskConical, 
  ShieldAlert, 
  ArrowRight, 
  LogOut, 
  Shield, 
  Clock, 
  Hash, 
  Check, 
  HelpCircle, 
  X,
  Eye,
  EyeOff,
  ChevronDown,
  Globe,
  Cpu,
  UserCheck,
  Building,
  CheckSquare
} from 'lucide-react';
import UserProfilePanel from './UserProfilePanel';

const BACKEND_PORTS = [8000, 8001];

const apiFetch = async (path, options = {}) => {
  let lastError;
  for (const port of BACKEND_PORTS) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, options);
      return response;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('Failed to connect to backend server');
};

const ROLES = [
  {
    id: 'Farmer',
    title: 'Farmer',
    icon: Sprout,
    badgeColor: '#10b981',
    description: 'Predict crop yields, analyze soil health, and track farm production history.',
    redirectTarget: 'predictor',
    redirectLabel: 'Yield Predictor / Advisory'
  },
  {
    id: 'Consultant',
    title: 'Consultant',
    icon: FileSpreadsheet,
    badgeColor: '#06b6d4',
    description: 'Generate PDF/CSV yield reports and provide expert agronomic advisories.',
    redirectTarget: 'analytics',
    redirectLabel: 'Reports & Analytics'
  },
  {
    id: 'Researcher',
    title: 'Researcher',
    icon: FlaskConical,
    badgeColor: '#8b5cf6',
    description: 'Access regional agro-belt telemetry, raw datasets, and ML model performance metrics.',
    redirectTarget: 'advisory',
    redirectLabel: 'Data Insights'
  },
  {
    id: 'Admin',
    title: 'Admin',
    icon: ShieldCheck,
    badgeColor: '#f59e0b',
    description: 'Full system oversight, RBAC governance, and platform infrastructure control.',
    redirectTarget: 'auth',
    redirectLabel: 'User Management Console'
  }
];

const DEMO_ACCOUNTS = [
  { role: 'Farmer', identifier: 'farmer@cropcast.ai', name: 'Rajesh Kumar' },
  { role: 'Consultant', identifier: 'consultant@cropcast.ai', name: 'Dr. Anita Sharma' },
  { role: 'Researcher', identifier: 'researcher@cropcast.ai', name: 'Dr. Vikram Seth' },
  { role: 'Admin', identifier: 'admin@cropcast.ai', name: 'CropCast Admin' },
];

export default function LoginPage({ currentUser, token, onLoginSuccess, onLogout }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  
  // Form fields
  const [identifier, setIdentifier] = useState('farmer@cropcast.ai'); // Default to demo email
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [selectedRole, setSelectedRole] = useState('Farmer');
  const [rememberMe, setRememberMe] = useState(true);

  // Password Reset Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1: request, 2: verify & set new pwd
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  // Status & Validation Feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Session time remaining
  const [timeLeftStr, setTimeLeftStr] = useState('');

  // Protected Route RBAC test result state
  const [rbacTestResult, setRbacTestResult] = useState(null);
  const [testingRoute, setTestingRoute] = useState(false);

  // Decode JWT payload helper
  const decodeJwtPayload = (tokenStr) => {
    if (!tokenStr) return null;
    try {
      const parts = tokenStr.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (e) {
      return null;
    }
  };

  const decodedToken = decodeJwtPayload(token);

  // Auto session expiration monitor
  useEffect(() => {
    if (!decodedToken || !decodedToken.exp) return;

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = decodedToken.exp - now;

      if (remaining <= 0) {
        setTimeLeftStr('Expired');
        setErrorMsg('Session expired. Token cleared. Please log in again.');
        onLogout();
      } else {
        const days = Math.floor(remaining / (3600 * 24));
        const hours = Math.floor((remaining % (3600 * 24)) / 3600);
        const mins = Math.floor((remaining % 3600) / 60);
        const secs = remaining % 60;

        if (days > 0) {
          setTimeLeftStr(`${days}d ${hours}h left (Remember Me Active)`);
        } else {
          setTimeLeftStr(`${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [decodedToken, onLogout]);

  // Handle Role Dropdown change
  const handleRoleDropdownChange = (e) => {
    const roleId = e.target.value;
    setSelectedRole(roleId);
    
    // Auto-fill demo account credentials matching selected role if in login mode
    if (mode === 'login') {
      const demo = DEMO_ACCOUNTS.find(d => d.role === roleId);
      if (demo) {
        setIdentifier(demo.identifier);
        setPassword('password123');
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!identifier.trim()) {
      errors.identifier = mode === 'login' ? 'Email or username is required.' : 'Email address is required.';
    } else if (mode === 'register' && !identifier.includes('@')) {
      errors.identifier = 'Please enter a valid email address (e.g. user@domain.com).';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }

    if (mode === 'register' && !fullName.trim()) {
      errors.fullName = 'Full name is required for registration.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDemoLogin = async (demoAccount) => {
    setErrorMsg('');
    setSuccessMsg('');
    setFieldErrors({});
    setLoading(true);
    setIdentifier(demoAccount.identifier);
    setPassword('password123');
    setSelectedRole(demoAccount.role);

    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_or_username: demoAccount.identifier,
          password: 'password123',
          remember_me: rememberMe
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Login failed.');
      }

      const roleObj = ROLES.find(r => r.id === data.role) || ROLES[0];
      setSuccessMsg(`Authenticated as ${data.user.full_name}! Redirecting to ${roleObj.redirectLabel}...`);
      onLoginSuccess(data.access_token, data.user);
    } catch (err) {
      setErrorMsg(err.message || 'Invalid credentials or server error.');
    } finally {
      setLoading(false);
    }
  };

  const handleSsoLogin = (providerName) => {
    // Single Sign-On simulation using demo account matching current selected role
    const demo = DEMO_ACCOUNTS.find(d => d.role === selectedRole) || DEMO_ACCOUNTS[0];
    handleDemoLogin(demo);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!validateForm()) {
      setErrorMsg('Validation failed. Please fix highlighted errors below.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const response = await apiFetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email_or_username: identifier.trim(),
            password: password,
            remember_me: rememberMe
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || 'Invalid email/username or password.');
        }

        const roleObj = ROLES.find(r => r.id === data.role) || ROLES[0];
        setSuccessMsg(`Welcome back, ${data.user.full_name}! Redirecting to ${roleObj.redirectLabel}...`);
        onLoginSuccess(data.access_token, data.user);
      } else {
        const response = await apiFetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: identifier.trim(),
            username: username.trim() || undefined,
            full_name: fullName.trim(),
            password: password,
            role: selectedRole
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || 'Registration failed.');
        }

        const roleObj = ROLES.find(r => r.id === data.role) || ROLES[0];
        setSuccessMsg(`Account created with Bcrypt password hashing as ${data.role}! Redirecting to ${roleObj.redirectLabel}...`);
        onLoginSuccess(data.access_token, data.user);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPasswordReset = async (e) => {
    e.preventDefault();
    setResetMessage('');
    setResetError('');
    if (!resetEmail.trim()) {
      setResetError('Please enter your email or username.');
      return;
    }

    try {
      const res = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_or_username: resetEmail.trim() })
      });
      const data = await res.json();
      setResetMessage(`${data.message} Demo verification code: ${data.demo_reset_code}`);
      setResetCodeInput(data.demo_reset_code || 'RESET-9482');
      setResetStep(2);
    } catch (e) {
      setResetError('Server connection error.');
    }
  };

  const handleConfirmPasswordReset = async (e) => {
    e.preventDefault();
    setResetMessage('');
    setResetError('');

    if (!resetCodeInput.trim()) {
      setResetError('Please enter the 6-digit reset code.');
      return;
    }
    if (!newPasswordInput || newPasswordInput.length < 6) {
      setResetError('New password must be at least 6 characters long.');
      return;
    }

    try {
      const res = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_or_username: resetEmail.trim(),
          reset_code: resetCodeInput.trim(),
          new_password: newPasswordInput
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Reset failed.');

      setSuccessMsg('Password reset successfully! You can now log in with your new password.');
      setShowForgotModal(false);
      setPassword(newPasswordInput);
    } catch (err) {
      setResetError(err.message);
    }
  };

  const testProtectedRoute = async (endpoint, label) => {
    setTestingRoute(true);
    setRbacTestResult(null);

    try {
      const response = await apiFetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      setRbacTestResult({
        endpoint,
        label,
        status: response.status,
        ok: response.ok,
        data
      });
    } catch (err) {
      setRbacTestResult({
        endpoint,
        label,
        status: 500,
        ok: false,
        data: { detail: err.message }
      });
    } finally {
      setTestingRoute(false);
    }
  };

  const currentRoleConfig = ROLES.find(r => r.id === selectedRole) || ROLES[0];
  const CurrentRoleIcon = currentRoleConfig.icon;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* Authenticated Top User Info Bar (If logged in) */}
      {currentUser && (
        <div className="glass-card" style={{ padding: '20px 28px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${currentRoleConfig.badgeColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${currentRoleConfig.badgeColor}` }}>
                <CurrentRoleIcon size={24} color={currentRoleConfig.badgeColor} />
              </div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>{currentUser.full_name}</div>
                <div style={{ fontSize: '0.8rem', color: currentRoleConfig.badgeColor, fontWeight: 700 }}>
                  Role: {currentUser.role} • Workspace: {currentRoleConfig.redirectLabel}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {timeLeftStr && (
                <div style={{ fontSize: '0.78rem', color: '#fbbf24', background: 'rgba(15, 23, 42, 0.6)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={13} /> {timeLeftStr}
                </div>
              )}
              <button 
                className="btn-secondary" 
                onClick={() => {
                  onLogout();
                  setSuccessMsg('Logged out successfully. Token removed.');
                  setErrorMsg('');
                }} 
                style={{ padding: '8px 16px', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
              >
                <LogOut size={14} /> Logout Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REAL LOGIN MAIN CONTAINER: 2-COLUMN SPLIT SHOWCASE */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: currentUser ? '1fr 1fr' : '1.1fr 1fr', 
        gap: '32px',
        alignItems: 'stretch'
      }}>

        {/* LEFT COLUMN: AgTech AI Showcase Hero Banner & Features */}
        <div className="glass-card" style={{ 
          padding: '36px', 
          display: 'flex', 
          flexDirection: 'column', 
          justify: 'space-between',
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(7, 10, 17, 0.98) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Ambient Glow Graphic */}
          <div style={{ position: 'absolute', top: '-60px', left: '-60px', width: '220px', height: '220px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '50%', filter: 'blur(50px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(6, 182, 212, 0.15)', borderRadius: '50%', filter: 'blur(50px)', pointerEvents: 'none' }} />

          <div>
            {/* Brand Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' }}>
                <Sprout size={24} color="#ffffff" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  CropCast <span style={{ color: '#34d399', fontSize: '1.2rem', fontWeight: 600 }}>AI</span>
                </h1>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Precision Agriculture Intelligence Platform</span>
              </div>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', color: '#34d399', fontWeight: 600, marginBottom: '12px' }}>
                <Sparkles size={13} /> Enterprise Security & Role Governance
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.25, marginBottom: '12px' }}>
                Secure Access to Real-Time Crop Yield Telemetry
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Log in to harness predictive machine learning models trained on soil nutrients, rainfall forecasts, and agro-climatic indices.
              </p>
            </div>

            {/* Live Metrics Showcase Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '28px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '14px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Cpu size={14} color="#06b6d4" /> ML Ensemble Accuracy
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#06b6d4', marginTop: '4px' }}>94.8%</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>XGBoost + RandomForest</div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '14px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} color="#10b981" /> Auth & Protection
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>JWT + Bcrypt</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>Role-Based Access Control</div>
              </div>
            </div>

            {/* Role Capabilities Quick Summary List */}
            <div style={{ background: 'rgba(7, 10, 17, 0.7)', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '16px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Platform Roles & Workspaces:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ROLES.map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: r.badgeColor }} />
                    <strong style={{ color: '#ffffff', minWidth: '85px' }}>{r.title}:</strong>
                    <span>{r.redirectLabel}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Bottom Trust Badge */}
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={12} color="#10b981" /> 256-Bit Encrypted Session
            </span>
            <span>Version 2.4.0 (2026)</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Ultra-Sleek Real Login Card */}
        <div className="glass-card" style={{ 
          padding: '36px', 
          background: 'rgba(15, 23, 42, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          justify: 'space-between'
        }}>

          <div>
            {/* Form Mode Switcher Tabs */}
            <div style={{ 
              display: 'flex', 
              background: 'rgba(7, 10, 17, 0.9)', 
              padding: '4px', 
              borderRadius: '12px', 
              marginBottom: '24px', 
              border: '1px solid var(--border-glass)' 
            }}>
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); setFieldErrors({}); }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: mode === 'login' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                  color: mode === 'login' ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: mode === 'login' ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none'
                }}
              >
                <KeyRound size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); setFieldErrors({}); }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: mode === 'register' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                  color: mode === 'register' ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: mode === 'register' ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none'
                }}
              >
                <User size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                Create Account
              </button>
            </div>

            {/* Single Sign-On (SSO) Quick Login Options */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleSsoLogin('Google')}
                  className="btn-secondary"
                  style={{ justifyContent: 'center', padding: '10px', fontSize: '0.82rem', fontWeight: 600 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" style={{ marginRight: '6px' }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Google SSO
                </button>
                <button
                  type="button"
                  onClick={() => handleSsoLogin('Enterprise SSO')}
                  className="btn-secondary"
                  style={{ justifyContent: 'center', padding: '10px', fontSize: '0.82rem', fontWeight: 600 }}
                >
                  <Globe size={16} color="#38bdf8" style={{ marginRight: '6px' }} />
                  Enterprise SSO
                </button>
              </div>

              {/* OR Divider Line */}
              <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0 16px 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
                <span style={{ padding: '0 12px', fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                  OR CONTINUE WITH EMAIL
                </span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
              </div>
            </div>

            {/* Error / Success Notifications */}
            {errorMsg && (
              <div style={{ padding: '12px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '10px', color: '#fca5a5', fontSize: '0.83rem', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>{errorMsg}</div>
                <button onClick={() => setErrorMsg('')} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}><X size={14} /></button>
              </div>
            )}

            {successMsg && (
              <div style={{ padding: '12px 14px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '10px', color: '#6ee7b7', fontSize: '0.83rem', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>{successMsg}</div>
                <button onClick={() => setSuccessMsg('')} style={{ background: 'none', border: 'none', color: '#6ee7b7', cursor: 'pointer' }}><X size={14} /></button>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* ROLE SELECTION DROPDOWN (PROMINENT REAL LOGIN DROPDOWN) */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserCheck size={16} color={currentRoleConfig.badgeColor} />
                    Select Role / Workspace
                  </span>
                  <span style={{ fontSize: '0.72rem', color: currentRoleConfig.badgeColor, fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: `${currentRoleConfig.badgeColor}20` }}>
                    {currentRoleConfig.redirectLabel}
                  </span>
                </label>

                <div style={{ position: 'relative' }}>
                  <select
                    id="roleSelectDropdown"
                    value={selectedRole}
                    onChange={handleRoleDropdownChange}
                    className="input-field"
                    style={{
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      paddingLeft: '42px',
                      paddingRight: '40px',
                      fontWeight: 700,
                      color: '#ffffff',
                      background: `linear-gradient(135deg, ${currentRoleConfig.badgeColor}18 0%, rgba(15, 23, 42, 0.9) 100%)`,
                      borderColor: `${currentRoleConfig.badgeColor}60`,
                      cursor: 'pointer',
                      fontSize: '0.95rem'
                    }}
                  >
                    {ROLES.map((r) => (
                      <option key={r.id} value={r.id} style={{ background: '#0f172a', color: '#ffffff', padding: '12px' }}>
                        {r.title} — ({r.redirectLabel})
                      </option>
                    ))}
                  </select>
                  
                  {/* Left Role Icon */}
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <CurrentRoleIcon size={18} color={currentRoleConfig.badgeColor} />
                  </div>

                  {/* Right Custom Chevron Arrow */}
                  <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <ChevronDown size={18} color={currentRoleConfig.badgeColor} />
                  </div>
                </div>

                {/* Role Description helper note */}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={12} color={currentRoleConfig.badgeColor} />
                  <span>{currentRoleConfig.description}</span>
                </div>
              </div>

              {/* Registration specific fields */}
              {mode === 'register' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Full Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Rajesh Kumar"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (fieldErrors.fullName) setFieldErrors(prev => ({ ...prev, fullName: null }));
                        }}
                        style={{ paddingLeft: '42px', borderColor: fieldErrors.fullName ? '#ef4444' : undefined }}
                      />
                    </div>
                    {fieldErrors.fullName && (
                      <span style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '4px', display: 'block' }}>{fieldErrors.fullName}</span>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Username (Optional)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. rajesh_farmer"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ paddingLeft: '42px' }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email / Username Field */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  {mode === 'login' ? 'Email Address or Username' : 'Email Address'} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type={mode === 'register' ? 'email' : 'text'}
                    className="input-field"
                    placeholder={mode === 'login' ? 'farmer@cropcast.ai or farmer' : 'name@company.com'}
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (fieldErrors.identifier) setFieldErrors(prev => ({ ...prev, identifier: null }));
                    }}
                    style={{ paddingLeft: '42px', borderColor: fieldErrors.identifier ? '#ef4444' : undefined }}
                  />
                </div>
                {fieldErrors.identifier && (
                  <span style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '4px', display: 'block' }}>{fieldErrors.identifier}</span>
                )}
              </div>

              {/* Password Field + Eye Show/Hide Toggle */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Password (min 6 characters) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(identifier);
                        setShowForgotModal(true);
                      }}
                      style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: null }));
                    }}
                    style={{ paddingLeft: '42px', paddingRight: '42px', borderColor: fieldErrors.password ? '#ef4444' : undefined }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'center'
                    }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <span style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '4px', display: 'block' }}>{fieldErrors.password}</span>
                )}
              </div>

              {/* Remember Me Checkbox */}
              {mode === 'login' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <input
                    type="checkbox"
                    id="rememberMeCheckbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#10b981', cursor: 'pointer' }}
                  />
                  <label htmlFor="rememberMeCheckbox" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
                    Remember me on this device (7-day extended token)
                  </label>
                </div>
              )}

              {/* Primary Action Button */}
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ 
                  width: '100%', 
                  justify: 'center', 
                  padding: '14px', 
                  fontSize: '1rem', 
                  marginTop: '8px',
                  fontWeight: 700
                }}
              >
                {loading ? 'Authenticating & Redirecting...' : mode === 'login' ? `Sign In as ${selectedRole}` : `Register as ${selectedRole}`}
                <ArrowRight size={18} />
              </button>
            </form>
          </div>

          {/* Quick 1-Click Role Presets */}
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Instant Demo Presets:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {DEMO_ACCOUNTS.map((acc) => {
                const roleConfig = ROLES.find(r => r.id === acc.role) || ROLES[0];
                const isSelected = selectedRole === acc.role;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleDemoLogin(acc)}
                    disabled={loading}
                    style={{
                      padding: '6px 8px',
                      borderRadius: '8px',
                      border: isSelected ? `1px solid ${roleConfig.badgeColor}` : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isSelected ? `${roleConfig.badgeColor}25` : 'rgba(15, 23, 42, 0.6)',
                      color: isSelected ? '#ffffff' : 'var(--text-muted)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    {acc.role}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* ACTIVE TOKEN & SESSION INSPECTOR (If token exists) */}
      {token && (
        <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.9)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="#34d399" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>Active JWT Session Token</h3>
            </div>
            <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
              {decodedToken && (decodedToken.exp - Math.floor(Date.now() / 1000) > 3600) ? '7-DAY REMEMBER' : '30m EXPIRY'}
            </span>
          </div>

          {decodedToken && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.8rem', background: 'rgba(7, 10, 17, 0.7)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>User Subject ID:</span>
                <span style={{ fontFamily: 'monospace', color: '#6ee7b7', fontWeight: 600 }}>{decodedToken.sub}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Authenticated Email:</span>
                <span style={{ fontWeight: 600, color: '#ffffff' }}>{decodedToken.email}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Role Granted:</span>
                <span style={{ fontWeight: 700, color: currentRoleConfig.badgeColor, textTransform: 'uppercase' }}>{decodedToken.role || currentUser?.role}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Session Remaining:</span>
                <span style={{ fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} /> {timeLeftStr || 'Active'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          zIndex: 999,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '28px', background: '#0f172a', border: '1px solid var(--primary-emerald)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={20} color="#10b981" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Password Reset Workflow</h3>
              </div>
              <button onClick={() => setShowForgotModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {resetError && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.8rem', marginBottom: '16px' }}>
                {resetError}
              </div>
            )}

            {resetMessage && (
              <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#6ee7b7', fontSize: '0.8rem', marginBottom: '16px' }}>
                {resetMessage}
              </div>
            )}

            {resetStep === 1 ? (
              <form onSubmit={handleRequestPasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  Enter your registered email address or username to receive a password reset verification code.
                </p>
                <input
                  type="text"
                  className="input-field"
                  placeholder="farmer@cropcast.ai or farmer"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
                <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>
                  Request Verification Code
                </button>
              </form>
            ) : (
              <form onSubmit={handleConfirmPasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Verification Code (Demo: RESET-9482)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={resetCodeInput}
                    onChange={(e) => setResetCodeInput(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    New Secure Password (min 6 chars)
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>
                  Reset & Save New Password
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM SECTION: Protected Routes RBAC Tester */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} color="#f59e0b" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Role-Based Access Control (RBAC) Verification Matrix
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Test HTTP Bearer authorization headers against backend protected routes (returns 200 OK or 403 Forbidden).
            </p>
          </div>
          <div style={{ fontSize: '0.8rem', color: currentUser ? '#34d399' : '#f87171', fontWeight: 600 }}>
            {currentUser ? `Authenticated: ${currentUser.full_name} (${currentUser.role})` : '⚠️ Session Inactive'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          <button
            onClick={() => testProtectedRoute('/api/protected/farmer-dashboard', 'Farmer Dashboard')}
            disabled={testingRoute}
            className="btn-secondary"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '14px', textAlign: 'left', border: '1px solid rgba(16, 185, 129, 0.3)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Sprout size={16} color="#10b981" />
              <strong style={{ fontSize: '0.9rem' }}>Farmer Portal</strong>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Allowed: Farmer, Admin</span>
          </button>

          <button
            onClick={() => testProtectedRoute('/api/protected/consultant-tools', 'Consultant Tools')}
            disabled={testingRoute}
            className="btn-secondary"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '14px', textAlign: 'left', border: '1px solid rgba(6, 182, 212, 0.3)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <FileSpreadsheet size={16} color="#06b6d4" />
              <strong style={{ fontSize: '0.9rem' }}>Consultant Advisory</strong>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Allowed: Consultant, Admin</span>
          </button>

          <button
            onClick={() => testProtectedRoute('/api/protected/researcher-data', 'Researcher Telemetry')}
            disabled={testingRoute}
            className="btn-secondary"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '14px', textAlign: 'left', border: '1px solid rgba(139, 92, 246, 0.3)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <FlaskConical size={16} color="#8b5cf6" />
              <strong style={{ fontSize: '0.9rem' }}>Research Datasets</strong>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Allowed: Researcher, Admin</span>
          </button>

          <button
            onClick={() => testProtectedRoute('/api/protected/admin-panel', 'Admin Console')}
            disabled={testingRoute}
            className="btn-secondary"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '14px', textAlign: 'left', border: '1px solid rgba(245, 158, 11, 0.3)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <ShieldCheck size={16} color="#f59e0b" />
              <strong style={{ fontSize: '0.9rem' }}>Admin Console</strong>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Allowed: Admin only</span>
          </button>
        </div>

        {rbacTestResult && (
          <div style={{
            padding: '16px 20px',
            borderRadius: '12px',
            background: rbacTestResult.ok ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: rbacTestResult.ok ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: rbacTestResult.ok ? '#34d399' : '#f87171' }}>
                {rbacTestResult.ok ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{rbacTestResult.label} Response (HTTP {rbacTestResult.status})</span>
              </div>
              <span className={rbacTestResult.ok ? 'badge badge-emerald' : 'badge badge-gold'}>
                {rbacTestResult.ok ? '200 OK - ACCESS GRANTED' : `${rbacTestResult.status} FORBIDDEN`}
              </span>
            </div>
            <pre style={{
              margin: 0,
              padding: '10px 14px',
              borderRadius: '8px',
              background: '#07101e',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              color: '#cbd5e1',
              overflowX: 'auto'
            }}>
              {JSON.stringify(rbacTestResult.data, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* LINKED USER PROFILE & ADMIN GOVERNANCE PANEL */}
      {token && (
        <UserProfilePanel currentUser={currentUser} token={token} />
      )}

    </div>
  );
}
