import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { updateCurrentUser } from '../services/api';
import { User, Server, LogOut, CheckCircle, AlertCircle, Loader2, Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  const { user, setUser, logout } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const updatedUser = await updateCurrentUser({ name });
      setUser(updatedUser);
      setSuccessMsg('Profile updated successfully.');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-[#12372A] to-[#1F6B45] p-8 md:p-10 rounded-[2rem] shadow-card border border-[#2E8B57]/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#A8C957]/10 rounded-full blur-[80px] -mt-20 -mr-20 pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold text-[#FCFCF8] tracking-tight">Account Settings</h2>
          <p className="text-[#c6dfcd] mt-2 font-medium">Manage your profile, preferences, and account security.</p>
        </div>
        <div className="relative z-10 flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
          <SettingsIcon className="w-8 h-8 text-[#A8C957]" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PROFILE SETTINGS */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden h-full">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center bg-slate-50/50">
              <div className="p-2 bg-[#e8f0ea] rounded-xl mr-3">
                <User className="w-5 h-5 text-[#1F6B45]" />
              </div>
              <h3 className="text-xl font-bold text-[#12372A]">Profile Information</h3>
            </div>
            <div className="p-8">
              <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-md">
                {successMsg && (
                  <div className="flex items-center p-4 text-sm font-bold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-100">
                    <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                    {successMsg}
                  </div>
                )}
                {errorMsg && (
                  <div className="flex items-center p-4 text-sm font-bold text-red-700 bg-red-50 rounded-xl border border-red-100">
                    <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5BAE65] outline-none font-bold text-slate-800 bg-slate-50 focus:bg-white transition-all shadow-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                  <input 
                    type="email" 
                    value={user.email}
                    disabled
                    className="w-full px-5 py-3 bg-slate-100 text-slate-400 font-bold border border-slate-200 rounded-xl cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-400 mt-1 font-medium">Email cannot be changed.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Account Role</label>
                  <div>
                    <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider bg-[#e8f0ea] text-[#1F6B45] border border-[#c6dfcd]">
                      {user.role?.role_name || user.role} Access
                    </span>
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[#1F6B45] hover:bg-[#2E8B57] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5BAE65] transition-all w-full sm:w-auto"
                  >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <User className="w-4 h-4 mr-2" />}
                    {loading ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="space-y-6 flex flex-col">
          {/* APPLICATION SETTINGS */}
          <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden flex-1">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center bg-slate-50/50">
              <div className="p-2 bg-blue-50 rounded-xl mr-3">
                <Server className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-[#12372A]">System Status</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-50">
                <span className="text-sm font-bold text-slate-500">Platform Version</span>
                <span className="text-sm font-black text-slate-800">YieldSense 3.0</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-50">
                <span className="text-sm font-bold text-slate-500">Backend API</span>
                <span className="text-sm font-black text-emerald-600 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span> Connected
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm font-bold text-slate-500">Data Sync</span>
                <span className="text-sm font-black text-[#1F6B45]">Real-time Live</span>
              </div>
            </div>
          </div>

          {/* ACCOUNT MANAGEMENT */}
          <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden border-t-4 border-t-red-500">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center">
              <div className="p-2 bg-red-50 rounded-xl mr-3">
                <LogOut className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Security</h3>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-sm font-medium text-slate-500 leading-relaxed">
                Securely log out of your YieldSense AI account. This will clear your active session on this device immediately.
              </p>
              <button 
                onClick={logout} 
                className="w-full flex items-center justify-center px-6 py-3 bg-red-50 text-red-600 font-bold rounded-xl border border-red-200 hover:bg-red-100 hover:text-red-700 transition-all shadow-sm"
              >
                Sign Out from Device
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
