import React from 'react';
import { ThemeToggle } from './ThemeToggle';
import { FarmerProfile } from '../types';

interface HeaderProps {
  apiOnline: boolean;
  isDark: boolean;
  user: FarmerProfile | null;
  onToggleTheme: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onNavigateProfile: () => void;
  onNavigateAdmin?: () => void;
  isAdminView?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  apiOnline,
  isDark,
  user,
  onToggleTheme,
  onOpenAuth,
  onLogout,
  onNavigateProfile,
  onNavigateAdmin,
  isAdminView = false,
}) => {
  return (
    <header className="no-print sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Logo & Product Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-700 text-white rounded-2xl flex items-center justify-center text-xl sm:text-2xl shadow-md">
            🌾
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                YieldSense AI
              </h1>
              <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    apiOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                  }`}
                />
                {apiOnline ? 'System Online' : 'System Offline'}
              </span>
              {user?.role === 'admin' && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-800 uppercase">
                  Admin
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block font-medium">
              Agricultural Productivity & Seasonal Intelligence Platform
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3">
          <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />

          {user?.role === 'admin' && onNavigateAdmin && (
            <button
              onClick={onNavigateAdmin}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                isAdminView
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
              }`}
            >
              <span>⚙️</span>
              <span className="hidden sm:inline">{isAdminView ? 'Farmer View' : 'Admin Panel'}</span>
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onNavigateProfile}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-200 rounded-xl border border-emerald-200 dark:border-emerald-800 transition text-xs font-bold"
              >
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'F'}
                </span>
                <span className="hidden sm:inline max-w-[120px] truncate">{user.full_name}</span>
              </button>

              <button
                onClick={onLogout}
                title="Logout"
                className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition text-xs font-bold"
              >
                🚪
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
