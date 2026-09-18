import { useEffect, useState } from 'react'
import { analysisAPI, predictionAPI } from '../services/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'

// Clean, professional chart colors — muted palette
const CHART_COLORS = ['#2d7d46', '#3b82f6', '#d97706', '#7c3aed', '#dc2626', '#0891b2']

const TOOLTIP_STYLE = {
  backgroundColor: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  color: '#111827',
  fontSize: '0.8rem',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
}

function StatCard({ label, value, unit = '' }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {unit && <div className="stat-sub">{unit}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const [activeTab, setActiveTab]   = useState('weather')
  const [weather, setWeather]       = useState(null)
  const [soil, setSoil]             = useState(null)
  const [modelInfo, setModelInfo]   = useState(null)
  const [comparison, setComparison] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  useEffect(() => {
    async function loadAll() {
      setLoading(true); setError('')
      try {
        const [wRes, sRes, mRes, cRes] = await Promise.all([
          analysisAPI.getWeatherAnalysis(),
          analysisAPI.getSoilAnalysis(),
          predictionAPI.getModelInfo(),
          predictionAPI.getModelComparison(),
        ])
        setWeather(wRes.data)
        setSoil(sRes.data)
        setModelInfo(mRes.data)
        setComparison(cRes.data.models || [])
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load analytics data.')
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px', color: 'var(--text-muted)' }}>
      <div className="spinner" />
      <span style={{ fontSize: '0.875rem' }}>Loading analytics...</span>
    </div>
  )

  if (error) return (
    <div>
      <div className="alert alert-error">{error}</div>
      <p style={{ color: 'var(--text-muted)', marginTop: '10px', fontSize: '0.85rem' }}>
        Ensure the backend is running: <code>uvicorn main:app --reload</code>
      </p>
    </div>
  )

  const yieldByCondition = weather
    ? Object.entries(weather.yield_by_weather_condition).map(([k, v]) => ({ name: k, yield: v }))
    : []
  const yieldByCrop = weather
    ? Object.entries(weather.yield_by_crop).map(([k, v]) => ({ name: k, yield: v }))
    : []
  const yieldBySoil = soil
    ? Object.entries(soil.yield_by_soil_type).map(([k, v]) => ({ name: k, yield: v }))
    : []
  const npkCorr = soil ? [
    { name: 'Nitrogen',   correlation: soil.nutrient_yield_correlation.nitrogen_vs_yield },
    { name: 'Phosphorus', correlation: soil.nutrient_yield_correlation.phosphorus_vs_yield },
    { name: 'Potassium',  correlation: soil.nutrient_yield_correlation.potassium_vs_yield },
    { name: 'Soil pH',    correlation: soil.nutrient_yield_correlation.soil_ph_vs_yield },
  ] : []
  const sortedModels = [...comparison].sort((a, b) => b.r2_score - a.r2_score)

  const cardStyle = {
    background: 'var(--bg-white)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px 22px',
  }

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">Agricultural Analytics</h1>
        <p className="page-subtitle">
          Data-driven insights from {weather?.total_records_analyzed?.toLocaleString()} crop yield records
        </p>
      </div>

      {/* Summary stat cards */}
      {modelInfo && (
        <div className="grid-4" style={{ marginBottom: '28px' }}>
          <StatCard label="Best ML Model"    value={modelInfo.best_model || '—'} unit="Selected model" />
          <StatCard label="R² Score"         value={modelInfo.r2_score?.toFixed(4)} unit="Higher is better" />
          <StatCard label="Training Records" value={modelInfo.total_training_rows?.toLocaleString()} unit="dataset rows" />
          <StatCard label="Target Variable"  value="Yield" unit="kg/acre predicted" />
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {[
          { key: 'weather', label: 'Weather Analysis' },
          { key: 'soil',    label: 'Soil Analysis' },
          { key: 'models',  label: 'Model Comparison' },
        ].map(t => (
          <button
            key={t.key}
            id={`tab-${t.key}`}
            className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Weather Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'weather' && weather && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="grid-4">
            <StatCard label="Avg Rainfall"      value={weather.rainfall_statistics.mean?.toFixed(0)} unit="mm/year" />
            <StatCard label="Avg Temperature"   value={weather.temperature_statistics.mean?.toFixed(1)} unit="°C" />
            <StatCard label="Rainfall–Yield r"  value={weather.correlations.rainfall_vs_yield} unit="Pearson correlation" />
            <StatCard label="Temp–Yield r"      value={weather.correlations.temperature_vs_yield} unit="Pearson correlation" />
          </div>

          <div className="grid-2">
            <div style={cardStyle}>
              <div className="section-title" style={{ marginBottom: '18px' }}>Yield by Weather Condition</div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={yieldByCondition} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f9fafb' }} />
                  <Bar dataKey="yield" fill="#2d7d46" radius={[4, 4, 0, 0]} name="Avg Yield (kg/acre)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={cardStyle}>
              <div className="section-title" style={{ marginBottom: '18px' }}>Avg Yield by Crop Type</div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={yieldByCrop} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#6b7280', fontSize: 11 }} width={72} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f9fafb' }} />
                  <Bar dataKey="yield" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Avg Yield (kg/acre)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={cardStyle}>
            <div className="section-title" style={{ marginBottom: '14px' }}>Weather Interpretation</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(weather.interpretation).map(([key, val]) => (
                <div key={key} style={{
                  padding: '12px 16px', background: '#f9fafb',
                  borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary)',
                  fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6,
                }}>
                  <strong style={{ color: 'var(--primary)', textTransform: 'capitalize' }}>{key}: </strong>
                  {val}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Soil Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'soil' && soil && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="grid-4">
            <StatCard label="Avg Nitrogen"   value={soil.nitrogen_statistics.mean?.toFixed(1)} unit="kg/ha" />
            <StatCard label="Avg Phosphorus" value={soil.phosphorus_statistics.mean?.toFixed(1)} unit="kg/ha" />
            <StatCard label="Avg Potassium"  value={soil.potassium_statistics.mean?.toFixed(1)} unit="kg/ha" />
            <StatCard label="Avg Soil pH"    value={soil.soil_ph_statistics.mean?.toFixed(2)} unit={`Best: ${soil.top_soil_type_by_yield}`} />
          </div>

          <div className="grid-2">
            <div style={cardStyle}>
              <div className="section-title" style={{ marginBottom: '18px' }}>Yield by Soil Type</div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={yieldBySoil} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f9fafb' }} />
                  <Bar dataKey="yield" radius={[4, 4, 0, 0]} name="Avg Yield (kg/acre)">
                    {yieldBySoil.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={cardStyle}>
              <div className="section-title" style={{ marginBottom: '18px' }}>NPK Correlation with Yield</div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={npkCorr} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f9fafb' }} />
                  <Bar dataKey="correlation" radius={[4, 4, 0, 0]} name="Pearson r">
                    {npkCorr.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={cardStyle}>
            <div className="section-title" style={{ marginBottom: '14px' }}>Soil Interpretation</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(soil.interpretation).map(([key, val]) => (
                <div key={key} style={{
                  padding: '12px 16px', background: '#f9fafb',
                  borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent)',
                  fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6,
                }}>
                  <strong style={{ color: 'var(--accent)', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}: </strong>
                  {val}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Model Comparison Tab ──────────────────────────────────────────── */}
      {activeTab === 'models' && comparison.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={cardStyle}>
            <div className="section-title" style={{ marginBottom: '16px' }}>Model Comparison — GridSearchCV Results</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>R² Score</th>
                    <th>MAE (kg/acre)</th>
                    <th>RMSE (kg/acre)</th>
                    <th>CV Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedModels.map((m, i) => (
                    <tr key={m.model_name} className={i === 0 ? 'best-row' : ''}>
                      <td style={{ fontWeight: 600 }}>{i === 0 ? '★ ' : ''}{m.model_name}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{m.r2_score.toFixed(4)}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{m.mae.toFixed(2)}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{m.rmse.toFixed(2)}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{m.cv_best_score.toFixed(4)}</td>
                      <td>
                        {i === 0
                          ? <span className="badge badge-green">Best Model</span>
                          : <span className="badge badge-gray">Evaluated</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid-2">
            <div style={cardStyle}>
              <div className="section-title" style={{ marginBottom: '18px' }}>R² Score (higher is better)</div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={sortedModels.map(m => ({ name: m.model_name.split(' ')[0], r2: m.r2_score }))} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0.9, 1]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f9fafb' }} />
                  <Bar dataKey="r2" name="R² Score" radius={[4, 4, 0, 0]}>
                    {sortedModels.map((_, i) => <Cell key={i} fill={i === 0 ? '#2d7d46' : '#9ca3af'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={cardStyle}>
              <div className="section-title" style={{ marginBottom: '18px' }}>RMSE (lower is better)</div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={sortedModels.map(m => ({ name: m.model_name.split(' ')[0], rmse: m.rmse }))} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f9fafb' }} />
                  <Bar dataKey="rmse" name="RMSE" radius={[4, 4, 0, 0]}>
                    {sortedModels.map((_, i) => <Cell key={i} fill={i === 0 ? '#2d7d46' : '#9ca3af'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
