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
  CheckCircle2
} from 'lucide-react';
import api from '../api';

export default function Dashboard() {
  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const userName = localStorage.getItem('name') || 'Farmer';
  const userRole = localStorage.getItem('role') || 'Farmer';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [farmsRes, cropsRes, predRes, modelRes] = await Promise.all([
          api.get('/farms').catch(() => ({ data: [] })),
          api.get('/crops').catch(() => ({ data: [] })),
          api.get('/predictions').catch(() => ({ data: [] })),
          api.get('/ml/model-info').catch(() => ({ data: null }))
        ]);

        setFarms(farmsRes.data || []);
        setCrops(cropsRes.data || []);
        setPredictions(predRes.data || []);
        setModelInfo(modelRes.data);
      } catch (err) {
        console.error('Error loading dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const latestPrediction = predictions.length > 0 ? predictions[0] : null;

  const getFarmName = (farmId) => {
    if (!farmId) return null;
    const farm = farms.find((f) => f.id === farmId);
    return farm ? farm.farm_name : `Farm #${farmId}`;
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header welcome banner */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#e3ecd9] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-36 h-36 bg-brand-50 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 text-brand-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <Sparkles size={16} />
            <span>YieldSense AI Dashboard</span>
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
              <div>
                {latestPrediction ? (
                  <>
                    <div className="text-2xl font-extrabold text-slate-800 tracking-tight">
                      {latestPrediction.predicted_yield_kg.toLocaleString()}{' '}
                      <span className="text-xs font-bold text-brand-600">kg/ac</span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium block mt-1 truncate">
                      {latestPrediction.crop} ({latestPrediction.state})
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-lg font-bold text-slate-400 block">No Forecasts Yet</span>
                    <Link to="/predict" className="text-xs text-brand-600 font-semibold hover:underline">
                      Run first prediction →
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* 2. Total Farms */}
            <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] hover:border-brand-300 transition-all duration-300 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                  Registered Farms
                </span>
                <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
                  <Landmark size={20} />
                </div>
              </div>
              <div>
                <span className="text-2xl font-extrabold text-slate-800">{farms.length}</span>
                <span className="text-xs text-slate-500 font-medium block mt-1">
                  Active field layouts
                </span>
              </div>
            </div>

            {/* 3. Active Crops */}
            <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] hover:border-brand-300 transition-all duration-300 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                  Crop Logs
                </span>
                <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
                  <Trees size={20} />
                </div>
              </div>
              <div>
                <span className="text-2xl font-extrabold text-slate-800">{crops.length}</span>
                <span className="text-xs text-slate-500 font-medium block mt-1">
                  Recorded plantings &amp; yields
                </span>
              </div>
            </div>

            {/* 4. ML Model Status */}
            <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] hover:border-brand-300 transition-all duration-300 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                  Active ML Engine
                </span>
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <BrainCircuit size={20} />
                </div>
              </div>
              <div>
                <span className="text-sm font-bold text-slate-800 block truncate">
                  {modelInfo?.best_model_name || 'LinearRegression'}
                </span>
                <span className="text-xs text-blue-600 font-semibold block mt-1">
                  v{modelInfo?.model_version || '2.0.0'} • Model Live
                </span>
              </div>
            </div>
          </div>

          {/* Latest Prediction Spotlight & Forecast Launch Hero */}
          {latestPrediction ? (
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#e3ecd9] shadow-sm relative overflow-hidden space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[#f0f5eb]">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
                    <Sprout size={24} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                      Latest Field Forecast Spotlight
                    </span>
                    <h3 className="text-xl font-bold text-slate-800">
                      {latestPrediction.crop} • {latestPrediction.state}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(latestPrediction.created_at).toLocaleDateString()}
                  </span>
                  <Link
                    to="/predict"
                    className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 transition-all"
                  >
                    <Sparkles size={14} />
                    <span>New Forecast</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Spotlight Metric Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#f7faf4] p-5 rounded-2xl border border-[#e3ecd9] text-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Predicted Crop Yield
                  </span>
                  <div className="text-3xl font-extrabold text-slate-800">
                    {latestPrediction.predicted_yield_kg.toLocaleString()}{' '}
                    <span className="text-sm font-bold text-brand-600">kg/acre</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 mt-1 block">
                    ≈ {latestPrediction.predicted_yield_tons} metric tons/acre
                  </span>
                </div>

                <div className="bg-[#f7faf4] p-5 rounded-2xl border border-[#e3ecd9] flex flex-col justify-center space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Productivity Category:</span>
                    <span
                      className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                        latestPrediction.productivity_category?.includes('High')
                          ? 'bg-emerald-100 text-emerald-800'
                          : latestPrediction.productivity_category?.includes('Optimal')
                          ? 'bg-brand-100 text-brand-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {latestPrediction.productivity_category || 'Optimal Yield'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Soil &amp; pH:</span>
                    <span className="font-semibold text-slate-700">
                      {latestPrediction.soil_type} (pH {latestPrediction.soil_ph})
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Nutrient Profile:</span>
                    <span className="font-semibold text-slate-700">
                      N:{latestPrediction.n} P:{latestPrediction.p} K:{latestPrediction.k}
                    </span>
                  </div>
                </div>

                <div className="bg-[#f7faf4] p-5 rounded-2xl border border-[#e3ecd9] flex flex-col justify-center space-y-1 text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Info size={14} className="text-brand-600" />
                    Agronomic Advisory:
                  </span>
                  <p className="text-slate-600 line-clamp-3 leading-relaxed">
                    {latestPrediction.recommendation_summary || 'Nutrient and weather parameters in optimal range.'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-3xl border border-[#e3ecd9] flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-brand-50 text-brand-600 rounded-2xl">
                  <BrainCircuit size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-slate-800">Predictive Yield Forecasts</h3>
                    <span className="px-2 py-0.5 bg-brand-100 text-brand-700 text-[10px] font-bold rounded-full">
                      Model Live
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm mt-0.5">
                    Forecast your localized crop productivity using machine learning and soil analytics.
                  </p>
                </div>
              </div>
              <Link
                to="/predict"
                className="flex items-center gap-2 px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-2xl shadow-md shadow-brand-600/20 transition-all whitespace-nowrap"
              >
                <Sparkles size={16} />
                <span>Forecast Yield</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          )}

          {/* Recent Prediction History Section */}
          <div className="bg-white rounded-3xl border border-[#e3ecd9] p-6 md:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Recent Prediction History</h3>
                  <p className="text-xs text-slate-500">
                    Latest yield calculations saved to your farm account.
                  </p>
                </div>
              </div>
              <Link
                to="/predict"
                className="text-xs text-brand-600 font-bold hover:underline flex items-center gap-1"
              >
                <span>View Full Calculator</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {predictions.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-[#e3ecd9] rounded-2xl">
                No predictions recorded yet. Launch your first prediction using the ML Yield Predictor.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-[#e3ecd9] text-slate-500 font-bold uppercase tracking-wider">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Crop</th>
                      <th className="px-4 py-3">State</th>
                      <th className="px-4 py-3">Associated Farm</th>
                      <th className="px-4 py-3">Soil / pH</th>
                      <th className="px-4 py-3">NPK</th>
                      <th className="px-4 py-3">Predicted Yield</th>
                      <th className="px-4 py-3">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f4f8f2] text-slate-700">
                    {predictions.slice(0, 5).map((item) => (
                      <tr key={item.id} className="hover:bg-brand-50/20 transition-all">
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{item.crop}</td>
                        <td className="px-4 py-3">{item.state}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {getFarmName(item.farm_id) || '—'}
                        </td>
                        <td className="px-4 py-3">
                          {item.soil_type} (pH {item.soil_ph})
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px]">
                          {item.n}-{item.p}-{item.k}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">
                          {item.predicted_yield_kg.toLocaleString()} kg/ac
                          <span className="text-slate-400 font-normal block text-[10px]">
                            ({item.predicted_yield_tons} t/ac)
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-semibold px-2 py-0.5 rounded-full text-[10px] inline-block ${
                              item.productivity_category?.includes('High')
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.productivity_category?.includes('Optimal')
                                ? 'bg-brand-100 text-brand-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.productivity_category || 'Optimal Yield'}
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
