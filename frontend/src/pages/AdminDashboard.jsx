import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  Landmark,
  Trees,
  BrainCircuit,
  Activity,
  TrendingUp,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Database,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Error loading admin statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const modelMeta = stats?.model_info || {};
  const perfMetrics = modelMeta?.performance_metrics || {};

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Admin Command Center Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-1">
              <ShieldCheck size={16} />
              <span>YieldSense AI • Administrator Command Center</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Welcome, Administrator {user?.name || 'Admin'} 🛡️</h2>
            <p className="text-slate-300 text-sm mt-1">
              Global system oversight, user management, machine learning telemetry, and farm distribution metrics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/users"
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl text-xs font-semibold shadow-sm transition-all"
            >
              <Users size={15} />
              <span>Manage Users</span>
            </Link>
            <Link
              to="/analytics"
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-semibold backdrop-blur-sm transition-all"
            >
              <TrendingUp size={15} />
              <span>System Analytics</span>
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <RefreshCw className="animate-spin text-brand-500" size={32} />
        </div>
      ) : (
        <>
          {/* Main KPI Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Total Registered Users */}
            <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Platform Users</span>
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Users size={18} />
                </div>
              </div>
              <div className="my-3">
                <span className="text-3xl font-extrabold text-slate-800">{stats?.total_users || 0}</span>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span className="font-semibold text-brand-700">{stats?.total_farmers || 0} Farmers</span>
                  <span>•</span>
                  <span className="font-semibold text-slate-700">{stats?.total_administrators || 0} Admins</span>
                </div>
              </div>
              <Link to="/admin/users" className="text-xs text-brand-600 hover:underline font-semibold flex items-center gap-1">
                <span>View user directory</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {/* 2. Total Farms */}
            <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Farms Registered</span>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Landmark size={18} />
                </div>
              </div>
              <div className="my-3">
                <span className="text-3xl font-extrabold text-slate-800">{stats?.total_farms || 0}</span>
                <span className="text-xs text-slate-400 font-medium block mt-0.5">Across Indian agricultural zones</span>
              </div>
              <Link to="/farms" className="text-xs text-brand-600 hover:underline font-semibold flex items-center gap-1">
                <span>Inspect all farms</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {/* 3. Total Crops Logged */}
            <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Crop Records</span>
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <Trees size={18} />
                </div>
              </div>
              <div className="my-3">
                <span className="text-3xl font-extrabold text-slate-800">{stats?.total_crops || 0}</span>
                <span className="text-xs text-slate-400 font-medium block mt-0.5">Kharif & Rabi crop cycles</span>
              </div>
              <Link to="/crops" className="text-xs text-brand-600 hover:underline font-semibold flex items-center gap-1">
                <span>Inspect all crops</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {/* 4. Total Predictions Run */}
            <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">ML Yield Forecasts</span>
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                  <BrainCircuit size={18} />
                </div>
              </div>
              <div className="my-3">
                <span className="text-3xl font-extrabold text-slate-800">{stats?.total_predictions || 0}</span>
                <span className="text-xs text-slate-400 font-medium block mt-0.5">
                  Avg: {(stats?.avg_system_predicted_yield_kg || 0).toLocaleString()} kg/ac
                </span>
              </div>
              <Link to="/predict" className="text-xs text-brand-600 hover:underline font-semibold flex items-center gap-1">
                <span>Simulate new forecast</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Secondary Grid: ML Model Telemetry & System Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ML Model Telemetry Card (1 Column) */}
            <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BrainCircuit size={18} className="text-brand-600" />
                  <h3 className="text-base font-bold text-slate-800">Production ML Model</h3>
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                  Active v2.0.0
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Algorithm:</span>
                  <span className="font-bold text-slate-800">{modelMeta?.algorithm || 'LinearRegression'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Dataset Training Size:</span>
                  <span className="font-semibold text-slate-800">1,200 Train / 300 Test</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Features Vector:</span>
                  <span className="font-semibold text-slate-800">11 Raw (43 Encoded)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Test MAE:</span>
                  <span className="font-mono font-bold text-slate-800">{perfMetrics?.Test_MAE || '4,273.23'} kg/ac</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Test RMSE:</span>
                  <span className="font-mono font-bold text-slate-800">{perfMetrics?.Test_RMSE || '11,381.99'} kg/ac</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Test R² Score:</span>
                  <span className="font-mono font-bold text-slate-800">{perfMetrics?.Test_R2 || '0.0029'}</span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-400 leading-relaxed">
                Trained with Scikit-Learn 5-Fold Cross Validation pipeline. Serialized in <code className="text-slate-700">models/crop_yield_model.pkl</code>.
              </div>
            </div>

            {/* System Activity Stream (2 Columns) */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#e3ecd9] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-brand-600" />
                  <h3 className="text-base font-bold text-slate-800">Real-Time System Activity Stream</h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">Live event feed</span>
              </div>

              {(!stats?.recent_activity || stats.recent_activity.length === 0) ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No system activity recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.recent_activity.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                            item.type === 'prediction'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {item.type === 'prediction' ? '🌾' : '👤'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{item.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Regional Farm Distribution */}
          <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-brand-600" />
                <h3 className="text-base font-bold text-slate-800">State-Wise Farm Distribution</h3>
              </div>
              <span className="text-xs text-slate-400">{stats?.state_distribution?.length || 0} active locations</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
              {(stats?.state_distribution || []).map((st, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-xs font-semibold text-slate-600 block truncate">{st.state}</span>
                  <span className="text-lg font-bold text-brand-800 mt-0.5 block">{st.count}</span>
                  <span className="text-[10px] text-slate-400">farms</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
