import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppShell() {
  const location = useLocation();
  
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
    </div>
  );
}
