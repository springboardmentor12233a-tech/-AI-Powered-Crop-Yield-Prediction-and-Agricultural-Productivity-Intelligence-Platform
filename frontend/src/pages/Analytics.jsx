import { useEffect, useState } from 'react';
import { 
  LineChart as LineIcon, 
  Loader2, 
  AlertCircle,
  BarChart2,
  TrendingUp,
  Info
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { getPredictionHistory } from '../services/api';

export default function Analytics() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getPredictionHistory();
        // Sort by observation_date ascending for time series
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary-500" />
        <p>Loading analytics dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <AlertCircle className="w-8 h-8 mb-4" />
        <p>{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Performance Analytics</h2>
          <p className="text-slate-500 mt-1">Visualize your agricultural trends and productivity history.</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
              <LineIcon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Data Available</h3>
            <p className="text-slate-500 max-w-md">
              Run some yield predictions to populate your analytics dashboard with historical performance data.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare data for charts
  const timeSeriesData = history.map((item) => ({
    date: new Date(item.input_data?.observation_date || item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    yield: Math.round(item.predicted_yield)
  }));

  // Average yield by crop
  const cropStats = history.reduce((acc, item) => {
    if (!acc[item.crop_type]) {
      acc[item.crop_type] = { total: 0, count: 0 };
    }
    acc[item.crop_type].total += item.predicted_yield;
    acc[item.crop_type].count += 1;
    return acc;
  }, {});

  const cropData = Object.keys(cropStats).map(crop => ({
    name: crop,
    averageYield: Math.round(cropStats[crop].total / cropStats[crop].count)
  }));

  // Analytics charts rely strictly on formatted history data.

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Performance Analytics</h2>
        <p className="text-slate-500 mt-1">Visualize your agricultural trends and productivity history.</p>
      </div>
      
      {/* 1. KEY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary-50 border-primary-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-primary-700">Total Predictions</p>
              <BarChart2 className="w-4 h-4 text-primary-500" />
            </div>
            <h3 className="text-3xl font-bold text-primary-900">{history.length}</h3>
          </CardContent>
        </Card>
        
        <Card className="bg-emerald-50 border-emerald-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-emerald-700">Highest Yield</p>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className="text-3xl font-bold text-emerald-900">
              {Math.round(Math.max(...history.map(h => h.predicted_yield))).toLocaleString()}
              <span className="text-sm font-normal text-emerald-700 ml-1">kg/ha</span>
            </h3>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-blue-700">Crops Analyzed</p>
              <LineIcon className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="text-3xl font-bold text-blue-900">{Object.keys(cropStats).length}</h3>
          </CardContent>
        </Card>
      </div>

      {/* 2. YIELD PROGRESSION (Full Width) */}
      <Card>
        <CardHeader>
          <CardTitle>Yield Progression</CardTitle>
        </CardHeader>
        <CardContent>
          {timeSeriesData.length < 2 ? (
            <div className="flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 h-[280px]">
              <Info className="w-5 h-5 text-slate-400 mb-2" />
              <p className="text-sm text-slate-500">Not enough prediction data available yet.</p>
            </div>
          ) : (
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProgression" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#64748b', fontSize: 11 }} 
                    axisLine={false} 
                    tickLine={false} 
                    minTickGap={30} 
                  />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
                            <p className="text-sm font-semibold text-slate-800 mb-1">{payload[0].payload.date}</p>
                            <p className="text-sm font-bold text-emerald-600">Yield: {payload[0].payload.yield.toLocaleString()} kg/ha</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="yield" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorProgression)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. AVERAGE YIELD BY CROP (Full Width) */}
      <Card>
        <CardHeader>
          <CardTitle>Average Yield by Crop</CardTitle>
        </CardHeader>
        <CardContent>
          {cropData.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 h-[280px]">
              <Info className="w-5 h-5 text-slate-400 mb-2" />
              <p className="text-sm text-slate-500">No prediction history available yet.</p>
            </div>
          ) : (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cropData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }} 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
                            <p className="text-sm font-semibold text-slate-800 mb-1">{payload[0].payload.name}</p>
                            <p className="text-sm font-bold text-emerald-600">Yield: {payload[0].payload.averageYield.toLocaleString()} kg/ha</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="averageYield" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
