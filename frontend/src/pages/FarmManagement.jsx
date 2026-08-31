import React, { useState, useEffect } from 'react';
import { Landmark, Plus, AlertCircle, RefreshCw, X, Loader } from 'lucide-react';
import api from '../api';

export default function FarmManagement() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [farmName, setFarmName] = useState('');
  const [location, setLocation] = useState('');
  const [area, setArea] = useState('');
  const [soilType, setSoilType] = useState('Loamy');
  const [submitting, setSubmitting] = useState(false);

  const fetchFarms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/farms');
      setFarms(response.data);
    } catch (err) {
      setError('Failed to fetch farm data. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  const handleCreateFarm = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (parseFloat(area) <= 0) {
      setError('Area must be greater than 0.');
      setSubmitting(false);
      return;
    }

    try {
      const response = await api.post('/farms', {
        farm_name: farmName,
        location,
        area: parseFloat(area),
        soil_type: soilType
      });
      setFarms([response.data, ...farms]);
      setModalOpen(false);
      setFarmName('');
      setLocation('');
      setArea('');
      setSoilType('Loamy');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register the farm.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Farm Management</h2>
          <p className="text-slate-500 text-sm mt-0.5">Register and maintain your agricultural fields.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-semibold shadow-lg shadow-brand-600/10 hover:shadow-brand-600/20 transition-all text-sm"
        >
          <Plus size={18} />
          Add Farm
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-xl text-rose-700 flex items-start gap-3 text-sm">
          <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="animate-spin text-brand-500" size={32} />
        </div>
      ) : farms.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#e3ecd9] rounded-3xl p-12 text-center">
          <span className="text-4xl block mb-3">🏡</span>
          <h3 className="font-bold text-slate-700 text-lg">No Farms Registered</h3>
          <p className="text-slate-400 text-sm mt-1 mb-6">Create your first farm layout to track crops, soil, and forecasting variables.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl text-sm transition-all"
          >
            Add New Farm
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farms.map((farm) => (
            <div key={farm.id} className="bg-white rounded-3xl border border-[#e3ecd9] p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-brand-50/50 rounded-full blur-xl" />
              <div className="flex items-start justify-between gap-4 relative">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{farm.farm_name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Farm ID: {farm.id}</p>
                </div>
                <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
                  <Landmark size={20} />
                </div>
              </div>

              <div className="mt-6 space-y-3 pt-4 border-t border-slate-50 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Location:</span>
                  <span className="font-medium text-slate-800">{farm.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Area size:</span>
                  <span className="font-medium text-slate-800">{farm.area} acres</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Soil profile:</span>
                  <span className="px-2.5 py-0.5 bg-brand-100 text-brand-700 rounded-full text-xs font-semibold">
                    {farm.soil_type}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative z-10 border border-[#e3ecd9]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 text-lg">Add New Farm Field</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateFarm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Farm Name</label>
                <input
                  type="text"
                  required
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="Green Valley Estate"
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-[#e3ecd9] rounded-xl text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Location / Coordinates</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="California, Sector 4"
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-[#e3ecd9] rounded-xl text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Area Size (Acres)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="45.5"
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-[#e3ecd9] rounded-xl text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Soil Type</label>
                <select
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-[#e3ecd9] rounded-xl text-slate-850 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm cursor-pointer"
                >
                  <option value="Loamy">Loamy (High fertility)</option>
                  <option value="Clay">Clay (Holds moisture)</option>
                  <option value="Sandy">Sandy (Rapid drainage)</option>
                  <option value="Silt">Silt (Fine particle deposit)</option>
                  <option value="Peaty">Peaty (High organic matter)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 px-4 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader className="animate-spin" size={16} /> : 'Save Farm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
