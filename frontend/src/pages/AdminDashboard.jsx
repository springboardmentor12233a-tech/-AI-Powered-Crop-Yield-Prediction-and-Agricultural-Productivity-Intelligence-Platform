import { useEffect, useState } from 'react';
import { Shield, Users, Database, Sprout, Loader2, Edit, Trash2, X, Check, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { useAuth } from '../context/AuthContext';
import { getAllUsers, getAllRoles, updateAdminUser, deleteAdminUser } from '../services/api';
import { Button } from '../components/common/Button';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
        getAllRoles()
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
  
  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Admin Dashboard</h2>
          <p className="text-slate-500 mt-1">System overview and management console.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-indigo-500" />
          <span className="font-medium text-slate-700">{user?.name} (Admin)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-500">Total Users</p>
              <Users className="w-4 h-4 text-primary-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">{isLoading ? "-" : totalUsers}</h3>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-500">Farmers</p>
              <Sprout className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">{isLoading ? "-" : totalFarmers}</h3>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-500">Database Status</p>
              <Database className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">Healthy</h3>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-500">System State</p>
              <Shield className="w-4 h-4 text-indigo-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">Online</h3>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500 bg-red-50 rounded-lg">
              {error}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-4 text-sm font-semibold text-slate-600">ID</th>
                    <th className="py-3 px-4 text-sm font-semibold text-slate-600">Name</th>
                    <th className="py-3 px-4 text-sm font-semibold text-slate-600">Email</th>
                    <th className="py-3 px-4 text-sm font-semibold text-slate-600">Role</th>
                    <th className="py-3 px-4 text-sm font-semibold text-slate-600">Status</th>
                    <th className="py-3 px-4 text-sm font-semibold text-slate-600 text-right">Joined</th>
                    <th className="py-3 px-4 text-sm font-semibold text-slate-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-slate-500">#{u.id}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-800">{u.name}</td>
                      <td className="py-3 px-4 text-sm text-slate-500">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          u.role.role_name === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {u.role.role_name.charAt(0).toUpperCase() + u.role.role_name.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                            u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                          title={u.is_active ? "Click to deactivate" : "Click to activate"}
                        >
                          {u.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500 text-right">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2 flex justify-end">
                        <button 
                          onClick={() => handleEditClick(u)}
                          className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(u)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {usersList.length === 0 && (
                <div className="text-center py-8 text-slate-500">No users found.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Edit User</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>{editError}</p>
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Name</label>
                <input 
                  type="text" 
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" 
                  required 
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input 
                  type="email" 
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" 
                  required 
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Role</label>
                <select 
                  value={editForm.role_id}
                  onChange={(e) => setEditForm({...editForm, role_id: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                  required
                >
                  {rolesList.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.role_name.charAt(0).toUpperCase() + r.role_name.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="pt-2 flex justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <Button type="submit" disabled={editLoading} icon={editLoading ? Loader2 : Check}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
