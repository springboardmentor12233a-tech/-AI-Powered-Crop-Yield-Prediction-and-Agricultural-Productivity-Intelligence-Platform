import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { EmptyState, LoadingState, ErrorState } from '../components/common/StateComponents';
import { getPredictionHistory } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { CloudRain, ArrowRight, Thermometer, Droplets, Sun } from 'lucide-react';
import {
  LineChart,
  Line,
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Weather Analysis</h2>
          <p className="text-slate-500 mt-1">Impact assessment for {recentPrediction.input.crop_type} in {recentPrediction.input.region}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <Thermometer className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Temperature</p>
              <p className="font-semibold text-slate-800">{recentPrediction.input.temperature_C}°C</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <CloudRain className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Rainfall</p>
              <p className="font-semibold text-slate-800">{recentPrediction.input.rainfall_mm}mm</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Humidity</p>
              <p className="font-semibold text-slate-800">{recentPrediction.input["humidity_%"]}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <Sun className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Sunlight</p>
              <p className="font-semibold text-slate-800">{recentPrediction.input.sunlight_hours} hrs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weather Impact Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-800">Key Insights</h4>
              <ul className="space-y-2">
                {[data.overall_assessment, data.historical_yield_context, data.agricultural_insight].filter(Boolean).map((insight, idx) => (
                  <li key={idx} className="text-sm text-slate-600 flex items-start">
                    <ArrowRight className="w-4 h-4 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                    {insight}
                  </li>
                ))}
                {![data.overall_assessment, data.historical_yield_context, data.agricultural_insight].filter(Boolean).length && (
                  <p className="text-sm text-slate-500">No specific weather insights available for this context.</p>
                )}
              </ul>
            </div>

            {data.weather_assessment && Object.keys(data.weather_assessment).length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="text-sm font-semibold text-slate-800 mb-4">Detailed Parameter Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(data.weather_assessment).map(([key, assessment], idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <h5 className="font-semibold text-slate-800 capitalize mb-2">{key}</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Value:</span>
                          <span className="font-medium text-slate-700">{assessment.value}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block mb-0.5">Historical classification:</span>
                          <span className="text-slate-700 leading-snug">{assessment.assessment}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block mb-0.5">Yield context:</span>
                          <span className="text-slate-700 leading-snug">{assessment.historical_context}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weather Conditions Used in Previous Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="flex-1 flex items-center justify-center bg-slate-50/50 m-4 rounded-xl border border-dashed border-slate-200 py-12">
                <EmptyState 
                  title="No historical weather inputs available yet." 
                  message="Weather trends will appear after you make additional predictions."
                  icon={CloudRain}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="h-64">
                  <h4 className="text-sm font-semibold text-slate-700 mb-4 text-center">Temperature Trend (°C)</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history.map(item => ({
                      date: formatDate(item.input_data.observation_date || item.created_at),
                      temperature: item.input_data.temperature_C
                    }))} margin={{ top: 5, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} minTickGap={30} height={40} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: '#ef4444' }} activeDot={{ r: 6 }} name="Temp (°C)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="h-64">
                  <h4 className="text-sm font-semibold text-slate-700 mb-4 text-center">Rainfall Trend (mm)</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history.map(item => ({
                      date: formatDate(item.input_data.observation_date || item.created_at),
                      rainfall: item.input_data.rainfall_mm
                    }))} margin={{ top: 5, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} minTickGap={30} height={40} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="rainfall" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} name="Rainfall (mm)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="h-64">
                  <h4 className="text-sm font-semibold text-slate-700 mb-4 text-center">Humidity Trend (%)</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history.map(item => ({
                      date: formatDate(item.input_data.observation_date || item.created_at),
                      humidity: item.input_data["humidity_%"]
                    }))} margin={{ top: 5, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} minTickGap={30} height={40} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="humidity" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4, fill: '#06b6d4' }} activeDot={{ r: 6 }} name="Humidity (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="h-64">
                  <h4 className="text-sm font-semibold text-slate-700 mb-4 text-center">Sunlight Trend (hrs)</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history.map(item => ({
                      date: formatDate(item.input_data.observation_date || item.created_at),
                      sunlight: item.input_data.sunlight_hours
                    }))} margin={{ top: 5, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} minTickGap={30} height={40} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="sunlight" stroke="#d97706" strokeWidth={2} dot={{ r: 4, fill: '#d97706' }} activeDot={{ r: 6 }} name="Sun (hrs)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
