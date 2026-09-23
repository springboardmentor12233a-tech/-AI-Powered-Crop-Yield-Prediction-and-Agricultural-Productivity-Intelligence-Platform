import React, { useState } from 'react';
import { RecommendationInput, RecommendationResult } from '../types';
import { predictCropRecommendation } from '../services/api';

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
      const data = await predictCropRecommendation(input);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Crop suitability analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Module Title */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 rounded-full text-xs font-semibold mb-2">
          <span>🌱 Crop Suitability Analysis</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Find Optimal Crops for Your Land
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Tell us about your growing environment to discover top machine-learning recommended crops matched to your soil pH, temperature, humidity, and rainfall.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
            Growing Conditions & Soil Parameters
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
                <span className="text-teal-700 dark:text-teal-400 font-bold">
                  {input.Temperature}°C
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="0.5"
                value={input.Temperature}
                onChange={(e) => handleChange('Temperature', parseFloat(e.target.value))}
                className="w-full accent-teal-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>5°C (Cool)</span>
                <span>27°C (Moderate)</span>
                <span>50°C (Hot)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <label className="text-slate-700 dark:text-slate-300">
                  Relative Humidity (%)
                </label>
                <span className="text-teal-700 dark:text-teal-400 font-bold">
                  {input.Humidity}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="1"
                value={input.Humidity}
                onChange={(e) => handleChange('Humidity', parseFloat(e.target.value))}
                className="w-full accent-teal-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>10% (Dry)</span>
                <span>60% (Optimal)</span>
                <span>100% (Humid)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <label className="text-slate-700 dark:text-slate-300">
                  Soil pH Level
                </label>
                <span className="text-teal-700 dark:text-teal-400 font-bold">
                  pH {input.pH}
                </span>
              </div>
              <input
                type="range"
                min="3.5"
                max="10.0"
                step="0.1"
                value={input.pH}
                onChange={(e) => handleChange('pH', parseFloat(e.target.value))}
                className="w-full accent-teal-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>3.5 (Acidic)</span>
                <span>6.5–7.0 (Neutral)</span>
                <span>10.0 (Alkaline)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <label className="text-slate-700 dark:text-slate-300">
                  Annual Rainfall (mm)
                </label>
                <span className="text-teal-700 dark:text-teal-400 font-bold">
                  {input.Rainfall} mm
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="3000"
                step="10"
                value={input.Rainfall}
                onChange={(e) => handleChange('Rainfall', parseFloat(e.target.value))}
                className="w-full accent-teal-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>50 mm (Low)</span>
                <span>1000 mm (Moderate)</span>
                <span>3000 mm (Heavy)</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Matching Environmental Conditions...</span>
                </>
              ) : (
                <>
                  <span>🌱 Find Suitable Crops</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-6 space-y-6">
          {!result ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">
              <div className="w-16 h-16 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 rounded-2xl flex items-center justify-center text-3xl mx-auto">
                🌾
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Awaiting Environmental Inputs
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Adjust temperature, humidity, pH, and precipitation sliders to receive top multi-crop suitability recommendations.
              </p>
            </div>
          ) : (
            <div className="space-y-5 animate-fade-in">
              {/* Top Recommended Crop Banner */}
              <div className="bg-gradient-to-r from-teal-800 to-emerald-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-teal-600/40 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-200">
                      Top Match
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-extrabold mt-1">
                      {result.recommended_crop}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-teal-200 block">Match Confidence</span>
                    <span className="text-xl sm:text-2xl font-black text-white">
                      {result.confidence_pct}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-teal-100 leading-relaxed pt-2 border-t border-teal-700/50">
                  {result.recommended_crop} is scientifically matched to thrive within your temperature ({input.Temperature}°C), humidity ({input.Humidity}%), and moisture parameters.
                </p>
              </div>

              {/* Alternative Recommended Candidates */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Top Recommended Crops
                </h4>
                <div className="space-y-2">
                  {result.top_candidates.map((cand, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {cand.crop}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-2.5 py-1 rounded-full">
                        {cand.confidence_pct} match
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Soil pH Analysis Card */}
              {result.soil_ph_analysis && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Soil pH Classification
                    </h4>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {result.soil_ph_analysis.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {result.soil_ph_analysis.guidance}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
