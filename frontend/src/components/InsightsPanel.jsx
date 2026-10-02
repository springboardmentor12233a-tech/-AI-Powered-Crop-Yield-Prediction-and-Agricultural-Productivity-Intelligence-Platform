import React, { useState } from 'react';
import { 
  Droplets, Sun, Wind, TestTube, CheckCircle2, ChevronRight, AlertCircle, 
  FileText, Download, ShieldCheck, Sparkles, Award, Calendar, CloudRain, UserCheck 
} from 'lucide-react';
import SmartAdvisoryPanel from './SmartAdvisoryPanel';
import RiskAssessmentPanel from './RiskAssessmentPanel';



export default function InsightsPanel() {
  const [reportForm, setReportForm] = useState({
    farmerName: 'Balwinder Singh',
    consultantName: 'Dr. R. K. Sharma (Sr. Agronomist)',
    state: 'Punjab',
    crop: 'Wheat',
    season: 'Rabi',
    area: '50',
    rainfall: '650',
    temperature: '22',
    yieldPerHectare: '4.85'
  });

  const [generating, setGenerating] = useState(false);

  const soilParameters = [
    { name: 'Nitrogen (N)', current: '138 kg/ha', optimal: '120-150 kg/ha', status: 'Optimal', color: '#10b981' },
    { name: 'Phosphorus (P)', current: '42 kg/ha', optimal: '40-60 kg/ha', status: 'Optimal', color: '#10b981' },
    { name: 'Potassium (K)', current: '210 kg/ha', optimal: '200-250 kg/ha', status: 'Optimal', color: '#10b981' },
    { name: 'Soil pH', current: '6.8', optimal: '6.5 - 7.2', status: 'Optimal Neutral', color: '#06b6d4' },
    { name: 'Organic Carbon', current: '0.62%', optimal: '0.50 - 0.75%', status: 'Good Balance', color: '#10b981' }
  ];

  const recommendations = [
    { crop: 'Wheat (PBW 725)', suitability: '96%', yieldEst: '4.85 T/ha', waterReq: 'Medium' },
    { crop: 'Mustard (RH 749)', suitability: '88%', yieldEst: '2.10 T/ha', waterReq: 'Low' },
    { crop: 'Barley (RD 2899)', suitability: '84%', yieldEst: '3.60 T/ha', waterReq: 'Low' }
  ];

  const handleChange = (e) => {
    setReportForm({
      ...reportForm,
      [e.target.name]: e.target.value
    });
  };

  // Download PDF from FastAPI backend
  const handleDownloadPDF = async () => {
    setGenerating(true);
    try {
      const payload = {
        farmer_name: reportForm.farmerName,
        consultant_name: reportForm.consultantName,
        state: reportForm.state,
        crop: reportForm.crop,
        season: reportForm.season,
        area: parseFloat(reportForm.area) || 50.0,
        rainfall: parseFloat(reportForm.rainfall) || 650.0,
        temperature: parseFloat(reportForm.temperature) || 22.0,
        yield_per_hectare: parseFloat(reportForm.yieldPerHectare) || 4.85,
        total_production: (parseFloat(reportForm.yieldPerHectare) || 4.85) * (parseFloat(reportForm.area) || 50.0),
        confidence: 94.8,
        risk_level: "Low",
        model_used: "XGBoost Regressor v2.4",
        advisory: `Apply Nitrogen top-dressing at tillering stage and maintain 60-70% soil moisture during grain filling for ${reportForm.crop}.`
      };

      const ports = [8000, 8001];
      let downloaded = false;

      for (const port of ports) {
        try {
          const res = await fetch(`http://127.0.0.1:${port}/api/reports/export/pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `CropCast_${reportForm.crop}_Report_${reportForm.state}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            downloaded = true;
            break;
          }
        } catch (e) {
          // try next
        }
      }

      if (!downloaded) {
        // Direct browser URL download link fallback
        window.open(`http://127.0.0.1:8001/api/reports/export/pdf?crop=${reportForm.crop}&state=${reportForm.state}&farmer_name=${encodeURIComponent(reportForm.farmerName)}`, '_blank');
      }
    } catch (err) {
      console.error('Failed PDF download:', err);
    } finally {
      setGenerating(false);
    }
  };

  // Download CSV from FastAPI backend
  const handleDownloadCSV = async () => {
    try {
      const payload = {
        farmer_name: reportForm.farmerName,
        consultant_name: reportForm.consultantName,
        state: reportForm.state,
        crop: reportForm.crop,
        season: reportForm.season,
        area: parseFloat(reportForm.area) || 50.0,
        rainfall: parseFloat(reportForm.rainfall) || 650.0,
        temperature: parseFloat(reportForm.temperature) || 22.0,
        yield_per_hectare: parseFloat(reportForm.yieldPerHectare) || 4.85
      };

      const ports = [8000, 8001];
      for (const port of ports) {
        try {
          const res = await fetch(`http://127.0.0.1:${port}/api/reports/export/csv`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `CropCast_${reportForm.crop}_Data.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            break;
          }
        } catch (e) {
          // try next
        }
      }
    } catch (err) {
      console.error('Failed CSV download:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Grid: Soil Nutrient Profile & AI Crop Suitability */}
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

      {/* SMART ADVISORY PANEL */}
      <SmartAdvisoryPanel />

      {/* RISK ASSESSMENT & PEST ALERTS PANEL */}
      <RiskAssessmentPanel />

      {/* Bottom Section: Official Agricultural Intelligence Reporting Center */}

      <div className="glass-card" style={{ padding: '28px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>

        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-emerald"><ShieldCheck size={12} /> FastAPI Reporting System</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Farmers & Consultants Portal</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', color: '#ffffff', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText color="#10b981" /> Official Agricultural Intelligence Report Generator
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Generate comprehensive reports covering <strong>Productivity Scores (Tonnes/Ha)</strong>, <strong>Seasonal Yield Comparisons (Rabi vs. Kharif)</strong>, and <strong>Weather Impact Summaries</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={handleDownloadCSV} className="btn-secondary" style={{ padding: '10px 18px', fontSize: '0.85rem' }}>
              <Download size={16} color="#06b6d4" /> Export CSV Report
            </button>
            <button onClick={handleDownloadPDF} className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.85rem' }} disabled={generating}>
              <Download size={16} /> {generating ? 'Generating PDF...' : 'Download Official PDF Report'}
            </button>
          </div>
        </div>

        {/* Report Input Form Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '24px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Farmer / Client Name</label>
            <input type="text" name="farmerName" value={reportForm.farmerName} onChange={handleChange} className="input-field" />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Consultant / Agronomist</label>
            <input type="text" name="consultantName" value={reportForm.consultantName} onChange={handleChange} className="input-field" />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>State / Region</label>
            <select name="state" value={reportForm.state} onChange={handleChange} className="input-field">
              <option value="Punjab">Punjab</option>
              <option value="Haryana">Haryana</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Madhya Pradesh">Madhya Pradesh</option>
              <option value="Maharashtra">Maharashtra</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Target Crop</label>
            <select name="crop" value={reportForm.crop} onChange={handleChange} className="input-field">
              <option value="Wheat">Wheat</option>
              <option value="Rice">Rice</option>
              <option value="Maize">Maize</option>
              <option value="Cotton">Cotton</option>
              <option value="Soybean">Soybean</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Farm Area (Hectares)</label>
            <input type="number" name="area" value={reportForm.area} onChange={handleChange} className="input-field" />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Forecast Yield (T/ha)</label>
            <input type="number" name="yieldPerHectare" value={reportForm.yieldPerHectare} onChange={handleChange} className="input-field" step="0.05" />
          </div>
        </div>

        {/* Live Report Preview Section Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          
          {/* Card 1: Productivity Scores */}
          <div style={{ background: 'rgba(16, 185, 129, 0.06)', padding: '18px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Award size={18} color="#10b981" />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>Productivity Score (Tonnes/Ha)</h4>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>{reportForm.yieldPerHectare}</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>T/ha (Est. Total: <strong>{(parseFloat(reportForm.yieldPerHectare) * parseFloat(reportForm.area)).toFixed(1)} T</strong>)</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              • Productivity Index: <strong style={{ color: '#ffffff' }}>92.5/100 (Optimal Harvest)</strong><br />
              • Est. Value: <strong style={{ color: '#fbbf24' }}>${((parseFloat(reportForm.yieldPerHectare) * parseFloat(reportForm.area)) * 280).toLocaleString()} USD</strong>
            </p>
          </div>

          {/* Card 2: Seasonal Yield Comparison */}
          <div style={{ background: 'rgba(6, 182, 212, 0.06)', padding: '18px', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Calendar size={18} color="#06b6d4" />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>Seasonal Comparison (Rabi vs Kharif)</h4>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: '0 0 8px 0' }}>
              • <strong>Rabi (Winter):</strong> {reportForm.yieldPerHectare} T/ha (Optimal Grain Filling)<br />
              • <strong>Kharif (Monsoon):</strong> {(parseFloat(reportForm.yieldPerHectare) * 0.86).toFixed(2)} T/ha<br />
              • <strong>Variance:</strong> <span style={{ color: '#34d399', fontWeight: 700 }}>+15.5% Rabi Advantage</span>
            </p>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Optimal Sowing Window: Oct 20 – Nov 15</span>
          </div>

          {/* Card 3: Weather Impact Summary */}
          <div style={{ background: 'rgba(245, 158, 11, 0.06)', padding: '18px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <CloudRain size={18} color="#f59e0b" />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>Weather Impact Summary</h4>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: '0 0 8px 0' }}>
              • <strong>Precipitation:</strong> {reportForm.rainfall} mm (+8.3% vs 10-yr Mean)<br />
              • <strong>GDD Index:</strong> {parseInt(reportForm.temperature) * 65} GDD at {reportForm.temperature}°C<br />
              • <strong>Vulnerability Rating:</strong> <span style={{ color: '#34d399', fontWeight: 700 }}>Low Climate Risk</span>
            </p>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Precipitation and thermal range optimal for harvest.</span>
          </div>

        </div>

      </div>

    </div>
  );
}
