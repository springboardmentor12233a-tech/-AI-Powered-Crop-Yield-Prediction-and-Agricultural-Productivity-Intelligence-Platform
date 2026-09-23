import React, { useState, useEffect } from 'react';
import { FarmerProfile, FarmDetails, SavedReport, SavedRecommendation } from '../types';
import { fetchFarmerPredictionHistory, fetchFarmerRecommendationHistory } from '../services/api';

interface FarmerDashboardProps {
  user: FarmerProfile | null;
  farm: FarmDetails;
  onNavigate: (tab: 'yield' | 'recommendation' | 'analytics' | 'report' | 'farm' | 'profile' | 'assistant') => void;
  onOpenAuth: () => void;
}

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
  user,
  farm,
  onNavigate,
  onOpenAuth,
}) => {
  const [recentPrediction, setRecentPrediction] = useState<SavedReport | null>(null);
  const [recentRecommendation, setRecentRecommendation] = useState<SavedRecommendation | null>(null);

  useEffect(() => {
    if (user) {
      fetchFarmerPredictionHistory()
        .then((history) => {
          if (history.length > 0) setRecentPrediction(history[0]);
        })
        .catch(() => {});

      fetchFarmerRecommendationHistory()
        .then((history) => {
          if (history.length > 0) setRecentRecommendation(history[0]);
        })
        .catch(() => {});
    }
  }, [user]);

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
              Good day, {user ? user.full_name : 'Farmer'}!
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-xl leading-relaxed">
              Explore harvest forecasts, environmental suitability checks, actionable risk insights, and get instant guidance from your AI Agricultural Assistant.
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

      {/* Quick Action Modules */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <span>⚡ Quick Actions</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Action 1: Predict Yield */}
          <button
            onClick={() => onNavigate('yield')}
            className="flex flex-col text-left p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-lg transition-all group"
          >
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">
              🌾
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 mb-1">
              Predict Yield
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              Forecast expected harvest (ton/ha) for your crops.
            </p>
            <span className="mt-auto text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              Forecast →
            </span>
          </button>

          {/* Action 2: Check Crop Suitability */}
          <button
            onClick={() => onNavigate('recommendation')}
            className="flex flex-col text-left p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 hover:shadow-lg transition-all group"
          >
            <div className="w-10 h-10 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 rounded-2xl flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">
              🌱
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 mb-1">
              Find Suitable Crops
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              Match soil & weather conditions with optimal crops.
            </p>
            <span className="mt-auto text-xs font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1">
              Analyze →
            </span>
          </button>

          {/* Action 3: AI Assistant */}
          <button
            onClick={() => onNavigate('assistant')}
            className="flex flex-col text-left p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-lg transition-all group"
          >
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 rounded-2xl flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">
              🤖
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-400 mb-1">
              Ask AI Assistant
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              Chat with the agronomist assistant for contextual advice.
            </p>
            <span className="mt-auto text-xs font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1">
              Chat Now →
            </span>
          </button>

          {/* Action 4: Farm Conditions */}
          <button
            onClick={() => onNavigate('analytics')}
            className="flex flex-col text-left p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 hover:shadow-lg transition-all group"
          >
            <div className="w-10 h-10 bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 rounded-2xl flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">
              🌦️
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-700 dark:group-hover:text-sky-400 mb-1">
              Farm Analytics
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              Weather distributions & soil texture characteristics.
            </p>
            <span className="mt-auto text-xs font-bold text-sky-700 dark:text-sky-400 flex items-center gap-1">
              View Analytics →
            </span>
          </button>

          {/* Action 5: My Reports */}
          <button
            onClick={() => onNavigate('report')}
            className="flex flex-col text-left p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-lg transition-all group"
          >
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-2xl flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">
              📄
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 mb-1">
              PDF Reports
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              Inspect past forecasts and download A4 PDF reports.
            </p>
            <span className="mt-auto text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
              Open Reports →
            </span>
          </button>
        </div>
      </div>

      {/* Recent Results Section */}
      {user && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Latest Yield Prediction */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>📈</span> Latest Yield Prediction
              </h3>
              <button
                onClick={() => onNavigate('report')}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
              >
                All History →
              </button>
            </div>

            {recentPrediction ? (
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                      {recentPrediction.crop} ({recentPrediction.region})
                    </span>
                    <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {recentPrediction.predicted_yield.toFixed(2)} <span className="text-xs font-normal text-slate-500">ton/ha</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{recentPrediction.report_id}</span>
                </div>
                <div className="flex gap-3 text-xs text-slate-600 dark:text-slate-400 mt-3 pt-2 border-t border-emerald-100 dark:border-emerald-900/40">
                  <span>Soil: <b>{recentPrediction.soil_type}</b></span>
                  <span>Rain: <b>{recentPrediction.rainfall_mm}mm</b></span>
                  <span>pH: <b>{recentPrediction.soil_ph}</b></span>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                No predictions recorded yet. Run your first forecast above!
              </div>
            )}
          </div>

          {/* Latest Crop Recommendation */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>🌱</span> Latest Crop Suitability Match
              </h3>
              <button
                onClick={() => onNavigate('recommendation')}
                className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline"
              >
                Find Crops →
              </button>
            </div>

            {recentRecommendation ? (
              <div className="p-4 bg-teal-50/50 dark:bg-teal-950/20 rounded-2xl border border-teal-100 dark:border-teal-900/40">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wide">
                      Top Match
                    </span>
                    <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {recentRecommendation.recommended_crop}
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 rounded-full">
                    {recentRecommendation.confidence_pct} match
                  </span>
                </div>
                <div className="flex gap-3 text-xs text-slate-600 dark:text-slate-400 mt-3 pt-2 border-t border-teal-100 dark:border-teal-900/40">
                  <span>Temp: <b>{recentRecommendation.temperature_c}°C</b></span>
                  <span>Humidity: <b>{recentRecommendation.humidity_pct}%</b></span>
                  <span>pH: <b>{recentRecommendation.soil_ph}</b></span>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                No suitability analyses performed yet. Match your soil conditions now!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
