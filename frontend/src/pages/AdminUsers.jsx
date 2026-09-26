import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  ArrowLeft,
  Mail,
  Calendar,
  Landmark,
  Trees,
  BrainCircuit,
  UserCheck
} from 'lucide-react';
import api from '../api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data || []);
    } catch (err) {
      console.error('Error fetching admin user list:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#e3ecd9] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            to="/admin"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-all"
            title="Back to Admin Dashboard"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-brand-600 font-semibold text-xs uppercase tracking-wider mb-1">
              <ShieldCheck size={16} />
              <span>Platform Access Control</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">User Management Directory 👥</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Review and audit all registered farmers, agronomists, and system administrators.
            </p>
          </div>
        </div>

        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-semibold transition-all"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Users</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-[#e3ecd9] shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Role:</span>
          {['All', 'Farmer', 'Administrator'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                roleFilter === r
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-[#e3ecd9] shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <RefreshCw className="animate-spin text-brand-500" size={28} />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            No users matching your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-4 px-6">User ID</th>
                  <th className="py-4 px-6">Name & Email</th>
                  <th className="py-4 px-6">System Role</th>
                  <th className="py-4 px-6">Farms Owned</th>
                  <th className="py-4 px-6">Crops Logged</th>
                  <th className="py-4 px-6">Predictions</th>
                  <th className="py-4 px-6">Registered On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isAdmin = u.role === 'Administrator';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-400">
                        #{u.id}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800">{u.name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail size={12} />
                          <span>{u.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                            isAdmin
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          <ShieldCheck size={12} />
                          <span>{u.role}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-700">
                        {u.farms_count} farms
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-700">
                        {u.crops_count} crops
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-700">
                        {u.predictions_count} runs
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 font-mono">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
