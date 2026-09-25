import React from 'react';
import { SavedReport } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

  const risk = report.risk_assessment || (report.insights as any)?.risk_assessment;
  const llmInsights = report.llm_insights || (report.insights as any)?.llm_insights;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              YieldSense AI Productivity & Seasonal Intelligence
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Agronomic Assessment Report ({report.report_id})
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onDownloadPdf}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition shadow flex items-center gap-1.5"
            >
              <span>📥</span> Download Official PDF
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
              <span className="font-bold text-slate-800 dark:text-slate-100">{report.crop} ({report.region})</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Field / Plot</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {report.field_name || 'North Field'}
              </span>
            </div>
          </div>

          {/* Section 1: Yield Forecast */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              1. ML Forecasted Crop Yield
            </h4>
            <div className="p-5 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold block">
                  Projected Harvest Yield
                </span>
                <div className="text-3xl font-extrabold text-emerald-950 dark:text-emerald-100">
                  {report.predicted_yield.toFixed(2)}{' '}
                  <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                    ton/ha
                  </span>
                </div>
              </div>
              <div className="text-right text-xs text-emerald-800 dark:text-emerald-300 max-w-xs">
                In-memory machine learning regression estimate evaluated against historical field benchmarks.
              </div>
            </div>
          </div>

          {/* Section 2: Agricultural Risk Assessment */}
          {risk && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                2. Agricultural Risk Assessment
              </h4>
              <div
                className={`p-4 rounded-2xl border text-xs ${
                  risk.overall_risk === 'Low'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-900 dark:text-emerald-200'
                    : risk.overall_risk === 'High'
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-200 text-red-900 dark:text-red-200'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 text-amber-900 dark:text-amber-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">Overall Risk Rating: {risk.overall_risk}</span>
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-white/60 dark:bg-black/30">
                    Score: {risk.risk_score} / 10
                  </span>
                </div>
                <p className="mb-3">{risk.summary}</p>
                {risk.risk_factors && (
                  <div className="space-y-1.5 pt-2 border-t border-black/10 dark:border-white/10">
                    {risk.risk_factors.map((rf: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="font-bold shrink-0">• {rf.factor}:</span>
                        <span>{rf.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 3: AI Agronomic Explanations & Suggestions */}
          {llmInsights && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  3. Agronomic Findings & Actionable Advice
                </h4>
                <span className="text-[10px] text-slate-400 italic">
                  Source: {llmInsights.source}
                </span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2 overflow-x-auto prose prose-sm dark:prose-invert prose-emerald max-w-none prose-p:leading-relaxed prose-table:w-full prose-th:bg-slate-100 dark:prose-th:bg-slate-800 prose-td:border-slate-200 dark:prose-td:border-slate-700">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {llmInsights.content}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Section 4: Input Parameters Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              4. Field Parameters Summary
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
                <span className="font-bold">{report.fertilizer_kg} kg/ha</span>
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

          {/* Section 5: Disclaimer */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700 dark:text-slate-300">
              Important Decision Support Notice
            </div>
            <p>
              This assessment report is generated using machine learning predictive models and verified agronomic telemetry. Recommendations are intended for decision support and planning. Actual crop performance is subject to local weather conditions and agronomic management.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
