import React from 'react';
import { Layers, Droplets, Activity, TrendingUp } from 'lucide-react';

interface MetricCardsProps {
  summary: {
    total_farms: number;
    avg_yield_kg_ha: number;
    avg_rainfall_mm: number;
    avg_ndvi: number;
    total_regions: number;
    crops_supported: string[];
  };
}

export const MetricCards: React.FC<MetricCardsProps> = ({ summary }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="metrics-grid">
        <div className="glass-card metric-card">
          <div className="metric-header">
            <span className="metric-title">Monitored Farms</span>
            <div className="metric-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <Layers size={20} />
            </div>
          </div>
          <div>
            <div className="metric-value">{summary.total_farms.toLocaleString()}</div>
            <div className="metric-subtitle">Across {summary.total_regions} Global Agricultural Regions</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-header">
            <span className="metric-title">Average Crop Yield</span>
            <div className="metric-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div>
            <div className="metric-value">{summary.avg_yield_kg_ha.toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>kg/ha</span></div>
            <div className="metric-subtitle">Across {summary.crops_supported.length} Primary Crop Types</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-header">
            <span className="metric-title">Seasonal Rainfall</span>
            <div className="metric-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>
              <Droplets size={20} />
            </div>
          </div>
          <div>
            <div className="metric-value">{summary.avg_rainfall_mm} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>mm</span></div>
            <div className="metric-subtitle">Precipitation Telemetry Average</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-header">
            <span className="metric-title">Soil Health (NDVI)</span>
            <div className="metric-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc' }}>
              <Activity size={20} />
            </div>
          </div>
          <div>
            <div className="metric-value">{summary.avg_ndvi} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 1.0</span></div>
            <div className="metric-subtitle">Vegetation Health Index Average</div>
          </div>
        </div>
      </div>

      {/* Regional & Crop Yield Benchmark Overview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Regional Yield Performance</span>
            <span className="badge badge-green">Live Telemetry</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { region: 'North India', yield: 4450, share: '88%' },
              { region: 'South India', yield: 4320, share: '85%' },
              { region: 'South USA', yield: 4210, share: '82%' },
              { region: 'Central USA', yield: 4380, share: '86%' },
              { region: 'East Africa', yield: 4190, share: '80%' }
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, color: '#ffffff' }}>
                  <span>{r.region}</span>
                  <span className="num-tabular" style={{ color: '#34d399', fontWeight: 700 }}>{r.yield} kg/ha</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: r.share, height: '100%', background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)', borderRadius: '9999px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Supported Crop Species</span>
              <span className="badge badge-purple">5 Key Crops</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Precision ML models trained via <strong style={{ color: '#ffffff' }}>GridSearchCV</strong> to forecast productivity, soil pH suitability, and weather risk factors.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {summary.crops_supported.map((crop, idx) => (
              <span key={idx} style={{
                background: 'rgba(27, 94, 63, 0.35)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#a7f3d0',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700
              }}>
                🌾 {crop}
              </span>
            ))}
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Want a quick yield prediction?</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399' }}>Go to Yield Predictor →</span>
          </div>
        </div>

      </div>
    </div>
  );
};
