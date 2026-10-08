import { useEffect, useState } from 'react';
import { Shield, Users, Database, Sprout, Loader2, Edit, Trash2, X, Check, AlertCircle, Search, Server, User as UserIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { useAuth } from '../context/AuthContext';
import { getAllUsers, getAllRoles, updateAdminUser, deleteAdminUser } from '../services/api';
import { Button } from '../components/common/Button';
import { cn } from '../utils/cn';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  
  // Edit state
  const [editingUser, setEditingUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', role_id: '', is_active: true });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  const fetchUsersAndRoles = async () => {
    setIsLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([
        getAllUsers(),
        rolesList.length === 0 ? getAllRoles() : Promise.resolve(rolesList)
      ]);
      setUsersList(usersData);
      setRolesList(rolesData);
    } catch (err) {
      console.error("Failed to load admin data:", err);
      setError("Failed to load user management data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  const handleEditClick = (u) => {
    setEditingUser(u);
    setEditForm({
      name: u.name,
      email: u.email,
      role_id: u.role.id,
      is_active: u.is_active
    });
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);
    try {
      await updateAdminUser(editingUser.id, editForm);
      setIsEditModalOpen(false);
      fetchUsersAndRoles();
    } catch (err) {
      setEditError(err.response?.data?.detail || "Failed to update user.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (u) => {
    if (u.id === user.id) {
      alert("You cannot delete your own admin account.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${u.name}? This action cannot be undone.`)) {
      try {
        await deleteAdminUser(u.id);
        fetchUsersAndRoles();
      } catch (err) {
        alert(err.response?.data?.detail || "Failed to delete user.");
      }
    }
  };

  const handleToggleActive = async (u) => {
    if (u.id === user.id) {
      alert("You cannot deactivate your own admin account.");
      return;
    }
    try {
      await updateAdminUser(u.id, { is_active: !u.is_active });
      fetchUsersAndRoles();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update user status.");
    }
  };

  const totalUsers = usersList.length;
  const totalFarmers = usersList.filter(u => u.role.role_name === 'user').length;
  
  const filteredUsers = usersList.filter(u => 
    u.name.toLowerCase().includes(searchUserQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchUserQuery.toLowerCase())
  );
  
  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-[#12372A] to-[#1F6B45] p-8 md:p-10 rounded-[2rem] shadow-card border border-[#2E8B57]/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#A8C957]/10 rounded-full blur-[80px] -mt-20 -mr-20 pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold text-[#FCFCF8] tracking-tight">Admin Console</h2>
          <p className="text-[#c6dfcd] mt-2 font-medium">System overview and user management.</p>
        </div>
        <div className="relative z-10 flex items-center space-x-3 bg-white px-4 py-2.5 rounded-xl border border-slate-100 shadow-sm">
          <div className="p-2 bg-[#e8f0ea] rounded-xl text-[#1F6B45]">
            {(user?.role?.role_name === 'admin' || user?.role === 'admin') ? (
              <Shield className="w-5 h-5" />
            ) : (
              <UserIcon className="w-5 h-5" />
            )}
          </div>
          <div className="flex flex-col">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Logged In As</p>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-extrabold text-slate-800 leading-none">{user?.name || 'User'}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-[#A8C957]/20 text-[#12372A] leading-none">
                {user?.role?.role_name || user?.role || 'Admin'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl border border-slate-200/60 shadow-sm bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-slate-500 font-bold text-xs mb-1 uppercase tracking-widest">Total Users</h3>
          <p className="text-3xl font-extrabold text-[#12372A]">{isLoading ? "-" : totalUsers}</p>
        </div>
        
        <div className="p-6 rounded-3xl border border-slate-200/60 shadow-sm bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <Sprout className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-slate-500 font-bold text-xs mb-1 uppercase tracking-widest">Active Farmers</h3>
          <p className="text-3xl font-extrabold text-[#12372A]">{isLoading ? "-" : totalFarmers}</p>
        </div>
        
        <div className="p-6 rounded-3xl border border-slate-200/60 shadow-sm bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-slate-500 font-bold text-xs mb-1 uppercase tracking-widest">Database State</h3>
          <p className="text-2xl font-extrabold text-emerald-500 flex items-center">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span> Healthy
          </p>
        </div>

        <div className="p-6 rounded-3xl border border-slate-200/60 shadow-sm bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <Server className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-slate-500 font-bold text-xs mb-1 uppercase tracking-widest">System Load</h3>
          <p className="text-2xl font-extrabold text-slate-800">Nominal</p>
        </div>
      </div>
      
      <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="text-xl font-bold text-[#12372A]">User Management</h3>
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchUserQuery}
              onChange={(e) => setSearchUserQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5BAE65] transition-all"
            />
          </div>
        </div>
        
        <div className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-[#5BAE65] animate-spin mb-4" />
              <p className="text-slate-500 font-medium">Loading user database...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <p className="text-red-600 font-bold">{error}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="py-4 px-8 text-xs font-bold text-slate-400 uppercase tracking-widest">ID</th>
                    <th className="py-4 px-8 text-xs font-bold text-slate-400 uppercase tracking-widest">Name</th>
                    <th className="py-4 px-8 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                    <th className="py-4 px-8 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="py-4 px-8 text-xs font-bold text-slate-400 uppercase tracking-widest">Joined</th>
                    <th className="py-4 px-8 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-4 px-8 text-sm font-semibold text-slate-400">#{u.id}</td>
                      <td className="py-4 px-8">
                        <p className="text-sm font-bold text-slate-800">{u.name}</p>
                        <p className="text-xs font-medium text-slate-500">{u.email}</p>
                      </td>
                      <td className="py-4 px-8">
                        <span className={cn(
                          "inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider",
                          u.role.role_name === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-[#e8f0ea] text-[#1F6B45] border border-[#c6dfcd]'
                        )}>
                          {u.role.role_name}
                        </span>
                      </td>
                      <td className="py-4 px-8">
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={cn(
                            "inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-all",
                            u.is_active ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                          )}
                          title={u.is_active ? "Click to deactivate" : "Click to activate"}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", u.is_active ? "bg-emerald-500" : "bg-slate-400")}></span>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-4 px-8 text-sm font-medium text-slate-500">
                        {new Date(u.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-4 px-8 text-right">
                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditClick(u)}
                            className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-[#1F6B45] hover:border-[#5BAE65] rounded-lg transition-colors shadow-sm"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(u)}
                            className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-300 rounded-lg transition-colors shadow-sm"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-16">
                  <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium text-lg">No users found.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden transform transition-all">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Edit User</h3>
                <p className="text-xs font-medium text-slate-500 mt-1">Modify account details and permissions.</p>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
              {editError && (
                <div className="p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p>{editError}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Name</label>
                <input 
                  type="text" 
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5BAE65] outline-none font-medium text-slate-800 bg-slate-50 focus:bg-white transition-all shadow-sm" 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5BAE65] outline-none font-medium text-slate-800 bg-slate-50 focus:bg-white transition-all shadow-sm" 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role</label>
                <div className="relative">
                  <select 
                    value={editForm.role_id}
                    onChange={(e) => setEditForm({...editForm, role_id: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5BAE65] outline-none font-bold text-slate-800 bg-slate-50 focus:bg-white transition-all shadow-sm appearance-none cursor-pointer"
                    required
                  >
                    {rolesList.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.role_name.charAt(0).toUpperCase() + r.role_name.slice(1)} Access
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-6 py-3 w-full sm:w-auto text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={editLoading}
                  className="px-6 py-3 w-full sm:w-auto text-sm font-bold text-white bg-[#1F6B45] hover:bg-[#2E8B57] rounded-xl transition-all shadow-md flex items-center justify-center"
                >
                  {editLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
