import { useState } from 'react'
import { resourcesAPI } from '../services/api'
import PageBanner from '../components/PageBanner'

const CROPS      = ['Rice', 'Wheat', 'Maize', 'Sugarcane', 'Cotton', 'Soybean', 'Barley', 'Sorghum']
const SOIL_TYPES = ['Loamy', 'Sandy', 'Clay', 'Silty', 'Peaty', 'Chalky']
const DEFAULT = {
  crop: 'Rice', soil_type: 'Loamy', nitrogen: 80, phosphorus: 50,
  potassium: 60, soil_ph: 6.5, rainfall_mm: 900,
  fertilizer_used: 1, irrigation_used: 1,
}
const cardStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '22px 24px' }
const toggleStyle = (active) => ({
  flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-sm)',
  border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
  background: active ? 'var(--primary-bg)' : '#fff',
  color: active ? 'var(--primary)' : 'var(--text-muted)',
  cursor: 'pointer', fontWeight: active ? 600 : 400, fontSize: '0.875rem',
  transition: 'all var(--transition)',
})

const STATUS_COLOR = { Optimal: '#16a34a', Low: '#d97706', High: '#dc2626' }
const STATUS_BG    = { Optimal: '#f0fdf4', Low: '#fffbeb', High: '#fef2f2' }

