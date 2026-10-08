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
  Lightbulb,
  Shield
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';

const farmerNavigation = [
  { name: 'Dashboard', to: '/', icon: LayoutDashboard },
  { name: 'Yield Prediction', to: '/predict', icon: Sprout },
  { name: 'Weather Analysis', to: '/weather', icon: CloudRain },
  { name: 'Soil Analysis', to: '/soil', icon: TestTube },
  { name: 'Analytics', to: '/analytics', icon: LineChart },
  { name: 'Recommendations', to: '/recommendations', icon: Lightbulb },
  { name: 'Reports', to: '/reports', icon: FileText },
];

const adminNavigation = [
  { name: 'Admin Dashboard', to: '/admin', icon: Shield },
];

export function Sidebar({ onMenuClick }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const userRole = user?.role?.role_name || user?.role;
  const isAdmin = userRole === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderNavItems = (items) => (
    items.map((item) => (
      <NavLink
        key={item.name}
        to={item.to}
        onClick={onMenuClick}
        className={({ isActive }) => cn(
          "flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group relative",
          isActive
            ? "bg-[#1F6B45] text-[#FCFCF8] shadow-md shadow-[#081a13]/20"
            : "text-[#c6dfcd] hover:bg-[#1F6B45]/50 hover:text-[#FCFCF8]"
        )}
      >
        {({ isActive }) => (
          <>
            <item.icon
              className={cn(
                "flex-shrink-0 w-5 h-5 mr-3 transition-colors",
                isActive ? "text-[#A8C957]" : "text-[#5BAE65] group-hover:text-[#A8C957]"
              )}
            />
            {item.name}
          </>
        )}
      </NavLink>
    ))
  );

  return (
    <div className="flex flex-col w-64 bg-[#12372A] border-r border-[#0d291e] h-screen sticky top-0 shadow-xl z-20">

      {/* Brand Header */}
      <div className="p-6 flex items-center space-x-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#A8C957] to-[#5BAE65] flex items-center justify-center shadow-md">
          <Sprout className="w-5 h-5 text-[#12372A]" />
        </div>
        <span className="text-xl font-bold text-[#F7F8F2] tracking-tight font-sans">YieldSense AI</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
        {isAdmin && (
          <>
            <div className="px-3 pb-2 pt-2 text-xs font-semibold text-[#5BAE65]/70 uppercase tracking-wider">
              Administration
            </div>
            {renderNavItems(adminNavigation)}
          </>
        )}
        <div className="px-3 pb-2 pt-2 text-xs font-semibold text-[#5BAE65]/70 uppercase tracking-wider">
          Overview
        </div>
        {renderNavItems(farmerNavigation)}
      </nav>

      {/* Footer / User Settings */}
      <div className="p-4 border-t border-[#1F6B45]/30 space-y-1.5">
        <NavLink
          to="/settings"
          onClick={onMenuClick}
          className={({ isActive }) => cn(
            "flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-colors group",
            isActive
              ? "bg-[#1F6B45] text-[#FCFCF8]"
              : "text-[#c6dfcd] hover:bg-[#1F6B45]/50 hover:text-[#FCFCF8]"
          )}
        >
          <Settings className="flex-shrink-0 w-5 h-5 mr-3 text-[#5BAE65] group-hover:text-[#A8C957]" />
          Settings
        </NavLink>
        <button onClick={handleLogout} className="flex w-full items-center px-3 py-2.5 text-sm font-medium text-[#c6dfcd] rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors group">
          <LogOut className="flex-shrink-0 w-5 h-5 mr-3 text-[#5BAE65] group-hover:text-red-400" />
          Logout
        </button>

        {/* User Profile Mini */}
        <div className="mt-4 px-3 py-3 bg-[#0d291e] rounded-xl flex items-center shadow-inner border border-[#1F6B45]/20">
          <div className="w-8 h-8 rounded-full bg-[#1F6B45] flex items-center justify-center text-[#A8C957] font-bold text-sm border border-[#5BAE65]/30">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-medium text-[#FCFCF8] truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-[#5BAE65] truncate capitalize">{userRole}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
