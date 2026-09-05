import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Sparkles,
  TrendingUp,
  Droplets,
  Thermometer,
  Layers,
  FlaskConical,
  Calendar,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sprout,
  ArrowRight,
  Info,
  History,
  Trash2,
  Landmark
} from 'lucide-react';
import api from '../api';

const STATES = [
  'Andhra Pradesh', 'Bihar', 'Gujarat', 'Haryana', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab',
  'Rajasthan', 'Tamil Nadu', 'Uttar Pradesh', 'West Bengal'
];

const CROPS = [
  'Barley', 'Coffee', 'Cotton', 'Groundnut', 'Jute', 'Maize',
  'Pulses', 'Rice', 'Soybean', 'Sugarcane', 'Tea', 'Wheat'
];

const SOIL_TYPES = ['Black', 'Clay', 'Loamy', 'Red Soil', 'Sandy'];

const FERTILIZERS = ['Compost', 'DAP', 'NPK', 'Organic', 'Urea'];

const SAMPLE_PRESETS = [
  {
    name: '🌾 Karnataka Soybean',
    data: {
      State: 'Karnataka',
      Crop: 'Soybean',
      Soil_Type: 'Loamy',
      Fertilizer: 'DAP',
      N: 56,
      P: 41,
      K: 51,
      Rainfall_mm: 120,
      Temperature_C: 31.06,
      Soil_pH: 6.82,
      Year: 2024
    }
  },
  {
    name: '🌾 Punjab Wheat',
    data: {
      State: 'Punjab',
      Crop: 'Wheat',
      Soil_Type: 'Red Soil',
      Fertilizer: 'Compost',
      N: 58,
      P: 77,
      K: 129,
      Rainfall_mm: 227,
      Temperature_C: 30.85,
      Soil_pH: 5.93,
      Year: 2024
    }
  },
  {
    name: '🌱 AP Cotton',
    data: {
      State: 'Andhra Pradesh',
      Crop: 'Cotton',
      Soil_Type: 'Clay',
      Fertilizer: 'Organic',
      N: 108,
      P: 61,
      K: 63,
      Rainfall_mm: 263,
      Temperature_C: 37.03,
      Soil_pH: 6.24,
      Year: 2024
    }
  }
];

