import { useEffect, useState, useMemo } from 'react';
import { 
  LineChart as LineIcon, 
  Loader2, 
  AlertCircle,
  BarChart2,
  TrendingUp,
  Info,
  Calendar,
  Layers,
  Thermometer,
  CloudRain,
  Sprout
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar,
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { getPredictionHistory } from '../services/api';
import { cn } from '../utils/cn';

// Simple Pearson correlation
function pearsonCorrelation(x, y) {
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  const minLength = Math.min(x.length, y.length);
  if (minLength === 0) return 0;
  for (let i = 0; i < minLength; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
    sumY2 += y[i] * y[i];
  }
  const step1 = (minLength * sumXY) - (sumX * sumY);
  const step2 = (minLength * sumX2) - (sumX * sumX);
  const step3 = (minLength * sumY2) - (sumY * sumY);
  const step4 = Math.sqrt(step2 * step3);
  if (step4 === 0) return 0;
  return step1 / step4;
}

const CustomAreaTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100">
        <p className="text-sm font-bold text-slate-500 mb-1">{label}</p>
        <p className="text-lg font-extrabold text-[#1F6B45]">Yield: {payload[0].value.toLocaleString()} kg/ha</p>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100">
        <p className="text-sm font-bold text-slate-500 mb-1">{label}</p>
        <p className="text-lg font-extrabold text-blue-600">{Math.abs(payload[0].value).toFixed(2)} Score</p>
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getPredictionHistory();
        const sortedData = [...data].sort((a, b) => new Date(a.input_data?.observation_date || a.created_at) - new Date(b.input_data?.observation_date || b.created_at));
        setHistory(sortedData);
      } catch (err) {
        console.error(err);
        setError("Failed to load analytics data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const timeSeriesData = useMemo(() => history.map((item) => ({
    date: new Date(item.input_data?.observation_date || item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    yield: Math.round(item.predicted_yield),
    temperature: item.input_data?.temperature_C,
    rainfall: item.input_data?.rainfall_mm,
    crop: item.input_data?.crop_type || item.crop_type,
    region: item.input_data?.region || item.region
  })), [history]);

  const dataSpanDays = useMemo(() => {
    if (history.length === 0) return 0;
    if (history.length === 1) return 1;
    const firstDate = new Date(history[0].input_data?.observation_date || history[0].created_at);
    const lastDate = new Date(history[history.length-1].input_data?.observation_date || history[history.length-1].created_at);
    const diff = Math.round((lastDate - firstDate) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  }, [history]);

  const featureImportance = useMemo(() => {
    if (history.length < 3) return [];
    
    const yields = history.map(h => h.predicted_yield);
    const features = {
      'Rainfall': history.map(h => h.input_data?.rainfall_mm || 0),
      'Temperature': history.map(h => h.input_data?.temperature_C || 0),
      'Soil Moisture': history.map(h => h.input_data?.['soil_moisture_%'] || 0),
      'NDVI': history.map(h => h.input_data?.ndvi || 0),
      'Humidity': history.map(h => h.input_data?.['humidity_%'] || 0),
      'Soil pH': history.map(h => h.input_data?.soil_pH || 0),
      'Sunlight': history.map(h => h.input_data?.sunlight_hours || 0),
    };

    const importances = Object.keys(features).map(key => {
      const corr = pearsonCorrelation(features[key], yields);
      return { name: key, importance: isNaN(corr) ? 0 : Math.abs(corr) };
    });

    return importances.sort((a, b) => b.importance - a.importance);
  }, [history]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen -mt-20 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#5BAE65]" />
        <p className="font-medium text-[#1F6B45]">Loading agricultural analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500 bg-red-50 rounded-3xl m-8 border border-red-100">
        <AlertCircle className="w-10 h-10 mb-4" />
        <p className="font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-[#12372A] tracking-tight">Farm Analytics</h2>
        <p className="text-lg text-[#1F6B45]/80 mt-2 font-medium">Explore prediction trends and environmental relationships across your farm data.</p>
      </div>
      
      {/* 1. KEY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-3xl border border-slate-200/60 shadow-sm bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-[#e8f0ea] rounded-xl text-[#1F6B45]">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-slate-500 font-bold text-xs mb-1 uppercase tracking-widest">Total Predictions</h3>
          <p className="text-3xl font-extrabold text-[#12372A]">{history.length}</p>
        </div>
        
        <div className="p-6 rounded-3xl border border-slate-200/60 shadow-sm bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-slate-500 font-bold text-xs mb-1 uppercase tracking-widest">Highest Predicted Yield</h3>
          <p className="text-3xl font-extrabold text-[#12372A]">
            {history.length > 0 ? Math.round(Math.max(...history.map(h => h.predicted_yield))).toLocaleString() : 0}
            <span className="text-sm font-medium text-slate-500 ml-1">kg/ha</span>
          </p>
        </div>

        <div className="p-6 rounded-3xl border border-slate-200/60 shadow-sm bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Sprout className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-slate-500 font-bold text-xs mb-1 uppercase tracking-widest">Unique Crops</h3>
          <p className="text-3xl font-extrabold text-[#12372A]">
            {new Set(history.map(h => h.crop_type || h.input_data?.crop_type)).size}
          </p>
        </div>

        <div className="p-6 rounded-3xl border border-slate-200/60 shadow-sm bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-slate-500 font-bold text-xs mb-1 uppercase tracking-widest">Data Span</h3>
          <p className="text-3xl font-extrabold text-[#12372A]">
            {dataSpanDays}
            <span className="text-sm font-medium text-slate-500 ml-1">{dataSpanDays === 1 ? 'day' : 'days'}</span>
          </p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm p-16 text-center">
          <div className="w-20 h-20 bg-[#F7F8F2] rounded-full flex items-center justify-center mb-6">
            <BarChart2 className="w-10 h-10 text-[#5BAE65]" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">No Analytics Available</h3>
          <p className="text-slate-500 max-w-md text-lg">
            Run your first yield prediction to begin building your farm's data history and visualize insights.
          </p>
        </div>
      ) : (
        <>
          {/* 2. YIELD TRENDS */}
          <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-8">
            <h3 className="text-xl font-bold text-[#12372A] mb-8">Prediction Yield Trends</h3>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData}>
                  <defs>
                    <linearGradient id="colorYieldProg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5BAE65" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#5BAE65" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} 
                    axisLine={false} 
                    tickLine={false}
                    dy={15}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} 
                    axisLine={false} 
                    tickLine={false}
                    dx={-10}
                  />
                  <RechartsTooltip content={<CustomAreaTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="yield" stroke="#1F6B45" strokeWidth={4} fillOpacity={1} fill="url(#colorYieldProg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 3. FEATURE CORRELATION */}
            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-xl font-bold text-[#12372A]">Yield Correlators</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">Impact of metrics on your historical yield</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
                {featureImportance.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={featureImportance} layout="vertical" margin={{ left: 40, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#1e293b', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <RechartsTooltip content={<CustomBarTooltip />} cursor={{fill: '#f8fafc'}} />
                      <Bar dataKey="importance" fill="#0EA5E9" radius={[0, 8, 8, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                   <div className="h-full flex items-center justify-center text-slate-400 font-medium">Need at least 3 predictions to compute correlations.</div>
                )}
              </div>
            </div>

            {/* 4. ENVIRONMENTAL ANALYSIS (SCATTER) */}
            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-xl font-bold text-[#12372A]">Temperature vs Rainfall</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">Environmental conditions per prediction</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" dataKey="temperature" name="Temp" unit="°C" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis type="number" dataKey="rainfall" name="Rain" unit="mm" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <ZAxis type="number" dataKey="yield" range={[100, 500]} name="Yield" />
                    <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Predictions" data={timeSeriesData} fill="#F59E0B" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 5. HISTORICAL TABLE */}
          <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-8 overflow-hidden">
            <h3 className="text-xl font-bold text-[#12372A] mb-6">Historical Predictions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-100">
                    <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Crop</th>
                    <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Region</th>
                    <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Yield (kg/ha)</th>
                  </tr>
                </thead>
                <tbody>
                  {timeSeriesData.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-4 text-sm font-semibold text-slate-700">{row.date}</td>
                      <td className="py-4 text-sm font-medium text-slate-600">{row.crop || '-'}</td>
                      <td className="py-4 text-sm font-medium text-slate-600">{row.region || '-'}</td>
                      <td className="py-4 text-sm font-extrabold text-[#1F6B45] text-right">{row.yield.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
