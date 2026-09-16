import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { FarmerDashboard } from './components/FarmerDashboard';
import { MyFarmTab } from './components/MyFarmTab';
import { ProfileTab } from './components/ProfileTab';
import { YieldForecastTab } from './components/YieldForecastTab';
import { CropRecommendationTab } from './components/CropRecommendationTab';
import { WeatherSoilAnalyticsTab } from './components/WeatherSoilAnalyticsTab';
import { PredictionReportsTab } from './components/PredictionReportsTab';
import { AuthModal } from './components/AuthModal';
import { OnboardingWizard } from './components/OnboardingWizard';
import { YieldInput, FarmerProfile, FarmDetails } from './types';
import {
  checkApiHealth,
  fetchFarmerProfile,
  fetchFarmerFarm,
} from './services/api';

export const App: React.FC = () => {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'myfarm' | 'yield' | 'recommendation' | 'analytics' | 'report' | 'profile'
  >('dashboard');

  const [predictSubTab, setPredictSubTab] = useState<'yield' | 'recommendation'>('yield');
  const [apiOnline, setApiOnline] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // Authenticated Farmer state
  const [user, setUser] = useState<FarmerProfile | null>(null);
  const [farm, setFarm] = useState<FarmDetails>({
    field_name: 'North Field',
    land_size: 4.5,
    land_unit: 'Acres',
    soil_type: 'Loam',
    irrigation_method: 'Sprinkler',
  });

  // Theme state: defaults to dark or saved preference
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('yieldsense_theme');
    if (saved !== null) {
      return saved === 'dark';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Yield prediction input state
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
    field_name: 'North Field',
  });

  // Sync dark theme class with root document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('yieldsense_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('yieldsense_theme', 'light');
    }
  }, [isDark]);

  // Check API health and load saved token profile on mount
  useEffect(() => {
    let isMounted = true;
    const initApp = async () => {
      try {
        const online = await checkApiHealth();
        if (isMounted) setApiOnline(online);
      } catch {
        if (isMounted) setApiOnline(false);
      }

      const token = localStorage.getItem('yieldsense_token');
      if (token) {
        try {
          const profileData = await fetchFarmerProfile();
          const farmData = await fetchFarmerFarm();
          if (isMounted) {
            setUser(profileData);
            setFarm(farmData);
            // Prefill yield input with farm details
            setYieldInput((prev) => ({
              ...prev,
              field_name: farmData.field_name || prev.field_name,
              Soil_Type: farmData.soil_type || prev.Soil_Type,
              Irrigation: farmData.irrigation_method || prev.Irrigation,
            }));
          }
        } catch {
          localStorage.removeItem('yieldsense_token');
        }
      }
    };

    initApp();
    const interval = setInterval(async () => {
      const online = await checkApiHealth();
      if (isMounted) setApiOnline(online);
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleAuthSuccess = async (_token: string, userData: FarmerProfile) => {
    setUser(userData);
    try {
      const farmData = await fetchFarmerFarm();
      setFarm(farmData);
    } catch {}
  };

  const handleLogout = () => {
    localStorage.removeItem('yieldsense_token');
    setUser(null);
    setActiveTab('dashboard');
  };

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: '🏠' },
    { id: 'myfarm', label: 'My Farm', icon: '🏡' },
    { id: 'yield', label: 'Predict', icon: '🌾' },
    { id: 'analytics', label: 'Farm Conditions', icon: '🌦️' },
    { id: 'report', label: 'My Reports', icon: '📄' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ] as const;

  const showOnboarding = user && user.onboarding_completed === 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* App Header */}
      <Header
        apiOnline={apiOnline}
        isDark={isDark}
        user={user}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onNavigateProfile={() => setActiveTab('profile')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Onboarding Wizard Banner for New Farmers */}
        {showOnboarding && (
          <OnboardingWizard
            user={user}
            farm={farm}
            onComplete={() => {
              setUser({ ...user, onboarding_completed: 1 });
            }}
          />
        )}

        {/* Primary Navigation Bar */}
        <div className="no-print flex items-center gap-1.5 sm:gap-2 mb-8 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
          {navItems.map((item) => {
            const isActive =
              activeTab === item.id ||
              (item.id === 'yield' && (activeTab === 'yield' || activeTab === 'recommendation'));
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition whitespace-nowrap border ${
                  isActive
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-md'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Views */}
        <div>
          {/* HOME DASHBOARD */}
          {activeTab === 'dashboard' && (
            <FarmerDashboard
              user={user}
              farm={farm}
              onNavigate={(tab) => {
                if (tab === 'recommendation') {
                  setActiveTab('yield');
                  setPredictSubTab('recommendation');
                } else {
                  setActiveTab(tab as any);
                }
              }}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          )}

          {/* MY FARM SPECIFICATIONS */}
          {activeTab === 'myfarm' && (
            <MyFarmTab
              farm={farm}
              onFarmUpdated={(updated) => {
                setFarm(updated);
                setYieldInput((prev) => ({
                  ...prev,
                  field_name: updated.field_name || prev.field_name,
                  Soil_Type: updated.soil_type || prev.Soil_Type,
                  Irrigation: updated.irrigation_method || prev.Irrigation,
                }));
              }}
            />
          )}

          {/* PREDICT VIEW (Yield Forecast & Crop Suitability) */}
          {(activeTab === 'yield' || activeTab === 'recommendation') && (
            <div className="space-y-6">
              {/* Sub-navigation Switcher */}
              <div className="flex gap-2 p-1.5 bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl w-fit">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('yield');
                    setPredictSubTab('yield');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    predictSubTab === 'yield'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  🌾 Yield Forecast
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('recommendation');
                    setPredictSubTab('recommendation');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    predictSubTab === 'recommendation'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  🌱 Crop Suitability
                </button>
              </div>

              {predictSubTab === 'yield' ? (
                <YieldForecastTab
                  inputState={yieldInput}
                  setInputState={setYieldInput}
                  savedFarm={farm}
                />
              ) : (
                <CropRecommendationTab />
              )}
            </div>
          )}

          {/* FARM CONDITIONS & ANALYTICS */}
          {activeTab === 'analytics' && <WeatherSoilAnalyticsTab />}

          {/* MY REPORTS & HISTORY */}
          {activeTab === 'report' && (
            <PredictionReportsTab
              inputState={yieldInput}
              isLoggedIn={!!user}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          )}

          {/* FARMER PROFILE */}
          {activeTab === 'profile' && user && (
            <ProfileTab
              user={user}
              onProfileUpdated={(updated) => setUser(updated)}
              onLogout={handleLogout}
            />
          )}

          {activeTab === 'profile' && !user && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-3xl mx-auto">
                👤
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Farmer Profile Access
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sign in to manage your contact details and location settings.
              </p>
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition shadow-md"
              >
                Sign In / Register
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* App Footer */}
      <footer className="no-print border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-6 px-4 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
            <span>🌾 YieldSense AI</span>
            <span>•</span>
            <span>Crop Yield Prediction & Agricultural Recommendation Platform</span>
          </div>
          <div className="text-[11px]">
            <span>Agricultural Decision Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
