import { useNavigate } from 'react-router-dom';
import { Lightbulb, CheckCircle, AlertTriangle, Sprout, CloudRain, TestTube } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAppContext } from '../context/AppContext';

export default function Recommendations() {
  const { recentPrediction, analysisState } = useAppContext();
  const navigate = useNavigate();

  const insightsData = analysisState?.insightsData;
  const isLoading = analysisState?.status === 'loading';

  if (!recentPrediction) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mb-6">
          <Lightbulb className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">No Data Available</h3>
        <p className="text-slate-500 max-w-md mb-6">
          Run a prediction to generate tailored agricultural recommendations.
        </p>
        <Button onClick={() => navigate('/predict')}>Run Prediction</Button>
      </div>
    );
  }

  if (isLoading || !insightsData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin mb-4"></div>
        <p className="text-slate-500">Generating personalized recommendations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Strategic Recommendations</h2>
        <p className="text-slate-500 mt-1">Prescriptive actions based on your latest prediction.</p>
      </div>

      <Card className="bg-primary-50 border-primary-100">
        <CardContent className="p-6">
          <div className="flex items-start">
            <Lightbulb className="w-6 h-6 text-primary-500 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-primary-900 mb-2">Executive Summary</h3>
              <p className="text-primary-800 leading-relaxed">{insightsData.summary}</p>
              <p className="text-primary-700 mt-2 font-medium">{insightsData.yield_interpretation}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-amber-700">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Priority Actions (Attention Points)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {insightsData.attention_points?.map((pt, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 mr-2"></span>
                  <span className="text-slate-700">{pt}</span>
                </li>
              ))}
              {(!insightsData.attention_points || insightsData.attention_points.length === 0) && (
                <p className="text-slate-500 italic">No immediate attention points identified.</p>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-blue-700">
              <CloudRain className="w-5 h-5 mr-2" />
              Weather-Based Strategies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {insightsData.weather_insights?.map((pt, idx) => (
                <li key={idx} className="flex items-start">
                  <CheckCircle className="flex-shrink-0 w-4 h-4 text-blue-500 mt-1 mr-2" />
                  <span className="text-slate-700">{pt}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-emerald-700">
              <TestTube className="w-5 h-5 mr-2" />
              Soil Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {insightsData.soil_insights?.map((pt, idx) => (
                <li key={idx} className="flex items-start">
                  <CheckCircle className="flex-shrink-0 w-4 h-4 text-emerald-500 mt-1 mr-2" />
                  <span className="text-slate-700">{pt}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-slate-700">
              <Sprout className="w-5 h-5 mr-2" />
              Model Limitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {insightsData.limitations?.map((pt, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 mr-2"></span>
                  <span className="text-slate-600 italic text-sm">{pt}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
