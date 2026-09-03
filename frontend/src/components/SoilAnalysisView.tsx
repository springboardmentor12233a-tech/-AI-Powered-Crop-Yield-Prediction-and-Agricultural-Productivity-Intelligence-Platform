import React, { useState, useEffect } from 'react';
import { Layers, TestTube, Droplets, CheckCircle, Info, Sparkles } from 'lucide-react';

interface SoilProps {
  apiBaseUrl?: string;
}

export const SoilAnalysisView: React.FC<SoilProps> = ({ apiBaseUrl = 'http://localhost:8000' }) => {
  const [selectedCrop, setSelectedCrop] = useState('Wheat');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSoil(selectedCrop);
  }, [selectedCrop]);

  const fetchSoil = async (crop: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/soil/assessment?crop_type=${encodeURIComponent(crop)}`);
      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.detail || 'Failed to fetch soil assessment');
      }
      const json = await response.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Error fetching soil data.');
    } finally {
      setLoading(false);
    }
  };

  const metrics = data?.soil_metrics;

  return (
    <div className="section-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(192,132,252,0.08) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <Layers className="gradient-text-green" size={28} />
              <h2 style={{ fontSize: '1.4rem', color: '#ffffff', margin: 0, fontWeight: 700 }}>
                Crop-Aware Soil Health & Fertility Assessment
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
              Evaluates soil pH suitability, moisture sufficiency, NDVI index, and Soil Health Index tailored per crop species.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <Info size={16} color="#34d399" />
            <span style={{ fontSize: '0.78rem', color: '#a7f3d0', fontWeight: 600 }}>
              {data?.status_claim || 'Dataset-based Crop-Aware Soil Analytics'}
            </span>
          </div>
        </div>
      </div>

      {/* Crop Type Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Select Crop Species:</label>
        <select
          value={selectedCrop}
          onChange={(e) => setSelectedCrop(e.target.value)}
          className="search-input"
          style={{ width: '220px' }}
        >
          <option value="Wheat">Wheat</option>
          <option value="Rice">Rice</option>
          <option value="Maize">Maize</option>
          <option value="Soybean">Soybean</option>
          <option value="Cotton">Cotton</option>
        </select>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', padding: '1rem', borderRadius: '8px', color: '#fca5a5' }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
          Loading soil assessment...
        </div>
      )}

      {metrics && !loading && (
        <>
          {/* Main Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            
            <div className="glass-card" style={{ padding: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Soil Health Index</span>
                <Sparkles size={20} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', margin: '0.4rem 0' }}>
                {metrics.soil_health_index} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ 1.0</span>
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#34d399' }}>
                {metrics.fertility_assessment}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#60a5fa' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Soil pH Suitability</span>
                <TestTube size={20} />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', margin: '0.4rem 0' }}>
                {metrics.average_soil_pH} <span style={{ fontSize: '0.85rem', color: '#93c5fd' }}>pH</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Target Range for {data.crop_type}: {metrics.optimal_pH_range}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#38bdf8' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Moisture Sufficiency</span>
                <Droplets size={20} />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', margin: '0.4rem 0' }}>
                {metrics.moisture_sufficiency_percent} %
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Avg Moisture: {metrics.average_soil_moisture_percent} %
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c084fc' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Vegetation (NDVI)</span>
                <Layers size={20} />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', margin: '0.4rem 0' }}>
                {metrics.average_NDVI_index}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Canopy Density Rating
              </div>
            </div>

          </div>

          {/* Actionable Advice & Note */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={18} color="#34d399" />
              Actionable Soil Management Recommendation
            </h3>
            <p style={{ color: '#d1d5db', fontSize: '0.9rem', margin: 0, lineHeight: 1.5, background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              {metrics.pH_recommendation}
            </p>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.2rem' }}>
              * {data.general_reference_note}
            </div>
          </div>
        </>
      )}

    </div>
  );
};
