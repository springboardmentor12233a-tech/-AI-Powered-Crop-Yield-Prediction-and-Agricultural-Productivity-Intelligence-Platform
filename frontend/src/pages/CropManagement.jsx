import React, { useState, useEffect } from 'react';
import { Trees, Plus, AlertCircle, RefreshCw, X, Loader, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function CropManagement() {
  const [crops, setCrops] = useState([]);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [farmId, setFarmId] = useState('');
  const [cropName, setCropName] = useState('');
  const [season, setSeason] = useState('Kharif');
  const [sowingDate, setSowingDate] = useState('');
  const [harvestDate, setHarvestDate] = useState('');
  const [historicalYield, setHistoricalYield] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const cropsRes = await api.get('/crops');
      const farmsRes = await api.get('/farms');
      
      setCrops(cropsRes.data);
      setFarms(farmsRes.data);
      if (farmsRes.data.length > 0) {
        setFarmId(farmsRes.data[0].id.toString());
      }
    } catch (err) {
      setError('Failed to retrieve crops and farms databases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCrop = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!farmId) {
      setError('Please select a valid farm.');
      setSubmitting(false);
      return;
    }

    try {
      const response = await api.post('/crops', {
        farm_id: parseInt(farmId),
        crop_name: cropName,
        season,
        sowing_date: sowingDate || null,
        harvest_date: harvestDate || null,
        historical_yield: historicalYield ? parseFloat(historicalYield) : null
      });
      setCrops([response.data, ...crops]);
      setModalOpen(false);
      setCropName('');
      setSowingDate('');
      setHarvestDate('');
      setHistoricalYield('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to record crop log.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to map farm name
  const getFarmName = (fId) => {
    const farm = farms.find(f => f.id === fId);
    return farm ? farm.farm_name : `Farm #${fId}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Crop Logs Management</h2>
          <p className="text-slate-500 text-sm mt-0.5">Track historical yields, sowing dates, and seasons.</p>
        </div>
        {farms.length > 0 && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-semibold shadow-lg shadow-brand-600/10 hover:shadow-brand-600/20 transition-all text-sm"
          >
            <Plus size={18} />
            Log Crop
          </button>
        )}
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
        <div className="bg-[#fef8f0] border border-amber-250 p-6 rounded-3xl flex gap-4 text-slate-700 items-start">
          <Info className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-semibold text-slate-800 mb-1">Registration Required</h4>
            <p className="text-sm mb-4 leading-relaxed">You must register at least one Farm before you can log crop parameters and yields.</p>
            <Link
              to="/farms"
              className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold shadow-md transition-all inline-block"
            >
              Configure Farms
            </Link>
          </div>
        </div>
      ) : crops.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#e3ecd9] rounded-3xl p-12 text-center">
          <span className="text-4xl block mb-3">🌱</span>
          <h3 className="font-bold text-slate-700 text-lg">No Crops Logged</h3>
          <p className="text-slate-400 text-sm mt-1 mb-6">Start tracking agricultural operations by logging your first crop.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl text-sm transition-all"
          >
            Log New Crop
          </button>
        </div>
      ) : (
        <div className="bg-white border border-[#e3ecd9] rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[#e3ecd9] text-xs font-bold text-slate-450 uppercase tracking-wider">
                  <th className="px-6 py-4">Crop Name</th>
                  <th className="px-6 py-4">Farm Field</th>
                  <th className="px-6 py-4">Growth Season</th>
                  <th className="px-6 py-4">Sowing Date</th>
                  <th className="px-6 py-4">Harvest Date</th>
                  <th className="px-6 py-4">Historical Yield</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f8f2] text-sm text-slate-650">
                {crops.map((crop) => (
                  <tr key={crop.id} className="hover:bg-brand-50/20 transition-all">
                    <td className="px-6 py-4 font-semibold text-slate-800">{crop.crop_name}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{getFarmName(crop.farm_id)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-brand-100/50 text-brand-700 rounded-full text-xs font-semibold">
                        {crop.season}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{crop.sowing_date || 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-500">{crop.harvest_date || 'N/A'}</td>
                    <td className="px-6 py-4 font-semibold text-slate-850">
                      {crop.historical_yield ? `${crop.historical_yield} tons/acre` : 'Pending'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Creation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative z-10 border border-[#e3ecd9]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 text-lg">Log New Crop Instance</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCrop} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Select Farm Field</label>
                <select
                  value={farmId}
                  onChange={(e) => setFarmId(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-[#e3ecd9] rounded-xl text-slate-850 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm cursor-pointer"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.farm_name} ({f.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Crop Name</label>
                <input
                  type="text"
                  required
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  placeholder="Wheat, Maize, Rice, etc."
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-[#e3ecd9] rounded-xl text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Growth Season</label>
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-[#e3ecd9] rounded-xl text-slate-850 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm cursor-pointer"
                >
                  <option value="Kharif">Kharif (Monsoon)</option>
                  <option value="Rabi">Rabi (Winter Sown)</option>
                  <option value="Summer">Summer</option>
                  <option value="Spring">Spring</option>
                  <option value="Winter">Winter</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Sowing Date</label>
                  <input
                    type="date"
                    value={sowingDate}
                    onChange={(e) => setSowingDate(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-[#e3ecd9] rounded-xl text-slate-850 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Harvest Date</label>
                  <input
                    type="date"
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-[#e3ecd9] rounded-xl text-slate-850 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Historical Yield (Tons per Acre)</label>
                <input
                  type="number"
                  step="0.01"
                  value={historicalYield}
                  onChange={(e) => setHistoricalYield(e.target.value)}
                  placeholder="3.8"
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-[#e3ecd9] rounded-xl text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                />
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
                  {submitting ? <Loader className="animate-spin" size={16} /> : 'Save Crop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
