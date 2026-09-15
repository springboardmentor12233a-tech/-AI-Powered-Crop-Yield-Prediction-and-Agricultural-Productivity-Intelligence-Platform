import React, { useState } from 'react';
import { YieldInput, PredictionReportResponse } from '../types';
import { generatePredictionReport } from '../services/api';
import { FormattedReportViewer } from './FormattedReportViewer';

interface PredictionReportsTabProps {
  inputState: YieldInput;
}

export const PredictionReportsTab: React.FC<PredictionReportsTabProps> = ({ inputState }) => {
  const [report, setReport] = useState<PredictionReportResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generatePredictionReport(inputState);
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to compile agronomic prediction report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Generation Trigger */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">📋</span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Official Agronomic Prediction Report
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compile a comprehensive intelligence summary for {inputState.plot_label || 'Current Plot'} (Target Crop: {inputState.Crop}).
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition duration-150 flex items-center gap-2 shadow-md shadow-emerald-900/20 disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Compiling Document...</span>
            </>
          ) : (
            <>
              <span>⚡ Generate & Preview Report</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl p-4 text-rose-800 dark:text-rose-300 text-xs">
          <strong>Report Compilation Failed:</strong> {error}
        </div>
      )}

      {/* Render Formatted Report or Empty State */}
      {report ? (
        <FormattedReportViewer report={report} />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-12 sm:p-16 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center">
          <span className="text-4xl mb-3">📄</span>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No Report Generated Yet
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
            Click the generate button above to compile an official, exportable prediction report based on your currently configured field parameters.
          </p>
        </div>
      )}
    </div>
  );
};
