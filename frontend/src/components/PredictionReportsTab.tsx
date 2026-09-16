import React, { useState, useEffect } from 'react';
import { YieldInput, SavedReport } from '../types';
import { fetchPredictionHistory, downloadReportPdf } from '../services/api';
import { FormattedReportViewer } from './FormattedReportViewer';

interface PredictionReportsTabProps {
  inputState: YieldInput;
  isLoggedIn: boolean;
  onOpenAuth: () => void;
}

export const PredictionReportsTab: React.FC<PredictionReportsTabProps> = ({
  isLoggedIn,
  onOpenAuth,
}) => {
  const [history, setHistory] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedIn) {
      loadHistory();
    }
  }, [isLoggedIn]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const records = await fetchPredictionHistory();
      setHistory(records);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (reportId: string) => {
    setDownloadingId(reportId);
    try {
      await downloadReportPdf(reportId, `YieldSense_AI_Crop_Yield_Report_${reportId}.pdf`);
    } catch (err: any) {
      alert(err.message || 'Failed to download PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-full text-xs font-semibold mb-2">
            <span>📄 My Prediction Reports</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Crop Yield Assessment Reports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            View your saved yield prediction assessments and download printable A4 PDF documents.
          </p>
        </div>

        {isLoggedIn && (
          <button
            onClick={loadHistory}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition self-start sm:self-auto"
          >
            🔄 Refresh History
          </button>
        )}
      </div>

      {!isLoggedIn ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center justify-center text-3xl mx-auto">
            🔐
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Sign In to Access Your Saved Reports
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Authenticated farmers can save predictions, view detailed agronomic assessments, and download PDF reports anytime.
          </p>
          <button
            onClick={onOpenAuth}
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition shadow-md"
          >
            Sign In / Create Account
          </button>
        </div>
      ) : loading ? (
        <div className="text-center py-12 text-xs text-slate-500">Loading your saved report history...</div>
      ) : history.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-3xl mx-auto">
            📋
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            No Saved Reports Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            When you run a yield forecast, your reports will be saved here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.map((rpt) => (
            <div
              key={rpt.report_id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono text-[11px] font-bold rounded-lg">
                    {rpt.report_id}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {rpt.created_at ? rpt.created_at.substring(0, 10) : ''}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {rpt.crop} Forecast
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {rpt.field_name || 'Main Field'} ({rpt.region})
                  </p>
                </div>

                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/60">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                    Estimated Yield
                  </span>
                  <span className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-200">
                    {rpt.predicted_yield.toFixed(2)}{' '}
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      ton/ha
                    </span>
                  </span>
                </div>
              </div>

              <div className="pt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedReport(rpt)}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition text-center"
                >
                  View Report
                </button>
                <button
                  onClick={() => handleDownloadPdf(rpt.report_id)}
                  disabled={downloadingId === rpt.report_id}
                  className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition text-center disabled:opacity-50"
                >
                  {downloadingId === rpt.report_id ? 'Downloading...' : '📥 PDF Download'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Report Modal Viewer */}
      {selectedReport && (
        <FormattedReportViewer
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onDownloadPdf={() => handleDownloadPdf(selectedReport.report_id)}
        />
      )}
    </div>
  );
};
