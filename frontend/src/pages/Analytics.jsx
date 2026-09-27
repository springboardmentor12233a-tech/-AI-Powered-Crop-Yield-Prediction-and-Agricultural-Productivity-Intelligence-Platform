import { useEffect, useState } from 'react';
import { 
  LineChart as LineIcon, 
  Loader2, 
  AlertCircle,
  BarChart2,
  TrendingUp,
  Droplets,
  CloudRain
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
  ScatterChart, Scatter, ZAxis
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
          <h2 className="text-2xl font-bold text-slate-800">Analytics</h2>
          <p className="text-slate-500 mt-1">Advanced agricultural productivity trends.</p>
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
  const timeSeriesData = history.map((item, index) => ({
    name: new Date(item.input_data.observation_date || item.created_at).toLocaleDateString(),
    yield: Math.round(item.predicted_yield),
    index: index + 1
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

  // Soil moisture vs Yield
  const scatterData = history.map(item => ({
    moisture: item.input_data["soil_moisture_%"],
    yield: Math.round(item.predicted_yield),
    crop: item.crop_type
  }));

  // Rainfall vs Yield
  const rainfallScatterData = history.map(item => ({
    rainfall: item.input_data.rainfall_mm,
    yield: Math.round(item.predicted_yield),
    crop: item.crop_type
  }));

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Performance Analytics</h2>
        <p className="text-slate-500 mt-1">Visualize your agricultural trends and productivity history.</p>
      </div>
      
      {/* 1. KEY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* 2. CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* TIME SERIES */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Yield Progression</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProgression" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="yield" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorProgression)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* CROP COMPARISON */}
        <Card>
          <CardHeader>
            <CardTitle>Average Yield by Crop</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cropData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="averageYield" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* MOISTURE VS YIELD */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Droplets className="w-5 h-5 mr-2 text-cyan-500" />
              Soil Moisture Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" dataKey="moisture" name="Moisture %" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis type="number" dataKey="yield" name="Yield" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <ZAxis type="category" dataKey="crop" name="Crop" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Scatter name="Yield Analysis" data={scatterData} fill="#0ea5e9" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* RAINFALL VS YIELD */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CloudRain className="w-5 h-5 mr-2 text-indigo-500" />
              Rainfall Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" dataKey="rainfall" name="Rainfall (mm)" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis type="number" dataKey="yield" name="Yield" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <ZAxis type="category" dataKey="crop" name="Crop" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Scatter name="Yield Analysis" data={rainfallScatterData} fill="#6366f1" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
