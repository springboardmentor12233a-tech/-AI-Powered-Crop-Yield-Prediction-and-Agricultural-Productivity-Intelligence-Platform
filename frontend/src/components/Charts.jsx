import React from 'react';
import { Sprout, Droplets, Thermometer, FlaskConical, AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * 1. Comparative Crop Yield Bar Chart
 */
export function YieldBarChart({ data = [], title = 'Crop Productivity Ranking (kg/acre)' }) {
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        No crop productivity data available.
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => d.avg_yield_kg_per_acre || d.yield || 0), 100);

  return (
    <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
        <span className="text-xs text-slate-400 font-medium">{data.length} crops analyzed</span>
      </div>

      <div className="space-y-3 pt-2">
        {data.slice(0, 8).map((item, idx) => {
          const val = item.avg_yield_kg_per_acre || item.yield || 0;
          const pct = Math.min(100, Math.max(5, (val / maxVal) * 100));
          const name = item.crop_name || item.name || 'Crop';
          const rating = item.productivity_rating || (val >= 2800 ? 'High' : val >= 1600 ? 'Moderate' : 'Low');

          const barColor =
            rating === 'High'
              ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
              : rating === 'Moderate'
              ? 'bg-gradient-to-r from-amber-400 to-amber-500'
              : 'bg-gradient-to-r from-rose-400 to-rose-500';

          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 w-24 truncate">{name}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      rating === 'High'
                        ? 'bg-emerald-50 text-emerald-700'
                        : rating === 'Moderate'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {rating}
                  </span>
                </div>
                <span className="font-bold text-slate-800">
                  {val.toLocaleString()} <span className="text-[10px] text-slate-400">kg/ac</span>
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 2. Soil pH Spectrum Indicator Gauge
 */
export function SoilPhSpectrumGauge({ ph = 6.5, label = 'Soil pH Level' }) {
  const clampedPh = Math.min(14, Math.max(0, ph));
  // Map 0 - 14 scale to percentage 0% - 100%
  const markerPos = (clampedPh / 14) * 100;

  let statusBadge = { text: 'Optimal (6.0 - 7.5)', color: 'bg-emerald-100 text-emerald-800' };
  if (clampedPh < 5.5) {
    statusBadge = { text: 'Strongly Acidic (< 5.5)', color: 'bg-rose-100 text-rose-800' };
  } else if (clampedPh < 6.0) {
    statusBadge = { text: 'Slightly Acidic (5.5 - 6.0)', color: 'bg-amber-100 text-amber-800' };
  } else if (clampedPh > 7.8) {
    statusBadge = { text: 'Alkaline / Sodic (> 7.8)', color: 'bg-indigo-100 text-indigo-800' };
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">{label}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-800">{clampedPh.toFixed(2)}</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${statusBadge.color}`}>
              {statusBadge.text}
            </span>
          </div>
        </div>
        <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
          <FlaskConical size={20} />
        </div>
      </div>

      {/* Spectrum Bar */}
      <div className="space-y-1.5 pt-2">
        <div className="relative h-4 rounded-full overflow-hidden bg-gradient-to-r from-red-500 via-yellow-400 via-emerald-500 via-teal-500 to-indigo-600 shadow-inner">
          <div
            className="absolute top-0 bottom-0 w-3 -ml-1.5 bg-white border-2 border-slate-900 rounded-full shadow-md transition-all duration-500"
            style={{ left: `${markerPos}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
          <span>0 (Acidic)</span>
          <span>6.0 (Optimal)</span>
          <span>7.5</span>
          <span>14 (Alkaline)</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. N-P-K Nutrient Balance Visualizer
 */
export function NutrientRadarMeter({ n = 60, p = 40, k = 60 }) {
  const nutrients = [
    { name: 'Nitrogen (N)', val: n, max: 150, unit: 'kg/ha', optimal: '50-100', color: 'from-blue-400 to-blue-600' },
    { name: 'Phosphorus (P)', val: p, max: 100, unit: 'kg/ha', optimal: '30-60', color: 'from-amber-400 to-amber-600' },
    { name: 'Potassium (K)', val: k, max: 150, unit: 'kg/ha', optimal: '40-80', color: 'from-purple-400 to-purple-600' },
  ];

  return (
    <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-800">Primary Soil Nutrients (N-P-K)</h3>
        <span className="text-xs text-brand-600 font-semibold bg-brand-50 px-2.5 py-1 rounded-full">
          Field Balance
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-1">
        {nutrients.map((nut, i) => {
          const pct = Math.min(100, Math.max(5, (nut.val / nut.max) * 100));
          return (
            <div key={i} className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">{nut.name}</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-slate-800">{nut.val}</span>
                <span className="text-[10px] text-slate-400">{nut.unit}</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${nut.color} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400">Opt: {nut.optimal}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 4. Productivity Breakdown Donut / Meter
 */
export function ProductivityDonut({ breakdown = {} }) {
  const high = breakdown['High Yield (≥ 3000 kg/ac)'] || breakdown['High Yield'] || 0;
  const mod = breakdown['Moderate Yield (1500 - 3000 kg/ac)'] || breakdown['Moderate Yield'] || 0;
  const low = breakdown['Low Yield (< 1500 kg/ac)'] || breakdown['Low Yield'] || 0;

  const total = high + mod + low || 1;
  const highPct = Math.round((high / total) * 100);
  const modPct = Math.round((mod / total) * 100);
  const lowPct = Math.round((low / total) * 100);

  return (
    <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-800">Yield Productivity Breakdown</h3>
        <span className="text-xs text-slate-400 font-medium">{total.toLocaleString()} total</span>
      </div>

      {/* Multi-segment Progress Bar */}
      <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
        <div className="bg-emerald-500 transition-all duration-700" style={{ width: `${highPct}%` }} title={`High: ${high}`} />
        <div className="bg-amber-400 transition-all duration-700" style={{ width: `${modPct}%` }} title={`Moderate: ${mod}`} />
        <div className="bg-rose-400 transition-all duration-700" style={{ width: `${lowPct}%` }} title={`Low: ${low}`} />
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 text-center">
        <div className="p-2.5 bg-emerald-50/60 rounded-2xl border border-emerald-100/60">
          <div className="flex items-center justify-center gap-1 text-emerald-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>High</span>
          </div>
          <p className="text-lg font-bold text-slate-800 mt-0.5">{highPct}%</p>
          <span className="text-[10px] text-slate-400">{high} records</span>
        </div>

        <div className="p-2.5 bg-amber-50/60 rounded-2xl border border-amber-100/60">
          <div className="flex items-center justify-center gap-1 text-amber-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Moderate</span>
          </div>
          <p className="text-lg font-bold text-slate-800 mt-0.5">{modPct}%</p>
          <span className="text-[10px] text-slate-400">{mod} records</span>
        </div>

        <div className="p-2.5 bg-rose-50/60 rounded-2xl border border-rose-100/60">
          <div className="flex items-center justify-center gap-1 text-rose-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Low</span>
          </div>
          <p className="text-lg font-bold text-slate-800 mt-0.5">{lowPct}%</p>
          <span className="text-[10px] text-slate-400">{low} records</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 5. Radial Risk Gauge
 */
export function RiskScoreGauge({ score = 15, level = 'Low Risk', forecast = 'Optimal Productivity' }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const colorClass =
    score >= 50
      ? 'text-rose-500'
      : score >= 25
      ? 'text-amber-500'
      : 'text-emerald-500';

  const badgeBg =
    score >= 50
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : score >= 25
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  return (
    <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] shadow-sm flex items-center justify-between gap-4">
      <div className="space-y-1">
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Agro-Risk Assessment</span>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badgeBg}`}>
            {level}
          </span>
        </div>
        <p className="text-sm font-semibold text-slate-700 mt-1">{forecast}</p>
        <p className="text-xs text-slate-400">Calculated from Soil pH, Nutrients & Climate</p>
      </div>

      <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="text-slate-100"
            strokeWidth="10"
            stroke="currentColor"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            className={`${colorClass} transition-all duration-1000 ease-out`}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-lg font-extrabold text-slate-800">{Math.round(score)}%</span>
          <span className="text-[9px] text-slate-400 uppercase font-semibold">Risk</span>
        </div>
      </div>
    </div>
  );
}
