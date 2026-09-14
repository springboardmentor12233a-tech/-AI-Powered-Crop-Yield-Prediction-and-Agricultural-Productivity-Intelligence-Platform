import React, { useEffect, useState } from 'react';
import { Bell, Search, User } from 'lucide-react';
import { healthCheck } from '../../services/api';
import { Badge } from '../common/Badge';

export function Header({ title }) {
  const [backendStatus, setBackendStatus] = useState('loading');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        await healthCheck();
        setBackendStatus('connected');
      } catch (error) {
        setBackendStatus('error');
      }
    };
    checkStatus();
    // Poll every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

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
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white w-64 transition-all"
          />
        </div>
        
        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="h-8 w-8 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center text-primary-700">
          <User className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
}
