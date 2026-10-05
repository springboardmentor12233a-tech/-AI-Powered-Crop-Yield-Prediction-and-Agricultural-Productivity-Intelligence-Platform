import { useNavigate } from 'react-router-dom';
import { Lightbulb, CheckCircle, AlertTriangle, Sprout, CloudRain, TestTube, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAppContext } from '../context/AppContext';
import { cn } from '../utils/cn';

export default function Recommendations() {
  const { recentPrediction, analysisState } = useAppContext();
  const navigate = useNavigate();

  const insightsData = analysisState?.insightsData;
  const isLoading = analysisState?.status === 'loading';

  if (!recentPrediction) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8 bg-white rounded-[2rem] border border-slate-200/60 shadow-sm max-w-4xl mx-auto mt-8">
        <div className="w-24 h-24 bg-[#e8f0ea] text-[#1F6B45] rounded-full flex items-center justify-center mb-6 shadow-inner border border-[#c6dfcd]">
          <Lightbulb className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-bold text-[#12372A] mb-2 tracking-tight">No Data Available</h3>
        <p className="text-slate-500 max-w-md mb-8 text-lg">
          Run a yield prediction to generate tailored, AI-driven agricultural recommendations for your farm.
        </p>
        <button 
          onClick={() => navigate('/predict')}
          className="flex items-center justify-center px-6 py-3 bg-[#1F6B45] text-white font-bold rounded-xl hover:bg-[#2E8B57] transition-all transform hover:-translate-y-1 shadow-md hover:shadow-lg"
        >
          Generate Forecast <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    );
  }

  if (isLoading || !insightsData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8">
        <div className="w-16 h-16 border-4 border-[#1F6B45] border-t-[#A8C957] rounded-full animate-spin mb-6"></div>
        <p className="text-[#1F6B45] font-bold text-lg animate-pulse">Generating personalized recommendations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-[#12372A] tracking-tight">Strategic Recommendations</h2>
        <p className="text-lg text-[#1F6B45]/80 mt-2 font-medium">Prescriptive, AI-driven actions based on your latest prediction context.</p>
      </div>

      <div className="bg-gradient-to-br from-[#12372A] to-[#1F6B45] rounded-[2rem] shadow-card p-8 md:p-10 relative overflow-hidden border border-[#2E8B57]/30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#5BAE65]/10 rounded-full blur-[80px] -mt-20 -mr-20 pointer-events-none"></div>
        <div className="flex items-start relative z-10">
          <div className="p-3.5 bg-gradient-to-br from-[#A8C957] to-[#5BAE65] rounded-2xl shadow-lg mr-5">
            <Lightbulb className="w-6 h-6 text-[#12372A]" />
          </div>
          <div className="flex-1">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
              <h3 className="text-2xl font-bold text-[#FCFCF8]">Executive Summary</h3>
              {insightsData.status && (
                <span className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest shadow-sm",
                  insightsData.status.toLowerCase().includes('favorable') ? 'bg-[#A8C957] text-[#12372A]' :
                  insightsData.status.toLowerCase().includes('attention') ? 'bg-amber-400 text-amber-900' :
                  'bg-blue-400 text-blue-900'
                )}>
                  {insightsData.status}
                </span>
              )}
            </div>
            <p className="text-[#c6dfcd] text-lg leading-relaxed mb-6 font-medium">{insightsData.summary}</p>
            <div className="bg-[#081a13]/40 rounded-xl p-5 border border-[#5BAE65]/20 backdrop-blur-sm">
              <p className="text-[#F7F8F2] text-sm leading-relaxed">
                <strong className="text-[#A8C957] uppercase tracking-wider text-xs mr-2">Yield Interpretation:</strong> 
                {insightsData.yield_interpretation}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* PRIORITY ACTIONS */}
        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-8 flex flex-col h-full">
          <h3 className="text-xl font-bold text-[#12372A] mb-6 flex items-center">
            <AlertTriangle className="w-6 h-6 mr-3 text-amber-500" />
            Priority Actions & Alerts
          </h3>
          <div className="flex-1">
            {insightsData.attention_points && insightsData.attention_points.length > 0 ? (
              <div className="space-y-4">
                {insightsData.attention_points.map((pt, idx) => (
                  typeof pt === 'string' ? (
                    <div key={idx} className="p-5 rounded-2xl border bg-amber-50 border-amber-100/50 flex items-start shadow-sm">
                      <span className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-500 mt-1.5 mr-4"></span>
                      <span className="text-amber-900 text-sm font-medium leading-relaxed">{pt}</span>
                    </div>
                  ) : (
                    <div key={idx} className={cn(
                      "p-5 rounded-2xl border shadow-sm",
                      pt.severity === 'High' ? 'bg-red-50/80 border-red-200' :
                      pt.severity === 'Medium' ? 'bg-amber-50/80 border-amber-200' :
                      'bg-blue-50/80 border-blue-200'
                    )}>
                      <div className="flex justify-between items-start mb-3">
                        <h4 className={cn("font-bold text-base", 
                          pt.severity === 'High' ? 'text-red-900' :
                          pt.severity === 'Medium' ? 'text-amber-900' :
                          'text-blue-900'
                        )}>{pt.title}</h4>
                        <span className={cn(
                          "text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full",
                          pt.severity === 'High' ? 'bg-red-100 text-red-800' :
                          pt.severity === 'Medium' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        )}>{pt.severity}</span>
                      </div>
                      <p className={cn("text-sm mb-5 leading-relaxed font-medium",
                        pt.severity === 'High' ? 'text-red-800/80' :
                        pt.severity === 'Medium' ? 'text-amber-800/80' :
                        'text-blue-800/80'
                      )}>{pt.reason}</p>
                      <div className={cn("text-sm font-semibold px-4 py-3 rounded-xl flex items-start",
                        pt.severity === 'High' ? 'bg-red-100/50 text-red-900 border border-red-200/50' :
                        pt.severity === 'Medium' ? 'bg-amber-100/50 text-amber-900 border border-amber-200/50' :
                        'bg-blue-100/50 text-blue-900 border border-blue-200/50'
                      )}>
                        <ArrowRight className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{pt.action}</span>
                      </div>
                    </div>
                  )
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 bg-[#F7F8F2] border border-[#c6dfcd] border-dashed rounded-2xl text-center">
                <CheckCircle2 className="w-12 h-12 text-[#5BAE65] mb-4" />
                <h4 className="text-[#1F6B45] font-bold text-lg mb-1">No Immediate Alerts</h4>
                <p className="text-[#2E8B57] text-sm">Farm parameters are within optimal ranges.</p>
              </div>
            )}
          </div>
        </div>

        {/* WEATHER STRATEGIES */}
        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-8 flex flex-col h-full">
          <h3 className="text-xl font-bold text-[#12372A] mb-6 flex items-center">
            <CloudRain className="w-6 h-6 mr-3 text-cyan-600" />
            Weather-Based Strategies
          </h3>
          <div className="flex-1">
            {insightsData.weather_insights && insightsData.weather_insights.length > 0 ? (
              <div className="space-y-4">
                {insightsData.weather_insights.map((pt, idx) => (
                  typeof pt === 'string' ? (
                    <div key={idx} className="p-5 rounded-2xl border bg-[#f0f9ff] border-[#bae6fd]/50 flex items-start shadow-sm">
                      <CheckCircle className="flex-shrink-0 w-4 h-4 text-[#0ea5e9] mt-0.5 mr-3" />
                      <span className="text-[#0c4a6e] text-sm font-medium leading-relaxed">{pt}</span>
                    </div>
                  ) : (
                    <div key={idx} className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">{pt.condition}</p>
                        <p className="text-lg font-black text-[#0ea5e9]">{pt.value}</p>
                      </div>
                      <p className="text-sm text-slate-600 mb-5 leading-relaxed font-medium">{pt.interpretation}</p>
                      <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-start">
                        <Lightbulb className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5 text-[#0ea5e9]" />
                        <span className="text-sm font-medium text-slate-700">{pt.recommendation}</span>
                      </div>
                    </div>
                  )
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                <p className="text-slate-500 font-medium">No weather recommendations available.</p>
              </div>
            )}
          </div>
        </div>

        {/* SOIL MANAGEMENT */}
        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-8 flex flex-col h-full lg:col-span-2">
          <h3 className="text-xl font-bold text-[#12372A] mb-6 flex items-center">
            <TestTube className="w-6 h-6 mr-3 text-[#5BAE65]" />
            Soil Management & Agronomy
          </h3>
          <div className="flex-1">
            {insightsData.soil_insights && insightsData.soil_insights.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {insightsData.soil_insights.map((pt, idx) => (
                  typeof pt === 'string' ? (
                    <div key={idx} className="p-5 rounded-2xl border bg-[#f0fdf4] border-[#bbf7d0]/50 flex items-start shadow-sm">
                      <CheckCircle className="flex-shrink-0 w-4 h-4 text-[#22c55e] mt-0.5 mr-3" />
                      <span className="text-[#14532d] text-sm font-medium leading-relaxed">{pt}</span>
                    </div>
                  ) : (
                    <div key={idx} className="bg-[#F7F8F2] border border-[#c6dfcd]/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <p className="text-xs font-extrabold text-[#1F6B45]/60 uppercase tracking-widest">{pt.condition}</p>
                        <p className="text-lg font-black text-[#1F6B45]">{pt.value}</p>
                      </div>
                      <p className="text-sm text-slate-700 mb-5 leading-relaxed font-medium">{pt.interpretation}</p>
                      <div className="bg-white border border-[#c6dfcd] rounded-xl p-4 shadow-sm flex items-start">
                        <Sprout className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5 text-[#5BAE65]" />
                        <span className="text-sm font-medium text-[#12372A]">{pt.recommendation}</span>
                      </div>
                    </div>
                  )
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                <p className="text-slate-500 font-medium">No soil recommendations available.</p>
              </div>
            )}
          </div>
        </div>

        {/* LIMITATIONS */}
        <div className="bg-slate-50 rounded-[2rem] border border-slate-200 p-8 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center">
            <Info className="w-5 h-5 mr-3 text-slate-400" />
            Model Considerations & Limitations
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insightsData.limitations?.map((pt, idx) => (
              <li key={idx} className="flex items-start">
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 mr-3"></span>
                <span className="text-slate-500 text-sm font-medium leading-relaxed">{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
