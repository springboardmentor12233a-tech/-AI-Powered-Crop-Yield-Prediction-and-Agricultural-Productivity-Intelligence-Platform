import React, { useState } from 'react';
import {
  Brain,
  Bolt,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Droplet,
  ShieldAlert,
  TrendingUp,
  FileSpreadsheet,
  Layers,
  Thermometer,
  Activity,
  History,
  Check,
  ChevronRight,
  Sliders,
  DollarSign
} from 'lucide-react';

export const RecommendationsView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortOption, setSortOption] = useState('Highest Impact First');
  const [pivotDispatched, setPivotDispatched] = useState(false);
  const [workOrderGenerated, setWorkOrderGenerated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleDispatchPivot = () => {
    setPivotDispatched(true);
    setTimeout(() => {
      setPivotDispatched(false);
    }, 4000);
  };

  const handleWorkOrder = () => {
    setWorkOrderGenerated(true);
    setTimeout(() => {
      setWorkOrderGenerated(false);
    }, 4000);
  };

  const handleRunInference = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%' }}>
      {/* Top Header & Command Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
              <Brain size={16} />
              <span>Prescriptive Agronomy Engine · Module 7 LLM Real-time Inference</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
              AI Mitigation Directives
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.35rem', maxWidth: '750px' }}>
              Automated multi-spectral & sensor-derived prescriptive actions. Prioritize intervention windows to insulate yield margins against diurnal extremes and pathogen outbreaks.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', padding: '0.5rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <Sliders size={15} color="var(--text-muted)" />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sort by:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', fontWeight: 700, fontSize: '0.82rem', padding: 0 }}
              >
                <option value="Highest Impact First">Highest Impact First</option>
                <option value="Urgency / Time Window">Urgency / Time Window</option>
                <option value="Hectares at Risk">Hectares at Risk</option>
                <option value="Input Capital Demand">Input Capital Demand</option>
              </select>
            </div>

            <button
              onClick={handleRunInference}
              disabled={isRefreshing}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Bolt size={16} className={isRefreshing ? 'spin' : ''} />
              <span>{isRefreshing ? 'Running Inference...' : 'Run Fresh Inference'}</span>
            </button>
          </div>
        </div>

        {/* Top Metric KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {/* Card 1: Active Directives */}
          <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Active Directives</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                <Sparkles size={18} />
              </div>
            </div>
            <div style={{ margin: '0.85rem 0', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span className="num-tabular" style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff' }}>14</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>pending sign-off</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
              <span>9 parcels covered · Across Iowa East</span>
            </div>
          </div>

          {/* Card 2: Urgent Escalation */}
          <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid #ef4444' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fca5a5' }}>Urgent Intervention Required</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                <ShieldAlert size={18} />
              </div>
            </div>
            <div style={{ margin: '0.85rem 0', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span className="num-tabular" style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ef4444' }}>3</span>
              <span style={{ fontSize: '0.82rem', color: '#fca5a5', fontWeight: 700 }}>Immediate Actions (&lt;48h)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <AlertTriangle size={14} color="#ef4444" />
              <span>Risk of permanent grain pollination deficit</span>
            </div>
          </div>

          {/* Card 3: Protected Yield Harvest */}
          <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fbbf24' }}>Protected Yield Harvest</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                <DollarSign size={18} />
              </div>
            </div>
            <div style={{ margin: '0.85rem 0', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span className="num-tabular" style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff' }}>+1.85</span>
              <span style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 700 }}>t/Ha potential</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
              <span style={{ color: '#fbbf24', fontWeight: 700 }}>$142,000 preserved valuation</span>
              <span style={{ color: 'var(--text-dim)' }}>Model confidence: 94.2%</span>
            </div>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {[
            { id: 'All', label: 'All Recommendations (14)' },
            { id: 'Sowing', label: 'Crop Planning & Sowing (2)' },
            { id: 'Fertility', label: 'Fertility & Nutrients (4)' },
            { id: 'Irrigation', label: 'Irrigation & Moisture (3)' },
            { id: 'Disease', label: 'Disease & Pest Risk (3)' },
            { id: 'Optimization', label: 'Resource Optimization (2)' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                border: activeCategory === cat.id ? '1px solid #10b981' : '1px solid var(--border-color)',
                background: activeCategory === cat.id ? 'linear-gradient(135deg, #10b981 0%, #1b5e3f 100%)' : 'rgba(255,255,255,0.03)',
                color: activeCategory === cat.id ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.2s ease'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Bento Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.75rem', alignItems: 'start' }}>
        {/* Left Column: Action Stream (8 Cols) */}
        <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* CARD 1: Critical Variable-Rate Irrigation */}
          <div className="glass-card" style={{ padding: '0', overflow: 'hidden', position: 'relative' }}>
            <div style={{ height: '5px', width: '100%', background: '#ef4444' }}></div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge badge-red" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }}></span>
                    CRITICAL ACTION REQUIRED
                  </span>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                    Sector B4 · Center Pivot Alpha
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={13} /> Expires in 36h
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button title="View parcel history" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                    <History size={16} />
                  </button>
                </div>
              </div>

              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Urgent: Variable-Rate Irrigation Dispatch — Sector B4 Corn
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-amber" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <TrendingUp size={13} />
                    +0.92 t/Ha Yield Salvage • 380 Hectares affected
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Thermometer size={14} />
                    Heat Threshold Warning
                  </span>
                </div>
              </div>

              {/* Visual Telemetry Box */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', padding: '1rem', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
                    <Droplet size={22} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                      Inference Telemetry Baseline
                    </span>
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', margin: '0.2rem 0 0 0' }}>
                      Triggered by: 48h Root Zone Moisture Deficit (28% VWC) & Approaching 34°C Diurnal Peak
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                      Target root threshold: 38% VWC | Probe depth: 45cm & 90cm
                    </p>
                  </div>
                </div>

                {/* VWC Sparkline */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '140px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span>VWC Trend</span>
                    <span style={{ color: '#ef4444', fontWeight: 800 }}>-11.4%</span>
                  </div>
                  <svg width="140" height="32" viewBox="0 0 140 32" fill="none">
                    <path d="M0 6 C 20 8, 35 11, 50 15 C 75 20, 95 23, 115 28 L 140 31" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M0 6 C 20 8, 35 11, 50 15 C 75 20, 95 23, 115 28 L 140 31 L 140 32 L 0 32 Z" fill="#ef4444" fillOpacity="0.15" />
                    <circle cx="140" cy="31" r="3" fill="#ef4444" />
                  </svg>
                </div>
              </div>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Phenological stage R1 (silking/pollination) is acutely vulnerable to heat-induced pollen desiccation. Dispatching a calculated 25mm pivot cycle within 36 hours prevents irreversible ovule abortion and guards kernel count across all sandy-loam gradients.
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleDispatchPivot}
                    className="btn-primary"
                    style={{ background: pivotDispatched ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : undefined }}
                  >
                    {pivotDispatched ? <CheckCircle2 size={16} /> : <Bolt size={16} />}
                    <span>{pivotDispatched ? 'Cycle Dispatched · 25mm Scheduled' : 'Dispatch Pivot Command to Field Router'}</span>
                  </button>
                  <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#ffffff', padding: '0.55rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                    Recalculate Water Budget
                  </button>
                </div>
                <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={14} /> Snooze 12h
                </button>
              </div>
            </div>
          </div>

          {/* CARD 2: Optimal Spray Window - Disease Risk */}
          <div className="glass-card" style={{ padding: '0', overflow: 'hidden', position: 'relative' }}>
            <div style={{ height: '5px', width: '100%', background: '#f59e0b' }}></div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge badge-amber" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }}></span>
                    HIGH PATHOGEN RISK
                  </span>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                    Fields A1 & A3 · 520 Ha Total
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Friday Dawn Window</span>
                </div>
                <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontSize: '0.72rem' }}>Spore Index: 78/100</span>
              </div>

              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Optimal Spray Window: Preventive Fungicide Application for Northern Corn Leaf Blight
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <ShieldAlert size={13} />
                    Prevent up to 14% Foliar Necrosis • Field A1 & A3
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Target agent: Pyraclostrobin + Fluxapyroxad</span>
                </div>
              </div>

              {/* Spray Window Timeline Bar */}
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '0.85rem 1rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  <span>Spray Window Viability Index</span>
                  <span style={{ color: '#34d399' }}>Friday 05:30 – 09:30 AM (4h Duration)</span>
                </div>
                <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '9999px', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: '20%', background: '#374151' }} title="Unfavorable (dew/inversion)"></div>
                  <div style={{ width: '35%', background: '#10b981' }} title="Optimal Application Window (Green)"></div>
                  <div style={{ width: '25%', background: '#f59e0b' }} title="Marginal (wind rise)"></div>
                  <div style={{ width: '20%', background: '#374151' }} title="Unfavorable (thermal drift)"></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>04:00 (Thermal Inversion Risk)</span>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>Wind 4.8 km/h · Zero Inversion</span>
                  <span>11:00 (Gusts &gt;16 km/h)</span>
                </div>
              </div>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Microclimate sensor mesh indicates spore germination index reached the 78/100 threshold following continuous leaf wetness &gt; 11 hours. Ideal application window: Friday 05:30 – 09:30 AM to maximize systemic absorption prior to expected Friday night rain front.
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleWorkOrder}
                    style={{
                      background: workOrderGenerated ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #c9922e 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.55rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem'
                    }}
                  >
                    <FileSpreadsheet size={16} />
                    <span>{workOrderGenerated ? 'Work Order Generated #WO-8841' : 'Generate Chemical Work Order'}</span>
                  </button>
                  <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#ffffff', padding: '0.55rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                    View Tank-Mix Calculator
                  </button>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <CheckCircle2 size={15} /> Mark In-Progress
                </span>
              </div>
            </div>
          </div>

          {/* CARD 3: Medium Priority - Fertility & Nutrients */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid #3b82f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-blue">MEDIUM PRIORITY · FERTILITY</span>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                  Zone 2 · Soft Red Winter Wheat
                </span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Sentinel-2 Sync: 6h ago</span>
            </div>

            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Mid-Season Nitrogen Top-Dress Adjustment — Zone 2 Soft Wheat
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem' }}>
                <span className="badge badge-green">Protein Boost +0.8% • Economic Return +$34/Ha</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>NDVI Deficit: 0.12 vs 5-yr norm</span>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '0.85rem 1rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <Activity size={20} color="#3b82f6" style={{ marginTop: '2px' }} />
              <div>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>NDVI Curve Deviation Trigger</span>
                <p style={{ fontSize: '0.85rem', color: '#ffffff', margin: '0.2rem 0 0 0' }}>
                  Soil mineralization slowed due to early dry spell. Split application of 40 kg N/ha via UAN-28 stream bars will capture remaining late-tillering capacity.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn-primary" style={{ fontSize: '0.82rem', padding: '0.5rem 0.85rem' }}>
                  Download Shapefile Prescription
                </button>
                <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#ffffff', padding: '0.5rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600 }}>
                  Adjust Fertilizer Order
                </button>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Compatible with John Deere GS4 / Raven Viper</span>
            </div>
          </div>

          {/* CARD 4: Optimization - Cover Crop Planning */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-purple">RESOURCE OPTIMIZATION · STRATEGIC</span>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                  Post-Harvest Allocation · 890 Ha
                </span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>2025 Rotational Cycle</span>
            </div>

            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Cover Crop Planning: Post-Harvest Rye & Crimson Clover Allocation
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem' }}>
                <span className="badge badge-purple">Soil Health +12% • Nitrogen Scavenging 45 kg N/Ha</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Headland Compaction Remediation</span>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              High soil compaction telemetry identified in headlands following heavy harvest traffic. Deep taproot brassica and fibrous rye mixture will fracture subsoil hardpan and reduce spring runoff risk before 2025 soybean planting.
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn-primary" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', fontSize: '0.82rem', padding: '0.5rem 0.85rem' }}>
                  Add to 2025 Crop Plan
                </button>
                <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#ffffff', padding: '0.5rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600 }}>
                  Simulate SOM Trajectory
                </button>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated seed cost: $22.50/Ha</span>
            </div>
          </div>

        </div>

        {/* Right Column: Agronomic Context, Phenology & Live Telemetry Bento (4 Cols) */}
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Phenology Stage Progress Ribbon Component */}
          <div className="glass-card" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Brain size={18} color="#10b981" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Phenology Stage Ribbon</h3>
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Corn Field B4</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              Current biological vulnerability zone requires precision timing for moisture & tassel protection.
            </p>

            {/* Phenology Ribbon Visual Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
              {/* Step 1: VE-V6 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#10b981', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>
                  <Check size={14} />
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff' }}>VE – V6 (Vegetative)</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>May 28</span>
                </div>
              </div>
              <div style={{ width: '2px', height: '14px', background: '#10b981', marginLeft: '11px' }}></div>

              {/* Step 2: V12-VT */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#10b981', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>
                  <Check size={14} />
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff' }}>V12 – VT (Tasseling)</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>June 19</span>
                </div>
              </div>
              <div style={{ width: '2px', height: '14px', background: '#f59e0b', marginLeft: '11px' }}></div>

              {/* Step 3: R1 ACTIVE NOW */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(245, 158, 11, 0.12)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f59e0b', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>
                  R1
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff' }}>R1 (Silking / Pollination)</span>
                    <span style={{ background: '#f59e0b', color: '#000000', fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '4px' }}>ACTIVE</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 600 }}>Peak heat stress window</span>
                </div>
              </div>
              <div style={{ width: '2px', height: '14px', background: 'rgba(255,255,255,0.1)', marginLeft: '11px' }}></div>

              {/* Step 4: R3 Future */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.6 }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
                  R3
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#ffffff' }}>R3 (Milk / Grain Fill)</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Est. July 14</span>
                </div>
              </div>
              <div style={{ width: '2px', height: '14px', background: 'rgba(255,255,255,0.1)', marginLeft: '11px' }}></div>

              {/* Step 5: R6 Future */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.4 }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
                  R6
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#ffffff' }}>R6 (Black Layer)</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Est. Aug 28</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Field Micro-Telemetry Grid */}
          <div className="glass-card" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers size={18} color="#10b981" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Field Micro-Telemetry</h3>
              </div>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }}></span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Canopy Temp</span>
                <span className="num-tabular" style={{ display: 'block', fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>31.8°C</span>
                <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 700 }}>+2.4°C threshold</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Wind Inversion</span>
                <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>None</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Delta-T: 4.1</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>VPD (Vapor Deficit)</span>
                <span className="num-tabular" style={{ display: 'block', fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>2.4 kPa</span>
                <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700 }}>Moderate Transpiration</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Solar Irradiance</span>
                <span className="num-tabular" style={{ display: 'block', fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>892 W/m²</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Clear Sky: 0.96</span>
              </div>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#ffffff', fontWeight: 600 }}>
                <Activity size={14} color="#10b981" />
                <span>Gateway B-LoRa: Connected</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ping 12ms</span>
            </div>
          </div>

          {/* Sector Aerial Inspection Orthomosaic Snippet Card */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ height: '160px', width: '100%', background: '#111827', position: 'relative' }}>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4tDqKZYzq3vfN7cdMRPPXyRCsghqxM36k9hepRJ2SCNbiXqR8sg1bmDjNb1NXwwMvTl8SYGjX8WLJpm-viOpedrnb3gMZgjto24gbbMzHoq7ipoOBMV-p2oeSBAG-l3VpHyNxZvsmN3bEkel8LeHUbuIvK6AV2T-2OkBpFLfWqIZ-lwI8SRg6ucd9zsbCuF6bzTla6i_V3LaL6Q0osR2j_rbCtpbbUVnFrhryLgmcof91Ia9xP8vBPg"
                alt="Multispectral drone orthomosaic field imagery"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(7, 13, 9, 0.85)', backdropFilter: 'blur(8px)', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Layers size={12} color="#10b981" />
                NDRE Multispectral Overlay
              </div>
              <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(7, 13, 9, 0.85)', backdropFilter: 'blur(8px)', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', color: '#ffffff' }}>
                Res: 3.2 cm/px
              </div>
            </div>
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>Sector B4 Centroid Orthomosaic</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ef4444' }}>28% VWC Stress Core</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Infrared NDVI reveals 18 hectares of canopy thermal signature peaking 3.2°C above surrounding crop benchmark.
              </p>
              <button style={{ background: 'transparent', border: 'none', color: '#10b981', fontWeight: 700, fontSize: '0.8rem', padding: '0.2rem 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', textAlign: 'left' }}>
                <span>Open High-Resolution Multispectral Viewer</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
