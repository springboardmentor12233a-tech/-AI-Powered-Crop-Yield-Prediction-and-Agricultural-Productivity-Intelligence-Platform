import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, Bug, CloudRain, Thermometer, 
  Wind, CheckCircle2, Zap, AlertCircle, Sparkles, Filter, ChevronRight, Activity 
} from 'lucide-react';

const defaultRiskData = {
  crop: 'Wheat',
  state: 'Punjab',
  season: 'Rabi',
  climate_risk_summary: {
    overall_risk_score: 12.4,
    risk_level: 'Low',
    risk_badge: 'Low Risk',
    risk_color: '#10b981',
    drought_risk_percentage: 18.0,
    heat_stress_percentage: 14.0,
    frost_risk_percentage: 12.0,
    flood_risk_percentage: 8.0
  },
  pest_disease_alerts: [
    {
      id: "PEST-01",
      name: "Yellow Rust (Stripe Rust)",
      scientific_name: "Puccinia striiformis",
      risk_level: "High Risk",
      risk_percentage: 82.5,
      color: "#ef4444",
      trigger: "Favorable relative humidity (68%) & optimal canopy temperature (22°C)",
      symptoms: "Yellow pustules arranged in linear stripes on upper leaf blades",
      prevention: "Spray Propiconazole 25% EC @ 1 ml/L or Tebuconazole @ 1.5 ml/L."
    },
    {
      id: "PEST-02",
      name: "Wheat Aphids",
      scientific_name: "Macrosiphum miscanthi",
      risk_level: "Medium Risk",
      risk_percentage: 48.0,
      color: "#f59e0b",
      trigger: "Cloudy weather conditions during earhead emergence phase",
      symptoms: "Nymphs and adult aphids suck sap from tender earheads & flag leaves",
      prevention: "Spray Imidacloprid 17.8 SL @ 0.5 ml/L or Thiamethoxam 25 WG @ 0.2 g/L."
    }
  ],
  mitigation_strategy: "Favorable growth window identified. Perform routine weekly field scouting during grain filling stage."
};

const simulatedProfiles = {
  normal: {
    title: "Scenario 1: Optimal Growth (Punjab Rabi)",
    crop: "Wheat",
    state: "Punjab",
    temp: 22,
    rain: 650,
    hum: 65,
    summary: {
      overall_risk_score: 12.4,
      risk_level: "Low",
      risk_color: "#10b981",
      drought_risk_percentage: 18.0,
      heat_stress_percentage: 14.0,
      frost_risk_percentage: 12.0,
      flood_risk_percentage: 8.0
    }
  },
  drought_heat: {
    title: "Scenario 2: Drought & Heat Stress Alert (Maharashtra Kharif)",
    crop: "Cotton",
    state: "Maharashtra",
    temp: 36,
    rain: 320,
    hum: 42,
    summary: {
      overall_risk_score: 82.5,
      risk_level: "High",
      risk_color: "#ef4444",
      drought_risk_percentage: 86.0,
      heat_stress_percentage: 78.5,
      frost_risk_percentage: 5.0,
      flood_risk_percentage: 4.0
    }
  },
  disease_wet: {
    title: "Scenario 3: High Humidity Pathogen Alert (West Bengal Paddy)",
    crop: "Rice",
    state: "West Bengal",
    temp: 28,
    rain: 890,
    hum: 88,
    summary: {
      overall_risk_score: 64.0,
      risk_level: "Medium High",
      risk_color: "#f59e0b",
      drought_risk_percentage: 8.0,
      heat_stress_percentage: 38.0,
      frost_risk_percentage: 0.0,
      flood_risk_percentage: 72.0
    }
  }
};

