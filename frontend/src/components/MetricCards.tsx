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
  );
};
