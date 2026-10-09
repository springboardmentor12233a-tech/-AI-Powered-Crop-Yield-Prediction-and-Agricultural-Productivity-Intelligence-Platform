import { useState } from 'react'
import { recommendationAPI } from '../services/api'
import PageBanner from '../components/PageBanner'

const CROPS             = ['Rice', 'Wheat', 'Maize', 'Sugarcane', 'Cotton', 'Soybean', 'Barley', 'Sorghum']
const SOIL_TYPES        = ['Loamy', 'Sandy', 'Clay', 'Silty', 'Peaty', 'Chalky']
const REGIONS           = ['North', 'South', 'East', 'West', 'Central']
const WEATHER_CONDITIONS = ['Sunny', 'Rainy', 'Cloudy', 'Windy', 'Stormy']

const DEFAULT = {
  region: 'North', rainfall_mm: 900, temperature_c: 27,
  weather_condition: 'Sunny', soil_type: 'Loamy',
  nitrogen: 80, phosphorus: 50, potassium: 60, soil_ph: 6.5,
  fertilizer_used: 1, irrigation_used: 1,
}

const cardStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '22px 24px' }
const sectionLabel = { fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }

const toggleStyle = (active) => ({
  flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-sm)',
  border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
  background: active ? 'var(--primary-bg)' : '#fff',
  color: active ? 'var(--primary)' : 'var(--text-muted)',
  cursor: 'pointer', fontWeight: active ? 600 : 400,
  fontSize: '0.875rem', transition: 'all var(--transition)',
})

const MEDAL = ['🥇', '🥈', '🥉']

export default function RecommendationPage() {
  const [form, setForm]     = useState(DEFAULT)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setResult(null); setLoading(true)
    try {
      const res = await recommendationAPI.getCropRecommendation(form)
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Recommendation failed. Ensure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <PageBanner
        icon="🌾"
        title="Crop Recommendation"
        subtitle="Enter your farm conditions to get a data-driven crop recommendation"
        image="/rice-stalk.jpeg"
        objectPosition="center 35%"
        minHeight="110px"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '24px', alignItems: 'start' }}>

        {/* Form */}
        <div style={cardStyle}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            <div>
              <div style={sectionLabel}>Location</div>
              <div className="form-group">
                <label className="form-label" htmlFor="rec-region">Region</label>
                <select id="rec-region" className="form-select" value={form.region} onChange={e => upd('region', e.target.value)}>
                  {REGIONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div>
              <div style={sectionLabel}>Weather Conditions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="rec-rain">Rainfall (mm)</label>
                    <input id="rec-rain" type="number" className="form-input" value={form.rainfall_mm}
                      min={0} max={5000} step={10} onChange={e => upd('rainfall_mm', parseFloat(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="rec-temp">Temperature (°C)</label>
                    <input id="rec-temp" type="number" className="form-input" value={form.temperature_c}
                      min={-10} max={60} step={0.5} onChange={e => upd('temperature_c', parseFloat(e.target.value))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="rec-weather">Weather Condition</label>
                  <select id="rec-weather" className="form-select" value={form.weather_condition} onChange={e => upd('weather_condition', e.target.value)}>
                    {WEATHER_CONDITIONS.map(w => <option key={w}>{w}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <div style={sectionLabel}>Soil Parameters</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="rec-soil">Soil Type</label>
                  <select id="rec-soil" className="form-select" value={form.soil_type} onChange={e => upd('soil_type', e.target.value)}>
                    {SOIL_TYPES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="rec-n">Nitrogen (kg/ha)</label>
                    <input id="rec-n" type="number" className="form-input" value={form.nitrogen} min={0} max={200} step={1} onChange={e => upd('nitrogen', parseFloat(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="rec-p">Phosphorus (kg/ha)</label>
                    <input id="rec-p" type="number" className="form-input" value={form.phosphorus} min={0} max={200} step={1} onChange={e => upd('phosphorus', parseFloat(e.target.value))} />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="rec-k">Potassium (kg/ha)</label>
                    <input id="rec-k" type="number" className="form-input" value={form.potassium} min={0} max={200} step={1} onChange={e => upd('potassium', parseFloat(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="rec-ph">Soil pH</label>
                    <input id="rec-ph" type="number" className="form-input" value={form.soil_ph} min={0} max={14} step={0.1} onChange={e => upd('soil_ph', parseFloat(e.target.value))} />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div style={sectionLabel}>Agricultural Inputs</div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Fertilizer Available</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[['Yes', 1], ['No', 0]].map(([l, v]) => (
                      <button key={v} type="button" id={`rec-fert-${l.toLowerCase()}`} onClick={() => upd('fertilizer_used', v)} style={toggleStyle(form.fertilizer_used === v)}>{l}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Irrigation Available</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[['Yes', 1], ['No', 0]].map(([l, v]) => (
                      <button key={v} type="button" id={`rec-irrig-${l.toLowerCase()}`} onClick={() => upd('irrigation_used', v)} style={toggleStyle(form.irrigation_used === v)}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button type="submit" id="rec-submit-btn" className="btn btn-primary btn-full"
              disabled={loading} style={{ padding: '11px', fontSize: '0.9375rem' }}>
              {loading ? <><span className="spinner" /> Analyzing conditions...</> : 'Get Crop Recommendation'}
            </button>
          </form>
        </div>

        {/* Result */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {result ? (
            <>
              {/* Primary recommendation */}
              <div style={{ ...cardStyle, borderLeft: '4px solid var(--primary)', padding: '24px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  Recommended Crop
                </div>
                <div style={{ fontFamily: 'DM Sans', fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {result.recommended_crop}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  Expected avg yield: <strong style={{ color: 'var(--primary)' }}>{result.expected_avg_yield_kg_per_acre} kg/acre</strong>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, background: '#f9fafb', borderRadius: '6px', padding: '12px' }}>
                  <strong>Basis: </strong>{result.recommendation_basis}
                </div>
              </div>

              {/* Top 3 */}
              <div style={cardStyle}>
                <div className="section-title" style={{ marginBottom: '14px' }}>Top 3 Recommendations</div>
                {result.top_3_recommendations.map((c, i) => (
                  <div key={c.crop} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', marginBottom: '6px',
                    background: i === 0 ? 'var(--primary-bg)' : '#f9fafb',
                    border: `1px solid ${i === 0 ? '#bbf7d0' : '#e5e7eb'}`,
                    borderRadius: '8px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.1rem' }}>{MEDAL[i] || (i + 1)}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{c.crop}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.records_matched} matching records</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>{c.expected_avg_yield_kg_per_acre}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>kg/acre avg</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ ...cardStyle, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6, background: '#fffbeb', borderColor: '#fde68a' }}>
                <strong>Note: </strong>{result.note}
              </div>
            </>
          ) : (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px', opacity: 0.2 }}>🌾</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Fill in the form and click <strong style={{ color: 'var(--text-secondary)' }}>Get Crop Recommendation</strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
