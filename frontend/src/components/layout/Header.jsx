import { useEffect, useState } from 'react';
import { Bell, Search, User, LogOut, Settings as SettingsIcon, Check } from 'lucide-react';
import { healthCheck, getNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead } from '../../services/api';
import { Badge } from '../common/Badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';

const SEARCH_PAGES = [
  { name: 'Dashboard', path: '/', roles: ['admin', 'user', 'farmer'] },
  { name: 'Yield Prediction', path: '/predict', roles: ['user', 'farmer'] },
  { name: 'Weather Analysis', path: '/weather', roles: ['user', 'farmer'] },
  { name: 'Soil Analysis', path: '/soil', roles: ['user', 'farmer'] },
  { name: 'Analytics', path: '/analytics', roles: ['user', 'farmer'] },
  { name: 'Recommendations', path: '/recommendations', roles: ['user', 'farmer'] },
  { name: 'Agricultural Reports', path: '/reports', roles: ['user', 'farmer'] },
  { name: 'Settings', path: '/settings', roles: ['admin', 'user', 'farmer'] },
  { name: 'Admin Dashboard', path: '/admin', roles: ['admin'] }
];

export function Header({ title }) {
  const [backendStatus, setBackendStatus] = useState('loading');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
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
    const fetchNotifications = async () => {
      if (user) {
        try {
          const [notifs, unread] = await Promise.all([
            getNotifications(),
            getUnreadNotificationCount()
          ]);
          setNotifications(notifs);
          setUnreadCount(unread.count);
        } catch (e) {
          console.error("Failed to fetch notifications");
        }
      }
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error("Failed to mark all as read");
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const role = user?.role?.role_name || user?.role || 'user';
    const results = SEARCH_PAGES.filter(page => 
      page.roles.includes(role) && page.name.toLowerCase().includes(q)
    );
    setSearchResults(results);
  }, [searchQuery, user]);

  const handleSearchSelect = (path) => {
    navigate(path);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    if (title === 'Dashboard') {
      return `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ${user?.name?.split(' ')[0] || 'Farmer'} 👋`;
    }
    return title;
  };

  const displayTitle = getPageTitle();

  return (
    <header className="bg-surface/90 backdrop-blur-md border-b border-slate-200 h-[72px] px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm transition-all">
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">{displayTitle}</h1>
        
        <div className="ml-6 flex items-center hidden md:flex">
          {backendStatus === 'loading' && (
             <Badge variant="neutral" className="animate-pulse">Connecting...</Badge>
          )}
          {backendStatus === 'connected' && (
             <Badge variant="success" className="bg-[#5BAE65]/10 border border-[#5BAE65]/30 text-[#1F6B45]">System Online</Badge>
          )}
          {backendStatus === 'error' && (
             <Badge variant="error" className="bg-red-50 border border-red-200 text-red-700">System Offline</Badge>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-5">
        {/* SEARCH */}
        <div className="relative hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder={(user?.role?.role_name || user?.role) === 'admin' ? "Search admin modules..." : "Search modules..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5BAE65]/50 focus:bg-white w-64 transition-all shadow-inner"
          />
          {searchQuery.trim() !== '' && (
            <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50">Results</div>
              {searchResults.length > 0 ? (
                searchResults.map((res, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearchSelect(res.path)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm text-slate-700 transition-colors border-l-2 border-transparent hover:border-[#5BAE65]"
                  >
                    {res.name}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-slate-500 text-center">
                  No modules found
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* NOTIFICATIONS */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#EF4444] rounded-full border-2 border-white shadow-sm ring-2 ring-white animate-pulse"></span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute top-full right-0 mt-3 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs text-[#5BAE65] hover:text-[#1F6B45] font-semibold flex items-center transition-colors">
                    <Check className="w-3 h-3 mr-1" /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-4 border-b border-slate-50 transition-colors ${!notif.is_read ? 'bg-[#F7F8F2]' : 'bg-white'} hover:bg-slate-50 cursor-pointer`}
                      onClick={() => !notif.is_read && handleMarkRead(notif.id)}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <p className={`text-sm font-semibold ${!notif.is_read ? 'text-[#12372A]' : 'text-slate-700'}`}>
                          {notif.title}
                        </p>
                        {!notif.is_read && (
                          <span className="w-2 h-2 bg-[#A8C957] rounded-full mt-1.5 shadow-sm"></span>
                        )}
                      </div>
                      <p className={`text-sm leading-snug ${!notif.is_read ? 'text-[#1F6B45]' : 'text-slate-500'}`}>
                        {notif.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-2 font-medium">
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center flex flex-col items-center justify-center">
                    <Bell className="w-8 h-8 text-slate-200 mb-3" />
                    <p className="text-sm font-medium text-slate-500">You're all caught up!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* PROFILE */}
        <div className="relative">
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#5BAE65] to-[#A8C957] text-white font-bold text-sm flex items-center justify-center shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 border-2 border-white ring-2 ring-transparent focus:ring-[#A8C957]/50"
          >
            {user?.name?.charAt(0) || 'U'}
          </button>

          {showProfile && user && (
            <div className="absolute top-full right-0 mt-3 w-64 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="p-5 border-b border-slate-100 bg-[#F7F8F2]">
                <p className="font-bold text-slate-800 text-base">{user.name}</p>
                <p className="text-sm text-slate-500 mt-0.5">{user.email}</p>
                <Badge variant="neutral" className="mt-3 text-[10px] uppercase font-bold tracking-wider bg-white border-slate-200">{user.role?.role_name || user.role}</Badge>
              </div>
              <div className="p-2">
                <button 
                  onClick={() => { setShowProfile(false); navigate('/settings'); }}
                  className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <SettingsIcon className="w-4 h-4 mr-3 text-slate-400" />
                  Settings & Profile
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg mt-1 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3 text-red-400" />
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
