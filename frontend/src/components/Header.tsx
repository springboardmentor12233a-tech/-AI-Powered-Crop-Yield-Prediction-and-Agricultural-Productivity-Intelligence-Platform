import React from 'react';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  apiOnline: boolean;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ apiOnline, isDark, onToggleTheme }) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 py-3.5 transition-colors duration-200 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xl shadow-sm">
            🌾
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                YieldSense <span className="text-emerald-600 dark:text-emerald-400">AI</span>
              </h1>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                Agricultural Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Crop Yield Forecasting, Climate Analysis & Soil Advisory System
            </p>
          </div>
        </div>

        {/* Right side controls: System status & Theme Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                apiOnline ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            ></span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {apiOnline ? 'Intelligence Engine Ready' : 'Service Offline'}
            </span>
          </div>

          <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  );
};
