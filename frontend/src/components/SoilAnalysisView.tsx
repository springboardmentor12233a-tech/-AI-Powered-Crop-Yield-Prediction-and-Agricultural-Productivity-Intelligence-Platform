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
    <div className="section-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '1.5rem 1.75rem', background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(192,132,252,0.08) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
              <Layers className="gradient-text-green" size={28} />
              <h2 style={{ fontSize: '1.4rem', color: '#ffffff', margin: 0, fontWeight: 800 }}>
                Crop-Aware Soil Health & Fertility Assessment
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
              Evaluates soil pH suitability, moisture sufficiency, NDVI index, and Soil Health Index tailored per crop species.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <Info size={16} color="#34d399" />
            <span style={{ fontSize: '0.8rem', color: '#a7f3d0', fontWeight: 600 }}>
              {data?.status_claim || 'Dataset-based Crop-Aware Soil Analytics'}
            </span>
          </div>
        </div>
      </div>

      {/* Crop Type Selector Bar */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <label style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 700 }}>Select Crop Species:</label>
        <select
          value={selectedCrop}
          onChange={(e) => setSelectedCrop(e.target.value)}
          style={{
            background: '#0c1610',
            color: '#ffffff',
            border: '1px solid var(--border-color)',
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 600,
            minWidth: '240px',
            outline: 'none'
          }}
        >
          <option value="Wheat" style={{ background: '#0c1610', color: '#ffffff' }}>Wheat</option>
          <option value="Rice" style={{ background: '#0c1610', color: '#ffffff' }}>Rice</option>
          <option value="Maize" style={{ background: '#0c1610', color: '#ffffff' }}>Maize</option>
          <option value="Soybean" style={{ background: '#0c1610', color: '#ffffff' }}>Soybean</option>
          <option value="Cotton" style={{ background: '#0c1610', color: '#ffffff' }}>Cotton</option>
        </select>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Showing soil telemetry metrics for <strong style={{ color: '#34d399' }}>{selectedCrop}</strong>
        </span>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', padding: '1rem', borderRadius: '8px', color: '#fca5a5' }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
          Loading crop-aware soil health assessment...
        </div>
      )}

      {metrics && !loading && (
        <>
          {/* Main Metric Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#34d399' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Soil Health Index</span>
                <Sparkles size={22} />
              </div>
              <div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#ffffff', margin: '0.4rem 0', letterSpacing: '-0.02em' }}>
                  {metrics.soil_health_index} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ 1.0</span>
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399' }}>
                  {metrics.fertility_assessment}
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#60a5fa' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Soil pH Suitability</span>
                <TestTube size={22} />
              </div>
              <div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#ffffff', margin: '0.4rem 0', letterSpacing: '-0.02em' }}>
                  {metrics.average_soil_pH} <span style={{ fontSize: '1rem', color: '#93c5fd', fontWeight: 500 }}>pH</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Optimal Range for {data.crop_type}: <strong style={{ color: '#ffffff' }}>{metrics.optimal_pH_range}</strong>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid #38bdf8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#38bdf8' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Moisture Sufficiency</span>
                <Droplets size={22} />
              </div>
              <div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#ffffff', margin: '0.4rem 0', letterSpacing: '-0.02em' }}>
                  {metrics.moisture_sufficiency_percent} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>%</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Avg Soil Moisture: <strong style={{ color: '#7dd3fc' }}>{metrics.average_soil_moisture_percent} %</strong>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid #c084fc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#c084fc' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vegetation Vigor (NDVI)</span>
                <Layers size={22} />
              </div>
              <div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#ffffff', margin: '0.4rem 0', letterSpacing: '-0.02em' }}>
                  {metrics.average_NDVI_index}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Canopy Density Rating Index
                </div>
              </div>
            </div>

          </div>

          {/* Crop Soil pH & Nutrient Suitability Visualizer Card */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Crop Soil pH & Health Spectrum</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Comparing optimal soil pH boundaries for {selectedCrop} against current dataset averages</span>
              </div>
              <span className="badge badge-green">Optimal pH: {metrics.optimal_pH_range}</span>
            </div>

            <div style={{ background: '#0a130d', borderRadius: '10px', padding: '1.25rem', border: '1px solid var(--border-color)', height: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                  <span>Current Soil pH Benchmark ({metrics.average_soil_pH} pH)</span>
                  <span style={{ color: '#34d399' }}>{metrics.fertility_assessment}</span>
                </div>
                
                {/* pH Spectrum Bar */}
                <div style={{ position: 'relative', width: '100%', height: '24px', background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 30%, #10b981 50%, #3b82f6 80%, #8b5cf6 100%)', borderRadius: '8px', overflow: 'hidden' }}>
                  {/* Optimal Zone Highlight Bracket */}
                  <div style={{ position: 'absolute', left: '45%', width: '30%', height: '100%', border: '2px solid #ffffff', background: 'rgba(255,255,255,0.2)', boxShadow: '0 0 10px rgba(255,255,255,0.5)' }}></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>pH 4.5 (Strongly Acidic)</span>
                  <span>pH 6.0</span>
                  <span style={{ color: '#ffffff', fontWeight: 700 }}>pH 7.0 (Neutral)</span>
                  <span>pH 7.5</span>
                  <span>pH 9.0 (Alkaline)</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: '6px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Soil Moisture</span>
                  <strong style={{ fontSize: '0.9rem', color: '#7dd3fc' }}>{metrics.average_soil_moisture_percent}%</strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: '6px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Soil Health Index</span>
                  <strong style={{ fontSize: '0.9rem', color: '#34d399' }}>{metrics.soil_health_index} / 1.0</strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: '6px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>NDVI Vigor</span>
                  <strong style={{ fontSize: '0.9rem', color: '#c084fc' }}>{metrics.average_NDVI_index}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Actionable pH & Soil Recommendation Banner */}
          <div className="glass-card" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(59,130,246,0.06) 100%)' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#ffffff', margin: '0 0 0.75rem 0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={18} color="#34d399" />
              Agronomic Soil Management Guidance for {selectedCrop}
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#e2e8f0', margin: '0 0 0.5rem 0', lineHeight: 1.6 }}>
              {metrics.pH_recommendation}
            </p>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              * Evaluated against crop-specific agronomic pH boundaries from dataset records ({metrics.record_count} total samples analyzed).
            </div>
          </div>
        </>
      )}

    </div>
  );
};
