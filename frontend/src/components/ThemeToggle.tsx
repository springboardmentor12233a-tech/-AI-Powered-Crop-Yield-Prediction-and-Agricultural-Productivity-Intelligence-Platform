import React from 'react';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, onToggle }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors duration-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm"
    >
      {isDark ? (
        <span className="text-base" title="Switch to Light Mode">☀️</span>
      ) : (
        <span className="text-base" title="Switch to Dark Mode">🌙</span>
      )}
    </button>
  );
};
