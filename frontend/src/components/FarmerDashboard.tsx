import React from 'react';
import { FarmerProfile, FarmDetails } from '../types';

interface FarmerDashboardProps {
  user: FarmerProfile | null;
  farm: FarmDetails;
  onNavigate: (tab: 'yield' | 'recommendation' | 'analytics' | 'report' | 'farm' | 'profile') => void;
  onOpenAuth: () => void;
}

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
  user,
  farm,
  onNavigate,
  onOpenAuth,
}) => {
  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-600/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-100 border border-white/10">
              <span>🌾 YieldSense AI Decision Platform</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user ? user.full_name : 'Farmer'}!
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-xl leading-relaxed">
              Explore custom harvest forecasts, environmental suitability checks, and downloadable field reports tailored to your agricultural conditions.
            </p>
          </div>

          {!user ? (
            <button
              onClick={onOpenAuth}
              className="px-6 py-3 bg-white text-emerald-900 font-bold rounded-2xl text-xs sm:text-sm hover:bg-emerald-50 transition shadow-lg self-start md:self-auto"
            >
              Sign In / Register
            </button>
          ) : (
            <div className="flex gap-2 self-start md:self-auto">
              <button
                onClick={() => onNavigate('farm')}
                className="px-4 py-2.5 bg-emerald-600/60 hover:bg-emerald-600/80 text-white font-semibold text-xs rounded-xl border border-white/20 transition backdrop-blur-sm"
              >
                Edit Farm
              </button>
              <button
                onClick={() => onNavigate('profile')}
                className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-semibold text-xs rounded-xl border border-white/20 transition backdrop-blur-sm"
              >
                My Profile
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Your Farm Summary Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏡</span>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Your Farm Specifications
            </h2>
          </div>
          <button
            onClick={() => onNavigate('farm')}
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            Manage Details →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Field / Plot
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate block">
              {farm.field_name || 'North Field'}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Land Area
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block">
              {farm.land_size} {farm.land_unit}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Soil Type
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block">
              {farm.soil_type}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Irrigation
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block">
              {farm.irrigation_method}
            </span>
          </div>
        </div>
      </div>

      {/* Main Action Modules */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <span>⚡ What would you like to do?</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Action 1: Predict Yield */}
          <button
            onClick={() => onNavigate('yield')}
            className="flex flex-col text-left p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-lg transition-all group"
          >
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              🌾
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 mb-1">
              Predict My Yield
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Estimate expected crop harvest (ton/ha) based on your soil, weather, and fertilizer inputs.
            </p>
            <span className="mt-auto text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              Start Forecast →
            </span>
          </button>

          {/* Action 2: Check Crop Suitability */}
          <button
            onClick={() => onNavigate('recommendation')}
            className="flex flex-col text-left p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-lg transition-all group"
          >
            <div className="w-12 h-12 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              🌱
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 mb-1">
              Check Crop Suitability
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Find crops best suited for your local temperature, humidity, soil pH, and rainfall.
            </p>
            <span className="mt-auto text-xs font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1">
              Check Crops →
            </span>
          </button>

          {/* Action 3: Farm Conditions */}
          <button
            onClick={() => onNavigate('analytics')}
            className="flex flex-col text-left p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-lg transition-all group"
          >
            <div className="w-12 h-12 bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              🌦️
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 mb-1">
              Farm Conditions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Explore climatic distributions, weather ranges, and soil texture performance metrics.
            </p>
            <span className="mt-auto text-xs font-bold text-sky-700 dark:text-sky-400 flex items-center gap-1">
              View Conditions →
            </span>
          </button>

          {/* Action 4: My Reports */}
          <button
            onClick={() => onNavigate('report')}
            className="flex flex-col text-left p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-lg transition-all group"
          >
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              📄
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 mb-1">
              My Reports
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Access your saved prediction history, view full assessments, and download A4 PDF files.
            </p>
            <span className="mt-auto text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
              Open History →
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
