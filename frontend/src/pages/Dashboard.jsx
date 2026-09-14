import React, { useEffect, useState } from 'react';
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
import { getWeatherAnalysis, getSoilAnalysis, getLLMInsights } from '../services/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
  const { recentPrediction, analysisState, fetchAnalysis, retryInsights } = useAppContext();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (recentPrediction) {
      fetchAnalysis(recentPrediction);
    }
  }, [recentPrediction, fetchAnalysis]);

  const weatherData = analysisState?.weatherData;
  const soilData = analysisState?.soilData;
  const insightsData = analysisState?.insightsData;
  const loadingExtras = analysisState?.status === 'loading';
  const llmError = analysisState?.llmError;

  const hasData = !!recentPrediction;
  const input = recentPrediction?.input;
  const result = recentPrediction?.result;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Welcome to YieldSense AI</h2>
          <p className="text-slate-500 mt-1">A centralized agricultural intelligence platform for crop yield forecasting and farm productivity analysis.</p>
        </div>
        <Button onClick={() => navigate('/predict')} icon={Sprout} className="flex-shrink-0">
          Run New Prediction
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
                <h3 className="text-lg font-semibold text-slate-400">No prediction</h3>
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
            {hasData ? (
              <h3 className="text-2xl font-bold text-slate-800">Optimized</h3>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-slate-400">Awaiting data</h3>
                <p className="text-xs text-slate-400 mt-1">Run a prediction</p>
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
              <h3 className="text-2xl font-bold text-slate-800">{soilData.suitability_status || 'Not available yet'}</h3>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-slate-400">Awaiting analysis</h3>
                <p className="text-xs text-slate-400 mt-1">Run a prediction</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-500">Weather Risk</p>
              <CloudRain className="w-4 h-4 text-cyan-500" />
            </div>
            {hasData && weatherData ? (
              <h3 className="text-2xl font-bold text-slate-800">{weatherData.overall_risk || 'Not available yet'}</h3>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-slate-400">Awaiting analysis</h3>
                <p className="text-xs text-slate-400 mt-1">Run a prediction</p>
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
              <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-8 text-center">
                <TrendingUp className="w-10 h-10 text-slate-300 mb-3" />
                <h3 className="text-lg font-semibold text-slate-700 mb-1">No yield data available yet</h3>
                <p className="text-sm text-slate-500 mb-4 max-w-md">Run a prediction to begin building your agricultural performance view.</p>
                <Button onClick={() => navigate('/predict')} size="sm">Run Prediction</Button>
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[{ year: 'Current', yield: result.predicted_yield_kg_per_hectare }]}>
                    <defs>
                      <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="yield" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorYield)" />
                  </AreaChart>
                </ResponsiveContainer>
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
                <Badge variant="neutral" className="mb-4">No Active Prediction</Badge>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                  Your next prediction will populate yield, weather, soil and recommendation insights here.
                </p>
                <Button onClick={() => navigate('/predict')} variant="primary" size="sm" className="w-full">
                  Start Prediction
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
            <CardTitle>Weather Overview</CardTitle>
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
            <CardTitle>Agricultural Risk</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {!hasData ? (
              <div className="h-full flex items-center justify-center p-6 text-center text-sm text-slate-500 bg-slate-50 rounded-lg">
                Risk assessment unavailable until analysis is performed.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-sm font-medium text-slate-700">Overall Risk</span>
                  <Badge variant="neutral">Not available yet</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-sm font-medium text-slate-700">Weather Risk</span>
                  <Badge variant="neutral">Not available yet</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-sm font-medium text-slate-700">Soil Risk</span>
                  <Badge variant="neutral">Not available yet</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5. INSIGHTS ROW */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center">
          <Lightbulb className="w-5 h-5 mr-2 text-primary-500" />
          Agricultural Insights
        </h3>
        {!hasData ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-slate-500 bg-slate-50">
              <p className="mb-4">AI-generated agricultural insights will appear after your first analysis.</p>
              <Button onClick={() => navigate('/predict')} variant="outline" size="sm">Generate Analysis</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insightsData ? (
              <Card className="col-span-full bg-primary-50 border-primary-100">
                <CardContent className="p-6">
                  <h4 className="text-sm font-bold text-primary-800 mb-2">AI-Generated Agricultural Insight</h4>
                  <p className="text-sm text-slate-700 leading-relaxed mb-4">{insightsData.summary}</p>
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-xs font-semibold text-primary-700 uppercase tracking-wider mb-1">Yield Interpretation</h5>
                      <p className="text-sm text-slate-700">{insightsData.yield_interpretation}</p>
                    </div>
                    {insightsData.weather_insights && insightsData.weather_insights.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-primary-700 uppercase tracking-wider mb-1">Weather Insights</h5>
                        <ul className="list-disc pl-4 space-y-1">
                          {insightsData.weather_insights.map((pt, idx) => (
                            <li key={idx} className="text-sm text-slate-700">{pt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {insightsData.soil_insights && insightsData.soil_insights.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-primary-700 uppercase tracking-wider mb-1">Soil Insights</h5>
                        <ul className="list-disc pl-4 space-y-1">
                          {insightsData.soil_insights.map((pt, idx) => (
                            <li key={idx} className="text-sm text-slate-700">{pt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {insightsData.attention_points && insightsData.attention_points.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-primary-700 uppercase tracking-wider mb-1">Points of Attention</h5>
                        <ul className="list-disc pl-4 space-y-1">
                          {insightsData.attention_points.map((pt, idx) => (
                            <li key={idx} className="text-sm text-slate-700">{pt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {insightsData.limitations && insightsData.limitations.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Limitations</h5>
                        <ul className="list-disc pl-4 space-y-1">
                          {insightsData.limitations.map((pt, idx) => (
                            <li key={idx} className="text-sm text-amber-700 italic">{pt}</li>
                          ))}
                        </ul>
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
