import React, { useState } from 'react';
import { RecommendationInput, RecommendationResult } from '../types';
import { predictRecommendation } from '../services/api';

export const CropRecommendationTab: React.FC = () => {
  const [input, setInput] = useState<RecommendationInput>({
    Temperature: 24.5,
    Humidity: 65.0,
    pH: 6.8,
    Rainfall: 800.0,
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendationResult | null>(null);

  const handleChange = (field: keyof RecommendationInput, val: number) => {
    setInput((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await predictRecommendation(input);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Crop suitability analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Module Title */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 rounded-full text-xs font-semibold mb-2">
          <span>🌱 Crop Suitability Module</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Analyze Crop Suitability
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Input local temperature, humidity, soil pH, and rainfall to discover crop varieties best matched for your environment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
            Environmental Growing Conditions
          </h3>

          {error && (
            <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-900">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <label className="text-slate-700 dark:text-slate-300">
                  Average Temperature (°C)
                </label>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  {input.Temperature} °C
                </span>
              </div>
              <input
                type="number"
                step="0.5"
                value={input.Temperature}
                onChange={(e) => handleChange('Temperature', parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <label className="text-slate-700 dark:text-slate-300">
                  Relative Humidity (%)
                </label>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  {input.Humidity} %
                </span>
              </div>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={input.Humidity}
                onChange={(e) => handleChange('Humidity', parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <label className="text-slate-700 dark:text-slate-300">Soil pH Scale (0-14)</label>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  pH {input.pH}
                </span>
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                max="14"
                value={input.pH}
                onChange={(e) => handleChange('pH', parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                Shows soil acidity/alkalinity.
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <label className="text-slate-700 dark:text-slate-300">Rainfall (mm)</label>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  {input.Rainfall} mm
                </span>
              </div>
              <input
                type="number"
                step="10"
                min="0"
                value={input.Rainfall}
                onChange={(e) => handleChange('Rainfall', parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-2xl transition shadow-md disabled:opacity-50"
              >
                {loading ? 'Analyzing your conditions...' : '🌱 Analyze Crop Suitability'}
              </button>
            </div>
          </form>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-6 space-y-6">
          {result ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-teal-500/30 shadow-xl space-y-6 animate-fade-in">
              {/* Best Match Banner */}
              <div className="text-center p-6 bg-teal-50 dark:bg-teal-950/60 rounded-2xl border border-teal-200 dark:border-teal-800">
                <span className="text-xs font-semibold text-teal-800 dark:text-teal-300 uppercase tracking-wider block mb-1">
                  Optimal Best Match
                </span>
                <div className="text-3xl font-extrabold text-teal-950 dark:text-teal-100 capitalize my-2">
                  🌾 {result.recommended_crop}
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-600 text-white text-xs font-bold rounded-full">
                  <span>Model Confidence: {result.confidence_pct}</span>
                </div>
              </div>

              {/* Ranked Candidate List */}
              <div>
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                  Relative Suitability Candidate Rankings
                </h3>
                <div className="space-y-2">
                  {result.top_candidates.map((cand, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold flex items-center justify-center text-slate-700 dark:text-slate-300">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100 capitalize">
                          {cand.crop}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                        {cand.confidence_pct}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Soil pH Analysis */}
              {result.soil_ph_analysis && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                  <div className="font-bold text-slate-800 dark:text-slate-100">
                    Soil pH Assessment: {result.soil_ph_analysis.category}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    {result.soil_ph_analysis.guidance}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-3xl mx-auto">
                🌱
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Ready for Suitability Matching
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Set your growing conditions on the left and click "Analyze Crop Suitability" to view crop rankings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
