import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { predictYield } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { Sprout, Loader2, ArrowRight } from 'lucide-react';

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

export default function YieldPrediction() {
  const [formData, setFormData] = useState(defaultFormState);
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const predictionResult = await predictYield(formData);
      setResult(predictionResult);
      setRecentPrediction({ input: formData, result: predictionResult });
    } catch (err) {
      setError(err.response?.data?.detail || "An error occurred during prediction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Yield Prediction</h2>
        <p className="text-slate-500 mt-1">Configure agricultural parameters to forecast crop production.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Agricultural Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Categorical Inputs */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Region</label>
                  <input type="text" name="region" value={formData.region} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" required />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Crop Type</label>
                  <input type="text" name="crop_type" value={formData.crop_type} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" required />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Irrigation Type</label>
                  <input type="text" name="irrigation_type" value={formData.irrigation_type} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" required />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Fertilizer Type</label>
                  <input type="text" name="fertilizer_type" value={formData.fertilizer_type} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" required />
                </div>
                
                {/* Numeric Inputs */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Soil Moisture (%)</label>
                  <input type="number" step="0.1" name="soil_moisture_%" value={formData["soil_moisture_%"]} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" required />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Soil pH</label>
                  <input type="number" step="0.1" name="soil_pH" value={formData.soil_pH} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" required />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Temperature (°C)</label>
                  <input type="number" step="0.1" name="temperature_C" value={formData.temperature_C} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" required />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Rainfall (mm)</label>
                  <input type="number" step="0.1" name="rainfall_mm" value={formData.rainfall_mm} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" required />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Humidity (%)</label>
                  <input type="number" step="0.1" name="humidity_%" value={formData["humidity_%"]} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" required />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Sunlight (hours/day)</label>
                  <input type="number" step="0.1" name="sunlight_hours" value={formData.sunlight_hours} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" required />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">NDVI Index</label>
                  <input type="number" step="0.01" name="NDVI_index" value={formData.NDVI_index} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" required />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Crop Cycle (days)</label>
                  <input type="number" name="total_days" value={formData.total_days} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" required />
                </div>
                
                {/* Date and Location */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Sowing Date</label>
                  <input type="date" name="sowing_date" value={formData.sowing_date} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" required />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Observation Date</label>
                  <input type="date" name="observation_date" value={formData.observation_date} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" required />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Latitude</label>
                  <input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" required />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Longitude</label>
                  <input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" required />
                </div>
                 {/* Remaining Fields */}
                 <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Pesticide Usage (ml)</label>
                  <input type="number" step="0.1" name="pesticide_usage_ml" value={formData.pesticide_usage_ml} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" required />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Disease Status</label>
                  <select name="crop_disease_status" value={formData.crop_disease_status} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
                    <option value="Healthy">Healthy</option>
                    <option value="Mild">Mild</option>
                    <option value="Severe">Severe</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button type="submit" disabled={loading} icon={loading ? Loader2 : Sprout}>
                  {loading ? 'Running AI Model...' : 'Predict Yield'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prediction Result</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100 mb-4">
                  {error}
                </div>
              )}
              
              {!result && !loading && !error && (
                <div className="text-center py-8 px-4 border-2 border-dashed border-slate-200 rounded-xl">
                  <Sprout className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Submit the form to generate a yield prediction.</p>
                </div>
              )}

              {loading && (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Analyzing variables...</p>
                </div>
              )}

              {result && !loading && (
                <div className="space-y-6">
                  <div className="text-center p-6 bg-primary-50 rounded-xl border border-primary-100">
                    <p className="text-sm text-primary-600 font-medium mb-2">Estimated Yield</p>
                    <h4 className="text-4xl font-bold text-primary-700">{result.predicted_yield_kg_per_hectare.toLocaleString()}</h4>
                    <p className="text-xs text-primary-500 mt-1">{result.unit}</p>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={() => navigate('/')} 
                    variant="outline" 
                    icon={ArrowRight}
                  >
                    View on Dashboard
                  </Button>
                  <Button 
                    className="w-full mt-2" 
                    onClick={() => navigate('/reports')} 
                    variant="secondary"
                  >
                    Generate Full Report
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
