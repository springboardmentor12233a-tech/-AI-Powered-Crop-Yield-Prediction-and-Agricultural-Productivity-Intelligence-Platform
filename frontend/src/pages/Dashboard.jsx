import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Landmark,
  Trees,
  ShieldCheck,
  Database,
  Sliders,
  BrainCircuit,
  RefreshCw,
  Info,
  ArrowRight,
  Sparkles,
  History,
  TrendingUp,
  Calendar,
  Sprout,
  CheckCircle2,
  AlertTriangle,
  Bot,
  FlaskConical,
  Droplets
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import { RiskScoreGauge, NutrientRadarMeter } from '../components/Charts';

export default function Dashboard() {
  const { user, role } = useAuth();

  // If active user is Administrator, display dedicated Admin Dashboard
  if (role === 'Administrator') {
    return <AdminDashboard />;
  }

  // Otherwise, render rich Farmer Dashboard
  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [modelInfo, setModelInfo] = useState(null);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  const userName = user?.name || 'Farmer';
  const userRole = role || 'Farmer';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [farmsRes, cropsRes, predRes, modelRes] = await Promise.all([
        api.get('/farms').catch(() => ({ data: [] })),
        api.get('/crops').catch(() => ({ data: [] })),
        api.get('/predictions').catch(() => ({ data: [] })),
        api.get('/ml/model-info').catch(() => ({ data: null })),
      ]);

      const farmList = farmsRes.data || [];
      const cropList = cropsRes.data || [];
      const predList = predRes.data || [];

      setFarms(farmList);
      setCrops(cropList);
      setPredictions(predList);
      setModelInfo(modelRes.data);

      // Evaluate latest prediction risks if available
      if (predList.length > 0) {
        const latest = predList[0];
        try {
          const riskRes = await api.post('/insights/analyze', {
            Crop: latest.crop,
            Soil_Type: latest.soil_type,
            Fertilizer: latest.fertilizer,
            N: latest.n,
            P: latest.p,
            K: latest.k,
            Rainfall_mm: latest.rainfall_mm,
            Temperature_C: latest.temperature_c,
            Soil_pH: latest.soil_ph,
          });
          setRiskAssessment(riskRes.data);
        } catch {
          // Silent fallback
        }
      }
    } catch (err) {
      console.error('Error loading dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const latestPrediction = predictions.length > 0 ? predictions[0] : null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header welcome banner */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#e3ecd9] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-36 h-36 bg-brand-50 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 text-brand-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <Sparkles size={16} />
            <span>YieldSense AI Farmer Portal</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Welcome back, {userName}! 👋</h2>
          <p className="text-slate-500 text-sm mt-1">
            Here is your live crop forecast, field records, and agricultural intelligence summary.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-brand-100/60 text-brand-800 rounded-2xl text-xs font-semibold shadow-sm">
          <ShieldCheck size={16} className="text-brand-600" />
          <span>Verified {userRole} Access</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="animate-spin text-brand-500" size={32} />
        </div>
      ) : (
        <>
          {/* Main Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Latest Yield Metric Card */}
            <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] hover:border-brand-300 transition-all duration-300 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                  Latest Forecast
                </span>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <TrendingUp size={20} />
                </div>
              </div>

              {latestPrediction ? (
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold text-slate-800">
                      {latestPrediction.predicted_yield_kg.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">kg / acre</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <span className="font-semibold text-brand-700">{latestPrediction.crop}</span>
                    <span>•</span>
                    <span>{latestPrediction.predicted_yield_tons.toFixed(2)} tons/ac</span>
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  <span className="text-sm text-slate-400 font-medium">No forecast yet</span>
                  <p className="text-xs text-slate-400 mt-0.5">Run your first prediction below</p>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {latestPrediction ? `${latestPrediction.state}` : 'AI Ready'}
                </span>
                <Link to="/predict" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                  <span>Predict</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            {/* 2. Registered Farms Card */}
            <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] hover:border-brand-300 transition-all duration-300 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                  My Farms
                </span>
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Landmark size={20} />
                </div>
              </div>
              <div>
                <span className="text-3xl font-extrabold text-slate-800">{farms.length}</span>
                <p className="text-xs text-slate-400 mt-1">
                  Total Area: <strong className="text-slate-600">{farms.reduce((acc, f) => acc + (f.area || 0), 0).toFixed(1)} acres</strong>
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Managed plots</span>
                <Link to="/farms" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                  <span>Manage</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            {/* 3. Crop Varieties Card */}
            <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] hover:border-brand-300 transition-all duration-300 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                  Active Crops
                </span>
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <Trees size={20} />
                </div>
              </div>
              <div>
                <span className="text-3xl font-extrabold text-slate-800">{crops.length}</span>
                <p className="text-xs text-slate-400 mt-1">
                  Logged in Farm Management
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Current seasons</span>
                <Link to="/crops" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                  <span>View Crops</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            {/* 4. Total Predictions Logged Card */}
            <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] hover:border-brand-300 transition-all duration-300 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                  Total Predictions
                </span>
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                  <BrainCircuit size={20} />
                </div>
              </div>
              <div>
                <span className="text-3xl font-extrabold text-slate-800">{predictions.length}</span>
                <p className="text-xs text-slate-400 mt-1">
                  Forecast history records
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">LinearRegression v2.0.0</span>
                <Link to="/analytics" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                  <span>Analytics</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions & AI Assistant Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Prediction Banner (2 Cols) */}
            <div className="lg:col-span-2 bg-gradient-to-r from-brand-700 via-emerald-800 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-md flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles size={16} />
                  <span>AI Crop Yield Forecaster</span>
                </div>
                <h3 className="text-2xl font-bold">Predict Next Season's Harvest</h3>
                <p className="text-sm text-emerald-100/90 max-w-xl leading-relaxed">
                  Enter your farm's soil pH, N-P-K nutrients, and anticipated weather to estimate harvest yield with our trained ML regression pipeline.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/predict"
                  className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-emerald-50 text-brand-850 rounded-2xl font-bold text-sm shadow-md transition-all"
                >
                  <BrainCircuit size={18} />
                  <span>Launch Prediction Tool</span>
                </Link>
                <Link
                  to="/analytics"
                  className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-semibold text-sm backdrop-blur-sm transition-all"
                >
                  <TrendingUp size={16} />
                  <span>View Agricultural Analytics</span>
                </Link>
              </div>
            </div>

            {/* AI Assistant Quick Launcher (1 Col) */}
            <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-brand-600 text-xs font-bold uppercase tracking-wider">
                  <Bot size={16} />
                  <span>AgriSense AI Assistant</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800">Ask Farming & Soil Questions</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Get instant agronomic guidance on fertilizer dosing, soil acidity remediation, and weather risk management.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Link
                  to="/chatbot"
                  className="flex items-center justify-between w-full p-3 bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-300 rounded-2xl text-xs font-semibold text-slate-700 hover:text-brand-800 transition-all"
                >
                  <span>🌾 Best fertilizer for Soybean?</span>
                  <ArrowRight size={14} />
                </Link>
                <Link
                  to="/chatbot"
                  className="flex items-center justify-between w-full p-3 bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-300 rounded-2xl text-xs font-semibold text-slate-700 hover:text-brand-800 transition-all"
                >
                  <span>🧪 How to correct acidic soil?</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Prediction History Table */}
          <div className="bg-white rounded-3xl border border-[#e3ecd9] shadow-sm overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Recent Yield Predictions</h3>
                <p className="text-xs text-slate-500 mt-0.5">Your most recent crop harvest forecasts.</p>
              </div>
              <Link to="/analytics" className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1">
                <span>View all in Analytics</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {predictions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No predictions recorded yet. Run your first prediction using the tool above!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="py-3.5 px-4">Crop & Location</th>
                      <th className="py-3.5 px-4">Soil & Fertilizer</th>
                      <th className="py-3.5 px-4">N-P-K (kg/ha)</th>
                      <th className="py-3.5 px-4">Rainfall & Temp</th>
                      <th className="py-3.5 px-4">Soil pH</th>
                      <th className="py-3.5 px-4">Predicted Yield</th>
                      <th className="py-3.5 px-4">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {predictions.slice(0, 5).map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800 block">{p.crop}</span>
                          <span className="text-slate-400 text-[11px]">{p.state} ({p.year})</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-slate-700 block">{p.soil_type}</span>
                          <span className="text-slate-400 text-[11px]">{p.fertilizer}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          {p.n} - {p.p} - {p.k}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {p.rainfall_mm}mm / {p.temperature_c}°C
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{p.soil_ph.toFixed(2)}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800 block">{p.predicted_yield_kg.toLocaleString()} kg/ac</span>
                          <span className="text-slate-400 text-[11px]">{p.predicted_yield_tons.toFixed(2)} tons/ac</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              p.productivity_category === 'High Yield'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : p.productivity_category === 'Moderate Yield'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {p.productivity_category || 'Standard'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
