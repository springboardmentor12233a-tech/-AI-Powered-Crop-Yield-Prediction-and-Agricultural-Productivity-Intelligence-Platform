import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { Leaf, Sprout, CloudRain, ThermometerSun, MapPin, FlaskConical, Beaker, Zap, BarChart2, Activity, Home, LayoutDashboard, PieChart, FileText, Settings, User, Lock, Mail, Users, Shield, Trash2, LogOut, Database, UserPlus, LogIn, CheckCircle, MessageSquare, Edit2, Send } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, Legend } from 'recharts';
import logoImg from './assets/logo.jpg';
import './App.css';

const isDev = import.meta.env.DEV;
const defaultApiUrl = isDev ? 'http://localhost:8000/api' : 'https://data-practice.onrender.com/api';
const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : defaultApiUrl;
const MobileEmulator = ({ scale = 1 }) => (
  <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', height: `${600 * scale}px`, alignItems: 'center', transform: `scale(${scale})`, transformOrigin: 'center center' }}>
    <div style={{ position: 'absolute', top: '10%', right: '10%', width: '300px', height: '300px', backgroundColor: 'var(--primary)', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.15, zIndex: 0 }}></div>
    <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: '250px', height: '250px', backgroundColor: 'var(--secondary)', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.15, zIndex: 0 }}></div>
    <div style={{ position: 'absolute', top: '20px', right: '-40px', width: '100px', height: '100px', backgroundImage: 'radial-gradient(var(--text-muted) 2px, transparent 2px)', backgroundSize: '15px 15px', opacity: 0.2, zIndex: 0 }}></div>

    <div style={{ position: 'relative', width: '300px', height: '580px', backgroundColor: '#fff', border: '12px solid #1e293b', borderRadius: '40px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', zIndex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '120px', height: '25px', backgroundColor: '#1e293b', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', zIndex: 10 }}></div>
      <div style={{ flex: 1, backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
        <img src="https://images.unsplash.com/photo-1586771107445-d3ca888129ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Farm Map" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
        <div style={{ padding: '1.5rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Field Alpha</h4>
            <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>Active</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1.5rem' }}>
            <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Forecast Yield</p>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#0f172a' }}>4,250 kg</p>
            </div>
            <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Health Score</p>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--primary)' }}>92/100</p>
            </div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '8px', borderRadius: '8px', color: 'var(--secondary)' }}>
              <Leaf size={16} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: '600', color: '#0f172a' }}>Apply Nitrogen</p>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Recommended tomorrow</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div style={{ position: 'absolute', bottom: '50px', left: '-20px', backgroundColor: 'white', padding: '1rem 1.5rem', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', zIndex: 2, display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
      <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px', color: 'var(--primary)' }}>
        <Activity size={24} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>AI Confidence</p>
        <p style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: '700' }}>98.4%</p>
      </div>
    </div>
  </div>
);

const BackgroundDecorations = () => (
  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: '-15%', left: '-5%', width: '50vw', height: '50vw', backgroundColor: 'rgba(16, 185, 129, 0.06)', borderRadius: '50%', filter: 'blur(120px)' }}></div>
    <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '40vw', height: '40vw', backgroundColor: 'rgba(14, 165, 233, 0.05)', borderRadius: '50%', filter: 'blur(100px)' }}></div>
    <div style={{ position: 'absolute', top: '15%', right: '25%', width: '120px', height: '120px', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '50%' }}></div>
    <div style={{ position: 'absolute', bottom: '25%', left: '10%', width: '200px', height: '200px', border: '1px dashed rgba(15, 23, 42, 0.1)', borderRadius: '50%' }}></div>
    <div style={{ position: 'absolute', top: '40%', left: '20%', width: '40px', height: '40px', border: '2px solid rgba(14, 165, 233, 0.15)', borderRadius: '50%' }}></div>
    <div style={{ position: 'absolute', top: '10%', right: '10%', width: '180px', height: '180px', backgroundImage: 'radial-gradient(rgba(15, 23, 42, 0.1) 2px, transparent 2px)', backgroundSize: '15px 15px', opacity: 0.6 }}></div>
  </div>
);

