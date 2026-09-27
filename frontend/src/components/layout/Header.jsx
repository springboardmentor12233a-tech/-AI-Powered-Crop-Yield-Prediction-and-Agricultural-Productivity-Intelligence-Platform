import { useEffect, useState } from 'react';
import { Bell, Search, User, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { healthCheck } from '../../services/api';
import { Badge } from '../common/Badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';

const SEARCH_PAGES = [
  { name: 'Dashboard', path: '/', keywords: ['dashboard', 'home', 'main'] },
  { name: 'Yield Prediction', path: '/predict', keywords: ['yield', 'predict', 'forecast'] },
  { name: 'Weather Analysis', path: '/weather', keywords: ['weather', 'climate', 'temperature', 'rain'] },
  { name: 'Soil Analysis', path: '/soil', keywords: ['soil', 'moisture', 'ph', 'ndvi'] },
  { name: 'Analytics', path: '/analytics', keywords: ['analytics', 'charts', 'history'] },
  { name: 'Recommendations', path: '/recommendations', keywords: ['recommendations', 'advice', 'actions'] },
  { name: 'Agricultural Reports', path: '/reports', keywords: ['report', 'summary', 'pdf'] },
  { name: 'Settings', path: '/settings', keywords: ['settings', 'profile', 'account'] }
];

export function Header({ title }) {
  const [backendStatus, setBackendStatus] = useState('loading');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { recentPrediction } = useAppContext();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        await healthCheck();
        setBackendStatus('connected');
      } catch {
        setBackendStatus('error');
      }
    };
    checkStatus();
    // Poll every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const results = SEARCH_PAGES.filter(page => 
      page.name.toLowerCase().includes(q) || 
      page.keywords.some(kw => kw.includes(q))
    );
    setSearchResults(results);
  }, [searchQuery]);

  const handleSearchSelect = (path) => {
    navigate(path);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 h-16 px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
        
        <div className="ml-6 flex items-center">
          {backendStatus === 'loading' && (
             <Badge variant="neutral">Connecting to Backend...</Badge>
          )}
          {backendStatus === 'connected' && (
             <Badge variant="success" className="bg-emerald-50 border border-emerald-200 text-emerald-700">Backend Connected</Badge>
          )}
          {backendStatus === 'error' && (
             <Badge variant="error" className="bg-red-50 border border-red-200 text-red-700">Backend Offline</Badge>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* SEARCH */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white w-64 transition-all"
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
              {searchResults.map((res, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSearchSelect(res.path)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm text-slate-700 border-b border-slate-100 last:border-0"
                >
                  {res.name}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* NOTIFICATIONS */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {recentPrediction && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-semibold text-slate-800">Notifications</h3>
              </div>
              <div className="p-4">
                {recentPrediction ? (
                  <div className="text-sm text-slate-600 space-y-1">
                    <p className="font-medium text-slate-800">Prediction Generated</p>
                    <p>Yield prediction of {recentPrediction.result.predicted_yield_kg_per_hectare.toLocaleString()} kg/ha completed for {recentPrediction.input.crop_type}.</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">No new notifications</p>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* PROFILE */}
        <div className="relative">
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className="h-8 w-8 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center text-primary-700 hover:bg-primary-200 transition-colors"
          >
            <User className="w-4 h-4" />
          </button>

          {showProfile && user && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <p className="font-medium text-slate-800">{user.name}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
                <Badge variant="neutral" className="mt-2 text-xs uppercase">{user.role?.role_name || user.role}</Badge>
              </div>
              <div className="p-2">
                <button 
                  onClick={() => { setShowProfile(false); navigate('/settings'); }}
                  className="w-full flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md"
                >
                  <SettingsIcon className="w-4 h-4 mr-3 text-slate-400" />
                  Settings & Profile
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md mt-1"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
