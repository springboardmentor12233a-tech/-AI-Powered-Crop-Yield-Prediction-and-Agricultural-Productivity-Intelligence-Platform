import { useEffect, useState } from 'react';
import { Shield, Users, Database, Sprout, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { useAuth } from '../context/AuthContext';
import { getAllUsers } from '../services/api';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getAllUsers();
        setUsersList(data);
      } catch (err) {
        console.error("Failed to load users:", err);
        setError("Failed to load user management data.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500 text-right">
                        {new Date(u.created_at).toLocaleDateString()}
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
    </div>
  );
}
