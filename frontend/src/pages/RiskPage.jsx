import { useState } from 'react'
import { riskAPI } from '../services/api'
import PageBanner from '../components/PageBanner'

const CROPS             = ['Rice', 'Wheat', 'Maize', 'Sugarcane', 'Cotton', 'Soybean', 'Barley', 'Sorghum']
const SOIL_TYPES        = ['Loamy', 'Sandy', 'Clay', 'Silty', 'Peaty', 'Chalky']
const REGIONS           = ['North', 'South', 'East', 'West', 'Central']
const WEATHER_CONDITIONS = ['Sunny', 'Rainy', 'Cloudy', 'Windy', 'Stormy']

const DEFAULT = {
  crop: 'Rice', rainfall_mm: 900, temperature_c: 27,
  weather_condition: 'Sunny', soil_type: 'Loamy', region: 'North',
  nitrogen: 80, phosphorus: 50, potassium: 60, soil_ph: 6.5,
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

const RISK_COLOR = { High: '#dc2626', Medium: '#d97706', Low: '#16a34a' }
const RISK_BG    = { High: '#fef2f2', Medium: '#fffbeb', Low: '#f0fdf4' }
const RISK_BORDER = { High: '#fecaca', Medium: '#fde68a', Low: '#bbf7d0' }

function RiskBadge({ level }) {
  return (
    <span style={{
      display: 'inline-block', padding: '3px 12px', borderRadius: '999px',
      fontSize: '0.78rem', fontWeight: 600,
      color: RISK_COLOR[level], background: RISK_BG[level],
      border: `1px solid ${RISK_BORDER[level]}`,
    }}>{level} Risk</span>
  )
}

function RiskItem({ item }) {
  return (
    <div style={{
      padding: '12px 16px', borderRadius: '8px', marginBottom: '8px',
      background: RISK_BG[item.risk_level],
      border: `1px solid ${RISK_BORDER[item.risk_level]}`,
      borderLeft: `4px solid ${RISK_COLOR[item.risk_level]}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.factor}</div>
        <RiskBadge level={item.risk_level} />
      </div>
      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {item.description}
      </div>
    </div>
  )
}

export default function RiskPage() {
  const [form, setForm]     = useState(DEFAULT)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [tab, setTab]       = useState('all')

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setResult(null); setLoading(true)
    try {
      const res = await riskAPI.assess(form)
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Risk assessment failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <PageBanner
        icon="⚠️"
        title="Agricultural Risk Assessment"
        subtitle="Analyze farm conditions and identify potential agricultural risks"
        image="/tractor-field.jpeg"
        objectPosition="center 45%"
        minHeight="110px"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', alignItems: 'start' }}>

        {/* Form */}
        <div style={cardStyle}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="risk-crop">Crop</label>
                <select id="risk-crop" className="form-select" value={form.crop} onChange={e => upd('crop', e.target.value)}>
                  {CROPS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="risk-region">Region</label>
                <select id="risk-region" className="form-select" value={form.region} onChange={e => upd('region', e.target.value)}>
                  {REGIONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="risk-rain">Rainfall (mm)</label>
                <input id="risk-rain" type="number" className="form-input" value={form.rainfall_mm} min={0} max={5000} step={10} onChange={e => upd('rainfall_mm', parseFloat(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="risk-temp">Temperature (°C)</label>
                <input id="risk-temp" type="number" className="form-input" value={form.temperature_c} min={-10} max={60} step={0.5} onChange={e => upd('temperature_c', parseFloat(e.target.value))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="risk-weather">Weather Condition</label>
              <select id="risk-weather" className="form-select" value={form.weather_condition} onChange={e => upd('weather_condition', e.target.value)}>
                {WEATHER_CONDITIONS.map(w => <option key={w}>{w}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="risk-soil">Soil Type</label>
              <select id="risk-soil" className="form-select" value={form.soil_type} onChange={e => upd('soil_type', e.target.value)}>
                {SOIL_TYPES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="risk-n">Nitrogen (kg/ha)</label>
                <input id="risk-n" type="number" className="form-input" value={form.nitrogen} min={0} max={200} step={1} onChange={e => upd('nitrogen', parseFloat(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="risk-p">Phosphorus (kg/ha)</label>
                <input id="risk-p" type="number" className="form-input" value={form.phosphorus} min={0} max={200} step={1} onChange={e => upd('phosphorus', parseFloat(e.target.value))} />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="risk-k">Potassium (kg/ha)</label>
                <input id="risk-k" type="number" className="form-input" value={form.potassium} min={0} max={200} step={1} onChange={e => upd('potassium', parseFloat(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="risk-ph">Soil pH</label>
                <input id="risk-ph" type="number" className="form-input" value={form.soil_ph} min={0} max={14} step={0.1} onChange={e => upd('soil_ph', parseFloat(e.target.value))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Fertilizer</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[['Yes', 1], ['No', 0]].map(([l, v]) => (
                  <button key={v} type="button" id={`risk-fert-${v}`} onClick={() => upd('fertilizer_used', v)} style={toggleStyle(form.fertilizer_used === v)}>{l}</button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Irrigation</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[['Yes', 1], ['No', 0]].map(([l, v]) => (
                  <button key={v} type="button" id={`risk-irrig-${v}`} onClick={() => upd('irrigation_used', v)} style={toggleStyle(form.irrigation_used === v)}>{l}</button>
                ))}
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            <button type="submit" id="risk-submit-btn" className="btn btn-primary btn-full" disabled={loading} style={{ padding: '10px' }}>
              {loading ? <><span className="spinner" /> Assessing risks...</> : 'Assess Agricultural Risk'}
            </button>
          </form>
        </div>

        {/* Results */}
        {result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
            {/* Overall risk banner */}
            <div style={{
              ...cardStyle, padding: '24px',
              background: RISK_BG[result.overall_risk_level],
              borderColor: RISK_BORDER[result.overall_risk_level],
              borderLeft: `6px solid ${RISK_COLOR[result.overall_risk_level]}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                    Overall Risk Level — {result.crop}
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: RISK_COLOR[result.overall_risk_level] }}>
                    {result.overall_risk_level} Risk
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {result.risk_summary}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '999px', background: '#fef2f2', color: '#dc2626', fontSize: '0.8rem', fontWeight: 600, border: '1px solid #fecaca' }}>
                      {result.high_risk_count} High
                    </span>
                    <span style={{ padding: '4px 12px', borderRadius: '999px', background: '#fffbeb', color: '#d97706', fontSize: '0.8rem', fontWeight: 600, border: '1px solid #fde68a' }}>
                      {result.medium_risk_count} Medium
                    </span>
                    <span style={{ padding: '4px 12px', borderRadius: '999px', background: '#f0fdf4', color: '#16a34a', fontSize: '0.8rem', fontWeight: 600, border: '1px solid #bbf7d0' }}>
                      {result.low_risks.length} Low
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab filter */}
            <div className="tabs">
              {[
                { key: 'all',    label: `All Factors (${result.all_risk_factors.length})` },
                { key: 'high',   label: `High Risk (${result.high_risk_count})` },
                { key: 'medium', label: `Medium Risk (${result.medium_risk_count})` },
                { key: 'low',    label: `Low Risk (${result.low_risks.length})` },
              ].map(t => (
                <button key={t.key} id={`risk-tab-${t.key}`}
                  className={`tab-btn ${tab === t.key ? 'active' : ''}`}
                  onClick={() => setTab(t.key)}>{t.label}</button>
              ))}
            </div>

            <div>
              {(tab === 'all'    ? result.all_risk_factors :
                tab === 'high'   ? result.high_risks :
                tab === 'medium' ? result.medium_risks :
                result.low_risks
              ).map((item, i) => <RiskItem key={i} item={item} />)}
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '10px 14px', background: '#fffbeb', borderRadius: '6px', border: '1px solid #fde68a' }}>
              {result.disclaimer}
            </div>
          </div>
        ) : (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px', opacity: 0.2 }}>⚠</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Enter your farm parameters and click <strong>Assess Agricultural Risk</strong></p>
          </div>
        )}
      </div>
    </div>
  )
}
