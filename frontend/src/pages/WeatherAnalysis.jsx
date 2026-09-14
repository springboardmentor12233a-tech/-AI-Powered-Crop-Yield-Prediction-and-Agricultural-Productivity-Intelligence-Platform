import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { EmptyState, LoadingState, ErrorState } from '../components/common/StateComponents';
import { getWeatherAnalysis } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { CloudRain, Sprout, ArrowRight, Thermometer, Droplets, Sun } from 'lucide-react';
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
  const { recentPrediction } = useAppContext();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (recentPrediction) {
      fetchAnalysis();
    }
  }, [recentPrediction]);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        crop_type: recentPrediction.input.crop_type,
        region: recentPrediction.input.region,
        temperature_C: recentPrediction.input.temperature_C,
        rainfall_mm: recentPrediction.input.rainfall_mm,
        "humidity_%": recentPrediction.input["humidity_%"],
        sunlight_hours: recentPrediction.input.sunlight_hours
      };
      const result = await getWeatherAnalysis(payload);
      setData(result);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load weather analysis.");
    } finally {
      setLoading(false);
    }
  };

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
  if (error) return <ErrorState message={error} onRetry={fetchAnalysis} />;
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Impact Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <span className="font-medium text-slate-700">Overall Weather Risk</span>
              <Badge variant={
                data.overall_risk === 'High' ? 'error' : 
                data.overall_risk === 'Moderate' ? 'warning' : 'success'
              }>
                {data.overall_risk || 'Unknown'}
              </Badge>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-800">Key Insights</h4>
              <ul className="space-y-2">
                {data.insights?.map((insight, idx) => (
                  <li key={idx} className="text-sm text-slate-600 flex items-start">
                    <ArrowRight className="w-4 h-4 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                    {insight}
                  </li>
                ))}
                {!data.insights?.length && (
                  <p className="text-sm text-slate-500">No specific weather insights available for this context.</p>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Historical Trend</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center bg-slate-50/50 m-4 rounded-xl border border-dashed border-slate-200">
             <EmptyState 
                title="Historical Data Unavailable" 
                message="Weather trend visualization requires connection to historical climate APIs."
                icon={CloudRain}
             />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
