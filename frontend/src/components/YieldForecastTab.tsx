import React, { useState } from 'react';
import { YieldInput, YieldPredictionResponse } from '../types';
import { predictYield } from '../services/api';
import { TechnicalDetailsModal } from './TechnicalDetailsModal';

interface YieldForecastTabProps {
  inputState: YieldInput;
  setInputState: React.Dispatch<React.SetStateAction<YieldInput>>;
}

export const YieldForecastTab: React.FC<YieldForecastTabProps> = ({
  inputState,
  setInputState,
}) => {
  const [result, setResult] = useState<YieldPredictionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showTechModal, setShowTechModal] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await predictYield(inputState);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while forecasting crop yield.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof YieldInput, value: string | number) => {
    setInputState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Regional baseline reference averages for contextual interpretation
  const regionalAverages: Record<string, number> = {
    Region_A: 112.5,
    Region_B: 116.8,
    Region_C: 119.2,
    Region_D: 124.0,
  };

  const regionalAvg = regionalAverages[inputState.Region] || 118.0;
  const yieldDiffPct = result
    ? (((result.predicted_yield_ton_per_ha - regionalAvg) / regionalAvg) * 100).toFixed(1)
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
      {/* Input Parameters Form */}
      <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm transition-colors">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🚜</span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Field & Crop Management Parameters
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Specify the environmental conditions and agronomic practices for your targeted harvest plot.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Target Crop & Geographic Region */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Crop Variety
              </label>
              <select
                value={inputState.Crop}
                onChange={(e) => handleChange('Crop', e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
              >
                <option value="Wheat">Wheat (Grain)</option>
                <option value="Rice">Rice (Paddy)</option>
                <option value="Maize">Maize (Corn)</option>
                <option value="Barley">Barley</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Geographic Zone / Region
              </label>
              <select
                value={inputState.Region}
                onChange={(e) => handleChange('Region', e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
              >
                <option value="Region_A">Region A (Northern Plains)</option>
                <option value="Region_B">Region B (Eastern Valley)</option>
                <option value="Region_C">Region C (Southern Hills)</option>
                <option value="Region_D">Region D (Western Basin)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Soil Texture, Soil pH, Irrigation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Soil Texture
              </label>
              <select
                value={inputState.Soil_Type}
                onChange={(e) => handleChange('Soil_Type', e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
              >
                <option value="Loam">Loam Soil</option>
                <option value="Clay">Clay Soil</option>
                <option value="Sandy">Sandy Soil</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Soil pH Level
                </label>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {inputState.Soil_pH.toFixed(2)}
                </span>
              </div>
              <input
                type="number"
                step="0.05"
                min="3.0"
                max="10.0"
                value={inputState.Soil_pH}
                onChange={(e) => handleChange('Soil_pH', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Irrigation Method
              </label>
              <select
                value={inputState.Irrigation}
                onChange={(e) => handleChange('Irrigation', e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
              >
                <option value="Sprinkler">Sprinkler Irrigation</option>
                <option value="Drip">Drip Irrigation</option>
                <option value="Flood">Flood / Basin</option>
                <option value="Unknown">Rainfed / Non-specified</option>
              </select>
            </div>
          </div>

          {/* Row 3: Temperature, Humidity, Rainfall */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Avg Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                min="-10"
                max="55"
                value={inputState.Temperature_C}
                onChange={(e) => handleChange('Temperature_C', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Relative Humidity (%)
              </label>
              <input
                type="number"
                step="1"
                min="5"
                max="100"
                value={inputState.Humidity_pct}
                onChange={(e) => handleChange('Humidity_pct', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Total Rainfall (mm)
              </label>
              <input
                type="number"
                step="5"
                min="0"
                max="3000"
                value={inputState.Rainfall_mm}
                onChange={(e) => handleChange('Rainfall_mm', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
              />
            </div>
          </div>

          {/* Row 4: Fertilizer, Pesticides, Planting Density */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Fertilizer Applied (kg/ha)
              </label>
              <input
                type="number"
                step="5"
                min="0"
                max="1000"
                value={inputState.Fertilizer_Used_kg}
                onChange={(e) => handleChange('Fertilizer_Used_kg', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Pesticides (kg/ha)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="200"
                value={inputState.Pesticides_Used_kg}
                onChange={(e) => handleChange('Pesticides_Used_kg', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Planting Density (plants/m²)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="100"
                value={inputState.Planting_Density}
                onChange={(e) => handleChange('Planting_Density', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
              />
            </div>
          </div>

          {/* Row 5: Previous Crop & Plot Label */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Preceding Crop Rotation
              </label>
              <select
                value={inputState.Previous_Crop}
                onChange={(e) => handleChange('Previous_Crop', e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
              >
                <option value="Maize">Maize</option>
                <option value="Rice">Rice</option>
                <option value="Wheat">Wheat</option>
                <option value="Barley">Barley</option>
                <option value="Unknown">Fallow / Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Farm Plot Identifier
              </label>
              <input
                type="text"
                value={inputState.plot_label || ''}
                onChange={(e) => handleChange('plot_label', e.target.value)}
                placeholder="e.g. North Field (Plot 3)"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-md shadow-emerald-900/20 disabled:opacity-50 text-sm"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Evaluating Field Data...</span>
              </>
            ) : (
              <>
                <span>⚡ Calculate Crop Yield Forecast</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Forecast Output & Insights Column */}
      <div className="lg:col-span-5 space-y-6">
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl p-4 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5">
            <span className="text-base">⚠️</span>
            <div>
              <strong className="block font-semibold mb-0.5">Forecast Request Failed:</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {result ? (
          <div className="space-y-5">
            {/* Primary Forecast Card */}
            <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold mb-2">
                <span>ESTIMATED HARVEST YIELD</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px]">
                  Validated Forecast
                </span>
              </div>

              <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight my-2">
                {result.predicted_yield_ton_per_ha.toFixed(2)}{' '}
                <span className="text-lg sm:text-xl font-normal text-emerald-300">ton/ha</span>
              </div>

              <p className="text-xs text-slate-200 mt-2 leading-relaxed">
                Projected harvest for <strong>{inputState.Crop}</strong> on {inputState.Soil_Type} soil in {inputState.Region}.
              </p>

              {/* Regional Context Comparison */}
              {yieldDiffPct && (
                <div className="mt-4 pt-3.5 border-t border-emerald-700/40 flex items-center justify-between text-xs text-slate-200">
                  <span>Regional Baseline Comparison:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded ${
                      parseFloat(yieldDiffPct) >= 0
                        ? 'bg-emerald-500/30 text-emerald-200'
                        : 'bg-amber-500/30 text-amber-200'
                    }`}
                  >
                    {parseFloat(yieldDiffPct) >= 0 ? `+${yieldDiffPct}%` : `${yieldDiffPct}%`} vs avg
                  </span>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-emerald-700/40 flex items-center justify-between text-xs text-emerald-400/80">
                <span>Confidence metric: R² 0.98</span>
                <button
                  type="button"
                  onClick={() => setShowTechModal(true)}
                  className="text-xs text-white underline hover:text-emerald-200 transition"
                >
                  View Model Details ℹ️
                </button>
              </div>
            </div>

            {/* Structured Multi-Tier Advisory Badges */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-3.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>💡</span> Field Intelligence & Agronomic Guidance
              </h3>

              {/* Data-Driven Insights */}
              {result.insights?.data_driven_insights?.map((ins, idx) => (
                <div
                  key={`data-${idx}`}
                  className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40 rounded-xl p-3 text-xs"
                >
                  <span className="font-bold text-sky-800 dark:text-sky-300 block mb-1">
                    📊 [Field Observation] {ins.title}
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">{ins.description}</p>
                </div>
              ))}

              {/* General Agricultural Guidance */}
              {result.insights?.general_guidance?.map((ins, idx) => (
                <div
                  key={`guidance-${idx}`}
                  className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-3 text-xs"
                >
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                    🌱 [Agronomic Practice] {ins.title}
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">{ins.description}</p>
                </div>
              ))}

              {/* Risk Alerts */}
              {result.insights?.risk_alerts?.map((ins, idx) => (
                <div
                  key={`risk-${idx}`}
                  className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-xl p-3 text-xs"
                >
                  <span className="font-bold text-amber-800 dark:text-amber-300 block mb-1">
                    ⚠️ [Advisory Warning] {ins.title}
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">{ins.description}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-slate-100 dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-10 sm:p-14 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center">
            <span className="text-4xl mb-3">📈</span>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ready for Yield Forecasting</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
              Select your targeted crop and field management practices, then click forecast to calculate estimated yield.
            </p>
          </div>
        )}
      </div>

      {/* Technical Model Modal */}
      <TechnicalDetailsModal
        isOpen={showTechModal}
        onClose={() => setShowTechModal(false)}
        title="Crop Yield Regression Architecture"
        details={{
          algorithm: result?.algorithm || 'Ridge Regression Pipeline with StandardScaler & OneHotEncoder',
          modelVersion: result?.model_version || 'YieldSense_Reg_v2.0.0',
          metrics: result?.confidence_metric || 'R²: 0.9821, RMSE: 5.08 ton/ha (5-Fold Cross Validation)',
          featuresUsed: [
            'Crop Species',
            'Region',
            'Soil Texture',
            'Soil pH',
            'Rainfall (mm)',
            'Temperature (°C)',
            'Humidity (%)',
            'Fertilizer (kg)',
            'Pesticides (kg)',
            'Planting Density',
            'Irrigation Method',
            'Previous Crop',
          ],
          notes:
            'Data note: The regression model utilizes continuous environmental and management inputs to provide indicative yield estimates.',
        }}
      />
    </div>
  );
};
