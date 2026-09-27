import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import Chatbot from '../Chatbot';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { getPredictionHistory } from '../../services/api';

export function AppShell() {
  const location = useLocation();
  const { user } = useAuth();
  
  const userRole = user?.role?.role_name || user?.role;
  const isAdmin = userRole === 'admin';
  
  const { recentPrediction, setRecentPrediction, fetchAnalysis } = useAppContext();

  useEffect(() => {
    if (!isAdmin && !recentPrediction) {
      const loadLatestPrediction = async () => {
        try {
          const hist = await getPredictionHistory();
          if (hist && hist.length > 0) {
            // Sort chronologically (ascending)
            const sorted = [...hist].sort((a, b) => new Date(a.input_data?.observation_date || a.created_at) - new Date(b.input_data?.observation_date || b.created_at));
            const latest = sorted[sorted.length - 1];
            const predictionObj = {
              input: latest.input_data,
              result: { predicted_yield_kg_per_hectare: latest.predicted_yield }
            };
            setRecentPrediction(predictionObj);
            // Optionally, we can also preload analysis here
            fetchAnalysis(predictionObj);
          }
        } catch (err) {
          console.error("Failed to load prediction history for context:", err);
        }
      };
      loadLatestPrediction();
    }
  }, [isAdmin, recentPrediction, setRecentPrediction, fetchAnalysis]);
  
  // Mapping paths to header titles
  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/': return 'Dashboard';
      case '/predict': return 'Yield Prediction';
      case '/weather': return 'Weather Analysis';
      case '/soil': return 'Soil Analysis';
      case '/analytics': return 'Analytics';
      case '/recommendations': return 'Recommendations';
      case '/reports': return 'Agricultural Reports';
      case '/settings': return 'Settings';
      default: return 'YieldSense AI';
    }
  };

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={getPageTitle(location.pathname)} />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      {!isAdmin && <Chatbot />}
    </div>
  );
}
