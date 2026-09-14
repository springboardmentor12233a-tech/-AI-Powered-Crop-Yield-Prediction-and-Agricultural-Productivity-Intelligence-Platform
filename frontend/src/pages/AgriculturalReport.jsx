import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState, LoadingState, ErrorState } from '../components/common/StateComponents';
import { getAgriculturalReport } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { FileText, Download, Printer } from 'lucide-react';

export default function AgriculturalReport() {
  const { recentPrediction, reportState, fetchReport } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (recentPrediction) {
      fetchReport(recentPrediction);
    }
  }, [recentPrediction, fetchReport]);

  const loading = reportState?.status === 'loading';
  const error = reportState?.error;
  const recentReport = reportState?.data;

  if (!recentPrediction) {
    return (
      <EmptyState 
        title="No Report Context" 
        message="Run a yield prediction to generate a comprehensive agricultural forecast report."
        icon={FileText}
        action={{ label: "Run Prediction", onClick: () => navigate('/predict') }}
      />
    );
  }

  if (loading) return <LoadingState message="Generating structured report..." />;
  if (error) return <ErrorState message={error} onRetry={fetchReport} />;
  if (!recentReport) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Agricultural Report</h2>
          <p className="text-slate-500 mt-1">Structured Forecast & Assessment</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" icon={Printer} onClick={() => window.print()}>Print</Button>
          <Button variant="primary" icon={Download}>Export PDF</Button>
        </div>
      </div>

      <Card className="print:shadow-none print:border-none">
        <CardHeader className="bg-slate-50 border-b border-slate-200 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900">YieldSense AI Forecast</h1>
            <p className="text-slate-600 mt-2">Generated on {new Date().toLocaleDateString()}</p>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          
          <section>
            <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-4">1. Yield Context</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Region</p>
                <p className="font-medium text-slate-800">{recentReport.region || 'Not available'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Crop Type</p>
                <p className="font-medium text-slate-800">{recentReport.crop_type || 'Not available'}</p>
              </div>
              <div className="col-span-2 mt-2 p-4 bg-primary-50 rounded-lg border border-primary-100 flex justify-between items-center">
                <span className="font-medium text-primary-800">Predicted Yield</span>
                <span className="text-2xl font-bold text-primary-700">
                  {recentReport.yield_prediction?.predicted_yield_kg_per_hectare?.toLocaleString() ?? 'Not available'} kg/ha
                </span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-4">2. Weather Impact Assessment</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-700">Overall Weather Risk</span>
                <Badge variant="neutral">
                  Not available yet
                </Badge>
              </div>
              <ul className="list-disc pl-5 space-y-2">
                {recentReport.historical_weather_context?.weather_assessment ? (
                  Object.entries(recentReport.historical_weather_context.weather_assessment).map(([key, data], idx) => (
                    <li key={idx} className="text-slate-700 text-sm">
                      <span className="font-medium capitalize">{key}:</span> {data.value} - {data.assessment} <br />
                      <span className="text-slate-500 italic">{data.historical_context}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-700 text-sm">Not available</li>
                )}
              </ul>
              {recentReport.historical_weather_context?.historical_yield_context && (
                <p className="text-sm text-slate-600 mt-3 p-3 bg-slate-50 rounded border border-slate-100">
                  {recentReport.historical_weather_context.historical_yield_context}
                </p>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-4">3. Soil Suitability Assessment</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-700">Suitability Status</span>
                <Badge variant="neutral">
                  Not available yet
                </Badge>
              </div>
              <ul className="list-disc pl-5 space-y-2">
                {recentReport.historical_soil_context?.soil_suitability_assessment ? (
                  Object.entries(recentReport.historical_soil_context.soil_suitability_assessment).map(([key, data], idx) => (
                    <li key={idx} className="text-slate-700 text-sm">
                      <span className="font-medium capitalize">{key}:</span> {data.value} - {data.assessment} <br />
                      <span className="text-slate-500 italic">{data.historical_context}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-700 text-sm">Not available</li>
                )}
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-4">4. Strategic Forecasting Summary</h3>
            <div className="space-y-3">
              {recentReport.overall_agricultural_forecasting_summary ? (
                <>
                  <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 border border-slate-100">
                    <p className="font-medium mb-1">Summary</p>
                    <p>{recentReport.overall_agricultural_forecasting_summary.summary}</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg text-sm text-amber-800 border border-amber-100">
                    <p className="font-medium mb-1">Limitations</p>
                    <p>{recentReport.overall_agricultural_forecasting_summary.limitations}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">Not available yet</p>
              )}
            </div>
          </section>

        </CardContent>
      </Card>
    </div>
  );
}
