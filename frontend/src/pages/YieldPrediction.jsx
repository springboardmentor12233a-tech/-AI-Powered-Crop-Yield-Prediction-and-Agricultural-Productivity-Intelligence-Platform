import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { predictYield, getPredictionHistory } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { 
  Sprout, 
  Loader2, 
  ArrowRight,
  MapPin,
  CloudRain,
  TestTube,
  Leaf,
  Brain,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { cn } from '../utils/cn';

const defaultFormState = {
  region: 'Central USA',
  crop_type: 'Maize',
  irrigation_type: 'Drip',
  fertilizer_type: 'Inorganic',
  crop_disease_status: 'Mild',
  "soil_moisture_%": 35.5,
  soil_pH: 6.8,
  temperature_C: 24.5,
  rainfall_mm: 120.0,
  "humidity_%": 65.0,
  sunlight_hours: 8.5,
  pesticide_usage_ml: 250.0,
  total_days: 120,
  latitude: 40.7,
  longitude: -95.0,
  NDVI_index: 0.65,
  sowing_date: '2024-04-15',
  observation_date: '2024-06-15'
};

const InputField = ({ label, type, name, value, onChange, icon: Icon, step }) => (
  <div className="space-y-1.5 group">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#5BAE65] transition-colors">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <input 
        type={type} 
        step={step}
        name={name} 
        value={value} 
        onChange={onChange} 
        className={cn(
          "w-full py-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-[#5BAE65]/50 focus:border-[#5BAE65] outline-none transition-all shadow-sm bg-slate-50 focus:bg-white",
          Icon ? "pl-10 pr-4" : "px-4"
        )}
        required 
      />
    </div>
  </div>
);

const SelectField = ({ label, name, value, onChange, options, icon: Icon }) => (
  <div className="space-y-1.5 group">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#5BAE65] transition-colors">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <select 
        name={name} 
        value={value} 
        onChange={onChange} 
        className={cn(
          "w-full py-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-[#5BAE65]/50 focus:border-[#5BAE65] outline-none transition-all shadow-sm bg-slate-50 focus:bg-white appearance-none cursor-pointer",
          Icon ? "pl-10 pr-4" : "px-4"
        )}
        required
      >
        {options.map(opt => (
          <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>
        ))}
      </select>
    </div>
  </div>
);

export default function YieldPrediction() {
  const [formData, setFormData] = useState(defaultFormState);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const { setRecentPrediction } = useAppContext();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const simulateLoadingSteps = () => {
    setLoadingText('Analyzing farm conditions...');
    setTimeout(() => {
      if (loading) setLoadingText('Running prediction model...');
    }, 800);
    setTimeout(() => {
      if (loading) setLoadingText('Generating agricultural insights...');
    }, 1600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    simulateLoadingSteps();
    setError(null);
    try {
      const predictionResult = await predictYield(formData);
      
      const hist = await getPredictionHistory();
      const sorted = [...hist].sort((a, b) => (a.id || 0) - (b.id || 0));
      const latest = sorted[sorted.length - 1];
      
      if (latest) {
        localStorage.setItem('currentPredictionId', latest.id.toString());
        setRecentPrediction({ 
          id: latest.id,
          input: formData, 
          result: predictionResult 
        });
      } else {
        setRecentPrediction({ input: formData, result: predictionResult });
      }
      
      setResult(predictionResult);
    } catch (err) {
      setError(err.response?.data?.detail || "An error occurred during prediction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-[#12372A] tracking-tight">AI Yield Prediction</h2>
        <p className="text-lg text-[#1F6B45]/80 mt-2 font-medium">Input your farm's parameters to generate a precise agricultural forecast.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <form id="prediction-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* 01. Farm Information */}
            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-5 sm:p-8">
              <div className="flex items-center mb-6 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-full bg-[#e8f0ea] text-[#1F6B45] flex items-center justify-center font-bold text-lg mr-4">01</div>
                <div>
                  <h3 className="text-xl font-bold text-[#12372A]">Location Details</h3>
                  <p className="text-sm text-slate-500 font-medium">Geographical data for your farm.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputField label="Region" type="text" name="region" value={formData.region} onChange={handleChange} icon={MapPin} />
                <InputField label="Latitude" type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} icon={MapPin} />
                <InputField label="Longitude" type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} icon={MapPin} />
              </div>
            </div>

            {/* 02. Environmental Conditions */}
            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-5 sm:p-8">
              <div className="flex items-center mb-6 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-full bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center font-bold text-lg mr-4">02</div>
                <div>
                  <h3 className="text-xl font-bold text-[#12372A]">Environmental Conditions</h3>
                  <p className="text-sm text-slate-500 font-medium">Weather and climate metrics.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Temperature (°C)" type="number" step="0.1" name="temperature_C" value={formData.temperature_C} onChange={handleChange} icon={CloudRain} />
                <InputField label="Rainfall (mm)" type="number" step="0.1" name="rainfall_mm" value={formData.rainfall_mm} onChange={handleChange} icon={CloudRain} />
                <InputField label="Humidity (%)" type="number" step="0.1" name="humidity_%" value={formData["humidity_%"]} onChange={handleChange} icon={CloudRain} />
                <InputField label="Sunlight (hours/day)" type="number" step="0.1" name="sunlight_hours" value={formData.sunlight_hours} onChange={handleChange} icon={CloudRain} />
              </div>
            </div>

            {/* 03. Soil & Crop Data */}
            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-5 sm:p-8">
              <div className="flex items-center mb-6 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-full bg-[#fef3c7] text-[#d97706] flex items-center justify-center font-bold text-lg mr-4">03</div>
                <div>
                  <h3 className="text-xl font-bold text-[#12372A]">Soil & Crop Data</h3>
                  <p className="text-sm text-slate-500 font-medium">Agronomic indicators and farm management.</p>
                </div>
              </div>
              
              <div className="space-y-8">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center"><TestTube className="w-4 h-4 mr-2 text-amber-600"/> Soil Health</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputField label="Soil Moisture (%)" type="number" step="0.1" name="soil_moisture_%" value={formData["soil_moisture_%"]} onChange={handleChange} />
                    <InputField label="Soil pH" type="number" step="0.1" name="soil_pH" value={formData.soil_pH} onChange={handleChange} />
                    <InputField label="NDVI Index" type="number" step="0.01" name="NDVI_index" value={formData.NDVI_index} onChange={handleChange} />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center"><Leaf className="w-4 h-4 mr-2 text-emerald-600"/> Crop Management</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputField label="Crop Type" type="text" name="crop_type" value={formData.crop_type} onChange={handleChange} />
                    <InputField label="Sowing Date" type="date" name="sowing_date" value={formData.sowing_date} onChange={handleChange} />
                    <InputField label="Observation Date" type="date" name="observation_date" value={formData.observation_date} onChange={handleChange} />
                    
                    <InputField label="Crop Cycle (days)" type="number" name="total_days" value={formData.total_days} onChange={handleChange} />
                    <SelectField label="Irrigation Type" name="irrigation_type" value={formData.irrigation_type} onChange={handleChange} options={['Drip', 'Sprinkler', 'Flood', 'Rainfed']} />
                    <SelectField label="Fertilizer Type" name="fertilizer_type" value={formData.fertilizer_type} onChange={handleChange} options={['Inorganic', 'Organic', 'Mixed']} />
                    
                    <InputField label="Pesticide Usage (ml)" type="number" step="0.1" name="pesticide_usage_ml" value={formData.pesticide_usage_ml} onChange={handleChange} />
                    <SelectField label="Disease Status" name="crop_disease_status" value={formData.crop_disease_status} onChange={handleChange} options={['Healthy', 'Mild', 'Severe']} />
                  </div>
                </div>
              </div>
            </div>
            
          </form>
        </div>

        {/* Right Sidebar - Result & Actions */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-[#12372A] rounded-[2rem] border border-[#1F6B45]/50 shadow-card p-5 sm:p-8 sticky top-24">
            <div className="flex items-center mb-6 border-b border-[#1F6B45] pb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#A8C957] to-[#5BAE65] text-[#12372A] flex items-center justify-center font-bold text-lg mr-4">04</div>
              <div>
                <h3 className="text-xl font-bold text-[#FCFCF8]">AI Prediction</h3>
                <p className="text-sm text-[#A8C957] font-medium">Model output</p>
              </div>
            </div>
            
            {error && (
              <div className="p-4 bg-red-500/10 text-red-300 rounded-xl text-sm border border-red-500/20 mb-6 font-medium">
                {error}
              </div>
            )}
            
            {!result && !loading && !error && (
              <div className="text-center py-10">
                <Brain className="w-16 h-16 text-[#1F6B45] mx-auto mb-4 opacity-50" />
                <p className="text-sm text-[#c6dfcd] leading-relaxed">Ready to process parameters.<br/>Click generate below to begin.</p>
              </div>
            )}

            {loading && (
              <div className="text-center py-10">
                <div className="w-16 h-16 border-4 border-[#1F6B45] border-t-[#A8C957] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm font-bold text-[#A8C957] animate-pulse">{loadingText}</p>
              </div>
            )}

            {result && !loading && (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-[#1F6B45]/50 border border-[#5BAE65]/30 text-[#A8C957] text-xs font-bold uppercase tracking-widest mb-4">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> AI Forecast
                </div>
                <h4 className="text-5xl font-extrabold text-[#FCFCF8] tracking-tight mb-2">
                  {result.predicted_yield_kg_per_hectare.toLocaleString()}
                </h4>
                <p className="text-[#c6dfcd] font-medium mb-8 border-b border-[#1F6B45] pb-8">{result.unit}</p>
                
                <div className="space-y-3">
                  <button 
                    onClick={() => navigate('/')} 
                    className="w-full flex items-center justify-center px-4 py-3 bg-[#A8C957] text-[#12372A] font-bold rounded-xl hover:bg-[#5BAE65] hover:text-white transition-colors"
                  >
                    View AI Analysis <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                  <button 
                    onClick={() => navigate('/reports')} 
                    className="w-full flex items-center justify-center px-4 py-3 bg-[#1F6B45]/50 text-[#c6dfcd] font-bold rounded-xl border border-[#5BAE65]/30 hover:bg-[#1F6B45] transition-colors"
                  >
                    Generate Report <FileText className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            )}

            {!result && !loading && (
              <button 
                type="submit" 
                form="prediction-form"
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-4 mt-6 bg-gradient-to-r from-[#A8C957] to-[#5BAE65] text-[#12372A] font-bold rounded-xl hover:shadow-lg hover:shadow-[#A8C957]/20 transition-all transform hover:-translate-y-1"
              >
                ✨ Generate Yield Prediction
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
