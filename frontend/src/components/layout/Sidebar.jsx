import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Sprout, 
  CloudRain, 
  TestTube, 
  FileText, 
  Settings, 
  LogOut,
  LineChart,
  Lightbulb
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  { name: 'Dashboard', to: '/', icon: LayoutDashboard },
  { name: 'Yield Prediction', to: '/predict', icon: Sprout },
  { name: 'Weather Analysis', to: '/weather', icon: CloudRain },
  { name: 'Soil Analysis', to: '/soil', icon: TestTube },
  { name: 'Analytics', to: '/analytics', icon: LineChart },
  { name: 'Recommendations', to: '/recommendations', icon: Lightbulb },
  { name: 'Reports', to: '/reports', icon: FileText },
];

export function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
      <div className="p-6 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
          <Sprout className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-slate-800 tracking-tight">YieldSense AI</span>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors group",
              isActive 
                ? "bg-primary-50 text-primary-700" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon 
                  className={cn(
                    "flex-shrink-0 w-5 h-5 mr-3 transition-colors",
                    isActive ? "text-primary-600" : "text-slate-400 group-hover:text-slate-600"
                  )} 
                />
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) => cn(
            "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors group",
            isActive ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <Settings className="flex-shrink-0 w-5 h-5 mr-3 text-slate-400 group-hover:text-slate-600" />
          Settings
        </NavLink>
        <button onClick={handleLogout} className="flex w-full items-center px-3 py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors group">
          <LogOut className="flex-shrink-0 w-5 h-5 mr-3 text-slate-400 group-hover:text-red-500" />
          Logout
        </button>
      </div>
    </div>
  );
}
