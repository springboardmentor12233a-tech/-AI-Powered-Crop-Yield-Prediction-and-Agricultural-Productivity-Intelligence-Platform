import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { EmptyState, LoadingState, ErrorState } from '../components/common/StateComponents';
import { getSoilAnalysis } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { TestTube, ArrowRight } from 'lucide-react';

export default function SoilAnalysis() {
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
        "soil_moisture_%": recentPrediction.input["soil_moisture_%"],
        soil_pH: recentPrediction.input.soil_pH,
      };
      const result = await getSoilAnalysis(payload);
      setData(result);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load soil analysis.");
    } finally {
      setLoading(false);
    }
  };

  if (!recentPrediction) {
    return (
      <EmptyState 
        title="No Soil Context" 
        message="Please run a yield prediction first to establish the agricultural context for soil analysis."
        icon={TestTube}
        action={{ label: "Run Prediction", onClick: () => navigate('/predict') }}
      />
    );
  }

  if (loading) return <LoadingState message="Analyzing soil suitability..." />;
  if (error) return <ErrorState message={error} onRetry={fetchAnalysis} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Soil Analysis</h2>
        <p className="text-slate-500 mt-1">Suitability assessment for {recentPrediction.input.crop_type}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Soil Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-700">Soil pH</span>
                <span className="text-slate-600">{recentPrediction.input.soil_pH}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                {/* pH ranges from 0 to 14, standardise around 7 for the bar */}
                <div 
                  className="bg-emerald-500 h-2 rounded-full" 
                  style={{ width: `${(recentPrediction.input.soil_pH / 14) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>0 (Acidic)</span>
                <span>14 (Alkaline)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-700">Soil Moisture</span>
                <span className="text-slate-600">{recentPrediction.input["soil_moisture_%"]}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${recentPrediction.input["soil_moisture_%"]}%` }}
                ></div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-lg mt-4 flex justify-between items-center">
                <span className="font-medium text-slate-700">Suitability Index</span>
                <Badge variant={
                  data.suitability_status === 'Optimal' ? 'success' : 
                  data.suitability_status === 'Poor' ? 'error' : 'warning'
                }>
                  {data.suitability_status || 'Unknown'}
                </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Soil Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {data.insights?.map((insight, idx) => (
                <li key={idx} className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0 mr-3 mt-0.5">
                    <ArrowRight className="w-3 h-3 text-primary-600" />
                  </div>
                  <span className="text-sm text-slate-700 leading-relaxed">{insight}</span>
                </li>
              ))}
              {!data.insights?.length && (
                <p className="text-sm text-slate-500">No specific soil insights available.</p>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
