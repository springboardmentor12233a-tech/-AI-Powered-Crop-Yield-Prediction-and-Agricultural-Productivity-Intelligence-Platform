import React, { useState, useEffect } from 'react';
import {
  AdminSystemStats,
  FarmerProfile,
  LLMConfig,
  SavedReport,
  SavedRecommendation,
  FarmDetails
} from '../types';
import {
  fetchAdminStats,
  fetchAdminFarmers,
  fetchAdminFarmerDetails,
  toggleFarmerStatus,
  fetchLLMConfigs,
  saveLLMConfig,
  testLLMConnection,
  deleteFarmerAccount
} from '../services/api';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'farmers' | 'llm'>('overview');
  const [stats, setStats] = useState<AdminSystemStats | null>(null);
  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFarmerId, setSelectedFarmerId] = useState<number | null>(null);
  const [farmerDetails, setFarmerDetails] = useState<{
    farmer: FarmerProfile;
    farm: FarmDetails;
    predictions: SavedReport[];
    recommendations: SavedRecommendation[];
  } | null>(null);
  
  // LLM Provider Management state
  const [llmConfigs, setLlmConfigs] = useState<LLMConfig[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('gemini');
  const [modelName, setModelName] = useState<string>('gemini-1.5-flash');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [isActiveProvider, setIsActiveProvider] = useState<boolean>(true);
  const [testResult, setTestResult] = useState<{ status: string; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, farmersData, configsData] = await Promise.all([
        fetchAdminStats(),
        fetchAdminFarmers(),
        fetchLLMConfigs()
      ]);
      setStats(statsData);
      setFarmers(farmersData);
      setLlmConfigs(configsData);
      
      const active = configsData.find(c => Boolean(c.is_active));
      if (active) {
        setSelectedProvider(active.provider);
        setModelName(active.model_name);
        setIsActiveProvider(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load admin telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectFarmer = async (farmerId: number) => {
    setSelectedFarmerId(farmerId);
    try {
      const details = await fetchAdminFarmerDetails(farmerId);
      setFarmerDetails(details);
    } catch (err: any) {
      alert('Error fetching farmer profile: ' + err.message);
    }
  };

  const handleToggleStatus = async (farmerId: number, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    try {
      await toggleFarmerStatus(farmerId, newStatus);
      setFarmers(prev => prev.map(f => f.id === farmerId ? { ...f, is_active: newStatus } : f));
      if (farmerDetails && farmerDetails.farmer.id === farmerId) {
        setFarmerDetails({
          ...farmerDetails,
          farmer: { ...farmerDetails.farmer, is_active: newStatus }
        });
      }
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleDeleteAccount = async (farmerId: number) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete farmer #${farmerId} and all associated data? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteFarmerAccount(farmerId);
      setFarmers(prev => prev.filter(f => f.id !== farmerId));
      if (farmerDetails && farmerDetails.farmer.id === farmerId) {
        setSelectedFarmerId(null);
        setFarmerDetails(null);
      }
      alert(`Farmer #${farmerId} deleted successfully.`);
    } catch (err: any) {
      alert('Failed to delete account: ' + err.message);
    }
  };

  const handleProviderChange = (prov: string) => {
    setSelectedProvider(prov);
    setApiKeyInput('');
    setTestResult(null);
    setSaveSuccess(null);
    if (prov === 'gemini') {
      setModelName('gemini-1.5-flash');
    } else if (prov === 'openai') {
      setModelName('gpt-4o-mini');
    } else if (prov === 'xai') {
      setModelName('grok-beta');
    }
    else if (prov === 'groq') {
      setModelName('llama-3.3-70b-versatile');
    }
    const existing = llmConfigs.find(c => c.provider === prov);
    if (existing) {
      setModelName(existing.model_name);
      setIsActiveProvider(Boolean(existing.is_active));
    }
  };

  const handleTestConnection = async () => {
    if (!apiKeyInput.trim()) {
      alert('Please enter an API key to test.');
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testLLMConnection({
        provider: selectedProvider,
        model_name: modelName,
        api_key: apiKeyInput.trim()
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ status: 'error', message: err.message || 'Connection test failed.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveLLM = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(null);
    try {
      await saveLLMConfig({
        provider: selectedProvider,
        model_name: modelName,
        api_key: apiKeyInput.trim() ? apiKeyInput.trim() : undefined,
        is_active: isActiveProvider
      });
      setSaveSuccess(`AI Provider '${selectedProvider}' saved successfully.`);
      const refreshedConfigs = await fetchLLMConfigs();
      setLlmConfigs(refreshedConfigs);
      setApiKeyInput('');
    } catch (err: any) {
      alert('Error saving configuration: ' + err.message);
    }
  };

  const filteredFarmers = farmers.filter(f =>
    f.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.district && f.district.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">Loading Admin Platform Controls...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center max-w-xl mx-auto my-8">
        <h3 className="text-lg font-bold text-red-800 dark:text-red-300 mb-2">Admin Authorization Required</h3>
        <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/30 text-blue-300 border border-blue-400/30">
              System Administration
            </span>
            <span className="text-xs text-slate-400">YieldSense Management Suite</span>
          </div>
          <h1 className="text-2xl font-bold mt-1 text-white">Platform Monitoring & LLM Control</h1>
          <p className="text-sm text-slate-300 mt-0.5">
            Oversee registered farmers, inspect agricultural forecast trends, and manage dynamic AI LLM integrations.
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            📊 System Analytics
          </button>
          <button
            onClick={() => setActiveTab('farmers')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'farmers'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            🧑‍🌾 Farmer Registry ({farmers.length})
          </button>
          <button
            onClick={() => setActiveTab('llm')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'llm'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            🤖 AI Provider Engine
          </button>
        </div>
      </div>

      {/* 1. OVERVIEW / SYSTEM ANALYTICS */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Total Registered Farmers</span>
                <span className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">🧑‍🌾</span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{stats.total_farmers}</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                {stats.active_farmers} active farming accounts
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Yield Predictions Run</span>
                <span className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">📈</span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{stats.total_predictions}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                Historical ML regression forecasts
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Suitability Matches</span>
                <span className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">🌾</span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{stats.total_recommendations}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                Multi-crop suitability analyses
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Active AI LLM Engine</span>
                <span className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">⚡</span>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-2 uppercase">
                {llmConfigs.find(c => Boolean(c.is_active))?.provider || 'None'}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-1">
                {llmConfigs.find(c => Boolean(c.is_active))?.model_name || 'Rule-based fallback active'}
              </div>
            </div>
          </div>

          {/* Activity Trends & Top Crops */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Commonly Forecasted Crops */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                <span className="mr-2">🌾</span> Top Forecasted Crops by Farmers
              </h3>
              {stats.top_forecasted_crops.length === 0 ? (
                <p className="text-sm text-slate-500">No yield forecasts logged yet.</p>
              ) : (
                <div className="space-y-3">
                  {stats.top_forecasted_crops.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{c.crop}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${Math.min(100, (c.count / Math.max(...stats.top_forecasted_crops.map(x => x.count))) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-8 text-right">{c.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Commonly Recommended Crops */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                <span className="mr-2">🌱</span> Top Recommended Crops by ML Match
              </h3>
              {stats.top_recommended_crops.length === 0 ? (
                <p className="text-sm text-slate-500">No crop recommendation queries logged yet.</p>
              ) : (
                <div className="space-y-3">
                  {stats.top_recommended_crops.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{c.crop}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-2.5 rounded-full"
                            style={{ width: `${Math.min(100, (c.count / Math.max(...stats.top_recommended_crops.map(x => x.count))) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-8 text-right">{c.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Platform Activity */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2">🕒</span> Live Platform Predictions Stream
            </h3>
            {stats.recent_activity.length === 0 ? (
              <p className="text-sm text-slate-500">No recent activity detected.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                  <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Report ID</th>
                      <th className="px-4 py-3">Farmer</th>
                      <th className="px-4 py-3">Crop</th>
                      <th className="px-4 py-3">Predicted Yield</th>
                      <th className="px-4 py-3 rounded-r-lg">Date / Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {stats.recent_activity.map((act) => (
                      <tr key={act.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{act.report_id}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-white">{act.farmer_name}</div>
                          <div className="text-xs text-slate-400">{act.farmer_email}</div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{act.crop}</td>
                        <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{act.predicted_yield.toFixed(2)} ton/ha</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{act.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. FARMER MANAGEMENT */}
      {activeTab === 'farmers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Farmers List */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Registered Farmers</h3>
              <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
                {filteredFarmers.length} Total
              </span>
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Search by name, email, district..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredFarmers.map((f) => (
                <div
                  key={f.id}
                  onClick={() => handleSelectFarmer(f.id)}
                  className={`p-3 rounded-xl cursor-pointer border transition ${
                    selectedFarmerId === f.id
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{f.full_name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        f.is_active === 1
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {f.is_active === 1 ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{f.email}</div>
                  <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
                    <span>{f.district ? `${f.district}, ${f.state}` : 'Region Undefined'}</span>
                    <span>{f.prediction_count || 0} Preds</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Farmer Details Panel */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            {!farmerDetails ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <span className="text-4xl mb-2">🧑‍🌾</span>
                <p className="font-medium text-slate-600 dark:text-slate-300">Select a farmer to inspect their full profile and agricultural activity.</p>
                <p className="text-xs mt-1">Farmer records remain strictly isolated to respect individual operational privacy.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Farmer Header Info */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{farmerDetails.farmer.full_name}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{farmerDetails.farmer.email} • ID #{farmerDetails.farmer.id}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      📍 {farmerDetails.farmer.village ? `${farmerDetails.farmer.village}, ` : ''}{farmerDetails.farmer.district}, {farmerDetails.farmer.state}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleStatus(farmerDetails.farmer.id, farmerDetails.farmer.is_active ?? 1)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                        farmerDetails.farmer.is_active === 1
                          ? 'border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950'
                          : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                      }`}
                    >
                      {farmerDetails.farmer.is_active === 1 ? 'Disable Account' : 'Activate Account'}
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(farmerDetails.farmer.id)}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>

                {/* Farm Metadata */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Field Name</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{farmerDetails.farm.field_name || 'Main Plot'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Land Area</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{farmerDetails.farm.land_size} {farmerDetails.farm.land_unit}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Soil Texture</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{farmerDetails.farm.soil_type}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Irrigation Setup</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{farmerDetails.farm.irrigation_method}</p>
                  </div>
                </div>

                {/* Farmer Prediction History */}
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Yield Forecast History ({farmerDetails.predictions.length})</h4>
                  {farmerDetails.predictions.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No yield predictions generated by this farmer yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {farmerDetails.predictions.map((p) => (
                        <div key={p.id} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs">
                          <div>
                            <span className="font-bold text-blue-600 dark:text-blue-400 mr-2">{p.report_id}</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{p.crop} ({p.region})</span>
                            <span className="text-slate-400 ml-2">Rain: {p.rainfall_mm}mm, pH: {p.soil_ph}</span>
                          </div>
                          <div className="font-extrabold text-emerald-600 dark:text-emerald-400">
                            {p.predicted_yield.toFixed(2)} ton/ha
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Farmer Crop Recommendation History */}
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Crop Suitability History ({farmerDetails.recommendations.length})</h4>
                  {farmerDetails.recommendations.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No crop suitability evaluations performed yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {farmerDetails.recommendations.map((r) => (
                        <div key={r.id} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">Recommended: {r.recommended_crop}</span>
                            <span className="text-slate-400 ml-2">Temp: {r.temperature_c}°C, Humidity: {r.humidity_pct}%, pH: {r.soil_ph}</span>
                          </div>
                          <div className="font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full">
                            {r.confidence_pct} match
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. AI LLM PROVIDER SETTINGS */}
      {activeTab === 'llm' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Controls */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                <span className="mr-2">🤖</span> AI LLM Provider Configuration
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Configure the LLM engine responsible for generating agronomic reports and powering the farmer AI assistant. 
                API credentials are encrypted and never committed to source code.
              </p>
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-medium">
                ✓ {saveSuccess}
              </div>
            )}

            <form onSubmit={handleSaveLLM} className="space-y-4">
              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Select AI Provider
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'gemini', name: 'Google Gemini', desc: 'Free Tier Available' },
                    { id: 'openai', name: 'OpenAI GPT', desc: 'Standard API' },
                    { id: 'xai', name: 'xAI Grok', desc: 'Enterprise Beta' },
                     { id: 'groq', name: 'Groq', desc: 'Cheaper high-throughput LLMs' }
                  ].map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => handleProviderChange(p.id)}
                      className={`p-3 rounded-xl border text-left transition ${
                        selectedProvider === p.id
                          ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-sm text-slate-900 dark:text-white">{p.name}</div>
                      <div className="text-[10px] text-slate-400">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Model Identifier */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Model Identifier
                </label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="e.g. gemini-1.5-flash or gpt-4o-mini"
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* API Key Input */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  API Key Secret
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={
                      llmConfigs.find(c => c.provider === selectedProvider)?.has_key
                        ? `Stored (Key: ${llmConfigs.find(c => c.provider === selectedProvider)?.masked_key}) — leave blank to keep`
                        : 'Enter provider API key (e.g. AIzaSy...)'
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Keys are stored locally in the secure database. We never expose or transmit full keys to the browser.
                </p>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={isActiveProvider}
                  onChange={(e) => setIsActiveProvider(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Set as Active Primary LLM Engine
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
                >
                  {isTesting ? 'Testing Link...' : '⚡ Test Connection'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md transition"
                >
                  Save Configuration
                </button>
              </div>
            </form>

            {/* Test Connection Output */}
            {testResult && (
              <div
                className={`p-4 rounded-xl border text-xs ${
                  testResult.status === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300'
                    : 'bg-red-50 dark:bg-red-950/40 border-red-300 text-red-800 dark:text-red-300'
                }`}
              >
                <div className="font-bold mb-1">
                  {testResult.status === 'success' ? '✓ Connection Verified' : '✗ Connection Failed'}
                </div>
                <div className="font-mono">{testResult.message}</div>
              </div>
            )}
          </div>

          {/* Provider Overview Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Configured AI Providers</h3>
            <div className="space-y-3">
              {llmConfigs.map((cfg) => (
                <div
                  key={cfg.provider}
                  className={`p-3 rounded-xl border ${
                    cfg.is_active
                      ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs uppercase text-slate-900 dark:text-white">{cfg.provider}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        cfg.is_active
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {cfg.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Model: {cfg.model_name}</div>
                  <div className="text-xs font-mono text-slate-400 mt-0.5">Key: {cfg.masked_key}</div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-500 dark:text-slate-400 space-y-1 border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-700 dark:text-slate-300">🛡️ Fail-Safe Guarantee:</span>
              <p>
                If the selected LLM provider is unavailable, exceeds rate limits, or is unconfigured, YieldSense automatically falls back to deterministic rule-based agronomic reporting. Core ML inference remains 100% operational.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
