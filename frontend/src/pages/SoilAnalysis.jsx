import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { EmptyState, LoadingState, ErrorState } from '../components/common/StateComponents';
import { getPredictionHistory, getHistoricalSoilData } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { TestTube, ArrowRight, Sprout, Droplets, Info } from 'lucide-react';
import {
  LineChart,
  Line,
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
      <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 min-w-[150px]">
        <p className="text-sm font-semibold text-slate-800 mb-2 border-b border-slate-100 pb-1">{label}</p>
        <p className="text-sm font-bold text-emerald-600 mb-2">{dataKeyName}: {data[payload[0].dataKey]}{dataKeyUnit}</p>
        <div className="space-y-1">
          {data.crop && <p className="text-xs text-slate-500"><span className="font-medium">Crop:</span> {data.crop}</p>}
          {data.region && <p className="text-xs text-slate-500"><span className="font-medium">Region:</span> {data.region}</p>}
          {payload[0].dataKey === 'moisture' && data.ph && <p className="text-xs text-slate-500"><span className="font-medium">Soil pH:</span> {data.ph}</p>}
          {payload[0].dataKey === 'ph' && data.moisture && <p className="text-xs text-slate-500"><span className="font-medium">Soil Moisture:</span> {data.moisture}%</p>}
          {data.yield && <p className="text-xs text-slate-500"><span className="font-medium">Yield:</span> {data.yield.toLocaleString()} kg/ha</p>}
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

  const parseAssessment = (assessmentObj) => {
    if (!assessmentObj) return {};
    let classification = assessmentObj.assessment;
    let yieldAssoc = null;
    let range = null;
    let correlation = null;
    let rawContext = assessmentObj.historical_context || "";
    let rawAssessment = assessmentObj.assessment || "";

    const classMatch = rawAssessment.match(/Value is in the '([^']+)'/);
    if (classMatch) classification = classMatch[1] + " quartile";
    
    const yieldMatch = rawAssessment.match(/associated with (a.*?) historical yield/);
    if (yieldMatch) yieldAssoc = yieldMatch[1] + " historical yield";

    const rangeMatch = rawContext.match(/\(([\d.]+\s*-\s*[\d.]+)\)/);
    if (rangeMatch) range = rangeMatch[1];

    const corrMatch = rawContext.match(/correlation \(([+-]?[\d.]+)\)/);
    if (corrMatch) correlation = corrMatch[1];
    
    return {
      classification,
      yieldAssoc,
      range,
      correlation,
      isLimited: rawContext.includes("Limited historical evidence")
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Soil Analysis</h2>
          <p className="text-slate-500 mt-1">Deep analysis of soil properties and suitability for {recentPrediction.input.crop_type}.</p>
        </div>
      </div>

      {/* SECTION 1: CURRENT SOIL CONDITIONS */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Current Soil Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Droplets className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800">Soil Moisture</span>
                </div>
                <p className="text-xs text-slate-500">Current prediction</p>
              </div>
              <div className="text-3xl font-bold text-slate-800">{recentPrediction.input["soil_moisture_%"]}%</div>
            </div>
            
            <div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-100 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Sprout className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-800">Soil pH</span>
                </div>
                <p className="text-xs text-slate-500">Current prediction</p>
              </div>
              <div className="text-3xl font-bold text-slate-800">{recentPrediction.input.soil_pH}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: SOIL INSIGHTS */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Soil Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {soilData.historical_yield_context && (
              <li className="flex items-start text-sm text-slate-700">
                <span className="text-emerald-500 mr-2 mt-0.5">•</span>
                <span className="leading-relaxed">{soilData.historical_yield_context}</span>
              </li>
            )}
            {soilData.overall_assessment && (
              <li className="flex items-start text-sm text-slate-700">
                <span className="text-emerald-500 mr-2 mt-0.5">•</span>
                <span className="leading-relaxed">{soilData.overall_assessment}</span>
              </li>
            )}
            {soilData.agricultural_insight && (
              <li className="flex items-start text-sm text-slate-700">
                <span className="text-emerald-500 mr-2 mt-0.5">•</span>
                <span className="leading-relaxed">{soilData.agricultural_insight}</span>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>

      {/* SECTION 3: HISTORICAL SOIL ANALYSIS */}
      <Card>
        <CardHeader>
          <CardTitle>Historical Soil Analysis</CardTitle>
          <p className="text-sm text-slate-500 font-normal mt-1">
            Historical soil conditions and their relationship with crop yield.
          </p>
        </CardHeader>
        <CardContent>
          {datasetLoading ? (
            <div className="flex-1 flex items-center justify-center bg-slate-50/50 m-4 rounded-xl border border-dashed border-slate-200 py-12">
              <LoadingState message="Loading historical dataset..." />
            </div>
          ) : !historicalDataset || historicalDataset.records.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 py-8 px-6 my-2 min-h-[180px]">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm mb-3">
                <TestTube className="w-5 h-5 text-slate-400" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800 mb-1.5">No historical soil records yet.</h4>
              <p className="text-sm text-slate-500 text-center max-w-xs leading-relaxed">
                The training dataset is currently empty.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Soil Moisture Distribution */}
              <div className="border border-slate-100 rounded-xl p-5 bg-white shadow-sm flex flex-col">
                <h4 className="text-sm font-semibold text-slate-700 mb-4 text-center">Soil Moisture Distribution</h4>
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={createBins(historicalDataset.records, 'soil_moisture', 10)} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="bin" tick={{ fontSize: 10, fill: '#64748b' }} tickMargin={10} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', padding: '8px' }} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Observations" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Soil pH Distribution */}
              <div className="border border-slate-100 rounded-xl p-5 bg-white shadow-sm flex flex-col">
                <h4 className="text-sm font-semibold text-slate-700 mb-4 text-center">Soil pH Distribution</h4>
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={createBins(historicalDataset.records, 'soil_pH', 10)} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="bin" tick={{ fontSize: 10, fill: '#64748b' }} tickMargin={10} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', padding: '8px' }} />
                      <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Observations" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Soil Moisture vs Yield */}
              <div className="border border-slate-100 rounded-xl p-5 bg-white shadow-sm flex flex-col">
                <h4 className="text-sm font-semibold text-slate-700 mb-4 text-center">Soil Moisture vs Yield</h4>
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" dataKey="soil_moisture" name="Soil Moisture" unit="%" tick={{ fontSize: 11, fill: '#64748b' }} tickMargin={10} domain={['dataMin', 'dataMax']} />
                      <YAxis type="number" dataKey="yield" name="Yield" unit=" kg/ha" tick={{ fontSize: 11, fill: '#64748b' }} tickMargin={10} axisLine={false} tickLine={false} domain={['dataMin', 'dataMax']} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', padding: '8px' }} />
                      <Scatter name="Training Records" data={historicalDataset.records} fill="#3b82f6" fillOpacity={0.6} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Soil pH vs Yield */}
              <div className="border border-slate-100 rounded-xl p-5 bg-white shadow-sm flex flex-col">
                <h4 className="text-sm font-semibold text-slate-700 mb-4 text-center">Soil pH vs Yield</h4>
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" dataKey="soil_pH" name="Soil pH" tick={{ fontSize: 11, fill: '#64748b' }} tickMargin={10} domain={['dataMin', 'dataMax']} />
                      <YAxis type="number" dataKey="yield" name="Yield" unit=" kg/ha" tick={{ fontSize: 11, fill: '#64748b' }} tickMargin={10} axisLine={false} tickLine={false} domain={['dataMin', 'dataMax']} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', padding: '8px' }} />
                      <Scatter name="Training Records" data={historicalDataset.records} fill="#10b981" fillOpacity={0.6} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
