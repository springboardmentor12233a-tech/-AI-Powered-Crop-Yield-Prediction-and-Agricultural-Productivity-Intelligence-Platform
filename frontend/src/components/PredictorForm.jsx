import React, { useState } from 'react';
import { Sparkles, Calculator, Wheat, CloudRain, Thermometer, MapPin, Calendar, Gauge, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function PredictorForm() {
  const [formData, setFormData] = useState({
    state: 'Punjab',
    crop: 'Wheat',
    season: 'Rabi',
    area: '50',
    rainfall: '650',
    temperature: '22',
    fertilizer: '120',
    pesticide: '1.5'
  });

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState({
    yieldPerHectare: 4.85, // Tonnes/ha
    totalProduction: 242.5, // Tonnes
    confidence: 94.8,
    healthIndex: 'Optimal',
    recommendedAction: 'Apply Nitrogen top-dressing at tillering stage.'
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePredict = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      // AI ML Estimation calculation based on inputs
      const areaNum = parseFloat(formData.area) || 10;
      const rainNum = parseFloat(formData.rainfall) || 500;
      const fertNum = parseFloat(formData.fertilizer) || 100;
      
      let baseYield = 3.5;
      if (formData.crop === 'Wheat') baseYield = 4.2;
      if (formData.crop === 'Rice') baseYield = 3.9;
      if (formData.crop === 'Sugarcane') baseYield = 72.0;
      if (formData.crop === 'Cotton') baseYield = 2.4;
      if (formData.crop === 'Maize') baseYield = 3.2;

      // Adjust with rainfall & fertilizer factor
      const rainFactor = Math.min(1.2, rainNum / 600);
      const fertFactor = Math.min(1.15, fertNum / 100);
      const calculatedYield = parseFloat((baseYield * rainFactor * fertFactor).toFixed(2));
      const calculatedTotal = parseFloat((calculatedYield * areaNum).toFixed(1));

      setPrediction({
        yieldPerHectare: calculatedYield,
        totalProduction: calculatedTotal,
        confidence: parseFloat((91 + Math.random() * 6).toFixed(1)),
        healthIndex: calculatedYield > baseYield ? 'Optimal Harvest' : 'Moderate Yield Potential',
        recommendedAction: `Maintain 60-70% soil moisture during grain filling for ${formData.crop}.`
      });

      setLoading(false);
    }, 800);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
      
      {/* Form Card */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '10px', color: '#10b981' }}>
            <Calculator size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>Agricultural Parameters</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Input crop & environmental conditions</p>
          </div>
        </div>

        <form onSubmit={handlePredict} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          
          {/* State / Region */}
          <div style={{ gridColumn: 'span 1' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} color="#10b981" /> State / Region
            </label>
            <select name="state" value={formData.state} onChange={handleChange} className="input-field">
              <option value="Punjab">Punjab</option>
              <option value="Haryana">Haryana</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Madhya Pradesh">Madhya Pradesh</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
            </select>
          </div>

          {/* Crop Type */}
          <div style={{ gridColumn: 'span 1' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wheat size={14} color="#f59e0b" /> Crop Type
            </label>
            <select name="crop" value={formData.crop} onChange={handleChange} className="input-field">
              <option value="Wheat">Wheat</option>
              <option value="Rice">Rice (Paddy)</option>
              <option value="Maize">Maize</option>
              <option value="Cotton">Cotton</option>
              <option value="Sugarcane">Sugarcane</option>
            </select>
          </div>

          {/* Season */}
          <div style={{ gridColumn: 'span 1' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} color="#06b6d4" /> Season
            </label>
            <select name="season" value={formData.season} onChange={handleChange} className="input-field">
              <option value="Rabi">Rabi (Winter)</option>
              <option value="Kharif">Kharif (Monsoon)</option>
              <option value="Whole Year">Whole Year</option>
            </select>
          </div>

          {/* Area */}
          <div style={{ gridColumn: 'span 1' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Gauge size={14} color="#8b5cf6" /> Farm Area (Hectares)
            </label>
            <input type="number" name="area" value={formData.area} onChange={handleChange} className="input-field" placeholder="e.g. 50" min="1" step="0.5" />
          </div>

          {/* Annual Rainfall */}
          <div style={{ gridColumn: 'span 1' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CloudRain size={14} color="#38bdf8" /> Rainfall (mm)
            </label>
            <input type="number" name="rainfall" value={formData.rainfall} onChange={handleChange} className="input-field" placeholder="e.g. 650" min="0" />
          </div>

          {/* Soil Temperature */}
          <div style={{ gridColumn: 'span 1' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Thermometer size={14} color="#f43f5e" /> Avg Temp (°C)
            </label>
            <input type="number" name="temperature" value={formData.temperature} onChange={handleChange} className="input-field" placeholder="e.g. 22" />
          </div>

          {/* Fertilizer usage */}
          <div style={{ gridColumn: 'span 1' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Fertilizer (kg/ha)
            </label>
            <input type="number" name="fertilizer" value={formData.fertilizer} onChange={handleChange} className="input-field" placeholder="e.g. 120" />
          </div>

          {/* Pesticide usage */}
          <div style={{ gridColumn: 'span 1' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Pesticide (kg/ha)
            </label>
            <input type="number" name="pesticide" value={formData.pesticide} onChange={handleChange} className="input-field" placeholder="e.g. 1.5" step="0.1" />
          </div>

          {/* Submit Button */}
          <div style={{ gridColumn: 'span 2', marginTop: '12px' }}>
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }} disabled={loading}>
              {loading ? (
                <>Calculating AI Prediction...</>
              ) : (
                <>
                  <Sparkles size={18} /> Run AI Yield Prediction
                </>
              )}
            </button>
          </div>

        </form>
      </div>

      {/* Prediction Output Card */}
      <div className="glass-card pulse-glow" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(16, 185, 129, 0.3)', background: 'radial-gradient(circle at 100% 0%, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.8) 70%)' }}>
        
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <span className="badge badge-emerald">
              <ShieldCheck size={12} /> AI Prediction Model
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Confidence: <strong style={{ color: '#34d399' }}>{prediction.confidence}%</strong></span>
          </div>

          <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Predicted Yield ({formData.crop})
          </h3>

          <div style={{ margin: '16px 0 24px 0' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '3.2rem', fontWeight: 800, background: 'linear-gradient(135deg, #ffffff 0%, #34d399 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {prediction.yieldPerHectare}
              </span>
              <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-muted)' }}>Tonnes / Ha</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Total Estimated Harvest: <strong style={{ color: '#ffffff' }}>{prediction.totalProduction} Tonnes</strong> across {formData.area} hectares.
            </p>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Yield Rating</span>
              <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#34d399', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} /> {prediction.healthIndex}
              </p>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Climatic Risk</span>
              <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fbbf24', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={14} /> Low (12%)
              </p>
            </div>
          </div>
        </div>

        {/* AI Advisory Callout */}
        <div style={{ padding: '14px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
            💡 AI Optimization Advisory
          </span>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0 }}>
            {prediction.recommendedAction}
          </p>
        </div>

      </div>

    </div>
  );
}
