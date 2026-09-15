import React, { useEffect, useState } from 'react';
import { WeatherAnalyticsSummary, SoilAnalyticsSummary } from '../types';
import { fetchWeatherAnalytics, fetchSoilAnalytics } from '../services/api';

export const WeatherSoilAnalyticsTab: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherAnalyticsSummary | null>(null);
  const [soilData, setSoilData] = useState<SoilAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    Promise.all([fetchWeatherAnalytics(), fetchSoilAnalytics()])
      .then(([w, s]) => {
        if (isMounted) {
          setWeatherData(w);
          setSoilData(s);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError(err.message || 'Failed to load statistical weather and soil analytics.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
        <svg className="animate-spin h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Loading Agro-Climatic & Soil Intelligence...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl p-6 text-rose-800 dark:text-rose-300 text-sm">
        <strong>Error Loading Analytics:</strong> {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Notice on Dataset-Driven Analysis & N/P/K Boundary */}
      <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 sm:p-5 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-3 shadow-sm">
        <span className="text-lg flex-shrink-0">ℹ️</span>
        <div className="space-y-1">
          <strong className="block font-bold text-sm">
            Agro-Climatic Intelligence & Soil Data Scope:
          </strong>
          <p className="text-emerald-800 dark:text-emerald-300/90 leading-relaxed">
            These climatic tolerance envelopes and soil texture benchmarks are statistically derived from verified historical agricultural datasets. In accordance with data integrity guidelines, soil analysis utilizes standardized pH and physical texture classifications. Physical Nitrogen (N), Phosphorus (P), and Potassium (K) telemetry are reserved for future hardware IoT sensor integration.
          </p>
        </div>
      </div>

      {/* Section 1: Optimal Climatic Envelopes for Major Crops */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🌦️</span>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Optimal Crop Climatic Envelopes
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ideal temperature, moisture, and precipitation ranges derived from species growth profiles.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {weatherData?.crop_climatic_profiles &&
            Object.entries(weatherData.crop_climatic_profiles).map(([crop, prof]) => (
              <div
                key={crop}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-emerald-500/40 transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{crop}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    Optimal
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-500 dark:text-slate-400">🌡️ Temp:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{prof.opt_temp_range}</span>
                  </div>
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-500 dark:text-slate-400">💧 Humidity:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{prof.opt_humidity_range}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">🌧️ Rainfall:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{prof.opt_rainfall_range}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Section 2: Soil Texture Yield Performance Benchmarks */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🌍</span>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Soil Texture Yield Benchmarks
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comparative harvest performance across verified agricultural soil categories.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {soilData?.soil_texture_performance &&
            Object.entries(soilData.soil_texture_performance).map(([soil, stats]) => (
              <div
                key={soil}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white text-base">{soil} Soil</span>
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-slate-600 dark:text-slate-300 font-medium">
                    {stats.record_count.toLocaleString()} field plots
                  </span>
                </div>

                <div>
                  <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {stats.avg_yield_ton_ha.toFixed(2)}{' '}
                    <span className="text-sm font-normal text-slate-500 dark:text-slate-400">ton/ha avg</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Observed Range: {stats.min_yield} – {stats.max_yield} ton/ha
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold block mb-1">Commonly Cultivated:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {stats.crops_grown.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Section 3: USDA Soil pH Agronomic Guide */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <span>🧪</span> USDA Soil pH Classification Reference
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-2.5 font-semibold">pH Interval</th>
                <th className="py-2.5 font-semibold">Classification</th>
                <th className="py-2.5 font-semibold">Agronomic Guidance</th>
                <th className="py-2.5 font-semibold">Typical Suitable Crops</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              <tr>
                <td className="py-3 font-semibold text-rose-600 dark:text-rose-400">&lt; 5.5</td>
                <td className="py-3 font-semibold">Strongly Acidic</td>
                <td className="py-3">Liming (calcium carbonate) advised to improve base saturation for legumes.</td>
                <td className="py-3">Tea, Potato, Sweet Potato, Blueberry</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-amber-600 dark:text-amber-400">5.5 – 6.5</td>
                <td className="py-3 font-semibold">Moderately Acidic</td>
                <td className="py-3">Optimal bioavailability for most cereal grains and pulses.</td>
                <td className="py-3">Rice, Maize, Wheat, Soybean, Groundnut</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-emerald-600 dark:text-emerald-400">6.5 – 7.5</td>
                <td className="py-3 font-semibold">Neutral (Ideal)</td>
                <td className="py-3">Maximum nutrient bioavailability and microbial health.</td>
                <td className="py-3">Wheat, Barley, Rice, Cotton, Sugarcane, Chickpea</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-sky-600 dark:text-sky-400">7.5 – 8.5</td>
                <td className="py-3 font-semibold">Moderately Alkaline</td>
                <td className="py-3">Acid-forming fertilizers (e.g. ammonium sulfate) can balance pH.</td>
                <td className="py-3">Barley, Cotton, Sugar Beet, Mustard</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-purple-600 dark:text-purple-400">&gt; 8.5</td>
                <td className="py-3 font-semibold">Strongly Alkaline</td>
                <td className="py-3">Gypsum or organic mulch application required to lower sodicity.</td>
                <td className="py-3">Barley, Date Palm</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
