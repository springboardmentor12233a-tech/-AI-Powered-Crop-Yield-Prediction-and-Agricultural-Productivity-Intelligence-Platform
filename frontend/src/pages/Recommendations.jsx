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
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Strategic Recommendations</h2>
        <p className="text-slate-500 mt-1">Prescriptive actions based on your latest prediction context.</p>
      </div>

      <Card className="bg-primary-50 border-primary-100">
        <CardContent className="p-6">
          <div className="flex items-start">
            <Lightbulb className="w-6 h-6 text-primary-500 mr-3 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-primary-900">Executive Summary</h3>
                {insightsData.status && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    insightsData.status.toLowerCase().includes('favorable') ? 'bg-emerald-100 text-emerald-800' :
                    insightsData.status.toLowerCase().includes('attention') ? 'bg-amber-100 text-amber-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {insightsData.status}
                  </span>
                )}
              </div>
              <p className="text-primary-800 leading-relaxed mb-3 font-medium">{insightsData.summary}</p>
              <div className="bg-white/60 rounded p-3 border border-primary-100/50">
                <p className="text-primary-900 text-sm"><strong>Yield Interpretation:</strong> {insightsData.yield_interpretation}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        
        {/* PRIORITY ACTIONS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-amber-700">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Priority Actions & Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insightsData.attention_points && insightsData.attention_points.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insightsData.attention_points.map((pt, idx) => (
                  typeof pt === 'string' ? (
                    <div key={idx} className="p-4 rounded-lg border bg-amber-50 border-amber-100 flex items-start">
                      <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 mr-3"></span>
                      <span className="text-amber-900 text-sm">{pt}</span>
                    </div>
                  ) : (
                    <div key={idx} className={`p-4 rounded-lg border ${
                      pt.severity === 'High' ? 'bg-red-50 border-red-100' :
                      pt.severity === 'Medium' ? 'bg-amber-50 border-amber-100' :
                      'bg-blue-50 border-blue-100'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`font-bold ${
                          pt.severity === 'High' ? 'text-red-900' :
                          pt.severity === 'Medium' ? 'text-amber-900' :
                          'text-blue-900'
                        }`}>{pt.title}</h4>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          pt.severity === 'High' ? 'bg-red-100 text-red-800' :
                          pt.severity === 'Medium' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>{pt.severity} Priority</span>
                      </div>
                      <p className={`text-sm mb-4 leading-relaxed ${
                        pt.severity === 'High' ? 'text-red-800' :
                        pt.severity === 'Medium' ? 'text-amber-800' :
                        'text-blue-800'
                      }`}>{pt.reason}</p>
                      <div className={`text-sm font-medium px-3 py-2.5 rounded ${
                        pt.severity === 'High' ? 'bg-red-100/50 text-red-900 border border-red-200' :
                        pt.severity === 'Medium' ? 'bg-amber-100/50 text-amber-900 border border-amber-200' :
                        'bg-blue-100/50 text-blue-900 border border-blue-200'
                      }`}>
                        <strong>Action:</strong> {pt.action}
                      </div>
                    </div>
                  )
                ))}
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center">
                <CheckCircle className="w-5 h-5 text-emerald-600 mr-2" />
                <p className="text-emerald-800 font-medium">No immediate high-priority attention points identified.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* WEATHER STRATEGIES */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-blue-700">
              <CloudRain className="w-5 h-5 mr-2" />
              Weather-Based Strategies
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insightsData.weather_insights && insightsData.weather_insights.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insightsData.weather_insights.map((pt, idx) => (
                  typeof pt === 'string' ? (
                    <div key={idx} className="p-4 rounded-lg border bg-blue-50 border-blue-100 flex items-start">
                      <CheckCircle className="flex-shrink-0 w-4 h-4 text-blue-500 mt-1 mr-3" />
                      <span className="text-blue-900 text-sm">{pt}</span>
                    </div>
                  ) : (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{pt.condition}</p>
                      <p className="text-xl font-bold text-slate-800 mb-2">{pt.value}</p>
                      <p className="text-sm text-slate-600 mb-4 leading-relaxed">{pt.interpretation}</p>
                      <div className="bg-white border border-slate-200 rounded p-3 text-sm text-slate-700 shadow-sm">
                        <strong className="text-blue-700 block mb-1">Recommendation:</strong> {pt.recommendation}
                      </div>
                    </div>
                  )
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic p-4 bg-slate-50 rounded">No weather recommendations available.</p>
            )}
          </CardContent>
        </Card>

        {/* SOIL MANAGEMENT */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-emerald-700">
              <TestTube className="w-5 h-5 mr-2" />
              Soil Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insightsData.soil_insights && insightsData.soil_insights.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insightsData.soil_insights.map((pt, idx) => (
                  typeof pt === 'string' ? (
                    <div key={idx} className="p-4 rounded-lg border bg-emerald-50 border-emerald-100 flex items-start">
                      <CheckCircle className="flex-shrink-0 w-4 h-4 text-emerald-500 mt-1 mr-3" />
                      <span className="text-emerald-900 text-sm">{pt}</span>
                    </div>
                  ) : (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{pt.condition}</p>
                      <p className="text-xl font-bold text-slate-800 mb-2">{pt.value}</p>
                      <p className="text-sm text-slate-600 mb-4 leading-relaxed">{pt.interpretation}</p>
                      <div className="bg-white border border-slate-200 rounded p-3 text-sm text-slate-700 shadow-sm">
                        <strong className="text-emerald-700 block mb-1">Recommendation:</strong> {pt.recommendation}
                      </div>
                    </div>
                  )
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic p-4 bg-slate-50 rounded">No soil recommendations available.</p>
            )}
          </CardContent>
        </Card>

        {/* LIMITATIONS */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-slate-600 text-base">
              <Sprout className="w-4 h-4 mr-2" />
              Model Limitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insightsData.limitations?.map((pt, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 mr-2"></span>
                  <span className="text-slate-500 text-xs leading-relaxed">{pt}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
