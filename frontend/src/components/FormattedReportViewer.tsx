import React from 'react';
import { SavedReport } from '../types';

interface FormattedReportViewerProps {
  report: SavedReport;
  onClose: () => void;
  onDownloadPdf: () => void;
}

export const FormattedReportViewer: React.FC<FormattedReportViewerProps> = ({
  report,
  onClose,
  onDownloadPdf,
}) => {
  if (!report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              YieldSense AI Agronomic Assessment
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Crop Yield Assessment Report ({report.report_id})
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onDownloadPdf}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition shadow flex items-center gap-1.5"
            >
              <span>📥</span> Download PDF
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-300"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold">Report ID</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                {report.report_id}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Date</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {report.created_at ? report.created_at.substring(0, 10) : 'Today'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Target Crop</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">{report.crop}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Field / Plot</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {report.field_name || 'Main Field'}
              </span>
            </div>
          </div>

          {/* Section 1: Yield Forecast */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              1. Yield Forecast
            </h4>
            <div className="p-5 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold block">
                  Forecasted Harvest Yield
                </span>
                <div className="text-3xl font-extrabold text-emerald-950 dark:text-emerald-100">
                  {report.predicted_yield.toFixed(2)}{' '}
                  <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                    ton/ha
                  </span>
                </div>
              </div>
              <div className="text-right text-xs text-emerald-800 dark:text-emerald-300 max-w-xs">
                Estimated yield based on the supplied soil, weather, and management inputs.
              </div>
            </div>
          </div>

          {/* Section 2: Field Conditions */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              2. Field & Environmental Conditions
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 block">Soil Texture</span>
                <span className="font-bold">{report.soil_type}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 block">Soil pH</span>
                <span className="font-bold">pH {report.soil_ph}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 block">Temperature</span>
                <span className="font-bold">{report.temperature_c}°C</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 block">Humidity</span>
                <span className="font-bold">{report.humidity_pct}%</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 block">Precipitation</span>
                <span className="font-bold">{report.rainfall_mm} mm</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 block">Fertilizer</span>
                <span className="font-bold">{report.fertilizer_kg} kg/cycle</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 block">Irrigation</span>
                <span className="font-bold">{report.irrigation}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 block">Previous Crop</span>
                <span className="font-bold">{report.previous_crop}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Agricultural Insights */}
          {report.insights && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                3. Soil & Agro-Meteorological Insights
              </h4>
              <div className="space-y-2 text-xs">
                {report.insights.data_driven_insights?.map((ins, i) => (
                  <div key={i} className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div className="font-bold text-slate-800 dark:text-slate-100">{ins.title}</div>
                    <div className="text-slate-600 dark:text-slate-400 mt-1">{ins.description}</div>
                  </div>
                ))}

                {report.insights.general_guidance?.map((ins, i) => (
                  <div key={i} className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div className="font-bold text-slate-800 dark:text-slate-100">{ins.title}</div>
                    <div className="text-slate-600 dark:text-slate-400 mt-1">{ins.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Notes & Limitations */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700 dark:text-slate-300">
              Important Notes & Limitations
            </div>
            <p>
              This assessment report is generated using machine learning predictive models trained on agricultural datasets. Use predictions as an indicative decision-support guide alongside local agronomic advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