export default function RiskAssessmentPanel({
  crop = 'Wheat',
  state = 'Punjab',
  season = 'Rabi',
  rainfall = 650,
  temperature = 22
}) {
  const [riskData, setRiskData] = useState(defaultRiskData);
  const [scenario, setScenario] = useState('normal');
  const [loading, setLoading] = useState(false);

  // Fetch live risk API from FastAPI backend
  useEffect(() => {
    const fetchRiskAssessment = async () => {
      setLoading(true);
      try {
        const ports = [8000, 8001];
        let success = false;

        for (const port of ports) {
          try {
            const res = await fetch(`http://127.0.0.1:${port}/api/risk/evaluate?crop=${crop}&state=${state}&season=${season}&temperature=${temperature}&rainfall=${rainfall}&humidity=68`);
            if (res.ok) {
              const data = await res.json();
              if (data.climate_risk_summary) {
                setRiskData(data);
                success = true;
                break;
              }
            }
          } catch (e) {
            // try next
          }
        }

        if (!success) {
          // Calculate client side fallback if API disconnected
          const demand = crop === 'Rice' ? 1250 : crop === 'Cotton' ? 800 : 550;
          const deficit = Math.max(0, demand - rainfall);
          const droughtPct = Math.min(95, Math.round((deficit / demand) * 100));
          const heatPct = temperature > 34 ? 80 : 15;
          const overall = Math.round((droughtPct * 0.4) + (heatPct * 0.3) + 12);
          
          let level = 'Low';
          let color = '#10b981';
          if (overall >= 60) { level = 'High'; color = '#ef4444'; }
          else if (overall >= 30) { level = 'Medium'; color = '#f59e0b'; }

          setRiskData(prev => ({
            ...prev,
            crop,
            state,
            climate_risk_summary: {
              overall_risk_score: overall,
              risk_level: level,
              risk_badge: `${level} Risk`,
              risk_color: color,
              drought_risk_percentage: droughtPct,
              heat_stress_percentage: heatPct,
              frost_risk_percentage: 12,
              flood_risk_percentage: rainfall > 800 ? 75 : 8
            }
          }));
        }
      } catch (err) {
        console.warn('Risk assessment API fallback active.', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRiskAssessment();
  }, [crop, state, season, rainfall, temperature]);

  const summary = riskData.climate_risk_summary || defaultRiskData.climate_risk_summary;

  return (
    <div className="glass-card" style={{ padding: '28px', border: `1px solid ${summary.risk_color}55`, background: 'radial-gradient(circle at 100% 0%, rgba(239, 68, 68, 0.08) 0%, rgba(15, 23, 42, 0.9) 70%)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-gold"><ShieldAlert size={12} /> Agro-Climatic Intelligence</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-Time Diagnostics</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert color={summary.risk_color} size={24} /> Climate Risk Assessment & Pest Early Warning
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Quantifying environmental risk scores (%) and pathogen vulnerability alerts for <strong>{crop}</strong> in <strong>{state}</strong>
          </p>
        </div>

        {/* Overall Risk Score Badge Box */}
        <div style={{ padding: '12px 20px', borderRadius: '14px', background: `${summary.risk_color}15`, border: `1px solid ${summary.risk_color}44`, display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase' }}>Composite Risk Score</span>
            <strong style={{ fontSize: '1.8rem', fontWeight: 800, color: summary.risk_color }}>{summary.overall_risk_score}%</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span 
              className="badge" 
              style={{ 
                background: summary.risk_color, 
                color: '#ffffff', 
                fontWeight: 700, 
                fontSize: '0.8rem',
                padding: '6px 14px',
                boxShadow: `0 0 15px ${summary.risk_color}66`
              }}
            >
              {summary.risk_level === 'Low' ? '🟢 Low Risk' : summary.risk_level === 'Medium' ? '🟡 Medium Risk' : '🔴 High Risk'} ({summary.overall_risk_score}%)
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Climate Sub-Risk Gauges & Pest Warning Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* SUB-SECTION 1: CLIMATE RISK BREAKDOWN BARS */}
        <div style={{ background: 'rgba(15, 23, 42, 0.75)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#06b6d4" /> Environmental Risk Breakdown (%)
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Drought Risk Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Drought Vulnerability</span>
                <strong style={{ color: summary.drought_risk_percentage > 50 ? '#ef4444' : summary.drought_risk_percentage > 25 ? '#f59e0b' : '#34d399' }}>
                  {summary.drought_risk_percentage}% {summary.drought_risk_percentage > 50 ? '(High)' : summary.drought_risk_percentage > 25 ? '(Medium)' : '(Low)'}
                </strong>
              </div>
              <div style={{ height: '8px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${summary.drought_risk_percentage}%`, height: '100%', background: summary.drought_risk_percentage > 50 ? '#ef4444' : summary.drought_risk_percentage > 25 ? '#f59e0b' : '#10b981', transition: 'width 0.5s ease' }}></div>
              </div>
            </div>

            {/* Heat Stress Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Thermal Heat Stress Index</span>
                <strong style={{ color: summary.heat_stress_percentage > 50 ? '#ef4444' : summary.heat_stress_percentage > 25 ? '#f59e0b' : '#34d399' }}>
                  {summary.heat_stress_percentage}% {summary.heat_stress_percentage > 50 ? '(High)' : summary.heat_stress_percentage > 25 ? '(Medium)' : '(Low)'}
                </strong>
              </div>
              <div style={{ height: '8px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${summary.heat_stress_percentage}%`, height: '100%', background: summary.heat_stress_percentage > 50 ? '#ef4444' : summary.heat_stress_percentage > 25 ? '#f59e0b' : '#10b981', transition: 'width 0.5s ease' }}></div>
              </div>
            </div>

            {/* Frost Risk Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Frost & Cold Snap Risk</span>
                <strong style={{ color: summary.frost_risk_percentage > 50 ? '#ef4444' : summary.frost_risk_percentage > 25 ? '#f59e0b' : '#34d399' }}>
                  {summary.frost_risk_percentage}% {summary.frost_risk_percentage > 50 ? '(High)' : summary.frost_risk_percentage > 25 ? '(Medium)' : '(Low)'}
                </strong>
              </div>
              <div style={{ height: '8px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${summary.frost_risk_percentage}%`, height: '100%', background: summary.frost_risk_percentage > 50 ? '#ef4444' : summary.frost_risk_percentage > 25 ? '#f59e0b' : '#10b981', transition: 'width 0.5s ease' }}></div>
              </div>
            </div>

            {/* Flood Risk Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Waterlogging & Flood Risk</span>
                <strong style={{ color: summary.flood_risk_percentage > 50 ? '#ef4444' : summary.flood_risk_percentage > 25 ? '#f59e0b' : '#34d399' }}>
                  {summary.flood_risk_percentage}% {summary.flood_risk_percentage > 50 ? '(High)' : summary.flood_risk_percentage > 25 ? '(Medium)' : '(Low)'}
                </strong>
              </div>
              <div style={{ height: '8px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${summary.flood_risk_percentage}%`, height: '100%', background: summary.flood_risk_percentage > 50 ? '#ef4444' : summary.flood_risk_percentage > 25 ? '#f59e0b' : '#10b981', transition: 'width 0.5s ease' }}></div>
              </div>
            </div>

          </div>
        </div>

        {/* SUB-SECTION 2: PEST & DISEASE WARNING ALERTS */}
        <div style={{ background: 'rgba(15, 23, 42, 0.75)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bug size={18} color="#f43f5e" /> Active Pest & Disease Warning Alerts
            </h3>
            <span className="badge badge-gold">{riskData.pest_disease_alerts?.length || 2} Alerts Active</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(riskData.pest_disease_alerts || defaultRiskData.pest_disease_alerts).map((alert) => (
              <div key={alert.id} style={{ padding: '14px', borderRadius: '10px', background: `${alert.color}0d`, border: `1px solid ${alert.color}33` }}>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: '#ffffff' }}>{alert.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic', display: 'block' }}>{alert.scientific_name}</span>
                  </div>
                  <span className="badge" style={{ background: alert.color, color: '#ffffff', fontSize: '0.72rem', fontWeight: 700 }}>
                    {alert.risk_level} ({alert.risk_percentage}%)
                  </span>
                </div>

                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0' }}>
                  ⚡ <strong>Weather Trigger:</strong> {alert.trigger}
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 6px 0' }}>
                  🔬 <strong>Symptoms:</strong> {alert.symptoms}
                </p>

                <div style={{ padding: '8px 10px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399' }}>🛡️ Chemical / Bio Prevention:</span>
                  <p style={{ fontSize: '0.78rem', color: '#ffffff', margin: '2px 0 0 0' }}>
                    {alert.prevention}
                  </p>
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Mitigation Callout Footer */}
      <div style={{ padding: '14px 18px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <CheckCircle2 size={20} color="#34d399" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0 }}>
          <strong>Agro-Mitigation Advisory:</strong> {riskData.mitigation_strategy || defaultRiskData.mitigation_strategy}
        </p>
      </div>

    </div>
  );
}
