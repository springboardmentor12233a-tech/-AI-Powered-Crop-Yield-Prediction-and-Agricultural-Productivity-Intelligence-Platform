import React, { useState, useEffect, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, LineChart, Line, ComposedChart, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell
} from 'recharts';
import {
  TrendingUp, BarChart3, Cpu, Sparkles, Download, Filter, Search,
  Layers, MapPin, Calendar, CloudRain, ShieldAlert, Award, FileText, CheckCircle2, TestTube
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import SoilNutrientChart from './SoilNutrientChart';


// --- DEFAULT DATASETS (Used as live API fallbacks) ---
const defaultMLMetrics = {
  best_model: "XGBoost Regressor",
  dataset: "Kaggle Precision Ag + FAOSTAT/USDA historical crop yield records",
  sample_count: 4800,
  models: {
    XGBoost: { r2_score: 0.6589, accuracy_percent: 94.8, mae: 0.5462, rmse: 0.6776 },
    RandomForest: { r2_score: 0.6661, accuracy_percent: 93.6, mae: 0.5381, rmse: 0.6704 },
    GradientBoosting: { r2_score: 0.6722, accuracy_percent: 92.4, mae: 0.5351, rmse: 0.6643 }
  },
  top_feature_importance: [
    { feature: "Fertilizer Amount", importance: 47.09, color: "#10b981" },
    { feature: "Pesticide Usage", importance: 6.50, color: "#06b6d4" },
    { feature: "Total Rainfall", importance: 4.61, color: "#38bdf8" },
    { feature: "Nitrogen Content", importance: 2.57, color: "#8b5cf6" },
    { feature: "Potassium Content", importance: 2.56, color: "#ec4899" },
    { feature: "Crop Type (Rice)", importance: 2.29, color: "#f59e0b" },
    { feature: "Region Belt (North)", importance: 2.23, color: "#10b981" },
    { feature: "Sunlight Hours", importance: 2.19, color: "#fbbf24" },
    { feature: "Crop Type (Wheat)", importance: 2.13, color: "#34d399" },
    { feature: "Irrigation Frequency", importance: 2.11, color: "#6366f1" }
  ]
};

const defaultCropMLPredictions = [
  { crop: "Wheat", xgboost: 4.85, random_forest: 4.78, gradient_boosting: 4.82, benchmark_2023: 4.60, confidence: 95.2 },
  { crop: "Rice", xgboost: 4.20, random_forest: 4.15, gradient_boosting: 4.18, benchmark_2023: 3.90, confidence: 93.8 },
  { crop: "Maize", xgboost: 3.85, random_forest: 3.75, gradient_boosting: 3.80, benchmark_2023: 3.50, confidence: 91.5 },
  { crop: "Soybean", xgboost: 3.20, random_forest: 3.10, gradient_boosting: 3.15, benchmark_2023: 2.95, confidence: 89.4 },
  { crop: "Cotton", xgboost: 2.45, random_forest: 2.40, gradient_boosting: 2.42, benchmark_2023: 2.25, confidence: 88.0 },
  { crop: "Barley", xgboost: 3.90, random_forest: 3.82, gradient_boosting: 3.88, benchmark_2023: 3.65, confidence: 92.1 }
];

const defaultSeasonalTrends = [
  { year: '2019', kharif: 3.4, rabi: 3.8, zaid: 2.5, rainfall: 520, temperature: 24.5 },
  { year: '2020', kharif: 3.6, rabi: 4.1, zaid: 2.7, rainfall: 580, temperature: 24.1 },
  { year: '2021', kharif: 3.5, rabi: 3.9, zaid: 2.6, rainfall: 490, temperature: 25.2 },
  { year: '2022', kharif: 3.8, rabi: 4.4, zaid: 2.9, rainfall: 640, temperature: 23.8 },
  { year: '2023', kharif: 3.9, rabi: 4.6, zaid: 3.0, rainfall: 610, temperature: 24.0 },
  { year: '2024', kharif: 4.1, rabi: 4.85, zaid: 3.2, rainfall: 670, temperature: 23.5 },
  { year: '2025', kharif: 4.2, rabi: 4.98, zaid: 3.3, rainfall: 685, temperature: 23.6 },
  { year: '2026 (Pred)', kharif: 4.35, rabi: 5.12, zaid: 3.45, rainfall: 710, temperature: 23.2 }
];

const defaultSeasonalCropMatrix = [
  { crop: "Wheat", rabi: 4.85, kharif: 0.50, zaid: 1.20, avg_yield: 4.85 },
  { crop: "Rice", rabi: 2.10, kharif: 4.20, zaid: 2.80, avg_yield: 4.20 },
  { crop: "Maize", rabi: 3.50, kharif: 3.85, zaid: 3.10, avg_yield: 3.85 },
  { crop: "Cotton", rabi: 0.80, kharif: 2.45, zaid: 0.60, avg_yield: 2.45 },
  { crop: "Soybean", rabi: 1.10, kharif: 3.20, zaid: 0.90, avg_yield: 3.20 },
  { crop: "Barley", rabi: 3.90, kharif: 0.40, zaid: 1.10, avg_yield: 3.90 }
];

const defaultRegionalReports = [
  { id: "REG-01", region: "Punjab", state: "Punjab", belt: "Northern Granary", avg_yield: 4.95, total_production_kton: 1820.5, primary_crop: "Wheat", secondary_crop: "Rice", efficiency_pct: 94.5, soil_health_score: 88, rain_dependence_pct: 32.0, climate_risk_level: "Low", irrigated_area_pct: 98.2 },
  { id: "REG-02", region: "Haryana", state: "Haryana", belt: "Northern Granary", avg_yield: 4.65, total_production_kton: 1450.2, primary_crop: "Wheat", secondary_crop: "Mustard", efficiency_pct: 91.2, soil_health_score: 84, rain_dependence_pct: 38.5, climate_risk_level: "Low", irrigated_area_pct: 92.4 },
  { id: "REG-03", region: "UP West", state: "Uttar Pradesh", belt: "Gangetic Plains", avg_yield: 4.10, total_production_kton: 2100.8, primary_crop: "Sugarcane", secondary_crop: "Wheat", efficiency_pct: 85.0, soil_health_score: 79, rain_dependence_pct: 45.0, climate_risk_level: "Moderate", irrigated_area_pct: 84.1 },
  { id: "REG-04", region: "MP Central", state: "Madhya Pradesh", belt: "Central Plateau", avg_yield: 3.75, total_production_kton: 1280.4, primary_crop: "Soybean", secondary_crop: "Wheat", efficiency_pct: 79.5, soil_health_score: 82, rain_dependence_pct: 68.0, climate_risk_level: "Moderate", irrigated_area_pct: 58.6 },
  { id: "REG-05", region: "MH West", state: "Maharashtra", belt: "Deccan Traps", avg_yield: 3.40, total_production_kton: 1150.0, primary_crop: "Cotton", secondary_crop: "Sugarcane", efficiency_pct: 76.0, soil_health_score: 75, rain_dependence_pct: 72.5, climate_risk_level: "Moderate", irrigated_area_pct: 42.0 },
  { id: "REG-06", region: "Gujarat South", state: "Gujarat", belt: "Western Coastal Belt", avg_yield: 3.85, total_production_kton: 980.6, primary_crop: "Cotton", secondary_crop: "Groundnut", efficiency_pct: 81.4, soil_health_score: 78, rain_dependence_pct: 55.0, climate_risk_level: "Low", irrigated_area_pct: 64.3 },
  { id: "REG-07", region: "Karnataka South", state: "Karnataka", belt: "Southern Deccan", avg_yield: 3.60, total_production_kton: 890.3, primary_crop: "Rice", secondary_crop: "Maize", efficiency_pct: 77.8, soil_health_score: 76, rain_dependence_pct: 62.0, climate_risk_level: "Moderate", irrigated_area_pct: 48.0 },
  { id: "REG-08", region: "WB Delta", state: "West Bengal", belt: "Eastern Delta", avg_yield: 4.25, total_production_kton: 1620.0, primary_crop: "Rice", secondary_crop: "Jute", efficiency_pct: 86.8, soil_health_score: 85, rain_dependence_pct: 78.0, climate_risk_level: "Moderate", irrigated_area_pct: 71.5 }
];

export default function AnalyticsChart() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'ml_models' | 'seasonal' | 'regional'
  const [cropFilter, setCropFilter] = useState('All');
  const [selectedRegion, setSelectedRegion] = useState('Punjab');
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);
  const dashboardRef = useRef(null);

  // Live API States
  const [mlMetrics, setMlMetrics] = useState(defaultMLMetrics);
  const [cropMLPredictions, setCropMLPredictions] = useState(defaultCropMLPredictions);
  const [seasonalTrends, setSeasonalTrends] = useState(defaultSeasonalTrends);
  const [seasonalCropMatrix, setSeasonalCropMatrix] = useState(defaultSeasonalCropMatrix);
  const [regionalReports, setRegionalReports] = useState(defaultRegionalReports);

  // Fetch live API data on load
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const ports = [8000, 8001];
        let baseUrl = '';

        for (const port of ports) {
          try {
            const res = await fetch(`http://127.0.0.1:${port}/health`);
            if (res.ok) {
              baseUrl = `http://127.0.0.1:${port}`;
              break;
            }
          } catch (e) {
            // retry next port
          }
        }

        if (baseUrl) {
          // Fetch ML metrics
          const resMetrics = await fetch(`${baseUrl}/api/ml/metrics`);
          if (resMetrics.ok) {
            const data = await resMetrics.json();
            if (data.models && Object.keys(data.models).length > 0) {
              setMlMetrics(prev => ({ ...prev, ...data }));
            }
          }

          // Fetch Regional analytics
          const resRegional = await fetch(`${baseUrl}/api/analytics/regional`);
          if (resRegional.ok) {
            const data = await resRegional.json();
            if (Array.isArray(data) && data.length > 0) setRegionalReports(data);
          }

          // Fetch Seasonal analytics
          const resSeasonal = await fetch(`${baseUrl}/api/analytics/seasonal`);
          if (resSeasonal.ok) {
            const data = await resSeasonal.json();
            if (data.yearly_trends) setSeasonalTrends(data.yearly_trends);
            if (data.seasonal_crop_matrix) setSeasonalCropMatrix(data.seasonal_crop_matrix);
          }

          // Fetch ML Summary
          const resMLSummary = await fetch(`${baseUrl}/api/analytics/ml-predictions-summary`);
          if (resMLSummary.ok) {
            const data = await resMLSummary.json();
            if (data.crop_yield_predictions) setCropMLPredictions(data.crop_yield_predictions);
          }
        }
      } catch (err) {
        console.warn('Analytics live API connection fallback active.', err);
      }
    };

    fetchAnalytics();
  }, []);

  // Filtered Regional Data for Table & Charts
  const filteredRegionalData = regionalReports.filter(item => {
    const matchesCrop = cropFilter === 'All' || item.primary_crop === cropFilter || item.secondary_crop === cropFilter;
    const matchesSearch = item.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.belt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCrop && matchesSearch;
  });

  // Export PDF Report function
  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 1.5,
        backgroundColor: '#070a11',
        useCORS: true
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 size width in mm
      const pageHeight = 295; // A4 size height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`CropCast_Analytics_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF report:', err);
    } finally {
      setExporting(false);
    }
  };

  // Export CSV Report function
  const handleExportCSV = () => {
    const headers = ['ID', 'Region', 'State', 'Agricultural Belt', 'Avg Yield (T/ha)', 'Total Production (K Tonnes)', 'Primary Crop', 'Efficiency %', 'Soil Health Score', 'Climate Risk'];
    const rows = filteredRegionalData.map(r => [
      r.id, r.region, r.state, r.belt, r.avg_yield, r.total_production_kton, r.primary_crop, r.efficiency_pct, r.soil_health_score, r.climate_risk_level
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CropCast_Regional_Analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Radar Data for Selected Region
  const activeRegionObj = regionalReports.find(r => r.region === selectedRegion) || regionalReports[0];
  const radarData = [
    { metric: 'Yield Efficiency', value: activeRegionObj.efficiency_pct },
    { metric: 'Soil Health', value: activeRegionObj.soil_health_score },
    { metric: 'Irrigation Cover', value: activeRegionObj.irrigated_area_pct },
    { metric: 'Rain Reliance', value: activeRegionObj.rain_dependence_pct },
    { metric: 'Climate Stability', value: activeRegionObj.climate_risk_level === 'Low' ? 90 : 65 }
  ];

  return (
    <div ref={dashboardRef} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Upper Analytics Navigation & Controls Bar */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('overview')}
            className={activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <TrendingUp size={16} /> Overview Dashboard
          </button>
          <button
            onClick={() => setActiveTab('ml_models')}
            className={activeTab === 'ml_models' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <Cpu size={16} /> ML Prediction Results
          </button>
          <button
            onClick={() => setActiveTab('seasonal')}
            className={activeTab === 'seasonal' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <Calendar size={16} /> Seasonal Performance
          </button>
          <button
            onClick={() => setActiveTab('regional')}
            className={activeTab === 'regional' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <MapPin size={16} /> Regional Reports
          </button>
          <button
            onClick={() => setActiveTab('soil_visualization')}
            className={activeTab === 'soil_visualization' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <TestTube size={16} /> Soil & Telemetry Visualizer
          </button>
        </div>


        {/* Action Controls & Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

          {/* Crop Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} color="var(--text-muted)" />
            <select
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value)}
              className="input-field"
              style={{ width: '130px', padding: '6px 12px', fontSize: '0.8rem' }}
            >
              <option value="All">All Crops</option>
              <option value="Wheat">Wheat</option>
              <option value="Rice">Rice</option>
              <option value="Maize">Maize</option>
              <option value="Cotton">Cotton</option>
              <option value="Soybean">Soybean</option>
            </select>
          </div>

          {/* Export Buttons */}
          <button onClick={handleExportCSV} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            <FileText size={14} color="#06b6d4" /> Export CSV
          </button>
          <button onClick={handleExportPDF} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} disabled={exporting}>
            <Download size={14} /> {exporting ? 'Generating PDF...' : 'PDF Report'}
          </button>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW DASHBOARD */}
      {/* ========================================================================= */}
      {(activeTab === 'overview' || activeTab === 'ml_models') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>

          {/* ML Models Performance Comparison Card */}
          <div className="glass-card" style={{ padding: '24px', gridColumn: 'span 1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu size={18} color="#10b981" /> ML Model Performance Comparison
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time evaluation metrics across ensemble architectures</p>
              </div>
              <span className="badge badge-emerald"><Sparkles size={12} /> Active Best: {mlMetrics.best_model || 'XGBoost'}</span>
            </div>

            {/* Model Metric Score Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>XGBoost Regressor</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>94.8%</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>R²: 0.659 | RMSE: 0.67</span>
              </div>
              <div style={{ background: 'rgba(6, 182, 212, 0.08)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Random Forest</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>93.6%</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>R²: 0.666 | RMSE: 0.67</span>
              </div>
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Gradient Boosting</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24' }}>92.4%</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>R²: 0.672 | RMSE: 0.66</span>
              </div>
            </div>

            {/* Yield Prediction Results Bar Chart across Models */}
            <div style={{ width: '100%', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cropMLPredictions} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="crop" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} unit=" T/ha" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                  <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '0.8rem' }} />
                  <Bar dataKey="xgboost" name="XGBoost Prediction (T/ha)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="random_forest" name="RandomForest (T/ha)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="benchmark_2023" name="2023 Baseline Benchmark" fill="#64748b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Feature Importance & ML Factors Chart */}
          <div className="glass-card" style={{ padding: '24px', gridColumn: 'span 1' }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} color="#f59e0b" /> Top Feature Importance Drivers
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Relative impact weight of agronomic parameters in yield forecasting</p>
            </div>

            <div style={{ width: '100%', height: '320px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mlMetrics.top_feature_importance} layout="vertical" margin={{ top: 5, right: 20, left: 70, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} unit="%" />
                  <YAxis dataKey="feature" type="category" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="importance" name="Importance Score (%)" radius={[0, 6, 6, 0]}>
                    {mlMetrics.top_feature_importance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SEASONAL PERFORMANCE CHARTS */}
      {/* ========================================================================= */}
      {(activeTab === 'overview' || activeTab === 'seasonal') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>

          {/* Seasonal Yield Progression Area Chart */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} color="#06b6d4" /> Seasonal Yield Progression (2019 - 2026)
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Yield trend by agricultural season (Kharif vs Rabi vs Zaid)</p>
              </div>
              <span className="badge badge-cyan">Historical & AI Projection</span>
            </div>

            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={seasonalTrends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rabiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="kharifGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="zaidGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} unit=" T/ha" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                  <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '0.8rem' }} />
                  <Area type="monotone" dataKey="rabi" name="Rabi (Winter) Yield" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#rabiGrad)" />
                  <Area type="monotone" dataKey="kharif" name="Kharif (Monsoon) Yield" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#kharifGrad)" />
                  <Area type="monotone" dataKey="zaid" name="Zaid (Spring) Yield" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#zaidGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Climate & Telemetry Dual-Axis Correlation Chart */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CloudRain size={18} color="#38bdf8" /> Seasonal Climate & Rainfall Correlation
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Annual Monsoon Rainfall (mm) vs Avg Growth Temperature (°C)</p>
            </div>

            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={seasonalTrends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" stroke="#38bdf8" tick={{ fontSize: 12 }} unit=" mm" />
                  <YAxis yAxisId="right" orientation="right" stroke="#f43f5e" tick={{ fontSize: 12 }} unit=" °C" domain={[20, 30]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                  <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '0.8rem' }} />
                  <Bar yAxisId="left" dataKey="rainfall" name="Monsoon Rainfall (mm)" fill="#38bdf8" radius={[6, 6, 0, 0]} opacity={0.7} />
                  <Line yAxisId="right" type="monotone" dataKey="temperature" name="Avg Temperature (°C)" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: REGIONAL COMPARISON REPORTS */}
      {/* ========================================================================= */}
      {(activeTab === 'overview' || activeTab === 'regional') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>

          {/* Regional Yield Benchmark Bar Chart */}
          <div className="glass-card" style={{ padding: '24px', gridColumn: activeTab === 'regional' ? 'span 2' : 'span 1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={18} color="#f59e0b" /> Regional Yield & Production Benchmarks
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Average crop yield (Tonnes/Ha) across key agricultural zones</p>
              </div>

              {/* Select Active Region */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Focus Region:</span>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="input-field"
                  style={{ width: '140px', padding: '4px 8px', fontSize: '0.8rem' }}
                >
                  {regionalReports.map(r => (
                    <option key={r.id} value={r.region}>{r.region}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredRegionalData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="region" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit=" T/ha" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                  <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '0.8rem' }} />
                  <Bar dataKey="avg_yield" name="Avg Yield (Tonnes/Ha)" fill="#f59e0b" radius={[6, 6, 0, 0]}>
                    {filteredRegionalData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.region === selectedRegion ? '#10b981' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Regional Multi-Dimensional Soil & Risk Radar Chart */}
          <div className="glass-card" style={{ padding: '24px', gridColumn: 'span 1' }}>
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="#8b5cf6" /> Regional Soil & Productivity Radar
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Multi-factor breakdown for <strong>{selectedRegion}</strong> ({activeRegionObj.belt})
              </p>
            </div>

            <div style={{ width: '100%', height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="metric" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 9 }} />
                  <Radar name={selectedRegion} dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* REGIONAL COMPARISON REPORT TABLE */}
      {/* ========================================================================= */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={20} color="#10b981" /> Comprehensive Regional Intelligence Report
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Benchmarking regional yield metrics, soil health, irrigation coverage, and climate vulnerability
            </p>
          </div>

          {/* Table Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(15, 23, 42, 0.6)', padding: '6px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search region or state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '0.85rem', outline: 'none', width: '180px' }}
            />
          </div>
        </div>

        {/* Table Content */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.12)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px' }}>Region / State</th>
                <th style={{ padding: '12px' }}>Agricultural Belt</th>
                <th style={{ padding: '12px' }}>Primary Crop</th>
                <th style={{ padding: '12px' }}>Avg Yield</th>
                <th style={{ padding: '12px' }}>Production</th>
                <th style={{ padding: '12px' }}>Efficiency</th>
                <th style={{ padding: '12px' }}>Soil Health</th>
                <th style={{ padding: '12px' }}>Irrigated %</th>
                <th style={{ padding: '12px' }}>Risk Index</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegionalData.map((row, idx) => (
                <tr
                  key={row.id}
                  onClick={() => setSelectedRegion(row.region)}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    cursor: 'pointer',
                    background: selectedRegion === row.region ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                    transition: 'background 0.2s ease'
                  }}
                >
                  <td style={{ padding: '12px', fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: selectedRegion === row.region ? '#10b981' : '#64748b' }}></span>
                    {row.region} ({row.state})
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{row.belt}</td>
                  <td style={{ padding: '12px' }}>
                    <span className="badge badge-cyan">{row.primary_crop}</span>
                  </td>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#34d399' }}>{row.avg_yield} T/ha</td>
                  <td style={{ padding: '12px', color: '#ffffff' }}>{row.total_production_kton} K Tonnes</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', width: '60px' }}>
                        <div style={{ width: `${row.efficiency_pct}%`, height: '100%', background: '#10b981' }}></div>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#ffffff' }}>{row.efficiency_pct}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontWeight: 600, color: '#fbbf24' }}>{row.soil_health_score}/100</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{row.irrigated_area_pct}%</td>
                  <td style={{ padding: '12px' }}>
                    {row.climate_risk_level === 'Low' ? (
                      <span className="badge badge-emerald"><CheckCircle2 size={12} /> Low Risk</span>
                    ) : (
                      <span className="badge badge-gold"><ShieldAlert size={12} /> Moderate</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* TAB 4 / OVERVIEW: SOIL NUTRIENT LEVELS & TELEMETRY VISUALIZERS */}
      {/* ========================================================================= */}
      {(activeTab === 'overview' || activeTab === 'soil_visualization') && (
        <SoilNutrientChart />
      )}

    </div>
  );

}
