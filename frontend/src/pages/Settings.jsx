import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { updateCurrentUser } from '../services/api';
import { User, Server, LogOut, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '../components/common/Badge';

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
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
        <p className="text-slate-500 mt-1">Manage your account and application preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* PROFILE SETTINGS */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center text-slate-800">
              <User className="w-5 h-5 mr-2 text-primary-500" />
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
              {successMsg && (
                <div className="flex items-center p-3 text-sm text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-100">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="flex items-center p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-100">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input 
                  type="email" 
                  value={user.email}
                  disabled
                  className="w-full px-3 py-2 bg-slate-50 text-slate-500 border border-slate-200 rounded-lg cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Role</label>
                <div>
                  <Badge variant="neutral" className="uppercase">{user.role?.role_name || user.role}</Badge>
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={loading} icon={loading ? Loader2 : User}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* APPLICATION SETTINGS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-slate-800">
              <Server className="w-5 h-5 mr-2 text-blue-500" />
              Application Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Version</span>
              <span className="text-sm font-medium text-slate-800">Milestone 3</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Backend API</span>
              <span className="text-sm font-medium text-emerald-600">Connected</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-600">Data Synchronization</span>
              <span className="text-sm font-medium text-slate-800">Real-time</span>
            </div>
          </CardContent>
        </Card>

        {/* ACCOUNT MANAGEMENT */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-slate-800">
              <LogOut className="w-5 h-5 mr-2 text-red-500" />
              Account Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500">
              Securely log out of your YieldSense AI account. This will clear your session on this device.
            </p>
            <Button onClick={logout} className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200">
              Logout
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
