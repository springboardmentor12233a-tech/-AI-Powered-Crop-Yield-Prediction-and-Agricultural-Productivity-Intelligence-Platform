import React from 'react';
import { Droplets, Sun, Wind, TestTube, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';

export default function InsightsPanel() {
  const soilParameters = [
    { name: 'Nitrogen (N)', current: '138 kg/ha', optimal: '120-150 kg/ha', status: 'Optimal', color: '#10b981' },
    { name: 'Phosphorus (P)', current: '42 kg/ha', optimal: '40-60 kg/ha', status: 'Optimal', color: '#10b981' },
    { name: 'Potassium (K)', current: '210 kg/ha', optimal: '200-250 kg/ha', status: 'Optimal', color: '#10b981' },
    { name: 'Soil pH', current: '6.8', optimal: '6.5 - 7.2', status: 'Slightly Alkaline', color: '#06b6d4' },
    { name: 'Organic Carbon', current: '0.62%', optimal: '0.50 - 0.75%', status: 'Good', color: '#10b981' }
  ];

  const recommendations = [
    { crop: 'Wheat (PBW 725)', suitability: '96%', yieldEst: '4.85 T/ha', waterReq: 'Medium' },
    { crop: 'Mustard (RH 749)', suitability: '88%', yieldEst: '2.10 T/ha', waterReq: 'Low' },
    { crop: 'Barley (RD 2899)', suitability: '84%', yieldEst: '3.60 T/ha', waterReq: 'Low' }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
      
      {/* Soil Health & N-P-K Analysis */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '10px', background: 'rgba(6, 182, 212, 0.15)', borderRadius: '10px', color: '#06b6d4' }}>
              <TestTube size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#ffffff', fontWeight: 700 }}>Soil Nutrient Profile</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time sensor telemetry & chemical analysis</p>
            </div>
          </div>
          <span className="badge badge-cyan">Updated Today</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {soilParameters.map((item, index) => (
            <div key={index} style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{item.name}</span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: 0 }}>Optimal target: {item.optimal}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>{item.current}</span>
                <span style={{ fontSize: '0.7rem', display: 'block', color: item.color, fontWeight: 600 }}>{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Climate & Crop Suitability Advisory */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '10px', color: '#f59e0b' }}>
              <Sun size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#ffffff', fontWeight: 700 }}>AI Recommended Crops</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Best suited crops for current soil & season</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {recommendations.map((rec, idx) => (
            <div key={idx} style={{ padding: '16px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>{rec.crop}</span>
                  <span className="badge badge-emerald">{rec.suitability} Match</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Est. Yield: <strong style={{ color: '#34d399' }}>{rec.yieldEst}</strong> • Water Need: {rec.waterReq}
                </p>
              </div>
              <ChevronRight size={18} color="var(--text-dim)" />
            </div>
          ))}
        </div>

        {/* Irrigation Alert */}
        <div style={{ marginTop: '20px', padding: '14px', background: 'rgba(6, 182, 212, 0.08)', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.2)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <Droplets size={20} color="#38bdf8" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>Irrigation Schedule Recommendation</span>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: '2px 0 0 0' }}>
              Soil moisture is currently at 68%. Next optimal drip irrigation window is scheduled in 48 hours (approx. 25mm depth).
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
