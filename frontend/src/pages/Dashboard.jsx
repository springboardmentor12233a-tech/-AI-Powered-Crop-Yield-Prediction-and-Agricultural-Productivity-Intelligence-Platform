import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sprout, 
  TrendingUp, 
  CloudRain, 
  TestTube, 
  Lightbulb, 
  AlertTriangle,
  ArrowRight,
  Thermometer,
  Droplets,
  LineChart as LineChartIcon,
  FileText
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { useAppContext } from '../context/AppContext';
import { getPredictionHistory } from '../services/api';
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
      <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 min-w-[150px]">
        <p className="text-sm font-semibold text-slate-800 mb-2 border-b border-slate-100 pb-1">{label}</p>
        <p className="text-sm font-bold text-emerald-600 mb-2">Yield: {data.yield.toLocaleString()} kg/ha</p>
        <div className="space-y-1">
          {data.crop && <p className="text-xs text-slate-500"><span className="font-medium">Crop:</span> {data.crop}</p>}
          {data.region && <p className="text-xs text-slate-500"><span className="font-medium">Region:</span> {data.region}</p>}
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
        // Dashboard does not need to overwrite recentPrediction.
        // AppShell handles the current prediction loading.
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

  // Use recentPrediction as the only active prediction. AppShell guarantees it loads.
  const activePrediction = recentPrediction;

  const hasData = !!activePrediction;
  const input = activePrediction?.input;
  const result = activePrediction?.result;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Welcome to YieldSense AI</h2>
          <p className="text-slate-500 mt-1">A centralized agricultural intelligence platform for crop yield forecasting and farm productivity analysis.</p>
        </div>
        <Button onClick={() => navigate('/predict')} icon={Sprout} className="flex-shrink-0">
          {hasData ? 'Run New Prediction' : 'Run Your First Prediction'}
        </Button>
      </div>

      {/* 2. KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-500">Predicted Yield</p>
              <TrendingUp className="w-4 h-4 text-primary-500" />
            </div>
            {hasData ? (
              <h3 className="text-2xl font-bold text-slate-800">{result.predicted_yield_kg_per_hectare.toLocaleString()} <span className="text-sm font-normal text-slate-500">kg/ha</span></h3>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-slate-400">No prediction yet</h3>
                <p className="text-xs text-slate-400 mt-1">Run a prediction</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-500">Yield Performance</p>
              <LineChartIcon className="w-4 h-4 text-blue-500" />
            </div>
            {hasData && history.length > 1 ? (
              <h3 className="text-2xl font-bold text-slate-800">
                {result.predicted_yield_kg_per_hectare >= history[history.length - 2].predicted_yield ? 'Improving' : 'Declining'}
              </h3>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-slate-400">Not enough data</h3>
                <p className="text-xs text-slate-400 mt-1">Run more predictions</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-500">Soil Status</p>
              <TestTube className="w-4 h-4 text-amber-500" />
            </div>
            {hasData && soilData ? (
              <div className="flex flex-col items-center justify-center">
                <h3 className="text-lg font-semibold text-emerald-600">Analyzed</h3>
                <button onClick={() => navigate('/soil')} className="text-xs text-primary-500 mt-1 flex items-center hover:underline">
                  View Details <ArrowRight className="w-3 h-3 ml-1" />
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-slate-400">No soil analysis yet</h3>
                <button onClick={() => navigate('/soil')} className="text-xs text-primary-500 mt-1 flex items-center hover:underline">
                  Run Soil Analysis <ArrowRight className="w-3 h-3 ml-1" />
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-500">Weather Impact</p>
              <CloudRain className="w-4 h-4 text-cyan-500" />
            </div>
            {hasData && weatherData ? (
              <div className="flex flex-col items-center justify-center">
                <h3 className="text-lg font-semibold text-emerald-600">Analyzed</h3>
                <button onClick={() => navigate('/weather')} className="text-xs text-primary-500 mt-1 flex items-center hover:underline">
                  View Details <ArrowRight className="w-3 h-3 ml-1" />
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-slate-400">No weather analysis yet</h3>
                <button onClick={() => navigate('/weather')} className="text-xs text-primary-500 mt-1 flex items-center hover:underline">
                  Run Weather Analysis <ArrowRight className="w-3 h-3 ml-1" />
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. MAIN CONTENT ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle>Yield Forecast / Productivity Trend</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px] flex flex-col">
            {!hasData ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-primary-50/50 rounded-xl border border-dashed border-primary-200 p-8 text-center">
                <Sprout className="w-12 h-12 text-primary-400 mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Welcome to your Dashboard!</h3>
                <p className="text-slate-600 mb-6 max-w-md">
                  You have not created a prediction yet. Start your journey by running your first yield forecast to unlock weather, soil, and AI insights.
                </p>
                <Button onClick={() => navigate('/predict')} size="lg" className="shadow-md">
                  Run Your First Prediction
                </Button>
              </div>
            ) : (
              <div className="h-[300px] w-full flex flex-col">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history.length > 1 ? history.map(item => ({
                    date: new Date(item.input_data.observation_date || item.created_at).toLocaleDateString(),
                    yield: Math.round(item.predicted_yield),
                    crop: item.input_data.crop_type || item.crop_type,
                    region: item.input_data.region || item.region
                  })) : [{ 
                    date: 'Current', 
                    yield: result.predicted_yield_kg_per_hectare,
                    crop: input.crop_type,
                    region: input.region
                  }]}>
                    <defs>
                      <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }} />
                    <Area type="monotone" dataKey="yield" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorYield)" />
                  </AreaChart>
                </ResponsiveContainer>
                {history.length <= 1 && (
                  <p className="text-center text-xs text-slate-500 mt-2">Current prediction. Make additional predictions to visualize your yield trend.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Prediction Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {!hasData ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-slate-100">
                <Badge variant="neutral" className="mb-4">No prediction yet</Badge>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                  You haven't created a prediction yet. Your next prediction will populate yield, weather, soil and recommendation insights here.
                </p>
                <Button onClick={() => navigate('/predict')} variant="primary" size="sm" className="w-full">
                  Run Your First Prediction
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center p-6 bg-primary-50 rounded-xl border border-primary-100">
                  <Badge variant="success" className="mb-3">Prediction Active</Badge>
                  <p className="text-sm text-primary-600 font-medium mb-1">Estimated Production</p>
                  <h4 className="text-3xl font-bold text-primary-700">{result.predicted_yield_kg_per_hectare.toLocaleString()}</h4>
                  <p className="text-xs text-primary-500 mt-1">kg per hectare</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-sm text-slate-500">Region</span>
                    <span className="text-sm font-medium text-slate-800">{input.region}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-sm text-slate-500">Crop Type</span>
                    <span className="text-sm font-medium text-slate-800">{input.crop_type}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. SECOND CONTENT ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Modeled Weather Conditions</CardTitle>
            <p className="text-xs text-slate-500 mt-1">Conditions used for this prediction</p>
          </CardHeader>
          <CardContent className="flex-1">
            {!hasData ? (
              <div className="h-full flex items-center justify-center p-6 text-center text-sm text-slate-500 bg-slate-50 rounded-lg">
                Weather analysis will appear after a prediction.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center text-red-600 mb-1">
                      <Thermometer className="w-4 h-4 mr-1" />
                      <span className="text-xs font-medium uppercase tracking-wider">Temp</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800">{input.temperature_C}°C</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center text-blue-600 mb-1">
                      <CloudRain className="w-4 h-4 mr-1" />
                      <span className="text-xs font-medium uppercase tracking-wider">Rain</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800">{input.rainfall_mm}mm</p>
                  </div>
                  <div className="p-3 bg-cyan-50 rounded-lg">
                    <div className="flex items-center text-cyan-600 mb-1">
                      <Droplets className="w-4 h-4 mr-1" />
                      <span className="text-xs font-medium uppercase tracking-wider">Humidity</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800">{input["humidity_%"]}%</p>
                  </div>
                </div>
                {weatherData && weatherData.agricultural_insight && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-sm font-medium text-slate-700 mb-1">Historical Context</p>
                    <p className="text-sm text-slate-600">{weatherData.agricultural_insight}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Soil Overview</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {!hasData ? (
              <div className="h-full flex items-center justify-center p-6 text-center text-sm text-slate-500 bg-slate-50 rounded-lg">
                Run a prediction to analyze soil conditions.
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">Soil Moisture</span>
                    <span className="text-slate-600">{input["soil_moisture_%"]}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${input["soil_moisture_%"]}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">Soil pH</span>
                    <span className="text-slate-600">{input.soil_pH}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(input.soil_pH / 14) * 100}%` }}></div>
                  </div>
                </div>
                {soilData && soilData.agricultural_insight && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-sm font-medium text-slate-700 mb-1">Historical Context</p>
                    <p className="text-sm text-slate-600">{soilData.agricultural_insight}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Agricultural Alerts</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {!hasData ? (
              <div className="h-full flex items-center justify-center p-6 text-center text-sm text-slate-500 bg-slate-50 rounded-lg">
                Alerts will be generated after a prediction.
              </div>
            ) : !insightsData ? (
              <div className="h-full flex items-center justify-center p-6 text-center text-sm text-slate-500 bg-slate-50 rounded-lg">
                {loadingExtras ? "Analyzing alerts..." : "Alerts unavailable."}
              </div>
            ) : (!insightsData.attention_points?.length && !insightsData.limitations?.length) ? (
              <div className="h-full flex items-center justify-center p-6 text-center text-sm text-emerald-600 bg-emerald-50 rounded-lg font-medium">
                No significant alerts available for the current prediction.
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2">
                {insightsData.attention_points && insightsData.attention_points.length > 0 && (
                  <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                    <div className="flex items-center mb-2 text-red-800">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      <span className="text-sm font-bold">Warnings & Attention Points</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1">
                      {insightsData.attention_points.map((pt, idx) => (
                        <li key={idx} className="text-sm text-red-700">{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {insightsData.limitations && insightsData.limitations.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <div className="flex items-center mb-2 text-blue-800">
                      <Lightbulb className="w-4 h-4 mr-2" />
                      <span className="text-sm font-bold">Recommendations</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1">
                      {insightsData.limitations.map((pt, idx) => (
                        <li key={idx} className="text-sm text-blue-700">{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5. INSIGHTS ROW */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center">
          <Lightbulb className="w-5 h-5 mr-2 text-primary-500" />
          AI Agricultural Insight
        </h3>
        {!hasData ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-slate-500 bg-slate-50">
              <p className="mb-4">AI-generated agricultural insights will appear after your first analysis.</p>
              <Button onClick={() => navigate('/predict')} variant="outline" size="sm">Generate Analysis</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {insightsData ? (
              <Card className="bg-primary-50 border-primary-100">
                <CardContent className="p-6">
                  <h4 className="text-lg font-bold text-slate-800 mb-4">AI Agricultural Insight</h4>
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-sm font-semibold text-primary-800">Prediction Interpretation</h5>
                      <p className="text-sm text-slate-700 leading-relaxed mt-1">{insightsData.summary} {insightsData.yield_interpretation}</p>
                    </div>
                    
                    {insightsData.weather_insights && insightsData.weather_insights.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-cyan-800">Weather Observations</h5>
                        <ul className="list-disc pl-4 space-y-1 mt-1">
                          {insightsData.weather_insights.map((pt, idx) => (
                            <li key={idx} className="text-sm text-slate-700">{pt}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {insightsData.soil_insights && insightsData.soil_insights.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-amber-800">Soil Observations</h5>
                        <ul className="list-disc pl-4 space-y-1 mt-1">
                          {insightsData.soil_insights.map((pt, idx) => (
                            <li key={idx} className="text-sm text-slate-700">{pt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {insightsData.strategic_forecasting && (
                      <div className="pt-2 border-t border-primary-100">
                        <h5 className="text-sm font-semibold text-indigo-800">Strategic Forecasting</h5>
                        <p className="text-sm text-slate-700 leading-relaxed mt-1">{insightsData.strategic_forecasting}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="col-span-full">
                <CardContent className="p-6 text-center text-sm text-slate-500 bg-slate-50 flex flex-col items-center justify-center space-y-3">
                  {loadingExtras ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full border-2 border-primary-500 border-t-transparent animate-spin"></div>
                      <span>Generating AI insights...</span>
                    </div>
                  ) : llmError ? (
                    <>
                      <span>Unable to generate AI insights.</span>
                      <Button onClick={retryInsights} variant="outline" size="sm">Retry</Button>
                    </>
                  ) : (
                    <span>Insights unavailable.</span>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* 6. BOTTOM ACTION AREA */}
      <div className="pt-6 border-t border-slate-200">
        <h3 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wider">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate('/predict')} variant="secondary" icon={Sprout}>New Yield Prediction</Button>
          <Button onClick={() => navigate('/weather')} variant="outline" icon={CloudRain}>Analyze Weather</Button>
          <Button onClick={() => navigate('/soil')} variant="outline" icon={TestTube}>Analyze Soil</Button>
          <Button onClick={() => navigate('/reports')} variant="outline" icon={FileText}>Generate Report</Button>
        </div>
      </div>

    </div>
  );
}
