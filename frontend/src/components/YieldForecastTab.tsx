import React, { useState } from 'react';
import { YieldInput, YieldResult, FarmDetails } from '../types';
import { predictYield } from '../services/api';

interface YieldForecastTabProps {
  inputState: YieldInput;
  setInputState: React.Dispatch<React.SetStateAction<YieldInput>>;
  savedFarm: FarmDetails;
}

export const YieldForecastTab: React.FC<YieldForecastTabProps> = ({
  inputState,
  setInputState,
  savedFarm,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<YieldResult | null>(null);

  const handleInputChange = (field: keyof YieldInput, value: any) => {
    setInputState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUseSavedFarmDetails = () => {
    if (savedFarm) {
      setInputState((prev) => ({
        ...prev,
        field_name: savedFarm.field_name || prev.field_name,
        Soil_Type: savedFarm.soil_type || prev.Soil_Type,
        Irrigation: savedFarm.irrigation_method || prev.Irrigation,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await predictYield(inputState);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate yield prediction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-semibold mb-2">
            <span>🌾 Yield Forecast Module</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Estimate Expected Crop Yield
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Provide your crop, soil, weather, and farm management details to calculate forecasted harvest yield (ton/ha).
          </p>
        </div>

        <button
          type="button"
          onClick={handleUseSavedFarmDetails}
          className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-semibold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800 transition self-start sm:self-auto"
        >
          ✨ Use Saved Farm Details
        </button>
      </div>

      {/* Main Grid: Form Steps & Live Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-7 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-2xl border border-red-200 dark:border-red-900 text-xs">
                ⚠️ {error}
              </div>
            )}

            {/* Field / Plot Name (Optional Metadata) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Field / Plot Name (Optional Metadata)
              </label>
              <input
                type="text"
                value={inputState.field_name || ''}
                onChange={(e) => handleInputChange('field_name', e.target.value)}
                placeholder="e.g. North Field (Plot 3)"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* STEP 1: CROP & REGION */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setActiveStep(activeStep === 1 ? 0 : 1)}
                className="w-full p-4 flex items-center justify-between text-left bg-slate-50/50 dark:bg-slate-800/30"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    Step 1 — Crop & Region
                  </span>
                </div>
                <span className="text-xs text-slate-400">{activeStep === 1 ? '▲' : '▼'}</span>
              </button>

              {activeStep === 1 && (
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Target Crop *
                    </label>
                    <select
                      value={inputState.Crop}
                      onChange={(e) => handleInputChange('Crop', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    >
                      <option value="Wheat">Wheat</option>
                      <option value="Rice">Rice</option>
                      <option value="Maize">Maize</option>
                      <option value="Barley">Barley</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Agricultural Region *
                    </label>
                    <select
                      value={inputState.Region}
                      onChange={(e) => handleInputChange('Region', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    >
                      <option value="Region_A">Region A</option>
                      <option value="Region_B">Region B</option>
                      <option value="Region_C">Region C</option>
                      <option value="Region_D">Region D</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: SOIL */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setActiveStep(activeStep === 2 ? 0 : 2)}
                className="w-full p-4 flex items-center justify-between text-left bg-slate-50/50 dark:bg-slate-800/30"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    Step 2 — Soil Profile
                  </span>
                </div>
                <span className="text-xs text-slate-400">{activeStep === 2 ? '▲' : '▼'}</span>
              </button>

              {activeStep === 2 && (
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Soil Texture Type *
                    </label>
                    <select
                      value={inputState.Soil_Type}
                      onChange={(e) => handleInputChange('Soil_Type', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    >
                      <option value="Loam">Loam (Balanced)</option>
                      <option value="Sandy">Sandy (Draining)</option>
                      <option value="Clay">Clay (Retentive)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Soil pH (0 - 14) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="14"
                      value={inputState.Soil_pH}
                      onChange={(e) => handleInputChange('Soil_pH', parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                    <span className="text-[11px] text-slate-400 block mt-1">
                      Shows how acidic or alkaline your soil is (6.5 - 7.5 is neutral).
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 3: WEATHER */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setActiveStep(activeStep === 3 ? 0 : 3)}
                className="w-full p-4 flex items-center justify-between text-left bg-slate-50/50 dark:bg-slate-800/30"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    Step 3 — Weather Conditions
                  </span>
                </div>
                <span className="text-xs text-slate-400">{activeStep === 3 ? '▲' : '▼'}</span>
              </button>

              {activeStep === 3 && (
                <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Avg Temp (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={inputState.Temperature_C}
                      onChange={(e) => handleInputChange('Temperature_C', parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Relative Humidity (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={inputState.Humidity_pct}
                      onChange={(e) => handleInputChange('Humidity_pct', parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Rainfall (mm)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={inputState.Rainfall_mm}
                      onChange={(e) => handleInputChange('Rainfall_mm', parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* STEP 4: FARM MANAGEMENT */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setActiveStep(activeStep === 4 ? 0 : 4)}
                className="w-full p-4 flex items-center justify-between text-left bg-slate-50/50 dark:bg-slate-800/30"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                    4
                  </span>
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    Step 4 — Farm Management Inputs
                  </span>
                </div>
                <span className="text-xs text-slate-400">{activeStep === 4 ? '▲' : '▼'}</span>
              </button>

              {activeStep === 4 && (
                <div className="p-5 space-y-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Fertilizer Applied (kg/cycle)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={inputState.Fertilizer_Used_kg}
                        onChange={(e) => handleInputChange('Fertilizer_Used_kg', parseFloat(e.target.value) || 0)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Irrigation Method
                      </label>
                      <select
                        value={inputState.Irrigation}
                        onChange={(e) => handleInputChange('Irrigation', e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      >
                        <option value="Sprinkler">Sprinkler</option>
                        <option value="Drip">Drip</option>
                        <option value="Flood">Flood</option>
                        <option value="Unknown">Rainfed / None</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Pesticides (kg/cycle)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={inputState.Pesticides_Used_kg}
                        onChange={(e) => handleInputChange('Pesticides_Used_kg', parseFloat(e.target.value) || 0)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Planting Density (plants/m²)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={inputState.Planting_Density}
                        onChange={(e) => handleInputChange('Planting_Density', parseFloat(e.target.value) || 0)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Previous Crop
                      </label>
                      <select
                        value={inputState.Previous_Crop}
                        onChange={(e) => handleInputChange('Previous_Crop', e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      >
                        <option value="Maize">Maize</option>
                        <option value="Wheat">Wheat</option>
                        <option value="Rice">Rice</option>
                        <option value="Barley">Barley</option>
                        <option value="Unknown">Other / None</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm rounded-2xl shadow-lg transition duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Calculating Forecast...' : '🌾 Predict My Yield'}
              </button>
            </div>
          </form>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-5 space-y-6">
          {result ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-emerald-500/30 shadow-xl space-y-6 animate-fade-in">
              {/* Primary Yield Banner */}
              <div className="text-center p-6 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-200 dark:border-emerald-800/80">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block mb-1">
                  Estimated Crop Yield
                </span>
                <div className="text-4xl sm:text-5xl font-extrabold text-emerald-900 dark:text-emerald-100 my-2">
                  {result.predicted_yield_ton_per_ha.toFixed(2)}{' '}
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                    ton/ha
                  </span>
                </div>
                <p className="text-xs text-emerald-800 dark:text-emerald-200 mt-2">
                  Estimated yield based on the conditions you provided.
                </p>
              </div>

              {/* Concise Input Parameters Summary */}
              <div>
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                  Supplied Field Summary
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl">
                    <span className="text-slate-400 block">Crop & Region</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {inputState.Crop} ({inputState.Region})
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl">
                    <span className="text-slate-400 block">Soil & pH</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {inputState.Soil_Type} (pH {inputState.Soil_pH})
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl">
                    <span className="text-slate-400 block">Weather</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {inputState.Temperature_C}°C, {inputState.Rainfall_mm}mm
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl">
                    <span className="text-slate-400 block">Irrigation</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {inputState.Irrigation}
                    </span>
                  </div>
                </div>
              </div>

              {/* Agronomic Guidance Insights */}
              {result.insights && result.insights.data_driven_insights && (
                <div>
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Key Agronomic Observations
                  </h3>
                  <div className="space-y-2">
                    {result.insights.data_driven_insights.map((insight, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs space-y-1 border border-slate-100 dark:border-slate-800"
                      >
                        <div className="font-bold text-slate-800 dark:text-slate-100">
                          {insight.title}
                        </div>
                        <div className="text-slate-600 dark:text-slate-400">
                          {insight.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-3xl mx-auto">
                📊
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Ready to Calculate Forecast
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Fill in your farm details on the left and click "Predict My Yield" to view estimated ton/ha results.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
