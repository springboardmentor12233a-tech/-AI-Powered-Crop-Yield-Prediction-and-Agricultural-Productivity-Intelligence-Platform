import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { FarmerDashboard } from './components/FarmerDashboard';
import { MyFarmTab } from './components/MyFarmTab';
import { ProfileTab } from './components/ProfileTab';
import { YieldForecastTab } from './components/YieldForecastTab';
import { CropRecommendationTab } from './components/CropRecommendationTab';
import { WeatherSoilAnalyticsTab } from './components/WeatherSoilAnalyticsTab';
import { PredictionReportsTab } from './components/PredictionReportsTab';
import { AIAssistantTab } from './components/AIAssistantTab';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { OnboardingWizard } from './components/OnboardingWizard';
import { YieldInput, FarmerProfile, FarmDetails } from './types';
import {
  checkApiHealth,
  fetchCurrentUserProfile,
  fetchFarmerFarm,
} from './services/api';

export const App: React.FC = () => {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'myfarm' | 'yield' | 'recommendation' | 'analytics' | 'report' | 'assistant' | 'admin' | 'profile'
  >('dashboard');

  const [apiOnline, setApiOnline] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // Authenticated Farmer / Admin state
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
          const profileData = await fetchCurrentUserProfile();
          const farmData = await fetchFarmerFarm();
          if (isMounted) {
            setUser(profileData);
            setFarm(farmData);
            // Prefill yield input with farm details
            setYieldInput((prev) => ({
              ...prev,
              field_name: farmData.field_name || prev.field_name,
              Soil_Type: (farmData.soil_type as any) || prev.Soil_Type,
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
    if (userData.role === 'admin') {
      setActiveTab('admin');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('yieldsense_token');
    setUser(null);
    setActiveTab('dashboard');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'myfarm', label: 'My Farm', icon: '🏡' },
    { id: 'yield', label: 'Predict Yield', icon: '🌾' },
    { id: 'recommendation', label: 'Crop Match', icon: '🌱' },
    { id: 'assistant', label: 'AI Assistant', icon: '🤖' },
    { id: 'analytics', label: 'Analytics', icon: '🌦️' },
    { id: 'report', label: 'Reports', icon: '📄' },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Admin Panel', icon: '⚙️' }] : []),
    { id: 'profile', label: 'Profile', icon: '👤' },
  ] as const;

  const showOnboarding = user && user.role === 'farmer' && user.onboarding_completed === 0;

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
        onNavigateAdmin={user?.role === 'admin' ? () => setActiveTab(activeTab === 'admin' ? 'dashboard' : 'admin') : undefined}
        isAdminView={activeTab === 'admin'}
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
        <div className="no-print flex items-center gap-1.5 sm:gap-2 mb-8 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id as any);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition whitespace-nowrap border ${
                  isActive
                    ? item.id === 'admin'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'bg-emerald-700 text-white border-emerald-700 shadow-md'
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
          {/* 1. HOME DASHBOARD */}
          {activeTab === 'dashboard' && (
            <FarmerDashboard
              user={user}
              farm={farm}
              onNavigate={(tab) => {
                if (tab === 'recommendation') {
                  setActiveTab('recommendation');
                } else if (tab === 'farm') {
                  setActiveTab('myfarm');
                } else {
                  setActiveTab(tab as any);
                }
              }}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          )}

          {/* 2. MY FARM SPECIFICATIONS */}
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

          {/* 3. YIELD FORECAST */}
          {activeTab === 'yield' && (
            <YieldForecastTab
              inputState={yieldInput}
              setInputState={setYieldInput}
              savedFarm={farm}
            />
          )}

          {/* 4. CROP SUITABILITY RECOMMENDATION */}
          {activeTab === 'recommendation' && (
            <CropRecommendationTab />
          )}

          {/* 5. AI AGRICULTURAL ASSISTANT CHATBOT */}
          {activeTab === 'assistant' && (
            <AIAssistantTab user={user} farm={farm} />
          )}

          {/* 6. FARM ANALYTICS (WEATHER & SOIL) */}
          {activeTab === 'analytics' && (
            <WeatherSoilAnalyticsTab />
          )}

          {/* 7. PREDICTION & SEASONAL REPORTS */}
          {activeTab === 'report' && (
            <PredictionReportsTab
              inputState={yieldInput}
              isLoggedIn={Boolean(user)}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          )}

          {/* 8. ADMIN PANEL (SYSTEM METRICS & LLM CONTROLS) */}
          {activeTab === 'admin' && (
            <AdminPanel />
          )}

          {/* 9. FARMER PROFILE */}
          {activeTab === 'profile' && user && (
            <ProfileTab
              user={user}
              onProfileUpdated={(updatedUser) => {
                setUser(updatedUser);
              }}
              onLogout={handleLogout}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="no-print mt-auto py-6 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>
            <b>YieldSense AI</b> — Agricultural Productivity Intelligence Platform
          </span>
          <span>Decision Support System • Grounded Agronomic Intelligence</span>
        </div>
      </footer>

      {/* Auth Modal */}
      {isAuthOpen && (
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
};