function App() {
  const [formData, setFormData] = useState({
    State: 'Haryana', Crop: 'Wheat', Soil_Type: 'Loam', Fertilizer: 'DAP',
    N: 120, P: 45, K: 80, Soil_pH: 6.5, Rainfall_mm: 900, Temperature_C: 15, Year: 2026
  });

  const [currentView, setCurrentView] = useState('home');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [authUser, setAuthUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); 
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');

  const [adminTab, setAdminTab] = useState('users'); 
  const [savedData, setSavedData] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [queries, setQueries] = useState([]);
  const [newQueryText, setNewQueryText] = useState('');
  const [replyText, setReplyText] = useState({});
  const [editUserForm, setEditUserForm] = useState(null); 
  const [expandedData, setExpandedData] = useState(null); 
  const [serverAwake, setServerAwake] = useState(false);

  useEffect(() => {
    // Ping backend immediately on load to start the 50s wake-up process
    axios.get(API_URL.replace(/\/api\/?$/, '/'))
      .then(() => setServerAwake(true))
      .catch(() => setServerAwake(true)); // Even on CORS error from root, it means the server woke up

    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setAuthUser(parsed);
      if (parsed.role === 'admin' && currentView !== 'admin') {
         setCurrentView('admin');
      }
    }
  }, []);

  const fetchData = async () => {
    if (authUser?.role === 'admin') {
      try {
        const usersRes = await axios.get(`${API_URL}/users`);
        setAllUsers(usersRes.data);
      } catch(e) {}
    }
    if (authUser) {
      try {
        const predRes = await axios.get(`${API_URL}/predictions`);
        setSavedData(predRes.data);
        const queryRes = await axios.get(`${API_URL}/queries`);
        setQueries(queryRes.data);
      } catch(e) {}
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [authUser]);

  const handleAuthChange = (e) => {
    setAuthForm({ ...authForm, [e.target.name]: e.target.value });
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (authMode === 'signup') {
      try {
        const res = await axios.post(`${API_URL}/auth/signup`, authForm);
        setAuthUser(res.data);
        localStorage.setItem('currentUser', JSON.stringify(res.data));
        setCurrentView('app');
      } catch (err) {
        setAuthError(err.response?.data?.detail || 'Signup failed');
      }
    } else {
      try {
        const res = await axios.post(`${API_URL}/auth/login`, authForm);
        setAuthUser(res.data);
        localStorage.setItem('currentUser', JSON.stringify(res.data));
        if (res.data.role === 'admin') {
          setCurrentView('admin');
        } else {
          setCurrentView('app');
        }
      } catch (err) {
        setAuthError('Invalid credentials.');
      }
    }
  };

  const handleLogout = () => {
    setAuthUser(null);
    localStorage.removeItem('currentUser');
    setCurrentView('home');
  };

  const deleteUser = async (id) => {
    try {
      await axios.delete(`${API_URL}/users/${id}`);
      fetchData();
    } catch(e) {}
  };

  const saveUserEdit = async () => {
    if (!editUserForm) return;
    try {
      await axios.put(`${API_URL}/users/${editUserForm.id}`, editUserForm);
      setEditUserForm(null);
      fetchData();
    } catch(e) {}
  };

  const submitQuery = async () => {
    if (!newQueryText.trim()) return;
    try {
      await axios.post(`${API_URL}/queries`, {
        userId: authUser.email,
        userName: authUser.name,
        text: newQueryText
      });
      setNewQueryText('');
      fetchData();
    } catch(e) {}
  };

  const submitReply = async (queryId) => {
    const text = replyText[queryId];
    if (!text || !text.trim()) return;
    try {
      await axios.post(`${API_URL}/queries/${queryId}/reply`, { response: text });
      setReplyText(prev => ({ ...prev, [queryId]: '' }));
      fetchData();
    } catch(e) {}
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const url = authUser ? `${API_URL}/predict?user=${authUser.email}` : `${API_URL}/predict`;
      const res = await axios.post(url, formData);
      setResult(res.data);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F8FAFC', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* 1. SIDE MENU BAR */}
      <aside style={{
        width: '260px',
        backgroundColor: '#1E293B',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '4px 0 25px rgba(0,0,0,0.05)',
        zIndex: 50
      }}>
        {/* Brand */}
        <div style={{ padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <img src={logoImg} alt="Logo" style={{ width: '36px', height: '36px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '0.5px' }}>Yield Predictor</span>
        </div>

        {/* Navigation */}
        <div style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '8px', letterSpacing: '1px' }}>Navigation</div>
          
          <button 
            onClick={() => setCurrentView('home')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', 
              backgroundColor: currentView === 'home' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              color: currentView === 'home' ? '#34D399' : '#CBD5E1',
              border: 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600', transition: 'all 0.2s', textAlign: 'left', width: '100%'
            }}
          >
            <Home size={18} /> Home
          </button>
          
          <button 
            onClick={() => {
              if (authUser) setCurrentView('app');
              else setCurrentView('auth');
            }}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', 
              backgroundColor: currentView === 'app' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              color: currentView === 'app' ? '#34D399' : '#CBD5E1',
              border: 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600', transition: 'all 0.2s', textAlign: 'left', width: '100%'
            }}
          >
            <Sprout size={18} /> AI Workspace
          </button>

          {/* Conditional Sub-menu when in App View */}
          <div style={{ 
            marginTop: '0.5rem', 
            paddingLeft: '24px', 
            borderLeft: '2px solid rgba(255,255,255,0.1)', 
            marginLeft: '24px',
            display: currentView === 'app' ? 'flex' : 'none', flexDirection: 'column', gap: '6px',
          }}>
            <button onClick={() => setActiveTab('dashboard')} style={{ background: 'transparent', border: 'none', color: activeTab === 'dashboard' ? 'white' : '#94A3B8', padding: '8px 0', textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: activeTab === 'dashboard' ? '600' : '400', transition: 'color 0.2s' }}>
              <Sprout size={14} /> Overview
            </button>
            <button onClick={() => setActiveTab('reports')} style={{ background: 'transparent', border: 'none', color: activeTab === 'reports' ? 'white' : '#94A3B8', padding: '8px 0', textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: activeTab === 'reports' ? '600' : '400', transition: 'color 0.2s' }}>
              <CloudRain size={14} /> Analytics
            </button>
            <button onClick={() => setActiveTab('advisory')} style={{ background: 'transparent', border: 'none', color: activeTab === 'advisory' ? 'white' : '#94A3B8', padding: '8px 0', textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: activeTab === 'advisory' ? '600' : '400', transition: 'color 0.2s' }}>
              <Leaf size={14} /> AI Advisory
            </button>
            <button onClick={() => setActiveTab('queries')} style={{ background: 'transparent', border: 'none', color: activeTab === 'queries' ? 'white' : '#94A3B8', padding: '8px 0', textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: activeTab === 'queries' ? '600' : '400', transition: 'color 0.2s' }}>
              <MessageSquare size={14} /> My Queries
            </button>
          </div>

          {authUser && authUser.role === 'admin' && (
            <button 
              onClick={() => setCurrentView('admin')}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', 
                backgroundColor: currentView === 'admin' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                color: currentView === 'admin' ? '#34D399' : '#CBD5E1',
                border: 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600', transition: 'all 0.2s', textAlign: 'left', width: '100%',
                marginTop: '1rem'
              }}
            >
              <Shield size={18} /> Admin Panel
            </button>
          )}

          {!authUser && (
             <button 
             onClick={() => setCurrentView('auth')}
             style={{ 
               display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', 
               backgroundColor: currentView === 'auth' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
               color: currentView === 'auth' ? '#34D399' : '#CBD5E1',
               border: 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600', transition: 'all 0.2s', textAlign: 'left', width: '100%',
               marginTop: '1rem'
             }}
           >
             <User size={18} /> Login / Signup
           </button>
          )}

        </div>

        {/* Server Status Indicator */}
        <div style={{ padding: '0.75rem 1rem', margin: 'auto 1rem 1rem 1rem', backgroundColor: serverAwake ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', border: `1px solid ${serverAwake ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}` }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: serverAwake ? '#10B981' : '#F59E0B', boxShadow: `0 0 10px ${serverAwake ? '#10B981' : '#F59E0B'}`, animation: serverAwake ? 'none' : 'pulse 1.5s infinite' }}></div>
          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: serverAwake ? '#10B981' : '#F59E0B' }}>
            {serverAwake ? 'Backend Online' : 'Waking Server (30s)...'}
          </span>
        </div>

        {/* User Profile Footer */}
        {authUser ? (
          <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#34D399', color: '#022C22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                {authUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: '700', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{authUser.name}</div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{authUser.role.toUpperCase()}</div>
              </div>
            </div>
            <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '8px' }}>
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Guest User</span>
          </div>
        )}
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: 'var(--bg-app)' }}>
        <BackgroundDecorations />

        {/* VIEW: HOME */}
        {currentView === 'home' && (
          <div style={{ height: '100%', overflowY: 'auto', padding: '4rem 5%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ maxWidth: '1200px', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(15, 118, 110, 0.1)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.875rem', fontWeight: '600', marginBottom: '1.5rem', letterSpacing: '0.5px' }}>
                  <Sprout size={16} /> DATA-DRIVEN AGRICULTURE
                </div>
                <h1 style={{ fontSize: '4rem', fontWeight: '800', lineHeight: '1.1', marginBottom: '1.5rem', color: 'var(--text-main)', letterSpacing: '-1.5px' }}>
                  Intelligent <span style={{ color: 'var(--primary)' }}>Harvest</span> Forecasting
                </h1>
                <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)', marginBottom: '2.5rem', lineHeight: '1.7', maxWidth: '95%' }}>
                  Leverage advanced machine learning agronomic models to optimize your harvest, balance soil nutrients, and ensure long-term sustainable soil health.
                </p>
                <button 
                  onClick={() => {
                    if (authUser) setCurrentView('app');
                    else setCurrentView('auth');
                  }}
                  style={{ background: 'linear-gradient(to right, #0F766E, #047857)', color: 'white', border: 'none', padding: '1rem 2rem', fontSize: '1.05rem', fontWeight: '700', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 8px 25px -5px rgba(15, 118, 110, 0.5)', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '8px', letterSpacing: '0.5px' }}
                >
                  Enter Workspace <Leaf size={18} />
                </button>
              </div>
              <MobileEmulator scale={1} />
            </div>
          </div>
        )}

        {/* VIEW: AUTHENTICATION */}
        {currentView === 'auth' && (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10, padding: '2rem' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 20px 50px -10px rgba(0,0,0,0.1)', width: '100%', maxWidth: '900px', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', overflow: 'hidden' }}>
              
              {/* Image Section */}
              <div style={{ flex: 1, display: 'none', '@media (minWidth: 768px)': { display: 'block' }, position: 'relative' }}>
                <img 
                  src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Farming Concept" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to right, rgba(0,0,0,0.1), rgba(0,0,0,0.6))' }}></div>
                <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', color: 'white', maxWidth: '80%' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Cultivate Success</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>AI-powered predictive models for precision agriculture.</p>
                </div>
              </div>

              {/* Form Section */}
              <div style={{ flex: 1, padding: '3rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{ display: 'inline-flex', padding: '16px', backgroundColor: 'rgba(15,118,110,0.1)', borderRadius: '20px', color: 'var(--primary)', marginBottom: '1rem' }}>
                    <Shield size={32} />
                  </div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px 0' }}>
                    {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
                    {authMode === 'login' ? 'Enter your credentials to access your workspace.' : 'Sign up to start optimizing your harvest.'}
                  </p>
                </div>

                {authError && (
                  <div style={{ backgroundColor: '#FEF2F2', color: '#DC2626', padding: '12px', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center', border: '1px solid #FCA5A5' }}>
                    {authError}
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {authMode === 'signup' && (
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px', display: 'block' }}>Full Name</label>
                      <div style={{ position: 'relative' }}>
                        <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <input type="text" name="name" value={authForm.name} onChange={handleAuthChange} placeholder="John Doe" style={{ width: '100%', boxSizing: 'border-box', padding: '0.9rem 1rem 0.9rem 2.5rem', border: '1px solid #E2E8F0', borderRadius: '12px', outline: 'none', fontSize: '0.95rem', backgroundColor: '#F8FAFC' }} />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px', display: 'block' }}>Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                      <input type="email" name="email" value={authForm.email} onChange={handleAuthChange} placeholder="user@example.com" style={{ width: '100%', boxSizing: 'border-box', padding: '0.9rem 1rem 0.9rem 2.5rem', border: '1px solid #E2E8F0', borderRadius: '12px', outline: 'none', fontSize: '0.95rem', backgroundColor: '#F8FAFC' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px', display: 'block' }}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                      <input type="password" name="password" value={authForm.password} onChange={handleAuthChange} placeholder="••••••••" style={{ width: '100%', boxSizing: 'border-box', padding: '0.9rem 1rem 0.9rem 2.5rem', border: '1px solid #E2E8F0', borderRadius: '12px', outline: 'none', fontSize: '0.95rem', backgroundColor: '#F8FAFC' }} />
                    </div>
                  </div>

                  <button type="submit" style={{ background: 'linear-gradient(to right, #0F766E, #047857)', color: 'white', border: 'none', padding: '1rem', borderRadius: '12px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer', marginTop: '0.5rem', boxShadow: '0 8px 20px -5px rgba(15, 118, 110, 0.4)', transition: 'transform 0.1s' }}>
                    {authMode === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                  {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
                  <button 
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'signup' : 'login');
                      setAuthError('');
                    }} 
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                  >
                    {authMode === 'login' ? 'Sign up' : 'Log in'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* VIEW: ADMIN PANEL */}
        {currentView === 'admin' && authUser && authUser.role === 'admin' && (
          <div style={{ height: '100%', padding: '2rem 3rem', overflowY: 'auto', position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px 0' }}>Admin Dashboard</h1>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.1rem' }}>Manage users, review data, and respond to queries.</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setAdminTab('users')} style={{ padding: '0.75rem 1rem', borderRadius: '12px', fontWeight: '600', border: 'none', cursor: 'pointer', backgroundColor: adminTab === 'users' ? 'var(--primary)' : 'white', color: adminTab === 'users' ? 'white' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} /> Users
                </button>
                <button onClick={() => setAdminTab('data')} style={{ padding: '0.75rem 1rem', borderRadius: '12px', fontWeight: '600', border: 'none', cursor: 'pointer', backgroundColor: adminTab === 'data' ? 'var(--primary)' : 'white', color: adminTab === 'data' ? 'white' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={18} /> Data
                </button>
                <button onClick={() => setAdminTab('queries')} style={{ padding: '0.75rem 1rem', borderRadius: '12px', fontWeight: '600', border: 'none', cursor: 'pointer', backgroundColor: adminTab === 'queries' ? 'var(--primary)' : 'white', color: adminTab === 'queries' ? 'white' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={18} /> Queries
                </button>
              </div>
            </div>

            {/* Admin: Users Tab */}
            {adminTab === 'users' && (
              <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 15px 40px -15px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.03)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={20} color="var(--primary)" /> Registered Users</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B' }}>
                        <th style={{ padding: '1rem', fontWeight: '600' }}>Name</th>
                        <th style={{ padding: '1rem', fontWeight: '600' }}>Email</th>
                        <th style={{ padding: '1rem', fontWeight: '600' }}>Role</th>
                        <th style={{ padding: '1rem', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((user) => (
                        <tr key={user.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '1rem', fontWeight: '500', color: 'var(--text-main)' }}>
                            {editUserForm?.id === user.id ? (
                              <input value={editUserForm.name} onChange={e => setEditUserForm({...editUserForm, name: e.target.value})} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #E2E8F0' }} />
                            ) : user.name}
                          </td>
                          <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                            {editUserForm?.id === user.id ? (
                              <input value={editUserForm.email} onChange={e => setEditUserForm({...editUserForm, email: e.target.value})} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #E2E8F0' }} />
                            ) : user.email}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', backgroundColor: user.role === 'admin' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: user.role === 'admin' ? '#8B5CF6' : '#10B981' }}>
                              {user.role.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            {editUserForm?.id === user.id ? (
                              <button onClick={saveUserEdit} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Save</button>
                            ) : (
                              <button onClick={() => setEditUserForm(user)} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                                <Edit2 size={16} /> Edit
                              </button>
                            )}
                            
                            {user.email !== authUser.email && (
                              <button onClick={() => deleteUser(user.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                                <Trash2 size={16} /> Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Admin: Data Tab */}
            {adminTab === 'data' && (
              <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 15px 40px -15px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.03)' }}>
                 <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}><Database size={20} color="var(--primary)" /> Prediction Logs</h3>
                 <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B' }}>
                        <th style={{ padding: '1rem', fontWeight: '600' }}>Date</th>
                        <th style={{ padding: '1rem', fontWeight: '600' }}>User</th>
                        <th style={{ padding: '1rem', fontWeight: '600' }}>Crop</th>
                        <th style={{ padding: '1rem', fontWeight: '600', textAlign: 'right' }}>Predicted Yield</th>
                        <th style={{ padding: '1rem', fontWeight: '600', textAlign: 'center' }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedData.map((data, idx) => (
                        <React.Fragment key={idx}>
                          <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{data.date}</td>
                            <td style={{ padding: '1rem', fontWeight: '500', color: 'var(--text-main)' }}>{data.user}</td>
                            <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{data.crop}</td>
                            <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '700', color: 'var(--primary)' }}>{data.predictedYield.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg/ac</td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                              <button onClick={() => setExpandedData(expandedData === idx ? null : idx)} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                                {expandedData === idx ? 'Hide' : 'View'}
                              </button>
                            </td>
                          </tr>
                          {expandedData === idx && (
                            <tr>
                              <td colSpan="5" style={{ padding: '1rem', backgroundColor: '#F8FAFC' }}>
                                <div>
                                  <strong>Searched Parameters:</strong>
                                  <pre style={{ fontSize: '0.85rem' }}>{JSON.stringify(data.formData, null, 2)}</pre>
                                  <strong>AI Advisory:</strong>
                                  <div className="markdown-body" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    <ReactMarkdown>{data.advisory_report || 'No advisory available'}</ReactMarkdown>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                      {savedData.length === 0 && (
                        <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No prediction data available.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Admin: Queries Tab */}
            {adminTab === 'queries' && (
              <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 15px 40px -15px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.03)' }}>
                 <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}><MessageSquare size={20} color="var(--primary)" /> User Support Queries</h3>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {queries.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No queries from users yet.</p>
                    ) : (
                      queries.map(q => (
                        <div key={q.id} style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.5rem', backgroundColor: '#F8FAFC' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <strong style={{ color: 'var(--text-main)' }}>{q.userName} ({q.userId})</strong>
                            <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>{q.date}</span>
                          </div>
                          <p style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)' }}>{q.text}</p>
                          
                          {q.response ? (
                            <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                              <strong style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: 'var(--primary)' }}>Admin Response:</strong>
                              <p style={{ margin: 0, color: 'var(--text-main)' }}>{q.response}</p>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input 
                                type="text" 
                                placeholder="Type your response..." 
                                value={replyText[q.id] || ''} 
                                onChange={(e) => setReplyText({...replyText, [q.id]: e.target.value})}
                                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none' }}
                              />
                              <button onClick={() => submitReply(q.id)} style={{ padding: '10px 16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Send size={16} /> Reply
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                 </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW: APP DASHBOARD (Workspace) */}
        {currentView === 'app' && (
          <div style={{ height: '100%', position: 'relative' }}>
            
            <div style={{ position: 'absolute', right: '-140px', top: '50%', transform: 'translateY(-50%)', zIndex: 0, pointerEvents: 'none', opacity: 0.85 }}>
              <MobileEmulator scale={0.9} />
            </div>

            <div style={{ height: '100%', padding: '2rem 3rem', boxSizing: 'border-box', display: 'grid', gridTemplateColumns: '350px minmax(500px, 800px)', gap: '2.5rem', position: 'relative', zIndex: 1, overflowY: 'auto' }} className="custom-scrollbar">
              
              {/* Form Sidebar */}
              <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '1.75rem', boxShadow: '0 15px 40px -15px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.03)', height: 'fit-content' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.75rem' }}>
                  <div style={{ padding: '10px', backgroundColor: 'rgba(15,118,110,0.1)', borderRadius: '12px', color: 'var(--primary)' }}><Settings size={22} /></div>
                  <h2 style={{ fontSize: '1.35rem', margin: 0, color: 'var(--text-main)', fontWeight: '800' }}>Calibration</h2>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Setup Group */}
                  <div>
                    <h3 style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}><MapPin size={14} /> Setup Profile</h3>
                    <div style={{ marginBottom: '12px' }}>
                      <input name="State" placeholder="State/Region" value={formData.State} onChange={handleChange} style={{ width: '100%', boxSizing: 'border-box', padding: '0.85rem 1rem', fontSize: '0.9rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', outline: 'none', color: '#0F172A' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <input name="Crop" placeholder="Crop Type" value={formData.Crop} onChange={handleChange} style={{ width: '100%', boxSizing: 'border-box', padding: '0.85rem 1rem', fontSize: '0.9rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', outline: 'none', color: '#0F172A' }} />
                      <input name="Soil_Type" placeholder="Soil Type" value={formData.Soil_Type} onChange={handleChange} style={{ width: '100%', boxSizing: 'border-box', padding: '0.85rem 1rem', fontSize: '0.9rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', outline: 'none', color: '#0F172A' }} />
                    </div>
                    <div>
                      <input name="Fertilizer" placeholder="Fertilizer Target" value={formData.Fertilizer} onChange={handleChange} style={{ width: '100%', boxSizing: 'border-box', padding: '0.85rem 1rem', fontSize: '0.9rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', outline: 'none', color: '#0F172A' }} />
                    </div>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '0' }} />

                  {/* Nutrients Group */}
                  <div>
                    <h3 style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}><FlaskConical size={14} /> Nutrients (kg/ha)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: '#64748B', marginBottom: '4px', display: 'block', fontWeight: '500' }}>Nitrogen (N)</label>
                        <input type="number" name="N" value={formData.N} onChange={handleChange} style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', fontSize: '0.9rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', outline: 'none', color: '#0F172A' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: '#64748B', marginBottom: '4px', display: 'block', fontWeight: '500' }}>Phosphorus (P)</label>
                        <input type="number" name="P" value={formData.P} onChange={handleChange} style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', fontSize: '0.9rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', outline: 'none', color: '#0F172A' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: '#64748B', marginBottom: '4px', display: 'block', fontWeight: '500' }}>Potassium (K)</label>
                        <input type="number" name="K" value={formData.K} onChange={handleChange} style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', fontSize: '0.9rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', outline: 'none', color: '#0F172A' }} />
                      </div>
                    </div>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '0' }} />

                  {/* Environment Group */}
                  <div>
                    <h3 style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}><CloudRain size={14} /> Environment</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: '#64748B', marginBottom: '4px', display: 'block', fontWeight: '500' }}>Soil pH</label>
                        <input type="number" step="0.1" name="Soil_pH" value={formData.Soil_pH} onChange={handleChange} style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', fontSize: '0.9rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', outline: 'none', color: '#0F172A' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: '#64748B', marginBottom: '4px', display: 'block', fontWeight: '500' }}>Rain (mm)</label>
                        <input type="number" name="Rainfall_mm" value={formData.Rainfall_mm} onChange={handleChange} style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', fontSize: '0.9rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', outline: 'none', color: '#0F172A' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: '#64748B', marginBottom: '4px', display: 'block', fontWeight: '500' }}>Temp (°C)</label>
                        <input type="number" name="Temperature_C" value={formData.Temperature_C} onChange={handleChange} style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', fontSize: '0.9rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', outline: 'none', color: '#0F172A' }} />
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} style={{ width: '100%', padding: '1rem', fontSize: '1rem', borderRadius: '12px', marginTop: '10px', background: 'linear-gradient(to right, #0F766E, #047857)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(15, 118, 110, 0.3)' }}>
                    {loading ? <div className="spinner"></div> : <><Leaf size={18} /> Execute AI Model</>}
                  </button>
                </form>
              </div>

              {/* Data Dashboard Area */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingRight: '2rem' }}>
                
                {/* NEW USER QUERIES TAB VIEW */}
                {activeTab === 'queries' ? (
                  <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 15px 40px -15px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.03)' }}>
                     <h2 style={{ fontSize: '1.8rem', margin: '0 0 1.5rem 0', color: 'var(--text-main)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                       <MessageSquare color="var(--primary)" /> Ask AI Support
                     </h2>
                     <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Have questions about your predictions or system usage? Ask our admin support here.</p>
                     
                     <div style={{ display: 'flex', gap: '10px', marginBottom: '2rem' }}>
                       <input 
                         type="text"
                         value={newQueryText}
                         onChange={e => setNewQueryText(e.target.value)}
                         placeholder="Type your question here..."
                         style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '1rem', outline: 'none' }}
                       />
                       <button onClick={submitQuery} style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none', padding: '0 1.5rem', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <Send size={18} /> Submit
                       </button>
                     </div>

                     <div>
                       <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Your Previous Queries</h3>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                         {queries.filter(q => q.userId === authUser.email).length === 0 ? (
                           <p style={{ color: 'var(--text-muted)' }}>You haven't submitted any queries yet.</p>
                         ) : (
                           queries.filter(q => q.userId === authUser.email).map(q => (
                             <div key={q.id} style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem', backgroundColor: '#F8FAFC' }}>
                               <p style={{ margin: '0 0 1rem 0', fontWeight: '500', color: 'var(--text-main)' }}>{q.text}</p>
                               {q.response ? (
                                 <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                                   <strong style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: 'var(--primary)' }}>Admin Response:</strong>
                                   <p style={{ margin: 0, color: 'var(--text-main)' }}>{q.response}</p>
                                 </div>
                               ) : (
                                 <span style={{ fontSize: '0.85rem', color: '#F59E0B', fontWeight: '600', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '4px 10px', borderRadius: '20px' }}>Awaiting Response</span>
                               )}
                             </div>
                           ))
                         )}
                       </div>
                     </div>
                  </div>
                ) : (
                  <>
                    {!result && !loading && (
                      <div style={{ backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '4rem 2rem', textAlign: 'center', border: '1px dashed #CBD5E1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ backgroundColor: '#F1F5F9', padding: '1.5rem', borderRadius: '50%', color: '#94A3B8' }}><BarChart2 size={48} /></div>
                        <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-main)' }}>Awaiting Parameters</h3>
                        <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: 0 }}>Input your soil and environmental data on the left to generate predictive yield models and AI advisory.</p>
                      </div>
                    )}

                    {error && (
                      <div style={{ backgroundColor: '#FEF2F2', padding: '1.5rem', borderRadius: '16px', border: '1px solid #FCA5A5' }}>
                        <h3 style={{ color: '#EF4444', margin: '0 0 0.5rem 0' }}>Analysis Error</h3>
                        <p style={{ margin: 0, color: '#991B1B' }}>{error}</p>
                      </div>
                    )}

                    {result && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h2 style={{ fontSize: '1.8rem', margin: '0 0 4px 0', color: 'var(--text-main)', fontWeight: '800' }}>Analysis Results</h2>
                            <p style={{ margin: 0, color: 'var(--text-muted)' }}>For {formData.Crop} in {formData.State}</p>
                          </div>
                          <div style={{ padding: '8px 16px', backgroundColor: 'rgba(16,185,129,0.1)', color: 'var(--primary)', borderRadius: '20px', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Activity size={16} /> High Confidence
                          </div>
                        </div>

                        {activeTab === 'dashboard' && (
                          <div style={{ animation: 'slideInRight 0.4s ease-out' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                              <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', backgroundColor: 'var(--primary)', filter: 'blur(50px)', opacity: 0.1 }}></div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><Sprout size={16} /> Forecasted Yield</div>
                                <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: '1' }}>{result.predicted_yield_kg_per_acre.toLocaleString(undefined, { maximumFractionDigits: 1 })}<span style={{ fontSize: '1.25rem', color: 'var(--text-muted)', fontWeight: '500', marginLeft: '8px' }}>kg/ac</span></div>
                              </div>
                              
                              <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}>
                                 <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} /> Profile Summary</div>
                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                   <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #E2E8F0', paddingBottom: '4px' }}><span style={{ color: 'var(--text-muted)' }}>Soil Type</span><span style={{ fontWeight: '600' }}>{formData.Soil_Type}</span></div>
                                   <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #E2E8F0', paddingBottom: '4px' }}><span style={{ color: 'var(--text-muted)' }}>pH Level</span><span style={{ fontWeight: '600' }}>{formData.Soil_pH}</span></div>
                                   <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Target Fertilizer</span><span style={{ fontWeight: '600' }}>{formData.Fertilizer}</span></div>
                                 </div>
                              </div>
                            </div>

                            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.03)', boxShadow: '0 15px 40px -15px rgba(0,0,0,0.08)' }}>
                              <h3 style={{ marginTop: 0, fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}><Leaf size={20} color="var(--secondary)" /> AI Execution Summary</h3>
                              <p style={{ fontSize: '1.05rem', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                                Based on your input parameters for <strong style={{color: 'var(--text-main)'}}>{formData.Crop}</strong> in <strong style={{color: 'var(--text-main)'}}>{formData.State}</strong>, the model predicts an optimal yield of <strong style={{color: 'var(--primary)'}}>{result.predicted_yield_kg_per_acre.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg/acre</strong>. The selected fertilizer ({formData.Fertilizer}) combined with {formData.Rainfall_mm}mm of expected rainfall establishes a highly favorable agronomic baseline.
                              </p>
                            </div>
                          </div>
                        )}

                        {activeTab === 'reports' && (
                          <div style={{ animation: 'slideInRight 0.4s ease-out', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--border)', height: '320px' }}>
                              <div style={{ fontWeight: '600', marginBottom: '1rem' }}>Macronutrient Profile (N-P-K)</div>
                              <ResponsiveContainer width="100%" height="85%">
                                <BarChart data={[
                                  { name: 'Nitrogen', value: formData.N, fill: '#3B82F6' },
                                  { name: 'Phosphorus', value: formData.P, fill: '#8B5CF6' },
                                  { name: 'Potassium', value: formData.K, fill: '#10B981' }
                                ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                  <XAxis dataKey="name" tick={{fontSize: 12, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} />
                                  <YAxis tick={{fontSize: 12, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} />
                                  <Tooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>

                            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--border)', height: '320px', display: 'flex', flexDirection: 'column' }}>
                              <div style={{ fontWeight: '600', marginBottom: '1.5rem' }}>Environmental Readiness</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, justifyContent: 'center' }}>
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px', fontWeight: '600', color: 'var(--text-main)' }}>
                                    <span>Nitrogen Level</span>
                                    <span style={{ color: '#3B82F6' }}>{Math.round(Math.min(100, (formData.N / 150) * 100))}%</span>
                                  </div>
                                  <div style={{ height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${Math.min(100, (formData.N / 150) * 100)}%`, height: '100%', backgroundColor: '#3B82F6', borderRadius: '4px' }}></div>
                                  </div>
                                </div>
                                
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px', fontWeight: '600', color: 'var(--text-main)' }}>
                                    <span>Moisture Level</span>
                                    <span style={{ color: '#F59E0B' }}>{Math.round(Math.min(100, (formData.Rainfall_mm / 1000) * 100))}%</span>
                                  </div>
                                  <div style={{ height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${Math.min(100, (formData.Rainfall_mm / 1000) * 100)}%`, height: '100%', backgroundColor: '#F59E0B', borderRadius: '4px' }}></div>
                                  </div>
                                </div>
                                
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px', fontWeight: '600', color: 'var(--text-main)' }}>
                                    <span>pH Optimization</span>
                                    <span style={{ color: '#10B981' }}>90%</span>
                                  </div>
                                  <div style={{ height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `90%`, height: '100%', backgroundColor: '#10B981', borderRadius: '4px' }}></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeTab === 'advisory' && (
                          <div className="markdown-body" style={{ animation: 'slideInRight 0.4s ease-out', backgroundColor: 'white', padding: '2.5rem', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', fontSize: '1.05rem', lineHeight: '1.7' }}>
                            <ReactMarkdown>{result.advisory_report}</ReactMarkdown>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
