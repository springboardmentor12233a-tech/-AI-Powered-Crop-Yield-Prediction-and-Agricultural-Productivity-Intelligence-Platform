import React, { useState } from 'react';
import { RecommendationInput, RecommendationResponse } from '../types';
import { predictRecommendation } from '../services/api';
import { TechnicalDetailsModal } from './TechnicalDetailsModal';

export const CropRecommendationTab: React.FC = () => {
  const [recInput, setRecInput] = useState<RecommendationInput>({
    Temperature: 26.0,
    Humidity: 70.0,
    pH: 6.5,
    Rainfall: 800.0,
  });

  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showTechModal, setShowTechModal] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await predictRecommendation(recInput);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while evaluating crop recommendations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
      {/* Environmental Parameters Column */}
      <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm transition-colors">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🌱</span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Environmental Suitability Matcher
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Identify which crop species are best suited for your local temperature, humidity, soil pH, and rainfall conditions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Temperature Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <span>Ambient Temperature</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                {recInput.Temperature.toFixed(1)} °C
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="0.5"
              value={recInput.Temperature}
              onChange={(e) => setRecInput({ ...recInput, Temperature: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-500"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>5°C (Cool)</span>
              <span>25°C (Temperate)</span>
              <span>50°C (Tropical Heat)</span>
            </div>
          </div>

          {/* Humidity Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <span>Relative Humidity</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                {recInput.Humidity.toFixed(0)} %
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="1"
              value={recInput.Humidity}
              onChange={(e) => setRecInput({ ...recInput, Humidity: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-500"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>10% (Arid)</span>
              <span>55% (Moderate)</span>
              <span>100% (Saturated)</span>
            </div>
          </div>

          {/* Soil pH Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <span>Soil Acidity / pH Level</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                {recInput.pH.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="3.5"
              max="10.0"
              step="0.1"
              value={recInput.pH}
              onChange={(e) => setRecInput({ ...recInput, pH: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-500"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>3.5 (Strongly Acidic)</span>
              <span>7.0 (Neutral)</span>
              <span>10.0 (Alkaline)</span>
            </div>
          </div>

          {/* Rainfall Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <span>Seasonal Precipitation / Rainfall</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                {recInput.Rainfall.toFixed(0)} mm
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="3000"
              step="10"
              value={recInput.Rainfall}
              onChange={(e) => setRecInput({ ...recInput, Rainfall: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-500"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>20 mm (Dry)</span>
              <span>800 mm (Moderate)</span>
              <span>3000 mm (Monsoon)</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-md shadow-emerald-900/20 disabled:opacity-50 text-sm"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Evaluating 70 Crop Varieties...</span>
              </>
            ) : (
              <>
                <span>🌿 Identify Best-Suited Crops</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Recommendation Results Column */}
      <div className="lg:col-span-6 space-y-6">
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl p-4 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5">
            <span className="text-base">⚠️</span>
            <div>
              <strong className="block font-semibold mb-0.5">Recommendation Request Failed:</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {result ? (
          <div className="space-y-5">
            {/* Top Recommended Crop Card */}
            <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative">
              <div className="text-xs text-emerald-300 font-semibold mb-1">RECOMMENDED CROP SPECIES</div>
              <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight my-2">
                {result.recommended_crop}
              </div>
              <p className="text-xs text-slate-200 mt-2">
                Matches your climate profile with <strong>{result.confidence_pct}</strong> statistical suitability.
              </p>
              <div className="mt-4 pt-3 border-t border-emerald-700/40 flex items-center justify-between text-xs text-emerald-300/80">
                <span>Evaluated across 70 crop varieties</span>
                <button
                  type="button"
                  onClick={() => setShowTechModal(true)}
                  className="text-xs text-white underline hover:text-emerald-200 transition"
                >
                  Model Specs ℹ️
                </button>
              </div>
            </div>

            {/* Top Ranked Candidate Alternatives */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center justify-between">
                <span>Top Candidate Crops Ranked</span>
                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  Relative probability
                </span>
              </h3>
              <div className="space-y-3">
                {result.top_candidates?.map((cand, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                      <span>{cand.crop}</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{cand.confidence_pct}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-200 dark:border-slate-800">
                      <div
                        className="bg-emerald-500 dark:bg-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(cand.confidence * 100, 3)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Soil pH Agronomic Guidance */}
            {result.soil_ph_analysis && (
              <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40 rounded-2xl p-5 shadow-sm text-xs space-y-1.5">
                <span className="font-bold text-sky-900 dark:text-sky-300 block text-sm">
                  🧪 Soil pH Status: {result.soil_ph_analysis.category} ({result.soil_ph_analysis.ph})
                </span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {result.soil_ph_analysis.guidance}
                </p>
                <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <strong>Other crops thriving at this pH:</strong>{' '}
                  {result.soil_ph_analysis.recommended_crops?.join(', ')}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-100 dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-10 sm:p-14 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center">
            <span className="text-4xl mb-3">🌱</span>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ready for Recommendation</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
              Adjust the environmental temperature, humidity, pH, and precipitation sliders to identify top-suited crops.
            </p>
          </div>
        )}
      </div>

      {/* Technical Model Modal */}
      <TechnicalDetailsModal
        isOpen={showTechModal}
        onClose={() => setShowTechModal(false)}
        title="Crop Recommendation Classifier Architecture"
        details={{
          algorithm: result?.algorithm || 'Random Forest Classifier (150 trees, max depth 15)',
          modelVersion: result?.model_version || 'YieldSense_Clf_v2.0.0',
          metrics: '95.86% Test Accuracy, 96.23% Stratified 5-Fold Cross Validation Accuracy',
          featuresUsed: ['Ambient Temperature (°C)', 'Relative Humidity (%)', 'Soil pH (0-14)', 'Rainfall (mm)'],
          notes:
            'Data note: Evaluates candidate suitability across 70 distinct crop classes. Soil nutrients (N/P/K) are excluded in compliance with verified dataset schema.',
        }}
      />
    </div>
  );
};
