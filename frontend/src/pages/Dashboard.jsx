import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sprout, 
  TrendingUp, 
  TrendingDown,
  CloudRain, 
  TestTube, 
  Lightbulb, 
  AlertTriangle,
  ArrowRight,
  Thermometer,
  Droplets,
  LineChart as LineChartIcon,
  FileText,
  Brain,
  ShieldCheck,
  CheckCircle2,
  Wind
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { useAppContext } from '../context/AppContext';
import { getPredictionHistory } from '../services/api';
import { cn } from '../utils/cn';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100 min-w-[180px]">
        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
        <p className="text-2xl font-extrabold text-[#1F6B45] mb-2">{data.yield.toLocaleString()} <span className="text-sm font-medium text-slate-500">kg/ha</span></p>
        <div className="space-y-1.5 pt-2 border-t border-slate-50">
          {data.crop && <p className="text-xs font-semibold text-slate-600">Crop: <span className="text-slate-800">{data.crop}</span></p>}
          {data.region && <p className="text-xs font-semibold text-slate-600">Region: <span className="text-slate-800">{data.region}</span></p>}
        </div>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { recentPrediction, analysisState, fetchAnalysis, retryInsights } = useAppContext();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  
  useEffect(() => {
    if (recentPrediction) {
      fetchAnalysis(recentPrediction);
    }
    const loadHistory = async () => {
      try {
        const hist = await getPredictionHistory();
        const sorted = [...hist].sort((a, b) => {
          const dateA = new Date(a.input_data?.observation_date || a.created_at).getTime();
          const dateB = new Date(b.input_data?.observation_date || b.created_at).getTime();
          if (dateA !== dateB) return dateA - dateB;
          return (a.id || 0) - (b.id || 0);
        });
        setHistory(sorted);
      } catch (err) {
        console.error("Failed to load prediction history", err);
      }
    };
    loadHistory();
  }, [recentPrediction, fetchAnalysis]);

  const weatherData = analysisState?.weatherData;
  const soilData = analysisState?.soilData;
  const insightsData = analysisState?.insightsData;
  const loadingExtras = analysisState?.status === 'loading';
  const llmError = analysisState?.llmError;

  const activePrediction = recentPrediction;
  const hasData = !!activePrediction;
  const input = activePrediction?.input;
  const result = activePrediction?.result;

  // Calculate trends
  let yieldTrend = null;
  let yieldTrendValue = null;
  if (hasData && history.length > 1) {
    const currentYield = result.predicted_yield_kg_per_hectare;
    const prevYield = history[history.length - 2]?.predicted_yield;
    if (prevYield && prevYield > 0) {
      const diff = ((currentYield - prevYield) / prevYield) * 100;
      yieldTrend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral';
      yieldTrendValue = `${Math.abs(diff).toFixed(1)}%`;
    }
  }

  const getSoilStatus = () => {
    if (!input) return { status: 'Unknown', color: 'text-slate-500' };
    const moisture = input['soil_moisture_%'];
    if (moisture >= 60 && moisture <= 80) return { status: 'Optimal', color: 'text-[#16A34A]' };
    if (moisture > 80) return { status: 'High Moisture', color: 'text-[#0EA5E9]' };
    return { status: 'Needs Water', color: 'text-[#F59E0B]' };
  };

  const getWeatherStatus = () => {
    if (!input) return { status: 'Unknown', color: 'text-slate-500' };
    const temp = input.temperature_C;
    if (temp >= 20 && temp <= 30) return { status: 'Favorable', color: 'text-[#16A34A]' };
    if (temp > 30) return { status: 'Heat Stress Risk', color: 'text-[#EF4444]' };
    return { status: 'Cool', color: 'text-[#0EA5E9]' };
  };

  const soilStatus = getSoilStatus();
  const weatherStatus = getWeatherStatus();

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      
      {/* 1. HERO SECTION */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#12372A] to-[#1F6B45] p-6 sm:p-10 md:p-14 shadow-card border border-[#2E8B57]/30">
        <div className="absolute -top-24 -right-24 opacity-10 pointer-events-none transform rotate-12">
          <Sprout className="w-[400px] h-[400px] text-[#A8C957]" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#FCFCF8] tracking-tight mb-5 leading-tight">
            Your farm intelligence <br className="hidden md:block"/> at a glance.
          </h2>
          <p className="text-lg md:text-xl text-[#c6dfcd] mb-8 font-medium leading-relaxed max-w-xl">
            Monitor crop health, predict yield, and make smarter agricultural decisions backed by AI.
          </p>
          <button 
            onClick={() => navigate('/predict')} 
            className="group relative inline-flex items-center justify-center bg-[#A8C957] text-[#12372A] font-bold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:bg-[#5BAE65] hover:text-white transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
          >
            <span className="relative z-10 flex items-center">
              {hasData ? 'Run New Prediction' : 'Run Your First Prediction'}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>
      </div>

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Yield Card */}
        <div className="p-6 rounded-3xl border border-slate-200/60 shadow-sm bg-white transition-all duration-300 hover:shadow-md hover:-translate-y-1 group">
          <div className="flex justify-between items-start mb-5">
            <div className="p-3.5 bg-gradient-to-br from-[#e8f0ea] to-[#c6dfcd] rounded-2xl text-[#1F6B45] group-hover:scale-110 transition-transform">
              <Sprout className="w-6 h-6" />
            </div>
            {yieldTrend && (
              <div className={cn("flex items-center text-sm font-bold px-2.5 py-1 rounded-lg", yieldTrend === 'up' ? 'bg-emerald-50 text-emerald-700' : yieldTrend === 'down' ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-700')}>
                {yieldTrend === 'up' ? <TrendingUp className="w-4 h-4 mr-1.5" /> : yieldTrend === 'down' ? <TrendingDown className="w-4 h-4 mr-1.5" /> : null}
                {yieldTrendValue}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-slate-500 font-bold text-xs mb-1.5 uppercase tracking-widest">Predicted Yield</h3>
            <div className="flex items-baseline">
              <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{hasData ? result.predicted_yield_kg_per_hectare.toLocaleString() : '--'}</span>
              {hasData && <span className="ml-2 text-sm font-semibold text-slate-500">kg/ha</span>}
            </div>
          </div>
        </div>

        {/* Soil Card */}
        <div className="p-6 rounded-3xl border border-slate-200/60 shadow-sm bg-white transition-all duration-300 hover:shadow-md hover:-translate-y-1 group">
          <div className="flex justify-between items-start mb-5">
            <div className="p-3.5 bg-[#fef3c7] rounded-2xl text-[#d97706] group-hover:scale-110 transition-transform">
              <TestTube className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h3 className="text-slate-500 font-bold text-xs mb-1.5 uppercase tracking-widest">Soil Health</h3>
            <div className={cn("text-2xl font-extrabold tracking-tight", hasData ? soilStatus.color : 'text-slate-400')}>
              {hasData ? soilStatus.status : 'No Data'}
            </div>
            {hasData && <p className="text-sm font-medium text-slate-500 mt-2">Moisture: {input?.['soil_moisture_%']}% | pH: {input?.soil_pH}</p>}
          </div>
        </div>

        {/* Weather Card */}
        <div className="p-6 rounded-3xl border border-slate-200/60 shadow-sm bg-white transition-all duration-300 hover:shadow-md hover:-translate-y-1 group">
          <div className="flex justify-between items-start mb-5">
            <div className="p-3.5 bg-[#e0f2fe] rounded-2xl text-[#0284c7] group-hover:scale-110 transition-transform">
              <CloudRain className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h3 className="text-slate-500 font-bold text-xs mb-1.5 uppercase tracking-widest">Weather Impact</h3>
            <div className={cn("text-2xl font-extrabold tracking-tight", hasData ? weatherStatus.color : 'text-slate-400')}>
              {hasData ? weatherStatus.status : 'No Data'}
            </div>
            {hasData && <p className="text-sm font-medium text-slate-500 mt-2">{input?.temperature_C}°C | {input?.rainfall_mm}mm Rain</p>}
          </div>
        </div>

        {/* AI Risk Card */}
        <div className="p-6 rounded-3xl border border-slate-200/60 shadow-sm bg-white transition-all duration-300 hover:shadow-md hover:-translate-y-1 group">
          <div className="flex justify-between items-start mb-5">
            <div className="p-3.5 bg-[#f3e8ff] rounded-2xl text-[#9333ea] group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h3 className="text-slate-500 font-bold text-xs mb-1.5 uppercase tracking-widest">AI Risk Level</h3>
            <div className="text-2xl font-extrabold tracking-tight text-[#16A34A]">
              {hasData ? (insightsData?.attention_points?.length > 1 ? <span className="text-[#F59E0B]">Moderate</span> : 'Low') : <span className="text-slate-400">No Data</span>}
            </div>
            {hasData && <p className="text-sm font-medium text-slate-500 mt-2">{insightsData?.attention_points?.length || 0} active warnings</p>}
          </div>
        </div>
      </div>

      {/* 3. MAIN CHARTS & AI SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Yield Performance Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-5 sm:p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Yield Performance</h3>
            <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#A8C957] outline-none appearance-none cursor-pointer">
              <option>Last 30 Days</option>
              <option>All Time</option>
            </select>
          </div>
          
          <div className="h-[350px] w-full">
            {!hasData ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#F7F8F2] rounded-2xl border border-dashed border-[#c6dfcd]">
                <LineChartIcon className="w-12 h-12 text-[#5BAE65] mb-4 opacity-50" />
                <p className="text-slate-500 font-semibold text-center">Run a prediction to visualize<br/>your yield trends over time.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={Array.isArray(history) && history.length > 1 ? history.map(item => ({
                  date: new Date(item.input_data?.observation_date || item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                  yield: Math.round(item.predicted_yield),
                  crop: item.input_data?.crop_type || item.crop_type,
                  region: item.input_data?.region || item.region
                })) : [{ 
                  date: 'Today', 
                  yield: result?.predicted_yield_kg_per_hectare || 0,
                  crop: input?.crop_type,
                  region: input?.region
                }]}>
                  <defs>
                    <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2E8B57" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2E8B57" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 600, fontSize: 12 }} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 600, fontSize: 12 }} dx={-10} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="yield" stroke="#1F6B45" strokeWidth={4} fillOpacity={1} fill="url(#colorYield)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* AI Intelligence Card */}
        <div className="bg-gradient-to-b from-[#12372A] to-[#0d291e] rounded-[2rem] shadow-card p-5 sm:p-8 relative overflow-hidden flex flex-col h-full border border-[#1F6B45]/50">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#5BAE65]/10 rounded-full blur-[80px] -mt-20 -mr-20 pointer-events-none"></div>
          
          <div className="flex items-center mb-8 relative z-10">
            <div className="p-3 bg-gradient-to-br from-[#A8C957] to-[#5BAE65] rounded-xl shadow-lg mr-4">
              <Brain className="w-6 h-6 text-[#12372A]" />
            </div>
            <h3 className="text-xl font-extrabold text-[#FCFCF8]">AI Intelligence</h3>
          </div>

          <div className="flex-1 flex flex-col relative z-10">
            {!hasData ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center">
                 <p className="text-[#c6dfcd] font-medium leading-relaxed mb-6">Your personalized AI insights will appear here after generating a forecast.</p>
               </div>
            ) : loadingExtras ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                 <div className="w-10 h-10 border-4 border-[#1F6B45] border-t-[#A8C957] rounded-full animate-spin"></div>
                 <p className="text-[#A8C957] font-semibold animate-pulse">Analyzing farm conditions...</p>
               </div>
            ) : insightsData ? (
              <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-[#1F6B45]/40 backdrop-blur-sm border border-[#5BAE65]/20 rounded-2xl p-5">
                  <p className="text-[#F7F8F2] font-medium text-sm leading-relaxed">
                    {insightsData.summary} {insightsData.yield_interpretation}
                  </p>
                </div>
                
                {insightsData.limitations && insightsData.limitations.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-[#A8C957] uppercase tracking-widest mb-3 flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Recommended Actions
                    </h4>
                    <ul className="space-y-3">
                      {insightsData.limitations.slice(0, 3).map((pt, idx) => (
                        <li key={idx} className="flex items-start bg-[#081a13]/50 rounded-xl p-3 border border-[#1F6B45]/30">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#A8C957] mt-1.5 mr-3 flex-shrink-0"></div>
                          <span className="text-[#c6dfcd] text-sm leading-relaxed">{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                 <p className="text-red-300 font-medium leading-relaxed mb-4">Unable to fetch AI insights.</p>
                 <button onClick={retryInsights} className="px-4 py-2 bg-[#1F6B45] text-white rounded-lg text-sm font-bold hover:bg-[#2E8B57] transition-colors">Retry</button>
              </div>
            )}
          </div>
          
          {hasData && insightsData && (
             <button onClick={() => navigate('/recommendations')} className="mt-6 w-full py-3.5 bg-[#1F6B45]/50 hover:bg-[#1F6B45] text-[#A8C957] font-bold rounded-xl border border-[#5BAE65]/30 transition-colors">
               View Full Analysis
             </button>
          )}
        </div>
      </div>

      {/* 4. FARM HEALTH & ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Farm Health Visuals */}
        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-5 sm:p-8">
          <h3 className="text-xl font-bold text-slate-800 mb-8">Environmental Intelligence</h3>
          
          {!hasData ? (
             <p className="text-slate-500 font-medium text-center py-12">Data available after prediction.</p>
          ) : (
             <div className="space-y-6">
                {/* Temperature */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center text-slate-700 font-bold text-sm">
                      <Thermometer className="w-4 h-4 mr-2 text-rose-500" /> Temperature
                    </div>
                    <span className="font-extrabold text-slate-800">{input?.temperature_C}°C</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-400 to-rose-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (input?.temperature_C || 0) * 2.5)}%` }}></div>
                  </div>
                </div>

                {/* Rainfall */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center text-slate-700 font-bold text-sm">
                      <CloudRain className="w-4 h-4 mr-2 text-blue-500" /> Rainfall
                    </div>
                    <span className="font-extrabold text-slate-800">{input?.rainfall_mm}mm</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-300 to-blue-600 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (input?.rainfall_mm || 0) / 3)}%` }}></div>
                  </div>
                </div>

                {/* Humidity */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center text-slate-700 font-bold text-sm">
                      <Droplets className="w-4 h-4 mr-2 text-cyan-500" /> Humidity
                    </div>
                    <span className="font-extrabold text-slate-800">{input?.['humidity_%']}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-300 to-cyan-500 h-full rounded-full transition-all duration-1000" style={{ width: `${input?.['humidity_%'] || 0}%` }}></div>
                  </div>
                </div>
                
                {/* NDVI */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center text-slate-700 font-bold text-sm">
                      <Sprout className="w-4 h-4 mr-2 text-emerald-500" /> Vegetation Index (NDVI)
                    </div>
                    <span className="font-extrabold text-slate-800">{input?.ndvi?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-[#A8C957] to-[#1F6B45] h-full rounded-full transition-all duration-1000" style={{ width: `${((input?.ndvi || 0) * 100)}%` }}></div>
                  </div>
                </div>
             </div>
          )}
        </div>

        {/* Agricultural Alerts */}
        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-5 sm:p-8 flex flex-col">
          <h3 className="text-xl font-bold text-slate-800 mb-6">Agricultural Alerts</h3>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {!hasData ? (
               <div className="flex flex-col items-center justify-center h-full text-center py-8">
                 <AlertTriangle className="w-12 h-12 text-slate-200 mb-3" />
                 <p className="text-slate-500 font-medium">Monitoring system inactive.<br/>Run a prediction to check for alerts.</p>
               </div>
            ) : insightsData?.attention_points?.length > 0 ? (
               <div className="space-y-4">
                 {insightsData.attention_points.map((pt, idx) => (
                   <div key={idx} className="flex p-4 rounded-2xl bg-amber-50 border border-amber-100">
                     <AlertTriangle className="w-6 h-6 text-amber-600 mr-4 flex-shrink-0" />
                     <div>
                       <h4 className="font-bold text-amber-900 text-sm mb-1">
                         {typeof pt === 'string' ? pt : pt.title || 'Attention Required'}
                       </h4>
                       {typeof pt !== 'string' && (
                         <p className="text-amber-800 text-sm leading-relaxed">{pt.reason} <span className="font-semibold block mt-1">Action: {pt.action}</span></p>
                       )}
                     </div>
                   </div>
                 ))}
               </div>
            ) : (
               <div className="flex flex-col items-center justify-center h-full text-center py-8 bg-[#F7F8F2] rounded-2xl border border-dashed border-[#c6dfcd]">
                 <CheckCircle2 className="w-12 h-12 text-[#5BAE65] mb-3" />
                 <p className="text-[#1F6B45] font-bold">All Systems Nominal</p>
                 <p className="text-sm text-[#2E8B57] mt-1">No critical agricultural alerts detected.</p>
               </div>
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}
