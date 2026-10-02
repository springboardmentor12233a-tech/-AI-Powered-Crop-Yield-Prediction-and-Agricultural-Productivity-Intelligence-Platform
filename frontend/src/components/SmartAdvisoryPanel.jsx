import React from 'react';
import { 
  Sparkles, Sprout, Droplets, Sun, TestTube, CheckCircle2, AlertTriangle, 
  Calendar, ShieldCheck, ChevronRight, Layers, ArrowRight, Zap, Info 
} from 'lucide-react';

export default function SmartAdvisoryPanel({ 
  formData = {
    state: 'Punjab',
    crop: 'Wheat',
    season: 'Rabi',
    area: '50',
    rainfall: '650',
    temperature: '22',
    fertilizer: '120',
    pesticide: '1.5'
  },
  prediction = {
    yieldPerHectare: 4.85,
    totalProduction: 242.5,
    confidence: 94.8,
    riskLevel: 'Low',
    modelUsed: 'XGBoost Regressor v2.4'
  }
}) {
  const areaNum = parseFloat(formData.area) || 50;
  const rainNum = parseFloat(formData.rainfall) || 650;
  const tempNum = parseFloat(formData.temperature) || 22;
  const fertNum = parseFloat(formData.fertilizer) || 120;
  const yieldNum = parseFloat(prediction.yieldPerHectare) || 4.85;

  // 1. FERTILIZER ADVISORY COMPUTATION
  const targetN = formData.crop === 'Rice' ? 140 : formData.crop === 'Sugarcane' ? 250 : 120;
  const topDressingN = Math.max(20, Math.round(targetN * 0.35));
  const topDressingUreaTotalKg = Math.round((topDressingN * 2.17) * areaNum); // 1kg N = 2.17kg Urea
  const basalDAPKg = Math.round(100 * areaNum);

  // 2. IRRIGATION SCHEDULING COMPUTATION (RAINFALL DEFICIT)
  const cropWaterDemand = {
    'Wheat': 550,
    'Rice': 1250,
    'Maize': 600,
    'Cotton': 800,
    'Sugarcane': 1800,
    'Soybean': 500,
    'Barley': 450
  };

  const waterDemand = cropWaterDemand[formData.crop] || 550;
  const rainfallDeficit = Math.max(0, waterDemand - rainNum);
  const totalIrrigationRounds = rainfallDeficit > 0 ? Math.ceil(rainfallDeficit / 45) : 0;
  const nextIrrigationHours = rainfallDeficit > 200 ? 36 : rainfallDeficit > 0 ? 72 : 120;

  // 3. CROP PLANNING & SUITABILITY MATCHES
  const cropSuitabilities = [
    {
      crop: `${formData.crop} (Primary Selection)`,
      suitability: '96%',
      estYield: `${yieldNum} T/ha`,
      waterRequirement: `${waterDemand} mm`,
      economicReturn: `$${Math.round(yieldNum * 280)} / Ha`,
      recommendation: 'Optimal primary choice for current soil chemistry and seasonal window.'
    },
    {
      crop: formData.crop === 'Wheat' ? 'Mustard (RH 749)' : 'Chickpea (PBG 7)',
      suitability: '88%',
      estYield: formData.crop === 'Wheat' ? '2.10 T/ha' : '1.85 T/ha',
      waterRequirement: '300 mm (50% Water Saving)',
      economicReturn: `$${Math.round(2.10 * 420)} / Ha`,
      recommendation: 'High-value low-water alternative requiring 45% less irrigation.'
    },
    {
      crop: formData.crop === 'Wheat' ? 'Barley (RD 2899)' : 'Mungbean (SML 668)',
      suitability: '84%',
      estYield: formData.crop === 'Wheat' ? '3.60 T/ha' : '1.40 T/ha',
      waterRequirement: '350 mm',
      economicReturn: `$${Math.round(3.60 * 250)} / Ha`,
      recommendation: 'Drought-tolerant rotational crop for soil organic matter buildup.'
    }
  ];

  return (
    <div className="glass-card" style={{ padding: '28px', border: '1px solid rgba(16, 185, 129, 0.35)', background: 'radial-gradient(circle at 0% 0%, rgba(16, 185, 129, 0.1) 0%, rgba(15, 23, 42, 0.9) 75%)' }}>
      
      {/* Panel Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-emerald"><Sparkles size={12} /> AI Intelligence Engine</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Connected to Prediction Outputs</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sprout color="#10b981" size={24} /> Smart Advisory Panel
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Actionable precision agronomical advisory for <strong>{formData.crop}</strong> in <strong>{formData.state}</strong> ({areaNum} Hectares)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px 16px', background: 'rgba(16, 185, 129, 0.12)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)', textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Yield Projection</span>
            <strong style={{ fontSize: '1.1rem', color: '#34d399' }}>{yieldNum} Tonnes / Ha</strong>
          </div>
        </div>
      </div>

      {/* Advisory Grid: 3 Main Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* CARD 1: FERTILIZER ADVICE (NITROGEN TOP-DRESSING) */}
        <div style={{ background: 'rgba(15, 23, 42, 0.75)', borderRadius: '14px', padding: '20px', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '8px', color: '#10b981' }}>
                  <TestTube size={18} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>Fertilizer Prescription</h3>
              </div>
              <span className="badge badge-emerald">Stage 2 Tillering</span>
            </div>

            {/* Nitrogen Top-Dressing Advice */}
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                🧪 Recommended Nitrogen Top-Dressing
              </span>
              <p style={{ fontSize: '0.88rem', color: '#ffffff', margin: 0, fontWeight: 600 }}>
                Apply <span style={{ color: '#34d399' }}>{topDressingN} kg/ha Nitrogen</span> ({Math.round(topDressingN * 2.17)} kg Urea/ha).
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Total required for {areaNum} Ha farm area: <strong style={{ color: '#ffffff' }}>{topDressingUreaTotalKg.toLocaleString()} kg Urea</strong> split into 2 applications.
              </p>
            </div>

            {/* Fertilizer Step Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.82rem', color: 'var(--text-main)' }}>
                <CheckCircle2 size={15} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span><strong>Basal Application:</strong> {Math.round(fertNum * 0.5)} kg/ha NPK at sowing time.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.82rem', color: 'var(--text-main)' }}>
                <CheckCircle2 size={15} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span><strong>Micronutrient Amendment:</strong> Apply 25 kg/ha Zinc Sulphate (21% Zn) to prevent foliar chlorosis.</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            <span>Target NPK: {targetN}-60-40 kg/ha</span>
            <span style={{ color: '#34d399', fontWeight: 600 }}>Optimal Nutrient Balance</span>
          </div>
        </div>

        {/* CARD 2: IRRIGATION SCHEDULING (RAINFALL DEFICIT) */}
        <div style={{ background: 'rgba(15, 23, 42, 0.75)', borderRadius: '14px', padding: '20px', border: '1px solid rgba(6, 182, 212, 0.25)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '8px', background: 'rgba(6, 182, 212, 0.15)', borderRadius: '8px', color: '#06b6d4' }}>
                  <Droplets size={18} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>Smart Irrigation Scheduler</h3>
              </div>
              {rainfallDeficit > 0 ? (
                <span className="badge badge-cyan">{rainfallDeficit} mm Deficit</span>
              ) : (
                <span className="badge badge-emerald">Adequate Rain</span>
              )}
            </div>

            {/* Rainfall Deficit Metric Box */}
            <div style={{ background: 'rgba(6, 182, 212, 0.08)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(6, 182, 212, 0.2)', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                💧 Hydrological Balance
              </span>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0 }}>
                Water Demand for {formData.crop}: <strong>{waterDemand} mm</strong> vs Rainfall: <strong>{rainNum} mm</strong>.
              </p>
              {rainfallDeficit > 0 ? (
                <p style={{ fontSize: '0.82rem', color: '#38bdf8', marginTop: '4px', fontWeight: 600 }}>
                  Precipitation deficit of <strong>{rainfallDeficit} mm</strong> requires <strong>{totalIrrigationRounds} supplemental drip irrigations</strong>.
                </p>
              ) : (
                <p style={{ fontSize: '0.82rem', color: '#34d399', marginTop: '4px', fontWeight: 600 }}>
                  Natural precipitation meets crop demand. Ensure field drainage channels are clear.
                </p>
              )}
            </div>

            {/* Irrigation Window Countdown */}
            <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Next Irrigation Window</span>
                <strong style={{ fontSize: '0.85rem', color: '#38bdf8' }}>In {nextIrrigationHours} Hours</strong>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: 0 }}>
                Scheduled Depth: <strong>35 mm (Drip / Micro-Sprinkler)</strong> • Target Soil Moisture: <strong>65 - 75%</strong>
              </p>
            </div>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            <span>Evapotranspiration Index: Low</span>
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>Drip Efficiency: 92%</span>
          </div>
        </div>

        {/* CARD 3: CROP PLANNING & ROTATION SUGGESTIONS */}
        <div style={{ background: 'rgba(15, 23, 42, 0.75)', borderRadius: '14px', padding: '20px', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '8px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '8px', color: '#f59e0b' }}>
                  <Sun size={18} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>Crop Planning & Rotation</h3>
              </div>
              <span className="badge badge-gold">AI Recommended</span>
            </div>

            {/* Suitability Matches List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
              {cropSuitabilities.map((item, idx) => (
                <div key={idx} style={{ padding: '10px 12px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <strong style={{ fontSize: '0.85rem', color: '#ffffff' }}>{item.crop}</strong>
                    <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>{item.suitability} Match</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                    Yield Est: <strong style={{ color: '#34d399' }}>{item.estYield}</strong> • Water: {item.waterRequirement}
                  </p>
                </div>
              ))}
            </div>

            {/* Crop Rotation Strategy */}
            <div style={{ padding: '10px 12px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                🔄 Rotational Sequence Advice
              </span>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: 0 }}>
                Rotate <strong>{formData.crop}</strong> with <strong>Green Gram (Mungbean)</strong> during Zaid season to fix ~35 kg/ha atmospheric nitrogen.
              </p>
            </div>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            <span>Soil Health Index: 88/100</span>
            <span style={{ color: '#fbbf24', fontWeight: 600 }}>High Land Capability</span>
          </div>
        </div>

      </div>

    </div>
  );
}
