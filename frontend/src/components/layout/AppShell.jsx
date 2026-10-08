import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import Chatbot from '../Chatbot';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { getPredictionHistory } from '../../services/api';

export function AppShell() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
            const savedId = localStorage.getItem('currentPredictionId');
            let latest;
            
            if (savedId) {
              latest = hist.find(h => h.id.toString() === savedId);
            }
            
            if (!latest) {
              // Fallback to highest ID (most recently created), NOT observation_date
              const sorted = [...hist].sort((a, b) => (a.id || 0) - (b.id || 0));
              latest = sorted[sorted.length - 1];
            }
            
            if (latest) {
              const predictionObj = {
                id: latest.id,
                input: latest.input_data,
                result: { predicted_yield_kg_per_hectare: latest.predicted_yield }
              };
              setRecentPrediction(predictionObj);
              fetchAnalysis(predictionObj);
              localStorage.setItem('currentPredictionId', latest.id.toString());
            }
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
    <div className="flex h-screen bg-surface-50 overflow-hidden relative">
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar with responsive classes */}
      <div className={`fixed inset-y-0 left-0 z-30 transform md:relative md:translate-x-0 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onMenuClick={() => setIsMobileMenuOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 w-full">
        <Header 
          title={getPageTitle(location.pathname)} 
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      {!isAdmin && <Chatbot />}
    </div>
  );
}
