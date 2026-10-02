import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { EmptyState, LoadingState, ErrorState } from '../components/common/StateComponents';
import { useAppContext } from '../context/AppContext';
import { FileText, Download, Printer, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function AgriculturalReport() {
  const { recentPrediction, reportState, fetchReport } = useAppContext();
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);

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

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Small artificial delay to allow React state to settle if needed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      let yPos = 20;
      const margin = 20;
      const pageWidth = doc.internal.pageSize.width;
      const maxWidth = pageWidth - margin * 2;
      const pageHeight = doc.internal.pageSize.height;

      const checkPageBreak = (heightNeeded) => {
        if (yPos + heightNeeded > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
        }
      };

      const addWrappedText = (text, x, fontSize, isBold = false, color = [0, 0, 0]) => {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.setTextColor(color[0], color[1], color[2]);
        const lines = doc.splitTextToSize(text || '', maxWidth);
        checkPageBreak(lines.length * (fontSize * 0.4));
        doc.text(lines, x, yPos);
        yPos += lines.length * (fontSize * 0.4) + 2;
      };

      // Header
      addWrappedText("YIELDSENSE AI FORECAST", margin, 20, true, [15, 23, 42]);
      yPos += 5;
      addWrappedText(`Generated on: ${new Date().toLocaleDateString()}`, margin, 12, false, [100, 116, 139]);
      yPos += 15;

      // 1. Yield Context
      addWrappedText("1. Yield Context", margin, 14, true, [30, 41, 59]);
      yPos += 4;
      addWrappedText(`Region: ${recentReport.region || 'Not available'}`, margin, 11);
      addWrappedText(`Crop Type: ${recentReport.crop_type || 'Not available'}`, margin, 11);
      yPos += 2;
      addWrappedText(`Predicted Yield: ${recentReport.yield_prediction?.predicted_yield_kg_per_hectare?.toLocaleString() ?? 'Not available'} kg/ha`, margin, 12, true, [3, 105, 161]);
      yPos += 12;

      // 2. Weather Impact Assessment
      addWrappedText("2. Weather Impact Assessment", margin, 14, true, [30, 41, 59]);
      yPos += 4;
      
      if (recentReport.historical_weather_context?.weather_assessment) {
        Object.entries(recentReport.historical_weather_context.weather_assessment).forEach(([key, data]) => {
          checkPageBreak(30);
          addWrappedText(key.toUpperCase().replace(/_/g, ' '), margin, 11, true, [71, 85, 105]);
          addWrappedText(`${data.value}`, margin, 12, true, [15, 23, 42]);
          yPos += 2;
          addWrappedText("Historical assessment:", margin, 10, true, [100, 116, 139]);
          addWrappedText(`${data.assessment}`, margin, 11, false, [51, 65, 85]);
          yPos += 2;
          addWrappedText("Historical relationship:", margin, 10, true, [100, 116, 139]);
          addWrappedText(`${data.historical_context}`, margin, 11, false, [51, 65, 85]);
          yPos += 8;
        });
      } else {
        addWrappedText("Not available", margin, 11);
        yPos += 8;
      }
      
      if (recentReport.historical_weather_context?.historical_yield_context) {
        checkPageBreak(25);
        addWrappedText("Weather Yield Context:", margin, 11, true, [71, 85, 105]);
        addWrappedText(recentReport.historical_weather_context.historical_yield_context, margin, 11, false, [51, 65, 85]);
        yPos += 12;
      }

      // 3. Soil Suitability Assessment
      checkPageBreak(20);
      addWrappedText("3. Soil Suitability Assessment", margin, 14, true, [30, 41, 59]);
      yPos += 4;
      
      if (recentReport.historical_soil_context?.soil_suitability_assessment) {
        Object.entries(recentReport.historical_soil_context.soil_suitability_assessment).forEach(([key, data]) => {
          checkPageBreak(30);
          addWrappedText(key.toUpperCase().replace(/_/g, ' '), margin, 11, true, [71, 85, 105]);
          addWrappedText(`${data.value}`, margin, 12, true, [15, 23, 42]);
          yPos += 2;
          addWrappedText("Historical assessment:", margin, 10, true, [100, 116, 139]);
          addWrappedText(`${data.assessment}`, margin, 11, false, [51, 65, 85]);
          yPos += 2;
          addWrappedText("Historical relationship:", margin, 10, true, [100, 116, 139]);
          addWrappedText(`${data.historical_context}`, margin, 11, false, [51, 65, 85]);
          yPos += 8;
        });
      } else {
        addWrappedText("Not available", margin, 11);
        yPos += 8;
      }

      // 4. Strategic Forecasting Summary
      checkPageBreak(25);
      addWrappedText("4. Strategic Forecasting Summary", margin, 14, true, [30, 41, 59]);
      yPos += 4;
      
      if (recentReport.overall_agricultural_forecasting_summary) {
        checkPageBreak(30);
        addWrappedText("Summary", margin, 11, true, [71, 85, 105]);
        addWrappedText(recentReport.overall_agricultural_forecasting_summary.summary, margin, 11, false, [51, 65, 85]);
        yPos += 6;
        
        checkPageBreak(30);
        addWrappedText("Limitations", margin, 11, true, [71, 85, 105]);
        addWrappedText(recentReport.overall_agricultural_forecasting_summary.limitations, margin, 11, false, [51, 65, 85]);
      } else {
        addWrappedText("Not available", margin, 11);
      }

      const dateStr = new Date().toISOString().split('T')[0];
      doc.save(`YieldSense_AI_Agricultural_Report_${dateStr}.pdf`);
    } catch (err) {
      console.error("PDF Generation Error:", err);
      alert("Failed to generate PDF. Check console for details.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Agricultural Report</h2>
          <p className="text-slate-500 mt-1">Structured Forecast & Assessment</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" icon={Printer} onClick={() => window.print()}>Print</Button>
          <Button 
            variant="primary" 
            icon={isExporting ? Loader2 : Download} 
            onClick={handleExportPDF}
            disabled={isExporting}
            className={isExporting ? "opacity-75 cursor-not-allowed" : ""}
          >
            {isExporting ? "Exporting..." : "Export PDF"}
          </Button>
        </div>
      </div>

      <div id="report-content" className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none">
        <div className="bg-slate-50 border-b border-slate-200 py-10 px-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">YieldSense AI Forecast</h1>
          <p className="text-slate-600 mt-2 font-medium">Generated on {new Date().toLocaleDateString()}</p>
        </div>
        <div className="p-8 space-y-10">
          
          <section>
            <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-4">1. Yield Context</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-sm text-slate-500 mb-1">Region</p>
                <p className="font-medium text-slate-800 text-lg">{recentReport.region || 'Not available'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-sm text-slate-500 mb-1">Crop Type</p>
                <p className="font-medium text-slate-800 text-lg">{recentReport.crop_type || 'Not available'}</p>
              </div>
              <div className="col-span-2 mt-2 p-6 bg-primary-50 rounded-lg border border-primary-100 flex justify-between items-center shadow-sm">
                <span className="font-semibold text-primary-800 text-lg">Predicted Yield</span>
                <span className="text-3xl font-bold text-primary-700">
                  {recentReport.yield_prediction?.predicted_yield_kg_per_hectare?.toLocaleString() ?? 'Not available'} kg/ha
                </span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-4">2. Weather Impact Assessment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentReport.historical_weather_context?.weather_assessment ? (
                Object.entries(recentReport.historical_weather_context.weather_assessment).map(([key, data], idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">{key.replace(/_/g, ' ')}</p>
                    <p className="text-xl font-bold text-slate-800 mb-4">{data.value}</p>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Historical assessment:</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{data.assessment}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Historical relationship:</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{data.historical_context}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 col-span-2">Not available</p>
              )}
            </div>
            {recentReport.historical_weather_context?.historical_yield_context && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  {recentReport.historical_weather_context.historical_yield_context}
                </p>
              </div>
            )}
          </section>

          <section>
            <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-4">3. Soil Suitability Assessment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentReport.historical_soil_context?.soil_suitability_assessment ? (
                Object.entries(recentReport.historical_soil_context.soil_suitability_assessment).map(([key, data], idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">{key.replace(/_/g, ' ')}</p>
                    <p className="text-xl font-bold text-slate-800 mb-4">{data.value}</p>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Historical assessment:</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{data.assessment}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Historical relationship:</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{data.historical_context}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 col-span-2">Not available</p>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-4">4. Strategic Forecasting Summary</h3>
            <div className="space-y-4">
              {recentReport.overall_agricultural_forecasting_summary ? (
                <>
                  <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-wide">Summary</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{recentReport.overall_agricultural_forecasting_summary.summary}</p>
                  </div>
                  <div className="bg-amber-50 p-5 rounded-lg border border-amber-200 shadow-sm">
                    <p className="text-sm font-bold text-amber-900 mb-2 uppercase tracking-wide">Limitations</p>
                    <p className="text-sm text-amber-800 leading-relaxed">{recentReport.overall_agricultural_forecasting_summary.limitations}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">Not available yet</p>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
