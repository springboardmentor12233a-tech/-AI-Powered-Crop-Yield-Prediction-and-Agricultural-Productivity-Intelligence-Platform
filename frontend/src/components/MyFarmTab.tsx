import React, { useState } from 'react';
import { updateFarmerFarm } from '../services/api';
import { FarmDetails } from '../types';

interface MyFarmTabProps {
  farm: FarmDetails;
  onFarmUpdated: (updated: FarmDetails) => void;
}

export const MyFarmTab: React.FC<MyFarmTabProps> = ({ farm, onFarmUpdated }) => {
  const [fieldName, setFieldName] = useState(farm.field_name || 'North Field');
  const [landSize, setLandSize] = useState<number>(farm.land_size || 4.5);
  const [landUnit, setLandUnit] = useState<'Acres' | 'Hectares'>(farm.land_unit || 'Acres');
  const [soilType, setSoilType] = useState<'Sandy' | 'Loam' | 'Clay'>(farm.soil_type || 'Loam');
  const [irrigation, setIrrigation] = useState<'Sprinkler' | 'Flood' | 'Drip' | 'Unknown'>(
    farm.irrigation_method || 'Sprinkler'
  );

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const updated = await updateFarmerFarm({
        field_name: fieldName,
        land_size: landSize,
        land_unit: landUnit,
        soil_type: soilType,
        irrigation_method: irrigation,
      });
      onFarmUpdated(updated);
      setSuccess('Farm details saved successfully! Your prefill options will reflect these updates.');
    } catch (err: any) {
      setError(err.message || 'Failed to save farm details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center justify-center text-xl">
            🌾
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              My Farm Specifications
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Update your land size, soil type, and irrigation method so prediction forms prefill automatically.
            </p>
          </div>
        </div>

        {success && (
          <div className="mb-6 p-3.5 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 rounded-2xl border border-emerald-200 dark:border-emerald-800">
            ✓ {success}
          </div>
        )}

        {error && (
          <div className="mb-6 p-3.5 text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-2xl border border-red-200 dark:border-red-900">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Field / Plot Name
            </label>
            <input
              type="text"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="e.g. North Field (Plot 3)"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              required
            />
            <span className="text-[11px] text-slate-400 block mt-1">
              Optional name used as report metadata (not an ML model feature).
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Land Size Area *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={landSize}
                onChange={(e) => setLandSize(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Land Unit *
              </label>
              <select
                value={landUnit}
                onChange={(e) => setLandUnit(e.target.value as any)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                <option value="Acres">Acres</option>
                <option value="Hectares">Hectares</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Default Soil Texture
              </label>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value as any)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                <option value="Loam">Loam (Balanced)</option>
                <option value="Sandy">Sandy (Light/Draining)</option>
                <option value="Clay">Clay (Heavy/Retentive)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Default Irrigation Method
              </label>
              <select
                value={irrigation}
                onChange={(e) => setIrrigation(e.target.value as any)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                <option value="Sprinkler">Sprinkler Irrigation</option>
                <option value="Drip">Drip Irrigation</option>
                <option value="Flood">Flood Irrigation</option>
                <option value="Unknown">Rainfed / None</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition shadow-md"
            >
              {loading ? 'Saving...' : 'Save Farm Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
