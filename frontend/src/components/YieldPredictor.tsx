import React, { useState, useEffect } from 'react';
import { Cpu, Award, AlertTriangle, Activity, BarChart2, CheckCircle, RefreshCw } from 'lucide-react';

interface PredictorProps {
  apiBaseUrl?: string;
}

export const YieldPredictor: React.FC<PredictorProps> = ({ apiBaseUrl = 'http://localhost:8000' }) => {
  const [formData, setFormData] = useState({
    crop_type: 'Wheat',
    region: 'North India',
    irrigation_type: 'Drip',
    fertilizer_type: 'NPK 14-35-14',
    crop_disease_status: 'None',
    soil_pH: 6.5,
    'soil_moisture_%': 45.0,
    temperature_C: 24.5,
    rainfall_mm: 185.0,
    'humidity_%': 62.0,
    sunlight_hours: 7.5,
    pesticide_usage_ml: 450.0,
    total_days: 120,
    NDVI_index: 0.68
  });

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<{
    predicted_yield_kg_ha: number;
    productivity_rating: string;
    risk_rating: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [modelMetrics, setModelMetrics] = useState<any>(null);

  useEffect(() => {
    fetchModelMetrics();
  }, []);

  const fetchModelMetrics = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/predict/models`);
      if (res.ok) {
        const data = await res.json();
        setModelMetrics(data);
      }
    } catch (err) {
      console.warn("Model comparison metrics offline or unavailable");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to generate prediction');
      }

      const result = await response.json();
      setPrediction(result);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during prediction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Header Card */}
      <div className="glass-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(59,130,246,0.08) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Cpu className="gradient-text-green" size={28} />
          <h2 style={{ fontSize: '1.4rem', color: '#ffffff', margin: 0, fontWeight: 700 }}>
            AI Crop Yield Prediction Engine
          </h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
          Enter 14 agricultural telemetry parameters to infer predicted harvest yield (kg/ha), productivity class, and risk rating using our trained Random Forest Regressor.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        
        {/* Prediction Form */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#ffffff', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="#10b981" />
            Telemetry Input Features (14 Parameters)
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            
            {/* 1. Crop Information */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                1. Crop & Region Information
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.6rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Crop Type</label>
                  <select name="crop_type" value={formData.crop_type} onChange={handleChange} className="search-input" style={{ width: '100%', marginTop: '0.2rem' }}>
                    <option value="Wheat">Wheat</option>
                    <option value="Rice">Rice</option>
                    <option value="Maize">Maize</option>
                    <option value="Soybean">Soybean</option>
                    <option value="Cotton">Cotton</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Region</label>
                  <select name="region" value={formData.region} onChange={handleChange} className="search-input" style={{ width: '100%', marginTop: '0.2rem' }}>
                    <option value="North India">North India</option>
                    <option value="South India">South India</option>
                    <option value="South USA">South USA</option>
                    <option value="Central USA">Central USA</option>
                    <option value="East Africa">East Africa</option>
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Crop Disease Status</label>
                  <select name="crop_disease_status" value={formData.crop_disease_status} onChange={handleChange} className="search-input" style={{ width: '100%', marginTop: '0.2rem' }}>
                    <option value="None">None</option>
                    <option value="Leaf Rust">Leaf Rust</option>
                    <option value="Blight">Blight</option>
                    <option value="Powdery Mildew">Powdery Mildew</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Soil Characteristics */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                2. Soil Characteristics
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.6rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Soil pH ({formData.soil_pH})</label>
                  <input type="number" step="0.1" name="soil_pH" value={formData.soil_pH} onChange={handleChange} className="search-input" style={{ width: '100%', marginTop: '0.2rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Soil Moisture (%)</label>
                  <input type="number" step="0.5" name="soil_moisture_%" value={formData['soil_moisture_%']} onChange={handleChange} className="search-input" style={{ width: '100%', marginTop: '0.2rem' }} />
                </div>
              </div>
            </div>

            {/* 3. Weather Conditions */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                3. Weather Parameters
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.6rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Temperature (°C)</label>
                  <input type="number" step="0.5" name="temperature_C" value={formData.temperature_C} onChange={handleChange} className="search-input" style={{ width: '100%', marginTop: '0.2rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rainfall (mm)</label>
                  <input type="number" step="1" name="rainfall_mm" value={formData.rainfall_mm} onChange={handleChange} className="search-input" style={{ width: '100%', marginTop: '0.2rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Humidity (%)</label>
                  <input type="number" step="1" name="humidity_%" value={formData['humidity_%']} onChange={handleChange} className="search-input" style={{ width: '100%', marginTop: '0.2rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sunlight (hrs/day)</label>
                  <input type="number" step="0.5" name="sunlight_hours" value={formData.sunlight_hours} onChange={handleChange} className="search-input" style={{ width: '100%', marginTop: '0.2rem' }} />
                </div>
              </div>
            </div>

            {/* 4. Farm Operations & Vegetation */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                4. Farm Operations & NDVI Index
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.6rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Irrigation Type</label>
                  <select name="irrigation_type" value={formData.irrigation_type} onChange={handleChange} className="search-input" style={{ width: '100%', marginTop: '0.2rem' }}>
                    <option value="Drip">Drip</option>
                    <option value="Sprinkler">Sprinkler</option>
                    <option value="Flood">Flood</option>
                    <option value="Rainfed">Rainfed</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fertilizer Type</label>
                  <select name="fertilizer_type" value={formData.fertilizer_type} onChange={handleChange} className="search-input" style={{ width: '100%', marginTop: '0.2rem' }}>
                    <option value="NPK 14-35-14">NPK 14-35-14</option>
                    <option value="Urea">Urea</option>
                    <option value="DAP">DAP</option>
                    <option value="Organic">Organic</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pesticide Usage (ml)</label>
                  <input type="number" step="10" name="pesticide_usage_ml" value={formData.pesticide_usage_ml} onChange={handleChange} className="search-input" style={{ width: '100%', marginTop: '0.2rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Growing Days</label>
                  <input type="number" name="total_days" value={formData.total_days} onChange={handleChange} className="search-input" style={{ width: '100%', marginTop: '0.2rem' }} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NDVI Vegetation Index (0.0 - 1.0)</label>
                  <input type="number" step="0.01" min="0" max="1" name="NDVI_index" value={formData.NDVI_index} onChange={handleChange} className="search-input" style={{ width: '100%', marginTop: '0.2rem' }} />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '0.85rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
              }}
            >
              {loading ? (
                <>
                  <RefreshCw className="spin" size={18} />
                  Calculating AI Yield Prediction...
                </>
              ) : (
                <>
                  <Cpu size={18} />
                  Calculate AI Yield Prediction
                </>
              )}
            </button>

          </form>
        </div>

        {/* Prediction Results & Model Comparison */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Prediction Output Card */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '260px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={18} color="#f59e0b" />
              AI Prediction Output Result
            </h3>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', padding: '0.85rem', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem' }}>
                <AlertTriangle size={16} style={{ display: 'inline', marginRight: '6px' }} />
                {error}
              </div>
            )}

            {!prediction && !error && !loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Cpu size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, fontSize: '0.9rem' }}>Fill out the 14 telemetry features on the left and click "Calculate AI Yield Prediction".</p>
              </div>
            )}

            {prediction && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Predicted Yield Highlight */}
                <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '12px', padding: '1.2rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#34d399', fontWeight: 600, letterSpacing: '0.05em' }}>
                    Predicted Crop Yield
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ffffff', margin: '0.2rem 0' }}>
                    {prediction.predicted_yield_kg_ha.toLocaleString()} <span style={{ fontSize: '1.1rem', fontWeight: 500, color: '#34d399' }}>kg/ha</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Inferred via Best Selected Model (Random Forest Regressor)
                  </div>
                </div>

                {/* Rating Cards Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Productivity Rating</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: prediction.productivity_rating === 'High' ? '#34d399' : prediction.productivity_rating === 'Medium' ? '#f59e0b' : '#ef4444', marginTop: '0.2rem' }}>
                      {prediction.productivity_rating}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Agricultural Risk Rating</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: prediction.risk_rating === 'Low' ? '#34d399' : prediction.risk_rating === 'Medium' ? '#f59e0b' : '#ef4444', marginTop: '0.2rem' }}>
                      {prediction.risk_rating}
                    </div>
                  </div>

                </div>

              </div>
            )}
          </div>

          {/* Model Comparison Metrics Card */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart2 size={18} color="#60a5fa" />
                Model Evaluation Metrics (Held-out Test Set)
              </h3>
              <button onClick={fetchModelMetrics} className="tab-btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                <RefreshCw size={12} /> Refresh
              </button>
            </div>

            {modelMetrics && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.5rem' }}>Model Algorithm</th>
                      <th style={{ padding: '0.5rem' }}>RMSE (kg/ha)</th>
                      <th style={{ padding: '0.5rem' }}>MAE (kg/ha)</th>
                      <th style={{ padding: '0.5rem' }}>R² Score</th>
                      <th style={{ padding: '0.5rem' }}>Latency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['Random Forest', 'XGBoost', 'LightGBM', 'Linear Regression'].map(modelName => {
                      const m = modelMetrics[modelName];
                      if (!m) return null;
                      const isBest = modelMetrics.best_model === modelName;

                      return (
                        <tr key={modelName} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: isBest ? 'rgba(16, 185, 129, 0.08)' : 'transparent' }}>
                          <td style={{ padding: '0.55rem', fontWeight: isBest ? 700 : 400, color: isBest ? '#34d399' : '#ffffff', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            {isBest && <CheckCircle size={14} color="#34d399" />}
                            {modelName}
                          </td>
                          <td style={{ padding: '0.55rem', color: isBest ? '#34d399' : 'var(--text-main)' }}>{m.rmse}</td>
                          <td style={{ padding: '0.55rem', color: 'var(--text-muted)' }}>{m.mae}</td>
                          <td style={{ padding: '0.55rem', color: 'var(--text-muted)' }}>{m.r2}</td>
                          <td style={{ padding: '0.55rem', color: 'var(--text-muted)' }}>{m.inference_latency_ms} ms</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                  * Primary Selection Criterion: Lowest Test RMSE. Best Model selected: <strong style={{ color: '#34d399' }}>{modelMetrics.best_model}</strong>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
