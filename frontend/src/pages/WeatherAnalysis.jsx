import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { EmptyState, LoadingState, ErrorState } from '../components/common/StateComponents';
import { getPredictionHistory } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { CloudRain, ArrowRight, Thermometer, Droplets, Sun, Wind } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function WeatherAnalysis() {
  const { recentPrediction, analysisState } = useAppContext();
  const navigate = useNavigate();

  const data = analysisState?.weatherData;
  const loading = !data && analysisState?.status === 'loading';
  const error = !data && analysisState?.status === 'error';

  const [history, setHistory] = useState([]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  useEffect(() => {
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
  }, []);

  if (!recentPrediction) {
    return (
      <EmptyState 
        title="No Weather Context" 
        message="Please run a yield prediction first to establish the agricultural context for weather analysis."
        icon={CloudRain}
        action={{ label: "Run Prediction", onClick: () => navigate('/predict') }}
      />
    );
  }

  if (loading) return <LoadingState message="Analyzing historical weather impacts..." />;
  if (error) return <ErrorState message="Failed to load weather analysis data." />;
  if (!data) return null;

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-[#12372A] to-[#1F6B45] p-6 md:p-10 rounded-[2rem] shadow-card border border-[#2E8B57]/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0284c7]/20 rounded-full blur-[80px] -mt-20 -mr-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#A8C957]/10 rounded-full blur-[80px] -mb-20 -ml-20 pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold text-[#FCFCF8] tracking-tight">Weather Impact Analysis</h2>
          <p className="text-[#c6dfcd] mt-2 font-medium">Climatological assessment for {recentPrediction.input.crop_type} in {recentPrediction.input.region}.</p>
        </div>
        <div className="relative z-10 flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
          <Wind className="w-8 h-8 text-[#A8C957]" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white rounded-3xl p-4 md:p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Thermometer className="w-24 h-24" /></div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <Thermometer className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Temperature</p>
          <p className="text-3xl font-extrabold text-[#12372A]">{recentPrediction.input.temperature_C}°C</p>
        </div>
        
        <div className="bg-white rounded-3xl p-4 md:p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><CloudRain className="w-24 h-24" /></div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <CloudRain className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Rainfall</p>
          <p className="text-3xl font-extrabold text-[#12372A]">{recentPrediction.input.rainfall_mm}<span className="text-xl text-slate-400 ml-1">mm</span></p>
        </div>
        
        <div className="bg-white rounded-3xl p-4 md:p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Droplets className="w-24 h-24" /></div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 flex items-center justify-center mb-4">
            <Droplets className="w-6 h-6 text-cyan-500" />
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Humidity</p>
          <p className="text-3xl font-extrabold text-[#12372A]">{recentPrediction.input["humidity_%"]}%</p>
        </div>
        
        <div className="bg-white rounded-3xl p-4 md:p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Sun className="w-24 h-24" /></div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
            <Sun className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Sunlight</p>
          <p className="text-3xl font-extrabold text-[#12372A]">{recentPrediction.input.sunlight_hours}<span className="text-xl text-slate-400 ml-1">hrs</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-5 py-4 md:px-8 md:py-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-xl font-bold text-[#12372A]">Climatological Assessment</h3>
            <p className="text-sm text-slate-500 font-medium mt-1">AI-driven analysis of current weather parameters.</p>
          </div>
          <div className="p-5 md:p-8 space-y-8">
            <div className="bg-[#f0f9ff] p-6 rounded-2xl border border-[#bae6fd]">
              <h4 className="text-xs font-black text-[#0284c7] uppercase tracking-widest mb-4">Strategic Insights</h4>
              <ul className="space-y-3">
                {[data.overall_assessment, data.historical_yield_context, data.agricultural_insight].filter(Boolean).map((insight, idx) => (
                  <li key={idx} className="text-sm text-[#0c4a6e] font-medium leading-relaxed flex items-start">
                    <ArrowRight className="w-5 h-5 text-[#0ea5e9] mr-3 flex-shrink-0 mt-0.5" />
                    {insight}
                  </li>
                ))}
                {![data.overall_assessment, data.historical_yield_context, data.agricultural_insight].filter(Boolean).length && (
                  <p className="text-sm text-[#0c4a6e] font-medium">No specific weather insights available for this context.</p>
                )}
              </ul>
            </div>

            {data.weather_assessment && Object.keys(data.weather_assessment).length > 0 && (
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Detailed Parameter Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(data.weather_assessment).map(([key, assessment], idx) => (
                    <div key={idx} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <h5 className="font-extrabold text-[#12372A] capitalize mb-4 text-lg">{key.replace(/_/g, ' ')}</h5>
                      <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Value</span>
                          <span className="font-bold text-slate-800 text-lg">{assessment.value}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Historical Classification</span>
                          <span className="text-sm text-slate-700 font-medium leading-snug">{assessment.assessment}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Yield Context</span>
                          <span className="text-sm text-slate-700 font-medium leading-snug">{assessment.historical_context}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-5 py-4 md:px-8 md:py-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-xl font-bold text-[#12372A]">Historical Weather Trends</h3>
            <p className="text-sm text-slate-500 font-medium mt-1">Weather conditions used in previous predictions.</p>
          </div>
          <div className="p-5 md:p-8">
            {history.length === 0 ? (
              <div className="flex-1 flex items-center justify-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 py-16">
                <EmptyState 
                  title="No historical weather inputs available yet." 
                  message="Weather trends will appear after you make additional predictions."
                  icon={CloudRain}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="border border-slate-100 rounded-2xl p-6 bg-white shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 text-center">Temperature Trend (°C)</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={history.map(item => ({
                        date: formatDate(item.input_data.observation_date || item.created_at),
                        temperature: item.input_data.temperature_C
                      }))} margin={{ top: 5, right: 30, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} minTickGap={30} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} domain={['auto', 'auto']} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: '600' }} />
                        <Area type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" activeDot={{ r: 6, strokeWidth: 0, fill: '#ef4444' }} name="Temp (°C)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="border border-slate-100 rounded-2xl p-6 bg-white shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 text-center">Rainfall Trend (mm)</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={history.map(item => ({
                        date: formatDate(item.input_data.observation_date || item.created_at),
                        rainfall: item.input_data.rainfall_mm
                      }))} margin={{ top: 5, right: 30, left: -20, bottom: 0 }}>
                         <defs>
                          <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} minTickGap={30} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} domain={['auto', 'auto']} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: '600' }} />
                        <Area type="monotone" dataKey="rainfall" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRain)" activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }} name="Rainfall (mm)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="border border-slate-100 rounded-2xl p-6 bg-white shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 text-center">Humidity Trend (%)</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={history.map(item => ({
                        date: formatDate(item.input_data.observation_date || item.created_at),
                        humidity: item.input_data["humidity_%"]
                      }))} margin={{ top: 5, right: 30, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorHumid" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} minTickGap={30} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} domain={['auto', 'auto']} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: '600' }} />
                        <Area type="monotone" dataKey="humidity" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorHumid)" activeDot={{ r: 6, strokeWidth: 0, fill: '#06b6d4' }} name="Humidity (%)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="border border-slate-100 rounded-2xl p-6 bg-white shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 text-center">Sunlight Trend (hrs)</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={history.map(item => ({
                        date: formatDate(item.input_data.observation_date || item.created_at),
                        sunlight: item.input_data.sunlight_hours
                      }))} margin={{ top: 5, right: 30, left: -20, bottom: 0 }}>
                         <defs>
                          <linearGradient id="colorSun" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#d97706" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} minTickGap={30} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} domain={['auto', 'auto']} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: '600' }} />
                        <Area type="monotone" dataKey="sunlight" stroke="#d97706" strokeWidth={3} fillOpacity={1} fill="url(#colorSun)" activeDot={{ r: 6, strokeWidth: 0, fill: '#d97706' }} name="Sun (hrs)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
