import React from 'react';

interface TechnicalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  details: {
    algorithm?: string;
    modelVersion?: string;
    metrics?: string;
    featuresUsed?: string[];
    notes?: string;
  };
}

export const TechnicalDetailsModal: React.FC<TechnicalDetailsModalProps> = ({
  isOpen,
  onClose,
  title,
  details,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚙️</span>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
          {details.algorithm && (
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">Statistical Algorithm</span>
              <span>{details.algorithm}</span>
            </div>
          )}

          {details.modelVersion && (
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">Model Identifier</span>
              <code>{details.modelVersion}</code>
            </div>
          )}

          {details.metrics && (
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">Cross-Validation Benchmark</span>
              <span>{details.metrics}</span>
            </div>
          )}

          {details.featuresUsed && (
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-white block mb-1">Evaluated Field Parameters</span>
              <div className="flex flex-wrap gap-1">
                {details.featuresUsed.map((f, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px]"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {details.notes && (
            <div className="text-slate-500 dark:text-slate-400 italic text-[11px]">
              {details.notes}
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