function NutrientCard({ item }) {
  return (
    <div style={{
      padding: '14px 16px', borderRadius: '8px',
      background: STATUS_BG[item.status] || '#f9fafb',
      border: `1px solid ${item.status === 'Optimal' ? '#bbf7d0' : item.status === 'High' ? '#fecaca' : '#fde68a'}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.nutrient}</div>
        <span style={{
          display: 'inline-block', padding: '2px 10px', borderRadius: '999px',
          fontSize: '0.72rem', fontWeight: 600,
          color: STATUS_COLOR[item.status] || '#374151',
          background: 'rgba(255,255,255,0.7)',
          border: `1px solid ${STATUS_COLOR[item.status] || '#d1d5db'}`,
        }}>{item.status}</span>
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
        Current: <strong>{item.current_value} {item.unit}</strong> | Optimal range: {item.optimal_range}
      </div>
      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {item.recommendation}
      </div>
    </div>
  )
}

export default function ResourcesPage() {
  const [form, setForm]     = useState(DEFAULT)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setResult(null); setLoading(true)
    try {
      const res = await resourcesAPI.optimize(form)
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Optimization failed.')
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = result
    ? result.optimization_score >= 70 ? '#16a34a'
      : result.optimization_score >= 45 ? '#d97706' : '#dc2626'
    : 'var(--primary)'

  return (
    <div className="animate-fade-in">
      <PageBanner
        icon="💧"
        title="Resource Optimization"
        subtitle="Data-driven fertilizer, irrigation, and NPK recommendations based on dataset analysis"
        image="/tractor-field.jpeg"
        objectPosition="center 60%"
        minHeight="110px"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', alignItems: 'start' }}>

        {/* Form */}
        <div style={cardStyle}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="res-crop">Crop</label>
              <select id="res-crop" className="form-select" value={form.crop} onChange={e => upd('crop', e.target.value)}>
                {CROPS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="res-soil">Soil Type</label>
              <select id="res-soil" className="form-select" value={form.soil_type} onChange={e => upd('soil_type', e.target.value)}>
                {SOIL_TYPES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="res-rain">Rainfall (mm)</label>
              <input id="res-rain" type="number" className="form-input" value={form.rainfall_mm} min={0} max={5000} step={10} onChange={e => upd('rainfall_mm', parseFloat(e.target.value))} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="res-n">Nitrogen (kg/ha)</label>
                <input id="res-n" type="number" className="form-input" value={form.nitrogen} min={0} max={200} step={1} onChange={e => upd('nitrogen', parseFloat(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="res-p">Phosphorus (kg/ha)</label>
                <input id="res-p" type="number" className="form-input" value={form.phosphorus} min={0} max={200} step={1} onChange={e => upd('phosphorus', parseFloat(e.target.value))} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="res-k">Potassium (kg/ha)</label>
                <input id="res-k" type="number" className="form-input" value={form.potassium} min={0} max={200} step={1} onChange={e => upd('potassium', parseFloat(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="res-ph">Soil pH</label>
                <input id="res-ph" type="number" className="form-input" value={form.soil_ph} min={0} max={14} step={0.1} onChange={e => upd('soil_ph', parseFloat(e.target.value))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Fertilizer</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[['Using', 1], ['Not Using', 0]].map(([l, v]) => (
                  <button key={v} type="button" id={`res-fert-${v}`} onClick={() => upd('fertilizer_used', v)} style={toggleStyle(form.fertilizer_used === v)}>{l}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Irrigation</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[['Using', 1], ['Not Using', 0]].map(([l, v]) => (
                  <button key={v} type="button" id={`res-irrig-${v}`} onClick={() => upd('irrigation_used', v)} style={toggleStyle(form.irrigation_used === v)}>{l}</button>
                ))}
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            <button type="submit" id="res-submit-btn" className="btn btn-primary btn-full" disabled={loading} style={{ padding: '10px' }}>
              {loading ? <><span className="spinner" /> Analyzing...</> : 'Analyze Resources'}
            </button>
          </form>
        </div>

        {/* Results */}
        {result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
            {/* Score */}
            <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                border: `4px solid ${scoreColor}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: scoreColor }}>{result.optimization_score}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>/ 100</div>
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Resource Optimization: <span style={{ color: scoreColor }}>{result.optimization_level}</span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Crop: {result.crop}</div>
              </div>
            </div>

            {/* Fertilizer & Irrigation */}
            <div className="grid-2">
              {[
                { title: 'Fertilizer', rec: result.fertilizer_recommendation },
                { title: 'Irrigation', rec: result.irrigation_recommendation },
              ].map(({ title, rec }) => (
                <div key={title} style={{ ...cardStyle, borderLeft: '3px solid var(--primary)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px' }}>{title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>{rec.current_status}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: '#f9fafb', padding: '8px', borderRadius: '6px', marginBottom: '6px' }}>
                    {rec.dataset_finding}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {rec.recommendation}
                  </div>
                </div>
              ))}
            </div>

            {/* Nutrient flags */}
            <div style={cardStyle}>
              <div className="section-title" style={{ marginBottom: '14px' }}>Nutrient & Soil pH Assessment</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {result.nutrient_recommendations.map(item => <NutrientCard key={item.nutrient} item={item} />)}
              </div>
            </div>

            {/* Crop typical NPK */}
            <div style={{ ...cardStyle, background: '#f8faff', borderColor: '#bfdbfe' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px', color: 'var(--accent)' }}>
                Typical NPK for {result.crop_typical_npk.crop} (dataset average)
              </div>
              <div className="grid-4" style={{ gap: '10px' }}>
                {[
                  ['Nitrogen', result.crop_typical_npk.avg_nitrogen, 'kg/ha'],
                  ['Phosphorus', result.crop_typical_npk.avg_phosphorus, 'kg/ha'],
                  ['Potassium', result.crop_typical_npk.avg_potassium, 'kg/ha'],
                  ['Soil pH', result.crop_typical_npk.avg_soil_ph, ''],
                ].map(([name, val, unit]) => (
                  <div key={name} style={{ background: '#fff', borderRadius: '6px', padding: '10px 12px', border: '1px solid #dbeafe' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px' }}>{name}</div>
                    <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{val} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{unit}</span></div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '8px' }}>{result.crop_typical_npk.note}</div>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '10px 14px', background: '#fffbeb', borderRadius: '6px', border: '1px solid #fde68a' }}>
              {result.disclaimer}
            </div>
          </div>
        ) : (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px', opacity: 0.2 }}>⚗️</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Enter your crop parameters and click <strong>Analyze Resources</strong></p>
          </div>
        )}
      </div>
    </div>
  )
}
