import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { useAppContext } from '../context/AppContext';
import { FileText, Download, Printer, Loader2, Sprout, CloudRain, TestTube, CheckCircle2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { cn } from '../utils/cn';

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
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8 bg-white rounded-[2rem] border border-slate-200/60 shadow-sm max-w-4xl mx-auto mt-8">
        <div className="w-24 h-24 bg-[#e8f0ea] text-[#1F6B45] rounded-full flex items-center justify-center mb-6 shadow-inner border border-[#c6dfcd]">
          <FileText className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-bold text-[#12372A] mb-2 tracking-tight">No Report Available</h3>
        <p className="text-slate-500 max-w-md mb-8 text-lg">
          Run a yield prediction to generate a comprehensive, exportable agricultural forecast report.
        </p>
        <button 
          onClick={() => navigate('/predict')}
          className="flex items-center justify-center px-6 py-3 bg-[#1F6B45] text-white font-bold rounded-xl hover:bg-[#2E8B57] transition-all transform hover:-translate-y-1 shadow-md hover:shadow-lg"
        >
          Generate Forecast
        </button>
      </div>
    );
  }

  if (loading) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8">
        <div className="w-16 h-16 border-4 border-[#1F6B45] border-t-[#A8C957] rounded-full animate-spin mb-6"></div>
        <p className="text-[#1F6B45] font-bold text-lg animate-pulse">Drafting structured report...</p>
      </div>
    );
  }

  if (error) {
     return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500 bg-red-50 rounded-3xl m-8 border border-red-100 max-w-3xl mx-auto mt-12">
        <p className="font-bold text-lg mb-4">{error}</p>
        <button onClick={() => fetchReport(recentPrediction)} className="px-6 py-2 bg-red-100 text-red-700 rounded-lg font-bold hover:bg-red-200">Retry</button>
      </div>
    );
  }

  if (!recentReport) return null;

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
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

      addWrappedText("YIELDSENSE AI FORECAST", margin, 20, true, [18, 55, 42]);
      yPos += 5;
      addWrappedText(`Generated on: ${new Date().toLocaleDateString()}`, margin, 12, false, [100, 116, 139]);
      yPos += 15;

      addWrappedText("1. Yield Context", margin, 14, true, [31, 107, 69]);
      yPos += 4;
      addWrappedText(`Region: ${recentReport.region || 'Not available'}`, margin, 11);
      addWrappedText(`Crop Type: ${recentReport.crop_type || 'Not available'}`, margin, 11);
      yPos += 2;
      addWrappedText(`Predicted Yield: ${recentReport.yield_prediction?.predicted_yield_kg_per_hectare?.toLocaleString() ?? 'Not available'} kg/ha`, margin, 12, true, [18, 55, 42]);
      yPos += 12;

      addWrappedText("2. Weather Impact Assessment", margin, 14, true, [31, 107, 69]);
      yPos += 4;
      
      if (recentReport.historical_weather_context?.weather_assessment) {
        Object.entries(recentReport.historical_weather_context.weather_assessment).forEach(([key, data]) => {
          checkPageBreak(30);
          addWrappedText(key.toUpperCase().replace(/_/g, ' '), margin, 11, true, [71, 85, 105]);
          addWrappedText(`${data.value}`, margin, 12, true, [18, 55, 42]);
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

      checkPageBreak(20);
      addWrappedText("3. Soil Suitability Assessment", margin, 14, true, [31, 107, 69]);
      yPos += 4;
      
      if (recentReport.historical_soil_context?.soil_suitability_assessment) {
        Object.entries(recentReport.historical_soil_context.soil_suitability_assessment).forEach(([key, data]) => {
          checkPageBreak(30);
          addWrappedText(key.toUpperCase().replace(/_/g, ' '), margin, 11, true, [71, 85, 105]);
          addWrappedText(`${data.value}`, margin, 12, true, [18, 55, 42]);
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

      checkPageBreak(25);
      addWrappedText("4. Strategic Forecasting Summary", margin, 14, true, [31, 107, 69]);
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
    <div className="space-y-6 max-w-4xl mx-auto pb-16 pt-4">
      <div className="flex justify-between items-center print:hidden mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-[#12372A] tracking-tight">Agricultural Report</h2>
          <p className="text-[#1F6B45]/80 mt-1 font-medium">Structured Forecast & Assessment</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => window.print()} className="px-4 py-2 border border-slate-200 bg-white text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors flex items-center">
            <Printer className="w-4 h-4 mr-2" /> Print
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className={cn("px-4 py-2 bg-[#1F6B45] text-white font-bold rounded-xl shadow-md hover:bg-[#2E8B57] hover:shadow-lg transition-all flex items-center", isExporting && "opacity-75 cursor-not-allowed")}
          >
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {isExporting ? "Exporting..." : "Export PDF"}
          </button>
        </div>
      </div>

      <div id="report-content" className="bg-white rounded-[2rem] shadow-card border border-slate-200/50 overflow-hidden print:shadow-none print:border-none print:rounded-none">
        
        {/* Cover Section */}
        <div className="bg-gradient-to-br from-[#12372A] to-[#1F6B45] py-16 px-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#A8C957]/10 rounded-full blur-[80px] -mt-20 -ml-20"></div>
          <div className="relative z-10">
            <FileText className="w-12 h-12 text-[#A8C957] mx-auto mb-6 opacity-80" />
            <h1 className="text-4xl md:text-5xl font-black text-[#F7F8F2] tracking-tight">YieldSense AI Forecast</h1>
            <p className="text-[#c6dfcd] mt-4 font-bold text-lg tracking-wide uppercase">Generated on {new Date().toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="p-10 md:p-14 space-y-12">
          
          {/* Section 1 */}
          <section>
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 rounded-full bg-[#1F6B45] text-white flex items-center justify-center font-bold mr-4">1</div>
              <h3 className="text-2xl font-bold text-[#12372A]">Yield Context</h3>
            </div>
            <div className="grid grid-cols-2 gap-6 pl-12">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Region</p>
                <p className="font-extrabold text-slate-800 text-xl">{recentReport.region || 'Not available'}</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Crop Type</p>
                <p className="font-extrabold text-slate-800 text-xl">{recentReport.crop_type || 'Not available'}</p>
              </div>
              <div className="col-span-2 p-8 bg-gradient-to-r from-[#F7F8F2] to-white rounded-2xl border border-[#5BAE65]/30 flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm">
                <div className="flex items-center mb-4 md:mb-0">
                  <Sprout className="w-8 h-8 text-[#1F6B45] mr-4" />
                  <span className="font-bold text-[#1F6B45] text-lg uppercase tracking-wider">Predicted Yield</span>
                </div>
                <div className="text-left md:text-right">
                  <span className="text-4xl font-black text-[#12372A]">
                    {recentReport.yield_prediction?.predicted_yield_kg_per_hectare?.toLocaleString() ?? 'Not available'}
                  </span>
                  <span className="text-[#5BAE65] font-bold text-lg ml-2">kg/ha</span>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Section 2 */}
          <section>
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 rounded-full bg-[#0284c7] text-white flex items-center justify-center font-bold mr-4">2</div>
              <h3 className="text-2xl font-bold text-[#12372A]">Weather Impact Assessment</h3>
            </div>
            <div className="pl-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recentReport.historical_weather_context?.weather_assessment ? (
                  Object.entries(recentReport.historical_weather_context.weather_assessment).map(([key, data], idx) => (
                    <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                      <p className="text-xs font-black text-[#0284c7] uppercase tracking-widest mb-2 flex items-center">
                        <CloudRain className="w-4 h-4 mr-2" /> {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-2xl font-extrabold text-slate-800 mb-6">{data.value}</p>
                      <div className="space-y-5">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Historical Assessment</p>
                          <p className="text-sm text-slate-700 font-medium leading-relaxed">{data.assessment}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Historical Relationship</p>
                          <p className="text-sm text-slate-700 font-medium leading-relaxed">{data.historical_context}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-medium text-slate-500">Not available</p>
                )}
              </div>
              
              {recentReport.historical_weather_context?.historical_yield_context && (
                <div className="mt-6 p-6 bg-[#f0f9ff] border border-[#bae6fd] rounded-2xl flex items-start">
                  <CheckCircle2 className="w-6 h-6 text-[#0ea5e9] mr-4 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-black text-[#0284c7] uppercase tracking-widest mb-2">Weather Yield Context</p>
                    <p className="text-sm text-[#0c4a6e] font-medium leading-relaxed">
                      {recentReport.historical_weather_context.historical_yield_context}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Section 3 */}
          <section>
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 rounded-full bg-[#d97706] text-white flex items-center justify-center font-bold mr-4">3</div>
              <h3 className="text-2xl font-bold text-[#12372A]">Soil Suitability Assessment</h3>
            </div>
            <div className="pl-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recentReport.historical_soil_context?.soil_suitability_assessment ? (
                  Object.entries(recentReport.historical_soil_context.soil_suitability_assessment).map(([key, data], idx) => (
                    <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                      <p className="text-xs font-black text-[#d97706] uppercase tracking-widest mb-2 flex items-center">
                        <TestTube className="w-4 h-4 mr-2" /> {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-2xl font-extrabold text-slate-800 mb-6">{data.value}</p>
                      <div className="space-y-5">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Historical Assessment</p>
                          <p className="text-sm text-slate-700 font-medium leading-relaxed">{data.assessment}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Historical Relationship</p>
                          <p className="text-sm text-slate-700 font-medium leading-relaxed">{data.historical_context}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-medium text-slate-500">Not available</p>
                )}
              </div>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Section 4 */}
          <section>
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 rounded-full bg-[#9333ea] text-white flex items-center justify-center font-bold mr-4">4</div>
              <h3 className="text-2xl font-bold text-[#12372A]">Strategic Forecasting Summary</h3>
            </div>
            <div className="pl-12 space-y-6">
              {recentReport.overall_agricultural_forecasting_summary ? (
                <>
                  <div className="bg-[#f3e8ff] p-8 rounded-2xl border border-[#d8b4fe] shadow-sm">
                    <p className="text-xs font-black text-[#7e22ce] mb-3 uppercase tracking-widest">Summary</p>
                    <p className="text-[15px] text-[#4c1d95] font-medium leading-relaxed">{recentReport.overall_agricultural_forecasting_summary.summary}</p>
                  </div>
                  <div className="bg-amber-50 p-8 rounded-2xl border border-amber-200 shadow-sm">
                    <p className="text-xs font-black text-amber-600 mb-3 uppercase tracking-widest">Limitations & Risks</p>
                    <p className="text-[15px] text-amber-900 font-medium leading-relaxed">{recentReport.overall_agricultural_forecasting_summary.limitations}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm font-medium text-slate-500">Not available yet</p>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