export default function YieldPrediction() {
  const [formData, setFormData] = useState({
    farm_id: '',
    State: 'Karnataka',
    Crop: 'Soybean',
    Soil_Type: 'Loamy',
    Fertilizer: 'DAP',
    N: 56,
    P: 41,
    K: 51,
    Rainfall_mm: 120,
    Temperature_C: 31.06,
    Soil_pH: 6.82,
    Year: 2024
  });

  const [farms, setFarms] = useState([]);
  const [modelInfo, setModelInfo] = useState(null);
  const [predictionsHistory, setPredictionsHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await api.get('/predictions');
      setPredictionsHistory(res.data);
    } catch (err) {
      console.warn('Could not fetch prediction history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    const initData = async () => {
      try {
        const [infoRes, farmsRes] = await Promise.all([
          api.get('/ml/model-info').catch(() => null),
          api.get('/farms').catch(() => ({ data: [] }))
        ]);
        if (infoRes) setModelInfo(infoRes.data);
        if (farmsRes) setFarms(farmsRes.data);
      } catch (err) {
        console.warn('Error fetching initial page metadata:', err);
      }
    };

    initData();
    fetchHistory();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['N', 'P', 'K', 'Rainfall_mm', 'Temperature_C', 'Soil_pH', 'Year'].includes(name)
        ? (value === '' ? '' : parseFloat(value))
        : value
    }));
  };

  const applyPreset = (presetData) => {
    setFormData((prev) => ({
      ...prev,
      ...presetData
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.State || !formData.Crop || !formData.Soil_Type || !formData.Fertilizer) {
      return 'Please select all categorical parameters (State, Crop, Soil Type, Fertilizer).';
    }
    if (formData.N === '' || formData.N < 0) return 'Nitrogen (N) must be 0 or greater.';
    if (formData.P === '' || formData.P < 0) return 'Phosphorus (P) must be 0 or greater.';
    if (formData.K === '' || formData.K < 0) return 'Potassium (K) must be 0 or greater.';
    if (formData.Rainfall_mm === '' || formData.Rainfall_mm < 0) return 'Rainfall must be 0 or greater.';
    if (formData.Temperature_C === '') return 'Temperature is required.';
    if (formData.Soil_pH === '' || formData.Soil_pH < 0 || formData.Soil_pH > 14) {
      return 'Soil pH must be between 0.0 and 14.0.';
    }
    return null;
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        farm_id: formData.farm_id ? parseInt(formData.farm_id) : null,
        State: formData.State,
        Crop: formData.Crop,
        Soil_Type: formData.Soil_Type,
        Fertilizer: formData.Fertilizer,
        N: parseFloat(formData.N),
        P: parseFloat(formData.P),
        K: parseFloat(formData.K),
        Rainfall_mm: parseFloat(formData.Rainfall_mm),
        Temperature_C: parseFloat(formData.Temperature_C),
        Soil_pH: parseFloat(formData.Soil_pH),
        Year: parseInt(formData.Year) || 2024
      };

      // Call authenticated prediction history endpoint to run ML inference & save
      const response = await api.post('/predictions', payload);
      
      const resData = response.data;
      setResult({
        predicted_yield_kg_per_acre: resData.predicted_yield_kg,
        predicted_yield_tons_per_acre: resData.predicted_yield_tons,
        productivity_category: resData.productivity_category || 'Optimal Yield',
        recommendation_summary: resData.recommendation_summary,
        model_version: modelInfo?.model_version || '2.0.0',
        algorithm_used: resData.model_name || 'LinearRegression',
        inputs_received: {
          State: resData.state,
          Crop: resData.crop,
          Soil_Type: resData.soil_type,
          Fertilizer: resData.fertilizer,
          N: resData.n,
          P: resData.p,
          K: resData.k,
          Rainfall_mm: resData.rainfall_mm,
          Temperature_C: resData.temperature_c,
          Soil_pH: resData.soil_ph
        }
      });

      // Refresh prediction history log
      fetchHistory();
    } catch (err) {
      console.error('Prediction request error:', err);
      // Fallback to direct prediction if token issue
      try {
        const rawPayload = {
          State: formData.State,
          Crop: formData.Crop,
          Soil_Type: formData.Soil_Type,
          Fertilizer: formData.Fertilizer,
          N: parseFloat(formData.N),
          P: parseFloat(formData.P),
          K: parseFloat(formData.K),
          Rainfall_mm: parseFloat(formData.Rainfall_mm),
          Temperature_C: parseFloat(formData.Temperature_C),
          Soil_pH: parseFloat(formData.Soil_pH),
          Year: parseInt(formData.Year) || 2024
        };
        const fallbackRes = await api.post('/predict/yield', rawPayload);
        setResult(fallbackRes.data);
      } catch (fallbackErr) {
        setError(err.response?.data?.detail || 'Prediction failed. Please check inputs and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistoryItem = async (id) => {
    try {
      await api.delete(`/predictions/${id}`);
      setPredictionsHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Failed to delete history record:', err);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#e3ecd9] shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="absolute right-0 top-0 w-36 h-36 bg-brand-50 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 text-brand-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <Sparkles size={16} />
            <span>AI Predictive Intelligence</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Crop Yield Prediction</h2>
          <p className="text-slate-500 text-sm mt-1">
            Forecast farm productivity using soil nutrients, cultivar type, and local weather patterns.
          </p>
        </div>

        {modelInfo && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-[#f4f8f0] border border-[#e3ecd9] rounded-2xl text-xs text-slate-700">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
            <div>
              <span className="font-bold block text-slate-800">
                Model: {modelInfo.best_model_name}
              </span>
              <span className="text-slate-500 text-[11px]">
                v{modelInfo.model_version} • {modelInfo.dataset_size} Trained Records
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Preset Quick Fill Bar */}
      <div className="flex items-center gap-3 flex-wrap bg-white p-4 rounded-2xl border border-[#e3ecd9]">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pl-1">
          <Sparkles size={14} className="text-brand-500" />
          Quick Test Profiles:
        </span>
        {SAMPLE_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => applyPreset(preset.data)}
            className="px-3.5 py-1.5 bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-300 text-slate-700 hover:text-brand-700 rounded-xl text-xs font-semibold transition-all"
          >
            {preset.name}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-2xl text-rose-700 flex items-start gap-3 text-sm shadow-sm">
          <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Form Inputs (Left) and Live Forecast Result (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Form Column */}
        <form onSubmit={handlePredict} className="lg:col-span-7 space-y-6">
          {/* Farm Link Selector (Optional) */}
          {farms.length > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-[#e3ecd9] flex items-center gap-3">
              <Landmark size={20} className="text-brand-600 flex-shrink-0" />
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Associate with Registered Farm (Optional)
                </label>
                <select
                  name="farm_id"
                  value={formData.farm_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs focus:bg-white focus:border-brand-500 outline-none"
                >
                  <option value="">-- No specific farm field selected --</option>
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.farm_name} ({f.location} - {f.area} acres)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 1. Categorical Selections Card */}
          <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#f0f5eb]">
              <Sprout size={18} className="text-brand-600" />
              <h3 className="font-bold text-slate-800 text-base">Crop &amp; Farm Region</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  State / Region
                </label>
                <select
                  name="State"
                  value={formData.State}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                >
                  {STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Crop Variety
                </label>
                <select
                  name="Crop"
                  value={formData.Crop}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                >
                  {CROPS.map((cr) => (
                    <option key={cr} value={cr}>{cr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Soil Classification
                </label>
                <select
                  name="Soil_Type"
                  value={formData.Soil_Type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                >
                  {SOIL_TYPES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Fertilizer Applied
                </label>
                <select
                  name="Fertilizer"
                  value={formData.Fertilizer}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                >
                  {FERTILIZERS.map((ft) => (
                    <option key={ft} value={ft}>{ft}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2. Soil Nutrients & pH Card */}
          <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#f0f5eb]">
              <FlaskConical size={18} className="text-brand-600" />
              <h3 className="font-bold text-slate-800 text-base">Soil Chemical Nutrients</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Nitrogen (N)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    name="N"
                    value={formData.N}
                    onChange={handleInputChange}
                    placeholder="e.g. 56"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">kg/ha</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Phosphorus (P)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    name="P"
                    value={formData.P}
                    onChange={handleInputChange}
                    placeholder="e.g. 41"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">kg/ha</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Potassium (K)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    name="K"
                    value={formData.K}
                    onChange={handleInputChange}
                    placeholder="e.g. 51"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">kg/ha</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Soil pH (0-14)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="14"
                  name="Soil_pH"
                  value={formData.Soil_pH}
                  onChange={handleInputChange}
                  placeholder="e.g. 6.8"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* 3. Climate & Season Card */}
          <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#f0f5eb]">
              <Thermometer size={18} className="text-brand-600" />
              <h3 className="font-bold text-slate-800 text-base">Weather &amp; Year Settings</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Rainfall (Seasonal)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    name="Rainfall_mm"
                    value={formData.Rainfall_mm}
                    onChange={handleInputChange}
                    placeholder="e.g. 120"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">mm</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Avg Temperature
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    name="Temperature_C"
                    value={formData.Temperature_C}
                    onChange={handleInputChange}
                    placeholder="e.g. 31.0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">°C</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Crop Year
                </label>
                <input
                  type="number"
                  name="Year"
                  value={formData.Year}
                  onChange={handleInputChange}
                  placeholder="e.g. 2024"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Predict Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-600/20 hover:shadow-brand-600/30 flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-70 text-base"
          >
            {loading ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                <span>Running ML Inference Engine &amp; Saving...</span>
              </>
            ) : (
              <>
                <BrainCircuit size={20} />
                <span>Predict &amp; Record Yield</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Prediction Results Display Column */}
        <div className="lg:col-span-5 space-y-6">
          {result ? (
            <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-brand-200 shadow-md space-y-6 animate-fadeIn relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="px-3.5 py-1.5 bg-brand-100 text-brand-700 font-bold text-xs rounded-xl flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  Forecast Generated &amp; Saved
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  {result.algorithm_used}
                </span>
              </div>

              {/* Main Metric Hero */}
              <div className="bg-gradient-to-br from-[#f2f8ed] to-[#e4f1dc] p-6 rounded-2xl border border-brand-100 text-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">
                  Estimated Productivity
                </span>
                <div className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight">
                  {result.predicted_yield_kg_per_acre.toLocaleString()}{' '}
                  <span className="text-lg font-bold text-brand-600">kg/acre</span>
                </div>
                <div className="text-sm font-semibold text-slate-600 mt-2">
                  ≈ <span className="text-slate-800 font-bold">{result.predicted_yield_tons_per_acre}</span> metric tons per acre
                </div>
              </div>

              {/* Category & Advisory */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Productivity Category</span>
                  <span
                    className={`font-bold px-3 py-1 rounded-full ${
                      result.productivity_category.includes('High')
                        ? 'bg-emerald-100 text-emerald-800'
                        : result.productivity_category.includes('Optimal')
                        ? 'bg-brand-100 text-brand-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {result.productivity_category}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1">
                  <span className="font-bold text-slate-700 block flex items-center gap-1">
                    <Info size={14} className="text-brand-600" />
                    Agronomic Recommendation:
                  </span>
                  <p className="leading-relaxed">{result.recommendation_summary}</p>
                </div>
              </div>

              {/* Input Parameters Summary */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Parameters Evaluated:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Crop / Variety</span>
                    <span className="font-semibold text-slate-700">{result.inputs_received.Crop}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Region</span>
                    <span className="font-semibold text-slate-700">{result.inputs_received.State}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Soil / pH</span>
                    <span className="font-semibold text-slate-700">{result.inputs_received.Soil_Type} (pH {result.inputs_received.Soil_pH})</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">NPK Ratio</span>
                    <span className="font-semibold text-slate-700">{result.inputs_received.N}-{result.inputs_received.P}-{result.inputs_received.K}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-[#e3ecd9] text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
                <BrainCircuit size={32} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Awaiting Field Inputs</h3>
                <p className="text-slate-500 text-xs mt-1 max-w-xs mx-auto">
                  Select your crop cultivar, soil nutrients, and weather values, then click{' '}
                  <span className="font-semibold text-brand-600">"Predict &amp; Record Yield"</span> to generate instantaneous forecasts.
                </p>
              </div>
            </div>
          )}

          {/* Model Accuracy Card */}
          {modelInfo && (
            <div className="bg-white p-5 rounded-3xl border border-[#e3ecd9] shadow-sm text-xs space-y-2">
              <span className="font-bold text-slate-700 block flex items-center gap-1.5">
                <TrendingUp size={15} className="text-brand-600" />
                Model Benchmark Reference
              </span>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px] font-bold">TEST MAE</span>
                  <span className="font-bold text-slate-800">{modelInfo.mae.toLocaleString()} kg/ac</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px] font-bold">TEST RMSE</span>
                  <span className="font-bold text-slate-800">{modelInfo.rmse.toLocaleString()} kg/ac</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px] font-bold">TEST R²</span>
                  <span className="font-bold text-slate-800">{modelInfo.r2.toFixed(4)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Prediction History Table */}
      <div className="bg-white rounded-3xl border border-[#e3ecd9] p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
              <History size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Prediction History</h3>
              <p className="text-xs text-slate-500">Your recent localized crop yield forecasts and records.</p>
            </div>
          </div>
          <button
            onClick={fetchHistory}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-all"
            title="Refresh History"
          >
            <RefreshCw size={16} className={historyLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {historyLoading && predictionsHistory.length === 0 ? (
          <div className="text-center py-8">
            <RefreshCw className="animate-spin text-brand-500 mx-auto" size={24} />
          </div>
        ) : predictionsHistory.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No saved prediction logs yet. Fill in the form above and run your first forecast!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-[#e3ecd9] text-slate-500 font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Crop</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3">Soil / pH</th>
                  <th className="px-4 py-3">N-P-K</th>
                  <th className="px-4 py-3">Predicted Yield</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f8f2] text-slate-700">
                {predictionsHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-brand-50/20 transition-all">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{item.crop}</td>
                    <td className="px-4 py-3">{item.state}</td>
                    <td className="px-4 py-3">{item.soil_type} (pH {item.soil_ph})</td>
                    <td className="px-4 py-3">{item.n}-{item.p}-{item.k}</td>
                    <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">
                      {item.predicted_yield_kg.toLocaleString()} kg/ac
                      <span className="text-slate-400 font-normal block text-[10px]">
                        ({item.predicted_yield_tons} t/ac)
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold px-2.5 py-0.5 rounded-full text-[10px] inline-block ${
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
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteHistoryItem(item.id)}
                        className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-all"
                        title="Delete Prediction Log"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
