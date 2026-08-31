import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, KeyRound, AlertCircle, RefreshCw, Briefcase } from 'lucide-react';
import api from '../api';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Farmer');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/register', { name, email, password, role });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.detail || 
        'Unable to complete registration. Email may already be in use.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-[#e5eedf] via-[#f7faf4] to-[#cce2be] p-4 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-brand-200/40 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#aad594]/30 rounded-full blur-3xl" />

      <div className="w-full max-w-md glass-card rounded-3xl p-8 z-10">
        <div className="text-center mb-8">
          <span className="text-4xl inline-block mb-3 animate-bounce">🌱</span>
          <h2 className="text-2xl font-bold text-slate-800">Create Account</h2>
          <p className="text-sm text-slate-500 mt-1">Join the YieldSense agricultural forecasting system</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-xl text-rose-700 flex items-start gap-3 text-sm">
            <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl text-emerald-800 flex items-start gap-3 text-sm">
            <span className="text-lg">✅</span>
            <div>
              <p className="font-semibold">Registration Successful!</p>
              <p className="text-xs mt-0.5 text-emerald-600">Redirecting you to login...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <User size={18} />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="block w-full pl-11 pr-4 py-3 bg-white border border-[#e3ecd9] rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Mail size={18} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farmer@yieldsense.com"
                className="block w-full pl-11 pr-4 py-3 bg-white border border-[#e3ecd9] rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">System Role</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Briefcase size={18} />
              </span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-white border border-[#e3ecd9] rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="Farmer">Farmer (Manage Crops & Farms)</option>
                <option value="Administrator">Administrator (Global Analytics & Verification)</option>
              </select>
              <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 text-xs">▼</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Password (Min 6 chars)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <KeyRound size={18} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-11 pr-4 py-3 bg-white border border-[#e3ecd9] rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-semibold shadow-lg shadow-brand-650/15 hover:shadow-brand-650/25 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin" size={18} />
                Registering...
              </>
            ) : (
              'Register'
            )}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
