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

          {/* ML prediction status card */}
          <div className="bg-white p-8 rounded-3xl border border-[#e3ecd9] flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-brand-50 text-brand-600 rounded-2xl">
                <BrainCircuit size={32} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800">Predictive Yield Forecasts</h3>
                <p className="text-slate-500 text-sm mt-0.5">Automated crop productivity models powered by regional weather and soil analytics.</p>
              </div>
            </div>
            <div className="px-5 py-2.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-2xl select-none">
              Awaiting Model Ingestion
            </div>
          </div>
        </>
      )}
    </div>
  );
}
