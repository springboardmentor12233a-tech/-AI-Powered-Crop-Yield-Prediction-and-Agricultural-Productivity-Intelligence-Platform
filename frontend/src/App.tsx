import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { YieldForecastTab } from './components/YieldForecastTab';
import { CropRecommendationTab } from './components/CropRecommendationTab';
import { WeatherSoilAnalyticsTab } from './components/WeatherSoilAnalyticsTab';
import { PredictionReportsTab } from './components/PredictionReportsTab';
import { YieldInput } from './types';
import { checkApiHealth } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'yield' | 'recommendation' | 'analytics' | 'report'>('yield');
  const [apiOnline, setApiOnline] = useState<boolean>(false);
  
  // Theme state: defaults to dark or saved preference
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('yieldsense_theme');
    if (saved !== null) {
      return saved === 'dark';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Default initial yield parameters
  const [yieldInput, setYieldInput] = useState<YieldInput>({
    Crop: 'Wheat',
    Region: 'Region_A',
    Soil_Type: 'Loam',
    Soil_pH: 6.8,
    Rainfall_mm: 650.0,
    Temperature_C: 22.5,
    Humidity_pct: 60.0,
    Fertilizer_Used_kg: 180.0,
    Irrigation: 'Sprinkler',
    Pesticides_Used_kg: 20.0,
    Planting_Density: 15.0,
    Previous_Crop: 'Maize',
    farm_id: 'FARM-ALPHA-01',
    plot_label: 'North Field (Plot 3)',
  });

  // Sync dark class with document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('yieldsense_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('yieldsense_theme', 'light');
    }
  }, [isDark]);

  // Check API health on mount and periodically
  useEffect(() => {
    let isMounted = true;
    const verifyHealth = async () => {
      try {
        await checkApiHealth();
        if (isMounted) setApiOnline(true);
      } catch {
        if (isMounted) setApiOnline(false);
      }
    };

    verifyHealth();
    const interval = setInterval(verifyHealth, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const tabs = [
    {
      id: 'yield',
      label: 'Crop Yield Forecasting',
      icon: '🌾',
      desc: 'Predict harvest yield by field inputs',
    },
    {
      id: 'recommendation',
      label: 'Crop Recommendation',
      icon: '🌱',
      desc: 'Match crops to local climate conditions',
    },
    {
      id: 'analytics',
      label: 'Weather & Soil Analytics',
      icon: '📊',
      desc: 'Climatic envelopes & soil benchmarks',
    },
    {
      id: 'report',
      label: 'Prediction Reports',
      icon: '📋',
      desc: 'Generate exportable agronomic summaries',
    },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* App Header */}
      <Header
        apiOnline={apiOnline}
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Navigation Tabs Bar */}
        <div className="no-print grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col text-left p-3.5 sm:p-4 rounded-2xl transition duration-150 border ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{tab.icon}</span>
                  <span className="font-bold text-xs sm:text-sm tracking-tight">{tab.label}</span>
                </div>
                <span className="text-[11px] opacity-75 hidden sm:block leading-snug">{tab.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Views */}
        <div>
          {activeTab === 'yield' && (
            <YieldForecastTab inputState={yieldInput} setInputState={setYieldInput} />
          )}

          {activeTab === 'recommendation' && <CropRecommendationTab />}

          {activeTab === 'analytics' && <WeatherSoilAnalyticsTab />}

          {activeTab === 'report' && <PredictionReportsTab inputState={yieldInput} />}
        </div>
      </main>

      {/* App Footer */}
      <footer className="no-print border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-6 px-4 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span>🌾 YieldSense AI</span>
            <span>•</span>
            <span>Agricultural Productivity Intelligence Platform</span>
          </div>
          <div>
            <span>Verified Milestone 2 System • Standardized Agronomic Modeling</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
