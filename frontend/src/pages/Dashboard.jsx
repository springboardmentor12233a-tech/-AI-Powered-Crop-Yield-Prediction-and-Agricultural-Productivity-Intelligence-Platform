import React, { useEffect, useState } from 'react';
import { Landmark, Trees, ShieldCheck, Database, Sliders, BrainCircuit, RefreshCw, Info } from 'lucide-react';
import api from '../api';

export default function Dashboard() {
  const [farmsCount, setFarmsCount] = useState(0);
  const [cropsCount, setCropsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const userName = localStorage.getItem('name') || 'Farmer';
  const userRole = localStorage.getItem('role') || 'Farmer';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const farmsRes = await api.get('/farms');
        const cropsRes = await api.get('/crops');
        setFarmsCount(farmsRes.data.length);
        setCropsCount(cropsRes.data.length);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header welcome banner */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#e3ecd9] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-brand-50 rounded-full blur-2xl" />
        <div className="relative">
          <h2 className="text-2xl font-bold text-slate-800">Hello, {userName}! 👋</h2>
          <p className="text-slate-500 text-sm mt-1">Here is the active summary for your agricultural forecasting system.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-brand-100/50 text-brand-700 rounded-2xl text-xs font-semibold">
          <ShieldCheck size={16} />
          <span>Verified {userRole} Access</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="animate-spin text-brand-500" size={32} />
        </div>
      ) : (
        <>
          {/* Main metric grids */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Farms card */}
            <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] hover:border-brand-300 transition-all duration-300 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-brand-50 text-brand-600 rounded-2xl">
                <Landmark size={24} />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Farms</span>
                <span className="text-2xl font-extrabold text-slate-800">{farmsCount}</span>
              </div>
            </div>

            {/* Crops card */}
            <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] hover:border-brand-300 transition-all duration-300 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-brand-50 text-brand-600 rounded-2xl">
                <Trees size={24} />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Active Crops</span>
                <span className="text-2xl font-extrabold text-slate-800">{cropsCount}</span>
              </div>
            </div>

            {/* Dataset status card */}
            <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] hover:border-brand-300 transition-all duration-300 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                <Database size={24} />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Raw Dataset</span>
                <span className="text-sm font-bold text-blue-600">Loaded &amp; Ready</span>
              </div>
            </div>

            {/* Preprocessing status */}
            <div className="bg-white p-6 rounded-3xl border border-[#e3ecd9] hover:border-brand-300 transition-all duration-300 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
                <Sliders size={24} />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Preprocessing</span>
                <span className="text-sm font-bold text-amber-600">Active Pipeline</span>
              </div>
            </div>
          </div>

          {/* ML prediction banner card */}
          <div className="bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-brand-700/10">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md text-white">
                <BrainCircuit size={32} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Machine Learning Yield Predictions</h3>
                <p className="text-brand-100 text-sm mt-0.5">Automated crop productivity predictions using weather and soil intelligence.</p>
              </div>
            </div>
            <div className="px-5 py-2.5 bg-white/20 hover:bg-white/25 transition-all text-xs font-semibold rounded-2xl border border-white/20 select-none">
              Milestone 2 - Coming Soon
            </div>
          </div>

          {/* Guidelines info card */}
          <div className="bg-[#f2f6ee] p-6 rounded-3xl border border-[#e0ebd5] flex gap-4 text-slate-700">
            <Info className="text-brand-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm leading-relaxed">
              <h4 className="font-semibold text-slate-800 mb-1">Week 1 Foundation Scope</h4>
              <p>The system is currently running on the Week 1 layout. You can create and manage database records for your <strong>Farms</strong> and linked <strong>Crops</strong>. Preprocessing pipelines have been written using Pandas to format crop, weather, and soil feature profiles. ML model integrations (XGBoost / Neural Networks) and recommendations are planned for Milestone 2.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
