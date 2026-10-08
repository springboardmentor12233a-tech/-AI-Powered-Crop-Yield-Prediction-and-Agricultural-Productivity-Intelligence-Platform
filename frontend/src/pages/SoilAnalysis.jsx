import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { EmptyState, LoadingState, ErrorState } from '../components/common/StateComponents';
import { getPredictionHistory, getHistoricalSoilData } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { TestTube, ArrowRight, Sprout, Droplets, Info, Layers } from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const CustomTooltip = ({ active, payload, label, dataKeyName, dataKeyUnit }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100 min-w-[200px]">
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">{label || 'Data Point'}</p>
        <p className="text-lg font-black text-[#1F6B45] mb-3">{dataKeyName}: {data[payload[0].dataKey]}{dataKeyUnit}</p>
        <div className="space-y-2">
          {data.crop && <p className="text-xs text-slate-500 flex justify-between"><span className="font-bold text-slate-700">Crop:</span> <span>{data.crop}</span></p>}
          {data.region && <p className="text-xs text-slate-500 flex justify-between"><span className="font-bold text-slate-700">Region:</span> <span>{data.region}</span></p>}
          {payload[0].dataKey === 'moisture' && data.ph && <p className="text-xs text-slate-500 flex justify-between"><span className="font-bold text-slate-700">Soil pH:</span> <span>{data.ph}</span></p>}
          {payload[0].dataKey === 'ph' && data.moisture && <p className="text-xs text-slate-500 flex justify-between"><span className="font-bold text-slate-700">Moisture:</span> <span>{data.moisture}%</span></p>}
          {data.yield && <p className="text-xs text-slate-500 flex justify-between"><span className="font-bold text-slate-700">Yield:</span> <span className="text-[#5BAE65] font-bold">{data.yield.toLocaleString()} kg/ha</span></p>}
        </div>
      </div>
    );
  }
  return null;
};

