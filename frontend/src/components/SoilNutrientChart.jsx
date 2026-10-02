import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
  ComposedChart, Line, ScatterChart, Scatter, ZAxis, Legend, AreaChart, Area 
} from 'recharts';
import { TestTube, CloudRain, TrendingUp, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

// --- DATASET 1: SOIL SAMPLES FOR DEMONSTRATING COLOR CODING ---
const soilSamplePresets = {
  optimal: {
    title: "Field 1 - Optimal Soil Health Index",
    sampleCode: "SOIL-SAMPLE-01 (North Block)",
    healthStatus: "Optimal Balance",
    overallScore: 92,
    nutrients: [
      { name: 'Nitrogen (N)', current: 138, min: 120, max: 150, unit: 'kg/ha', status: 'Optimal', color: '#10b981' },
      { name: 'Phosphorus (P)', current: 48, min: 40, max: 60, unit: 'kg/ha', status: 'Optimal', color: '#10b981' },
      { name: 'Potassium (K)', current: 225, min: 200, max: 250, unit: 'kg/ha', status: 'Optimal', color: '#10b981' },
      { name: 'Soil pH', current: 6.8, min: 6.0, max: 7.5, unit: 'pH', status: 'Optimal', color: '#10b981' },
      { name: 'Organic Carbon', current: 0.68, min: 0.50, max: 0.85, unit: '%', status: 'Optimal', color: '#10b981' }
    ]
  },
  deficit_risk: {
    title: "Field 2 - High Risk Nitrogen & Acidic pH Deficit",
    sampleCode: "SOIL-SAMPLE-02 (West Belt)",
    healthStatus: "Nutrient Risk Deficit",
    overallScore: 54,
    nutrients: [
      { name: 'Nitrogen (N)', current: 82, min: 120, max: 150, unit: 'kg/ha', status: 'Risk Deficit', color: '#ef4444' },
      { name: 'Phosphorus (P)', current: 35, min: 40, max: 60, unit: 'kg/ha', status: 'Moderate Warning', color: '#f59e0b' },
      { name: 'Potassium (K)', current: 170, min: 200, max: 250, unit: 'kg/ha', status: 'Moderate Warning', color: '#f59e0b' },
      { name: 'Soil pH', current: 5.2, min: 6.0, max: 7.5, unit: 'pH', status: 'Acidic Risk', color: '#ef4444' },
      { name: 'Organic Carbon', current: 0.32, min: 0.50, max: 0.85, unit: '%', status: 'Carbon Deficit Risk', color: '#ef4444' }
    ]
  },
  moderate: {
    title: "Field 3 - Moderate Potassium & Carbon Caution",
    sampleCode: "SOIL-SAMPLE-03 (Central Sector)",
    healthStatus: "Moderate Caution",
    overallScore: 76,
    nutrients: [
      { name: 'Nitrogen (N)', current: 128, min: 120, max: 150, unit: 'kg/ha', status: 'Optimal', color: '#10b981' },
      { name: 'Phosphorus (P)', current: 44, min: 40, max: 60, unit: 'kg/ha', status: 'Optimal', color: '#10b981' },
      { name: 'Potassium (K)', current: 185, min: 200, max: 250, unit: 'kg/ha', status: 'Moderate Warning', color: '#f59e0b' },
      { name: 'Soil pH', current: 7.8, min: 6.0, max: 7.5, unit: 'pH', status: 'Slight Alkaline', color: '#f59e0b' },
      { name: 'Organic Carbon', current: 0.52, min: 0.50, max: 0.85, unit: '%', status: 'Optimal', color: '#10b981' }
    ]
  }
};

// --- DATASET 2: HISTORICAL YIELD PROGRESSION (2019 - 2024) ---
const historicalYieldProgressionData = [
  { year: '2019', yieldWheat: 3.80, yieldRice: 3.40, yieldMaize: 3.10, status: 'Moderate', color: '#f59e0b' },
  { year: '2020', yieldWheat: 4.10, yieldRice: 3.60, yieldMaize: 3.30, status: 'Optimal', color: '#10b981' },
  { year: '2021', yieldWheat: 3.65, yieldRice: 3.35, yieldMaize: 2.95, status: 'Risk Deficit', color: '#ef4444' }, // Heat wave drop
  { year: '2022', yieldWheat: 4.40, yieldRice: 3.80, yieldMaize: 3.50, status: 'Optimal', color: '#10b981' },
  { year: '2023', yieldWheat: 4.60, yieldRice: 3.95, yieldMaize: 3.65, status: 'Optimal', color: '#10b981' },
  { year: '2024', yieldWheat: 4.85, yieldRice: 4.10, yieldMaize: 3.85, status: 'Optimal Record', color: '#10b981' }
];

// --- DATASET 3: RAINFALL VS YIELD CORRELATION SCATTER/COMPOSED ---
const rainfallYieldCorrelationData = [
  { rainfall: 320, yield: 2.45, region: 'MH Central (2021)', riskCategory: 'Drought Risk', color: '#ef4444' },
  { rainfall: 390, yield: 3.10, region: 'MP West (2019)', riskCategory: 'Drought Risk', color: '#ef4444' },
  { rainfall: 480, yield: 3.75, region: 'UP East (2020)', riskCategory: 'Moderate', color: '#f59e0b' },
  { rainfall: 560, yield: 4.20, region: 'Haryana (2022)', riskCategory: 'Optimal', color: '#10b981' },
  { rainfall: 650, yield: 4.85, region: 'Punjab (2024)', riskCategory: 'Optimal Peak', color: '#10b981' },
  { rainfall: 710, yield: 4.70, region: 'WB Delta (2023)', riskCategory: 'Optimal', color: '#10b981' },
  { rainfall: 890, yield: 3.60, region: 'Coastal AP (2021)', riskCategory: 'Excess Flood Risk', color: '#ef4444' },
  { rainfall: 940, yield: 3.20, region: 'Assam Delta (2022)', riskCategory: 'Excess Flood Risk', color: '#ef4444' }
];

export default function SoilNutrientChart() {
  const [selectedSample, setSelectedSample] = useState('optimal');
  const activeSample = soilSamplePresets[selectedSample];

  // Prepare normalized nutrient data for relative bar comparison (0 - 100% of target)
  const normalizedNutrientData = activeSample.nutrients.map(item => {
    let pct = 100;
    if (item.name === 'Soil pH') {
      pct = Math.min(100, Math.max(20, (item.current / 7.0) * 100));
    } else if (item.name === 'Organic Carbon') {
      pct = Math.min(100, Math.max(20, (item.current / 0.7) * 100));
    } else {
      pct = Math.min(100, Math.max(20, (item.current / item.max) * 100));
    }

    return {
      name: item.name.split(' ')[0], // 'Nitrogen', 'Phosphorus', etc.
      fullName: item.name,
      current: item.current,
      unit: item.unit,
      targetRange: `${item.min}-${item.max} ${item.unit}`,
      percentageOfTarget: Math.round(pct),
      status: item.status,
      color: item.color
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* CHART 1: HISTORICAL YIELD PROGRESSION (2019 - 2024) */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-emerald"><TrendingUp size={12} /> Multi-Year Telemetry</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Historical Benchmark</span>
            </div>
            <h3 style={{ fontSize: '1.2rem', color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Historical Crop Yield Progression (2019 – 2024)
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Tracking longitudinal yield performance (Tonnes per Hectare) with climate vulnerability drops highlighted in <strong style={{ color: '#ef4444' }}>Red (Risk)</strong> and growth in <strong style={{ color: '#10b981' }}>Green (Optimal)</strong>.
            </p>
          </div>
        </div>

        <div style={{ width: '100%', height: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historicalYieldProgressionData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="wheatColorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="riceColorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="maizeColorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} unit=" T/ha" domain={[2.0, 5.5]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                formatter={(value, name) => [`${value} Tonnes/Ha`, name]}
              />
              <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '0.85rem' }} />
              <Area type="monotone" dataKey="yieldWheat" name="Wheat Yield (T/ha)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#wheatColorGrad)" />
              <Area type="monotone" dataKey="yieldRice" name="Rice Yield (T/ha)" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#riceColorGrad)" />
              <Area type="monotone" dataKey="yieldMaize" name="Maize Yield (T/ha)" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#maizeColorGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Year-by-Year Color Coded Badges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginTop: '16px' }}>
          {historicalYieldProgressionData.map((item, idx) => (
            <div 
              key={idx} 
              style={{ 
                padding: '10px', 
                borderRadius: '8px', 
                background: item.color === '#10b981' ? 'rgba(16, 185, 129, 0.08)' : item.color === '#ef4444' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.08)',
                border: `1px solid ${item.color === '#10b981' ? 'rgba(16, 185, 129, 0.3)' : item.color === '#ef4444' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}` 
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>{item.year} Benchmark</span>
              <strong style={{ fontSize: '1rem', color: '#ffffff' }}>{item.yieldWheat} T/ha</strong>
              <span style={{ fontSize: '0.7rem', display: 'block', color: item.color, fontWeight: 700, marginTop: '2px' }}>
                {item.color === '#10b981' ? '🟢 Optimal' : item.color === '#ef4444' ? '🔴 Heat Stress Risk' : '🟡 Moderate'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CHART 2: RAINFALL VS YIELD CORRELATION */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-cyan"><CloudRain size={12} /> Agro-Meteorological Telemetry</span>
          </div>
          <h3 style={{ fontSize: '1.2rem', color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            Monsoon Rainfall vs. Crop Yield Correlation
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Mapping annual precipitation (mm) directly against harvest yield output. Color coded: <strong style={{ color: '#10b981' }}>Green = Optimal Rainfall (500–750mm)</strong>, <strong style={{ color: '#ef4444' }}>Red = Drought Risk (&lt;400mm) / Flood Stress (&gt;850mm)</strong>.
          </p>
        </div>

        <div style={{ width: '100%', height: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rainfallYieldCorrelationData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="region" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" stroke="#38bdf8" tick={{ fontSize: 11 }} unit=" mm" label={{ value: 'Rainfall (mm)', angle: -90, position: 'insideLeft', fill: '#38bdf8', fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#34d399" tick={{ fontSize: 11 }} unit=" T/ha" domain={[1.5, 5.5]} label={{ value: 'Yield (T/ha)', angle: 90, position: 'insideRight', fill: '#34d399', fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                formatter={(value, name) => [name.includes('Rainfall') ? `${value} mm` : `${value} Tonnes/Ha`, name]}
              />
              <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '0.85rem' }} />
              
              {/* Rainfall Bar with Dynamic Color Coding per Cell */}
              <Bar yAxisId="left" dataKey="rainfall" name="Monsoon Rainfall (mm)" radius={[6, 6, 0, 0]}>
                {rainfallYieldCorrelationData.map((entry, index) => (
                  <Cell key={`rain-cell-${index}`} fill={entry.color} opacity={0.7} />
                ))}
              </Bar>

              {/* Yield Line */}
              <Line yAxisId="right" type="monotone" dataKey="yield" name="Harvest Yield (T/ha)" stroke="#34d399" strokeWidth={3} dot={{ r: 5, fill: '#10b981' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend Indicator Box */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'center', marginTop: '16px', background: 'rgba(15, 23, 42, 0.6)', padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981', display: 'inline-block' }}></span>
            <span style={{ fontSize: '0.8rem', color: '#ffffff' }}>Optimal Monsoon (500 – 750 mm)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f59e0b', display: 'inline-block' }}></span>
            <span style={{ fontSize: '0.8rem', color: '#ffffff' }}>Moderate Rainfall (400 – 500 mm)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ef4444', display: 'inline-block' }}></span>
            <span style={{ fontSize: '0.8rem', color: '#ffffff' }}>Drought Risk (&lt;400mm) / Excess Flood (&gt;850mm)</span>
          </div>
        </div>

      </div>

      {/* CHART 3: SOIL NUTRIENT LEVELS (N, P, K, pH, CARBON) WITH INTERACTIVE PRESETS & COLOR CODING */}
      <div className="glass-card" style={{ padding: '24px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-emerald"><TestTube size={12} /> Chemical Soil Telemetry</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lab Chemistry & Sensor Array</span>
            </div>
            <h3 style={{ fontSize: '1.2rem', color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Soil Nutrient Levels & Chemistry (N, P, K, pH, Carbon)
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Dynamic threshold monitoring color coded: <strong style={{ color: '#10b981' }}>Green = Optimal Target</strong>, <strong style={{ color: '#f59e0b' }}>Yellow = Moderate Warning</strong>, <strong style={{ color: '#ef4444' }}>Red = Severe Risk / Deficit</strong>.
            </p>
          </div>

          {/* Interactive Preset Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(15, 23, 42, 0.8)', padding: '6px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={() => setSelectedSample('optimal')}
              className={selectedSample === 'optimal' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            >
              🟢 Sample 1 (Optimal)
            </button>
            <button
              onClick={() => setSelectedSample('moderate')}
              className={selectedSample === 'moderate' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            >
              🟡 Sample 2 (Moderate)
            </button>
            <button
              onClick={() => setSelectedSample('deficit_risk')}
              className={selectedSample === 'deficit_risk' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            >
              🔴 Sample 3 (Deficit Risk)
            </button>
          </div>
        </div>

        {/* Selected Sample Overview Banner */}
        <div style={{ 
          padding: '14px 18px', 
          borderRadius: '12px', 
          marginBottom: '20px', 
          background: activeSample.overallScore >= 85 ? 'rgba(16, 185, 129, 0.1)' : activeSample.overallScore >= 70 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.12)',
          border: `1px solid ${activeSample.overallScore >= 85 ? 'rgba(16, 185, 129, 0.3)' : activeSample.overallScore >= 70 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>{activeSample.sampleCode}</span>
            <strong style={{ fontSize: '1.1rem', color: '#ffffff' }}>{activeSample.title}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Soil Health Index</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: activeSample.overallScore >= 85 ? '#34d399' : activeSample.overallScore >= 70 ? '#fbbf24' : '#f43f5e' }}>
                {activeSample.overallScore} / 100
              </div>
            </div>
            {activeSample.overallScore >= 85 ? (
              <span className="badge badge-emerald"><CheckCircle2 size={12} /> Optimal Balance</span>
            ) : activeSample.overallScore >= 70 ? (
              <span className="badge badge-gold"><AlertTriangle size={12} /> Caution Required</span>
            ) : (
              <span className="badge" style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}><ShieldAlert size={12} /> Severe Soil Risk</span>
            )}
          </div>
        </div>

        {/* Recharts Bar Graph of Soil Nutrient Thresholds */}
        <div style={{ width: '100%', height: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={normalizedNutrientData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} unit="%" domain={[0, 115]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                formatter={(value, name, props) => [
                  `${props.payload.current} ${props.payload.unit} (Target: ${props.payload.targetRange})`,
                  `${props.payload.fullName} [${props.payload.status}]`
                ]}
              />
              <Bar dataKey="percentageOfTarget" name="% of Optimal Target" radius={[6, 6, 0, 0]}>
                {normalizedNutrientData.map((entry, index) => (
                  <Cell key={`nutrient-cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Nutrient Cards with Color Status Indicators */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '20px' }}>
          {activeSample.nutrients.map((item, idx) => (
            <div 
              key={idx}
              style={{
                padding: '14px',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.7)',
                border: `1px solid ${item.color === '#10b981' ? 'rgba(16, 185, 129, 0.25)' : item.color === '#ef4444' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>{item.name}</span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, boxShadow: `0 0 8px ${item.color}` }}></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: item.color }}>{item.current}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.unit}</span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', margin: '4px 0 0 0' }}>
                Target: {item.min}-{item.max} {item.unit} • <strong style={{ color: item.color }}>{item.status}</strong>
              </p>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
