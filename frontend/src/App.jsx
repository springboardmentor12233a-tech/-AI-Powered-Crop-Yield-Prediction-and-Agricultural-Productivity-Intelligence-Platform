import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Leaf, Sprout, CloudRain, ThermometerSun, MapPin, FlaskConical, Beaker, Zap } from 'lucide-react';
import './App.css';

const API_URL = 'http://localhost:8000/api/predict';

function App() {
  const [formData, setFormData] = useState({
    State: 'California',
    Crop: 'Almonds',
    Soil_Type: 'Loam',
    Fertilizer: 'Urea',
    N: 120,
    P: 45,
    K: 80,
    Soil_pH: 6.5,
    Rainfall_mm: 300,
    Temperature_C: 25,
    Year: 2026
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Failed to fetch prediction');
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-icon-wrapper">
          <Sprout size={32} />
        </div>
        <div>
          <h1 className="header-title">AI AgriYield Predictor</h1>
          <p className="header-subtitle">Advanced Agronomic Forecasting & Advisory</p>
        </div>
      </header>

      <div className="main-grid">
        <div className="glass-panel">
          <h2 className="panel-title">
            <MapPin size={20} />
            Field Parameters
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="input-group">
                <label className="input-label">State</label>
                <input name="State" value={formData.State} onChange={handleChange} className="input-field" />
              </div>
              <div className="input-group">
                <label className="input-label">Crop</label>
                <input name="Crop" value={formData.Crop} onChange={handleChange} className="input-field" />
              </div>
              <div className="input-group">
                <label className="input-label">Soil Type</label>
                <input name="Soil_Type" value={formData.Soil_Type} onChange={handleChange} className="input-field" />
              </div>
              <div className="input-group">
                <label className="input-label">Fertilizer</label>
                <input name="Fertilizer" value={formData.Fertilizer} onChange={handleChange} className="input-field" />
              </div>
            </div>

            <div className="divider"></div>
            
            <div className="form-grid-3">
              <div className="input-group">
                <label className="input-label"><FlaskConical size={16}/> N (kg/ha)</label>
                <input type="number" name="N" value={formData.N} onChange={handleChange} className="input-field" />
              </div>
              <div className="input-group">
                <label className="input-label"><FlaskConical size={16}/> P (kg/ha)</label>
                <input type="number" name="P" value={formData.P} onChange={handleChange} className="input-field" />
              </div>
              <div className="input-group">
                <label className="input-label"><FlaskConical size={16}/> K (kg/ha)</label>
                <input type="number" name="K" value={formData.K} onChange={handleChange} className="input-field" />
              </div>
            </div>

            <div className="form-grid-3">
              <div className="input-group">
                <label className="input-label" style={{color: '#f59e0b'}}><Beaker size={16}/> Soil pH</label>
                <input type="number" step="0.1" name="Soil_pH" value={formData.Soil_pH} onChange={handleChange} className="input-field" />
              </div>
              <div className="input-group">
                <label className="input-label" style={{color: '#3b82f6'}}><CloudRain size={16}/> Rain (mm)</label>
                <input type="number" name="Rainfall_mm" value={formData.Rainfall_mm} onChange={handleChange} className="input-field" />
              </div>
              <div className="input-group">
                <label className="input-label" style={{color: '#ef4444'}}><ThermometerSun size={16}/> Temp (°C)</label>
                <input type="number" name="Temperature_C" value={formData.Temperature_C} onChange={handleChange} className="input-field" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? <div className="spinner"></div> : <><Zap size={20}/> Generate Forecast & Advisory</>}
            </button>
          </form>
        </div>

        <div>
          {error && <div className="error-msg">{error}</div>}

          {result && (
            <>
              <div className="kpi-card">
                <div>
                  <div className="kpi-title"><Leaf size={16}/> Forecasted Yield</div>
                  <div className="kpi-value-wrapper">
                    <span className="kpi-value">
                      {result.predicted_yield_kg_per_acre.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    </span>
                    <span className="kpi-unit">kg/acre</span>
                  </div>
                </div>
                <div>
                  <span className="kpi-badge">High Confidence</span>
                </div>
              </div>

              <div className="glass-panel markdown-container">
                <ReactMarkdown>{result.advisory_report}</ReactMarkdown>
              </div>
            </>
          )}

          {!result && !loading && !error && (
            <div className="empty-state">
              <Sprout size={64} />
              <h3>Awaiting Farm Data</h3>
              <p>Enter the field parameters and generate the forecast to view the AI agronomic advisory action plan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
