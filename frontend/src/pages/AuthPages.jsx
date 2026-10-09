import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerUser, forgotPassword as apiForgotPassword, resetPassword as apiResetPassword } from '../services/api';
import { Sprout, Loader2, LogIn, UserPlus, ArrowRight, ShieldCheck } from 'lucide-react';
import { cn } from '../utils/cn';

const AuthLayout = ({ children, title, subtitle }) => (
  <div className="min-h-screen flex bg-white font-sans">
    {/* Left Side - Visual */}
    <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#12372A] to-[#1F6B45] relative overflow-hidden items-center justify-center p-12">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#A8C957]/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#5BAE65]/20 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3"></div>
      
      <div className="relative z-10 max-w-lg">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl inline-flex mb-8">
          <Sprout className="w-12 h-12 text-[#A8C957]" />
        </div>
        <h1 className="text-5xl font-black text-[#F7F8F2] tracking-tight leading-tight mb-6">
          Intelligence for <br/>Modern Agriculture.
        </h1>
        <p className="text-[#c6dfcd] text-xl leading-relaxed font-medium mb-12 max-w-md">
          Predict crop yields, analyze soil health, and monitor weather impacts with precision AI.
        </p>
        
        <div className="space-y-6">
          <div className="flex items-center text-[#e8f0ea]">
            <ShieldCheck className="w-6 h-6 text-[#A8C957] mr-4" />
            <span className="font-semibold text-lg">Bank-grade data security</span>
          </div>
          <div className="flex items-center text-[#e8f0ea]">
            <Sprout className="w-6 h-6 text-[#A8C957] mr-4" />
            <span className="font-semibold text-lg">AI-Powered Yield Forecasting</span>
          </div>
        </div>
      </div>
    </div>

    {/* Right Side - Form */}
    <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-24 bg-[#F7F8F2]">
      <div className="w-full max-w-md space-y-8">
        <div className="lg:hidden flex justify-center mb-12">
           <div className="bg-[#12372A] p-4 rounded-2xl shadow-lg inline-flex">
             <Sprout className="w-10 h-10 text-[#A8C957]" />
           </div>
        </div>
        
        <div>
          <h2 className="text-4xl font-extrabold text-[#12372A] tracking-tight">{title}</h2>
          <p className="mt-3 text-lg text-slate-500 font-medium">{subtitle}</p>
        </div>

        {children}
      </div>
    </div>
  </div>
);

const Input = ({ label, type, value, onChange, required, minLength }) => (
  <div className="space-y-2">
    <label className="text-sm font-bold text-slate-700">{label}</label>
    <input 
      type={type} 
      value={value}
      onChange={onChange}
      className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5BAE65] focus:border-transparent outline-none transition-all shadow-sm font-medium text-slate-800" 
      required={required} 
      minLength={minLength}
    />
  </div>
);

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your YieldSense account.">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-700">Password</label>
            <Link to="/forgot-password" className="text-sm font-bold text-[#1F6B45] hover:text-[#2E8B57] transition-colors">
              Forgot password?
            </Link>
          </div>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5BAE65] focus:border-transparent outline-none transition-all shadow-sm font-medium text-slate-800" 
            required 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-[#1F6B45] hover:bg-[#2E8B57] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5BAE65] transition-all"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign in to Dashboard"}
        </button>
      </form>

      <p className="text-center text-sm font-medium text-slate-500">
        Don't have an account? <Link to="/register" className="font-bold text-[#1F6B45] hover:text-[#2E8B57] transition-colors">Create one now</Link>
      </p>
    </AuthLayout>
  );
};

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await registerUser({ name, email, password });
      navigate('/login', { state: { message: 'Registration successful! Please login.' } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create an account" subtitle="Join the future of agriculture.">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input label="Full Name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Password (min 8 characters)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />

        <button 
          type="submit" 
          disabled={loading}
          className="w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-[#1F6B45] hover:bg-[#2E8B57] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5BAE65] transition-all"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
        </button>
      </form>

      <p className="text-center text-sm font-medium text-slate-500">
        Already have an account? <Link to="/login" className="font-bold text-[#1F6B45] hover:text-[#2E8B57] transition-colors">Sign in</Link>
      </p>
    </AuthLayout>
  );
};

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      await apiForgotPassword(email);
      setMessage('If an account exists for this email, a password reset link has been sent.');
    } catch (err) {
      if (err.response) {
        setMessage('If an account exists for this email, a password reset link has been sent.');
      } else {
        setError('Failed to connect to the server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your email to receive a recovery link.">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-200">
          {error}
        </div>
      )}
      
      {message && (
        <div className="p-4 bg-[#f0fdf4] text-[#15803d] text-sm font-medium rounded-xl border border-[#bbf7d0]">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button 
          type="submit" 
          disabled={loading}
          className="w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-[#1F6B45] hover:bg-[#2E8B57] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5BAE65] transition-all"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Link"}
        </button>
      </form>

      <p className="text-center text-sm font-medium text-slate-500">
        Remember your password? <Link to="/login" className="font-bold text-[#1F6B45] hover:text-[#2E8B57] transition-colors">Back to login</Link>
      </p>
    </AuthLayout>
  );
};

export const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await apiResetPassword(token, password);
      setMessage('Password has been successfully reset.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password. The token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8F2] p-4 font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-card p-10 border border-slate-200 text-center">
          <h2 className="text-2xl font-bold text-[#12372A] mb-3">Invalid Link</h2>
          <p className="text-slate-500 font-medium mb-8">The password reset link is missing or invalid.</p>
          <Link to="/login" className="px-6 py-3 bg-[#1F6B45] text-white font-bold rounded-xl hover:bg-[#2E8B57] transition-all">Return to login</Link>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout title="Create new password" subtitle="Secure your account with a strong password.">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-200">
          {error}
        </div>
      )}
      
      {message && (
        <div className="p-6 bg-[#f0fdf4] text-[#15803d] text-center rounded-xl border border-[#bbf7d0]">
          <p className="font-bold mb-4">{message}</p>
          <Link to="/login" className="inline-block px-6 py-3 bg-[#1F6B45] text-white font-bold rounded-xl hover:bg-[#2E8B57] transition-all">
            Return to Login
          </Link>
        </div>
      )}

      {!message && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-[#1F6B45] hover:bg-[#2E8B57] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5BAE65] transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save New Password"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
};
