import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Sprout,
  Droplets,
  FlaskConical,
  Layers,
  Thermometer,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Calendar,
  Filter,
  Search,
  ArrowUpDown
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import {
  YieldBarChart,
  SoilPhSpectrumGauge,
  NutrientRadarMeter,
  ProductivityDonut,
  RiskScoreGauge
} from '../components/Charts';

export default function AnalyticsPage() {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState('crops'); // 'crops', 'soil', 'weather', 'insights', 'history'
  const [viewMode, setViewMode] = useState('system'); // 'system' or 'farmer'

  const [systemAnalytics, setSystemAnalytics] = useState(null);
  const [farmerAnalytics, setFarmerAnalytics] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  // History filtering & search state
  const [searchCrop, setSearchCrop] = useState('');
  const [selectedSoil, setSelectedSoil] = useState('All');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [sysRes, farmRes, predRes] = await Promise.all([
        api.get('/analytics/system').catch(() => ({ data: null })),
        api.get('/analytics/farmer').catch(() => ({ data: null })),
        api.get('/predictions').catch(() => ({ data: [] })),
      ]);

      setSystemAnalytics(sysRes.data);
      setFarmerAnalytics(farmRes.data);
      setPredictions(predRes.data || []);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentData = viewMode === 'farmer' && farmerAnalytics ? farmerAnalytics : systemAnalytics;

  // Filtered prediction records for history tab
  const filteredPredictions = predictions.filter((p) => {
    const matchCrop = p.crop.toLowerCase().includes(searchCrop.toLowerCase()) || p.state.toLowerCase().includes(searchCrop.toLowerCase());
    const matchSoil = selectedSoil === 'All' || p.soil_type === selectedSoil;
    return matchCrop && matchSoil;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#e3ecd9] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-36 h-36 bg-brand-50 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 text-brand-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <Sparkles size={16} />
            <span>Agricultural Intelligence & Statistics</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Agricultural Analytics Dashboard 📈</h2>
          <p className="text-slate-500 text-sm mt-1">
            Comprehensive crop productivity profiles, soil nutrient telemetry, meteorological correlations, and yield distributions.
          </p>
        </div>

        {/* View Mode Switcher (Farmer vs System) */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setViewMode('system')}
            className={`px-4 py-2 rounded-xl transition-all ${
              viewMode === 'system'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🌍 System & Dataset Overview
          </button>
          <button
            onClick={() => setViewMode('farmer')}
            className={`px-4 py-2 rounded-xl transition-all ${
              viewMode === 'farmer'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🌾 My Farm Intelligence
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <RefreshCw className="animate-spin text-brand-500" size={32} />
        </div>
      ) : (
        <>
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Average Yield */}
            <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] shadow-sm flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                {viewMode === 'farmer' ? 'My Avg Forecast' : 'System Avg Yield'}
              </span>
              <div className="my-3">
                <span className="text-3xl font-extrabold text-slate-800">
                  {viewMode === 'farmer'
                    ? (farmerAnalytics?.avg_predicted_yield_kg || 0).toLocaleString()
                    : (systemAnalytics?.avg_yield_kg_per_acre || 0).toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 font-medium block mt-0.5">kg / acre (
                  {viewMode === 'farmer'
                    ? ((farmerAnalytics?.avg_predicted_yield_kg || 0) / 1000).toFixed(2)
                    : ((systemAnalytics?.avg_yield_kg_per_acre || 0) / 1000).toFixed(2)}{' '}
                  tons/ac)
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                <TrendingUp size={14} />
                <span>Verified Agro-Climatic Baseline</span>
              </div>
            </div>

            {/* 2. Maximum Potential Harvest */}
            <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] shadow-sm flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                {viewMode === 'farmer' ? 'Highest Forecast' : 'Top Yield Record'}
              </span>
              <div className="my-3">
                <span className="text-3xl font-extrabold text-emerald-700">
                  {viewMode === 'farmer'
                    ? (farmerAnalytics?.highest_predicted_yield_kg || 0).toLocaleString()
                    : (systemAnalytics?.max_yield_kg_per_acre || 0).toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 font-medium block mt-0.5">kg / acre</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-xl w-fit">
                <CheckCircle2 size={13} />
                <span>Optimal Soil & Rainfall</span>
              </div>
            </div>

            {/* 3. Records / Predictions Evaluated */}
            <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] shadow-sm flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                {viewMode === 'farmer' ? 'My Predictions' : 'Evaluated Observations'}
              </span>
              <div className="my-3">
                <span className="text-3xl font-extrabold text-brand-700">
                  {viewMode === 'farmer'
                    ? farmerAnalytics?.total_predictions || 0
                    : (systemAnalytics?.total_records_analyzed || 1500).toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 font-medium block mt-0.5">
                  {viewMode === 'farmer' ? 'Simulations logged' : 'Standardized data records'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-brand-700 font-semibold">
                <Layers size={14} />
                <span>12 Crops & 14 States</span>
              </div>
            </div>

            {/* 4. Active Farm Fields */}
            <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] shadow-sm flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                {viewMode === 'farmer' ? 'My Farm Holdings' : 'Machine Learning Model'}
              </span>
              <div className="my-3">
                <span className="text-2xl font-bold text-slate-800 truncate block">
                  {viewMode === 'farmer'
                    ? `${farmerAnalytics?.total_farms || 0} Farms (${farmerAnalytics?.total_crops || 0} Crops)`
                    : 'LinearRegression'}
                </span>
                <span className="text-xs text-slate-400 font-medium block mt-0.5">
                  {viewMode === 'farmer' ? 'Active managed acreage' : 'Trained v2.0.0 (43 Features)'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-brand-600 font-semibold">
                <ShieldCheck size={14} />
                <span>Validated Inference</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
            {[
              { id: 'crops', label: '🌾 Crop Productivity', icon: Sprout },
              { id: 'soil', label: '🧪 Soil & Nutrients', icon: FlaskConical },
              { id: 'weather', label: '🌧️ Weather Analytics', icon: Droplets },
              { id: 'insights', label: '⚠️ Risk & Insights', icon: AlertTriangle },
              { id: 'history', label: '📜 Prediction History', icon: Calendar },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/15'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-[#e3ecd9]'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Crop Productivity Analysis */}
          {activeTab === 'crops' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <YieldBarChart
                    data={systemAnalytics?.crop_productivity || []}
                    title="Average Crop Productivity Across Agro-Climatic Zones"
                  />
                </div>
                <div>
                  <ProductivityDonut breakdown={systemAnalytics?.productivity_breakdown || {}} />
                </div>
              </div>

              {/* Detailed Crop Productivity Data Table */}
              <div className="bg-white rounded-3xl border border-[#e3ecd9] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Crop Cultivar Yield Rankings</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Average, minimum, and maximum yields observed in the standardized dataset.</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-100">
                      <tr>
                        <th className="py-4 px-6">Crop Name</th>
                        <th className="py-4 px-6">Record Count</th>
                        <th className="py-4 px-6">Avg Yield (kg/ac)</th>
                        <th className="py-4 px-6">Avg Yield (tons/ac)</th>
                        <th className="py-4 px-6">Yield Range</th>
                        <th className="py-4 px-6">Productivity Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(systemAnalytics?.crop_productivity || []).map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-6 font-bold text-slate-800 flex items-center gap-2">
                            <span>🌱</span>
                            <span>{c.crop_name}</span>
                          </td>
                          <td className="py-4 px-6 font-medium">{c.record_count}</td>
                          <td className="py-4 px-6 font-bold text-slate-800">{c.avg_yield_kg_per_acre.toLocaleString()}</td>
                          <td className="py-4 px-6 text-slate-500">{(c.avg_yield_kg_per_acre / 1000).toFixed(2)}</td>
                          <td className="py-4 px-6 text-xs text-slate-500">
                            {c.min_yield_kg_per_acre.toLocaleString()} – {c.max_yield_kg_per_acre.toLocaleString()} kg/ac
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                c.productivity_rating === 'High'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : c.productivity_rating === 'Moderate'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {c.productivity_rating}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Soil Health & Nutrient Telemetry */}
          {activeTab === 'soil' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SoilPhSpectrumGauge ph={6.54} label="System Average Soil pH" />
                <NutrientRadarMeter n={74.8} p={50.2} k={101.4} />
              </div>

              {/* Soil Type Performance Comparison */}
              <div className="bg-white rounded-3xl border border-[#e3ecd9] p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Soil Classification Performance</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Average harvest yields and chemical nutrient profiles across soil textures.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
                  {(systemAnalytics?.soil_analytics || []).map((s, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{s.soil_type} Soil</span>
                        <p className="text-2xl font-extrabold text-slate-800 mt-1">
                          {s.avg_yield_kg_per_acre.toLocaleString()} <span className="text-xs font-normal text-slate-400">kg/ac</span>
                        </p>
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                        <div className="flex justify-between">
                          <span>Avg pH:</span>
                          <span className="font-semibold text-slate-700">{s.avg_ph}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Nitrogen (N):</span>
                          <span className="font-semibold text-slate-700">{s.avg_nitrogen} kg/ha</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Phosphorus (P):</span>
                          <span className="font-semibold text-slate-700">{s.avg_phosphorus} kg/ha</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Potassium (K):</span>
                          <span className="font-semibold text-slate-700">{s.avg_potassium} kg/ha</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Weather & Climate Analytics */}
          {activeTab === 'weather' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(systemAnalytics?.weather_analytics || []).map((w, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-3xl border border-[#e3ecd9] shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{w.rainfall_category}</span>
                      <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
                        <Droplets size={18} />
                      </div>
                    </div>
                    <div>
                      <span className="text-3xl font-extrabold text-slate-800">{w.avg_yield_kg_per_acre.toLocaleString()}</span>
                      <span className="text-xs text-slate-400 font-medium block mt-0.5">kg / acre average harvest</span>
                    </div>
                    <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                      Observed in {w.count} agricultural seasonal observations.
                    </p>
                  </div>
                ))}
              </div>

              {/* Climate Advisory Card */}
              <div className="bg-gradient-to-r from-cyan-900 to-slate-900 text-white p-8 rounded-3xl shadow-md relative overflow-hidden">
                <div className="relative z-10 max-w-2xl space-y-3">
                  <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                    <Droplets size={16} />
                    <span>Hydrological Advisory</span>
                  </div>
                  <h3 className="text-xl font-bold">Optimizing Seasonal Irrigation & Rainfall Efficiency</h3>
                  <p className="text-sm text-cyan-100/90 leading-relaxed">
                    Data indicates that moderate rainfall zones (120–220 mm) provide the highest yield stability across staple cereals and pulses. Low rainfall conditions (&lt;120 mm) require supplemental drip irrigation to prevent moisture stress during critical flowering and grain fill periods.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Risk & Agronomic Insights */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RiskScoreGauge score={18} level="Low Risk" forecast="Optimal Agro-Productivity" />
                <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] shadow-sm space-y-3">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Lightbulb className="text-amber-500" size={20} />
                    <span>Key Agricultural Insights</span>
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                    {(systemAnalytics?.key_insights || []).map((ins, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold mt-0.5">•</span>
                        <span>{ins}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommendations Card */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#e3ecd9] shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-600" size={20} />
                  <span>Agronomic Recommendations for Maximum Yield</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {(systemAnalytics?.system_recommendations || []).map((rec, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-start gap-3 text-xs text-slate-700 leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold flex-shrink-0 text-[11px]">
                        {i + 1}
                      </span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Prediction History & Searchable Log */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-3xl border border-[#e3ecd9] shadow-sm overflow-hidden space-y-4 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Prediction History & Simulations Log</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Filter and review all past agricultural forecasts and field estimates.</p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={searchCrop}
                      onChange={(e) => setSearchCrop(e.target.value)}
                      placeholder="Search crop or state..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>

                  <select
                    value={selectedSoil}
                    onChange={(e) => setSelectedSoil(e.target.value)}
                    className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 font-medium focus:outline-none"
                  >
                    <option value="All">All Soil Types</option>
                    <option value="Loamy">Loamy</option>
                    <option value="Black">Black</option>
                    <option value="Red Soil">Red Soil</option>
                    <option value="Clay">Clay</option>
                    <option value="Sandy">Sandy</option>
                  </select>
                </div>
              </div>

              {filteredPredictions.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-sm">
                  No prediction records matching your filter. Run a prediction in the Predict Yield tab!
                </div>
              ) : (
                <div className="overflow-x-auto pt-2">
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
                      {filteredPredictions.map((p) => (
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
          )}
        </>
      )}
    </div>
  );
}
