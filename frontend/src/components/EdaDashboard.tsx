import React from 'react';
import { BarChart2, CheckCircle } from 'lucide-react';

interface EdaDashboardProps {
  metrics: {
    total_records?: number;
    overall_stats?: Record<string, { mean: number; min: number; max: number; std: number }>;
    crop_breakdown?: Record<string, { count: number; avg_yield: number }>;
    top_crop_by_yield?: string;
  };
}

export const EdaDashboard: React.FC<EdaDashboardProps> = ({ metrics }) => {
  const plotsList = [
    { title: "Crop Yield Distribution", file: "yield_distribution.png", desc: "KDE & Frequency histogram showing yield spread across farms" },
    { title: "Yield Comparison by Crop", file: "yield_by_crop.png", desc: "Boxplot breakdown comparing Wheat, Rice, Maize, Soybean & Cotton productivity" },
    { title: "Seasonal Rainfall vs. Yield", file: "rainfall_vs_yield.png", desc: "Scatter plot with linear regression trend analysis" },
    { title: "Soil pH Impact", file: "soil_pH_vs_yield.png", desc: "Evaluating soil acidity/alkalinity thresholds on output" },
    { title: "Multi-Feature Correlation Matrix", file: "correlation_heatmap.png", desc: "Pairwise feature correlation heatmaps" }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Statistical Summary Banner */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <BarChart2 size={24} color="#10b981" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Exploratory Data Analysis (EDA) Insights</h2>
        </div>

        {metrics.crop_breakdown && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {Object.entries(metrics.crop_breakdown).map(([crop, data]) => (
              <div key={crop} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{crop}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399', margin: '0.25rem 0' }}>
                  {data.avg_yield.toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>kg/ha</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{data.count} farms analyzed</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generated EDA Plots Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        {plotsList.map((p, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '1.25rem', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#60a5fa' }}>{p.title}</h3>
              <span className="badge badge-green" style={{ display: 'flex', gap: '0.3rem' }}>
                <CheckCircle size={12} /> Generated
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{p.desc}</p>
            
            <div style={{
              background: '#0d1117',
              borderRadius: '10px',
              padding: '0.5rem',
              border: '1px solid var(--border-color)',
              minHeight: '220px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img
                src={`http://localhost:8000/eda_plots/${p.file}`}
                alt={p.title}
                style={{ width: '100%', height: 'auto', borderRadius: '6px' }}
                onError={(e) => {
                  // Fallback if backend server not running
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
