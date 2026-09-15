import React, { useState } from 'react';
import { PredictionReportResponse } from '../types';

interface FormattedReportViewerProps {
  report: PredictionReportResponse;
}

export const FormattedReportViewer: React.FC<FormattedReportViewerProps> = ({ report }) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const text = `YieldSense AI Agricultural Report
Report ID: ${report.report_id}
Generated: ${report.generated_at}
Plot: ${report.farm_details.plot_label} (${report.farm_details.region})
Crop: ${report.agronomic_inputs.crop_selected}
Predicted Yield: ${report.forecast_results.predicted_yield_ton_per_ha} ton/ha
Soil: ${report.agronomic_inputs.soil_texture} (pH ${report.agronomic_inputs.soil_ph}, ${report.agronomic_inputs.soil_classification})
Weather: ${report.agronomic_inputs.temperature_c}°C, ${report.agronomic_inputs.humidity_pct}% humidity, ${report.agronomic_inputs.rainfall_mm}mm rainfall
Management: ${report.agronomic_inputs.fertilizer_applied_kg}kg/ha fertilizer, ${report.agronomic_inputs.irrigation_method} irrigation`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const inp = report.agronomic_inputs;
  const fc = report.forecast_results;
  const ins = report.insights_summary;

  return (
    <div className="space-y-6">
      {/* Report Action Bar (Hidden on print) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <div className="flex items-center gap-2">
          <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
            Report ID: {report.report_id}
          </span>
          <span className="text-slate-400 text-xs">•</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{report.generated_at}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/80 transition flex items-center gap-1.5 shadow-sm"
          >
            <span>{copied ? '✅ Copied!' : '📋 Copy Summary'}</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm shadow-emerald-900/20"
          >
            <span>🖨️ Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Main Printable Document Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-sm space-y-8">
        {/* Document Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌾</span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  YieldSense AI — Agricultural Intelligence Report
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Standardized Agronomic Forecast & Field Condition Assessment
              </p>
            </div>
            <div className="text-right text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
              <div><strong className="text-slate-800 dark:text-slate-200">Report ID:</strong> {report.report_id}</div>
              <div><strong className="text-slate-800 dark:text-slate-200">Issued:</strong> {report.generated_at}</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Farm / Holding</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{report.farm_details.farm_id}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Field Plot Identifier</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{report.farm_details.plot_label}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Geographic Zone</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{report.farm_details.region}</span>
            </div>
          </div>
        </div>

        {/* Section 1: Executive Forecast Summary */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
            1. Harvest Yield Forecast
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-5">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase">
                Target Crop Production Estimate
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-700 dark:text-emerald-300 my-1">
                {fc.predicted_yield_ton_per_ha.toFixed(2)}{' '}
                <span className="text-base font-normal text-emerald-600 dark:text-emerald-400">ton/ha</span>
              </div>
              <p className="text-xs text-emerald-900 dark:text-emerald-200">
                Projected yield for <strong>{inp.crop_selected}</strong> under evaluated soil conditions ({inp.soil_texture}, pH {inp.soil_ph}) and management practices.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between text-xs space-y-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Alternative Crop Suitability:</span>
              <div className="space-y-1">
                {fc.top_recommended_alternatives?.slice(0, 3).map((alt, i) => (
                  <div key={i} className="flex justify-between text-slate-600 dark:text-slate-300 text-[11px]">
                    <span>• {alt.crop}</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">{alt.confidence_pct}</span>
                  </div>
                ))}
              </div>
              <span className="text-[10px] text-slate-400 italic">Evaluated for local climate</span>
            </div>
          </div>
        </div>

        {/* Section 2: Input Parameter Audit Table */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
            2. Agronomic & Environmental Input Audit
          </h3>
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Parameter Category</th>
                  <th className="py-2.5 px-4 font-semibold">Input Feature</th>
                  <th className="py-2.5 px-4 font-semibold">Evaluated Value</th>
                  <th className="py-2.5 px-4 font-semibold">Agronomic Assessment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                <tr>
                  <td className="py-2 px-4 font-medium text-slate-500 dark:text-slate-400">Soil Condition</td>
                  <td className="py-2 px-4 font-medium">Soil pH</td>
                  <td className="py-2 px-4 font-bold">{inp.soil_ph.toFixed(2)}</td>
                  <td className="py-2 px-4">{inp.soil_classification}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-medium text-slate-500 dark:text-slate-400">Soil Condition</td>
                  <td className="py-2 px-4 font-medium">Soil Texture</td>
                  <td className="py-2 px-4 font-bold">{inp.soil_texture}</td>
                  <td className="py-2 px-4">Standard Agricultural Arable Soil</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-medium text-slate-500 dark:text-slate-400">Climate</td>
                  <td className="py-2 px-4 font-medium">Average Temperature</td>
                  <td className="py-2 px-4 font-bold">{inp.temperature_c.toFixed(1)} °C</td>
                  <td className="py-2 px-4">Thermal Growth Regime</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-medium text-slate-500 dark:text-slate-400">Climate</td>
                  <td className="py-2 px-4 font-medium">Relative Humidity</td>
                  <td className="py-2 px-4 font-bold">{inp.humidity_pct.toFixed(0)} %</td>
                  <td className="py-2 px-4">Atmospheric Moisture</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-medium text-slate-500 dark:text-slate-400">Precipitation</td>
                  <td className="py-2 px-4 font-medium">Seasonal Rainfall</td>
                  <td className="py-2 px-4 font-bold">{inp.rainfall_mm.toFixed(0)} mm</td>
                  <td className="py-2 px-4">Precipitation Supply</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-medium text-slate-500 dark:text-slate-400">Management</td>
                  <td className="py-2 px-4 font-medium">Fertilizer Application</td>
                  <td className="py-2 px-4 font-bold">{inp.fertilizer_applied_kg} kg/ha</td>
                  <td className="py-2 px-4">Nutrient Replenishment</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-medium text-slate-500 dark:text-slate-400">Management</td>
                  <td className="py-2 px-4 font-medium">Irrigation Method</td>
                  <td className="py-2 px-4 font-bold">{inp.irrigation_method}</td>
                  <td className="py-2 px-4">Water Application Method</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-medium text-slate-500 dark:text-slate-400">Rotation</td>
                  <td className="py-2 px-4 font-medium">Preceding Crop</td>
                  <td className="py-2 px-4 font-bold">{inp.preceding_crop}</td>
                  <td className="py-2 px-4">Previous Field Crop</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Multi-Tier Intelligence Cards */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
            3. Automated Agronomic Intelligence & Risk Assessment
          </h3>
          <div className="space-y-3 text-xs">
            {ins?.data_driven_insights?.map((item, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40">
                <span className="font-bold text-sky-900 dark:text-sky-300 block mb-1">
                  📊 [Field Observation] {item.title}
                </span>
                <p className="text-slate-700 dark:text-slate-300">{item.description}</p>
              </div>
            ))}

            {ins?.general_guidance?.map((item, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
                <span className="font-bold text-emerald-900 dark:text-emerald-300 block mb-1">
                  🌱 [Agronomic Guidance] {item.title}
                </span>
                <p className="text-slate-700 dark:text-slate-300">{item.description}</p>
              </div>
            ))}

            {ins?.risk_alerts?.map((item, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60">
                <span className="font-bold text-amber-900 dark:text-amber-300 block mb-1">
                  ⚠️ [Advisory Alert] {item.title}
                </span>
                <p className="text-slate-700 dark:text-slate-300">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Document Sign-off & Disclaimers */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5 leading-relaxed">
          <strong className="block text-slate-700 dark:text-slate-300">Methodology & Operational Disclaimer:</strong>
          <p>
            This intelligence report was generated by YieldSense AI utilizing empirical agricultural data modeling. Forecasts represent expected statistical harvest averages under standard climatic cycles. Actual yields may vary due to localized micro-climate variations, pest outbreaks, or extreme meteorological anomalies.
          </p>
          <p className="pt-2 text-[10px] text-slate-400">
            YieldSense AI Platform • Version 2.0.0 • Verified Milestone 2 Production Build
          </p>
        </div>
      </div>
    </div>
  );
};