export default function SoilAnalysis() {
  const { recentPrediction, analysisState } = useAppContext();
  const navigate = useNavigate();

  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historicalDataset, setHistoricalDataset] = useState(null);
  const [datasetLoading, setDatasetLoading] = useState(false);

  const soilData = analysisState?.soilData;
  const soilLoading = !soilData && analysisState?.status === 'loading';
  const soilError = !soilData && analysisState?.status === 'error';

  const llmData = analysisState?.insightsData;
  const llmLoading = analysisState?.status === 'loading';
  const llmError = analysisState?.llmError;

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const createBins = (data, key, numBins = 10) => {
    if (!data || data.length === 0) return [];
    const min = Math.min(...data.map(d => d[key]));
    const max = Math.max(...data.map(d => d[key]));
    const step = (max - min) / numBins;
    if (step === 0) return [{ bin: `${min.toFixed(1)}`, count: data.length }];
    
    const bins = Array.from({ length: numBins }, (_, i) => ({
      min: min + i * step,
      max: min + (i + 1) * step,
      count: 0
    }));
    
    data.forEach(d => {
      const val = d[key];
      const binIdx = Math.min(Math.floor((val - min) / step), numBins - 1);
      bins[binIdx].count++;
    });
    
    return bins.map(b => ({
      bin: `${b.min.toFixed(1)}-${b.max.toFixed(1)}`,
      count: b.count
    }));
  };

  useEffect(() => {
    const fetchHistory = async () => {
      if (!recentPrediction) return;
      
      setHistoryLoading(true);
      setDatasetLoading(true);
      try {
        const [history, dataset] = await Promise.all([
          getPredictionHistory(),
          getHistoricalSoilData(recentPrediction.input.crop_type)
        ]);

        const validHistory = history.filter(p => 
          p && p.input && 
          p.input["soil_moisture_%"] != null && 
          p.input.soil_pH != null && 
          p.created_at
        ).sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          if (dateA === dateB) {
            return (b.id || '').toString().localeCompare((a.id || '').toString());
          }
          return dateB - dateA;
        });
        setHistoryData(validHistory);
        setHistoricalDataset(dataset);
      } catch (err) {
        console.error("Failed to fetch prediction history for charts:", err);
      } finally {
        setHistoryLoading(false);
        setDatasetLoading(false);
      }
    };
    fetchHistory();
  }, [recentPrediction]);

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

  if (soilLoading || llmLoading) return <LoadingState message="Analyzing soil conditions and compiling insights..." />;
  if (soilError || !soilData) return <ErrorState message="Failed to load soil analysis data." />;

  const formattedHistory = [...historyData].reverse().map(h => ({
    date: formatDate(h.created_at),
    moisture: h.input["soil_moisture_%"],
    ph: h.input.soil_pH,
    yield: h.predicted_yield_kg_per_ha,
    crop: h.input.crop_type,
    region: h.input.region
  }));

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-[#12372A] to-[#1F6B45] p-6 md:p-10 rounded-[2rem] shadow-card border border-[#2E8B57]/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#d97706]/20 rounded-full blur-[80px] -mt-20 -mr-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#10b981]/20 rounded-full blur-[80px] -mb-20 -ml-20 pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold text-[#FCFCF8] tracking-tight">Soil Deep Analysis</h2>
          <p className="text-[#c6dfcd] mt-2 font-medium">Substrate evaluation and suitability for {recentPrediction.input.crop_type}.</p>
        </div>
        <div className="relative z-10 flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
          <Layers className="w-8 h-8 text-[#A8C957]" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-[2rem] p-5 md:p-8 border border-slate-200/60 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 bg-blue-50 w-32 h-32 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500 ease-out"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Soil Moisture</span>
              </div>
              <p className="text-xs text-slate-400 font-medium ml-13">Current assessment</p>
            </div>
            <div className="text-5xl font-black text-[#12372A]">{recentPrediction.input["soil_moisture_%"]}<span className="text-2xl text-slate-300 ml-1">%</span></div>
          </div>
        </div>
        
        <div className="bg-white rounded-[2rem] p-5 md:p-8 border border-slate-200/60 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 bg-emerald-50 w-32 h-32 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500 ease-out"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Sprout className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Soil pH</span>
              </div>
              <p className="text-xs text-slate-400 font-medium ml-13">Current assessment</p>
            </div>
            <div className="text-5xl font-black text-[#12372A]">{recentPrediction.input.soil_pH}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-5 py-4 md:px-8 md:py-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xl font-bold text-[#12372A]">AI Soil Insights</h3>
          <p className="text-sm text-slate-500 font-medium mt-1">Machine learning interpretations of soil viability.</p>
        </div>
        <div className="p-5 md:p-8">
          <ul className="space-y-4">
            {soilData.historical_yield_context && (
              <li className="flex items-start bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50">
                <ArrowRight className="w-5 h-5 text-emerald-500 mr-4 flex-shrink-0 mt-0.5" />
                <span className="text-[15px] font-medium text-emerald-900 leading-relaxed">{soilData.historical_yield_context}</span>
              </li>
            )}
            {soilData.overall_assessment && (
              <li className="flex items-start bg-[#f0f9ff]/50 p-5 rounded-2xl border border-[#bae6fd]/50">
                <ArrowRight className="w-5 h-5 text-[#0284c7] mr-4 flex-shrink-0 mt-0.5" />
                <span className="text-[15px] font-medium text-[#0c4a6e] leading-relaxed">{soilData.overall_assessment}</span>
              </li>
            )}
            {soilData.agricultural_insight && (
              <li className="flex items-start bg-amber-50/50 p-5 rounded-2xl border border-amber-100/50">
                <ArrowRight className="w-5 h-5 text-amber-500 mr-4 flex-shrink-0 mt-0.5" />
                <span className="text-[15px] font-medium text-amber-900 leading-relaxed">{soilData.agricultural_insight}</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-5 py-4 md:px-8 md:py-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xl font-bold text-[#12372A]">Historical Analysis & Distribution</h3>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Historical soil conditions and their relationship with crop yield.
          </p>
        </div>
        <div className="p-5 md:p-8">
          {datasetLoading ? (
            <div className="flex-1 flex items-center justify-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 py-16">
              <LoadingState message="Loading historical dataset..." />
            </div>
          ) : !historicalDataset || historicalDataset.records.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 py-12 px-6 my-2">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm mb-4">
                <TestTube className="w-8 h-8 text-slate-300" />
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-2">No historical soil records yet.</h4>
              <p className="text-sm text-slate-500 text-center max-w-sm leading-relaxed">
                The training dataset is currently empty. Make predictions to build historical trends.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Soil Moisture Distribution */}
              <div className="border border-slate-100 rounded-2xl p-4 md:p-6 bg-slate-50/30 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 text-center">Moisture Frequency Distribution</h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={createBins(historicalDataset.records, 'soil_moisture', 10)} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="bin" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} tickMargin={10} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: '600' }} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Observations" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Soil pH Distribution */}
              <div className="border border-slate-100 rounded-2xl p-4 md:p-6 bg-slate-50/30 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 text-center">pH Level Frequency Distribution</h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={createBins(historicalDataset.records, 'soil_pH', 10)} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="bin" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} tickMargin={10} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: '600' }} />
                      <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} name="Observations" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Soil Moisture vs Yield */}
              <div className="border border-slate-100 rounded-2xl p-4 md:p-6 bg-slate-50/30 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 text-center">Moisture vs Yield Scatter</h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" dataKey="soil_moisture" name="Soil Moisture" unit="%" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} tickMargin={10} domain={['dataMin', 'dataMax']} axisLine={false} tickLine={false} />
                      <YAxis type="number" dataKey="yield" name="Yield" unit=" kg/ha" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} tickMargin={10} axisLine={false} tickLine={false} domain={['dataMin', 'dataMax']} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip dataKeyName="Moisture" dataKeyUnit="%" />} />
                      <Scatter name="Training Records" data={historicalDataset.records} fill="#3b82f6" fillOpacity={0.7} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Soil pH vs Yield */}
              <div className="border border-slate-100 rounded-2xl p-4 md:p-6 bg-slate-50/30 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 text-center">pH vs Yield Scatter</h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" dataKey="soil_pH" name="Soil pH" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} tickMargin={10} domain={['dataMin', 'dataMax']} axisLine={false} tickLine={false} />
                      <YAxis type="number" dataKey="yield" name="Yield" unit=" kg/ha" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} tickMargin={10} axisLine={false} tickLine={false} domain={['dataMin', 'dataMax']} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip dataKeyName="pH Level" dataKeyUnit="" />} />
                      <Scatter name="Training Records" data={historicalDataset.records} fill="#10b981" fillOpacity={0.7} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
