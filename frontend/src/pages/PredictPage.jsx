import { useState } from 'react'
import { predictionAPI, insightsAPI } from '../services/api'

const CROPS             = ['Rice', 'Wheat', 'Maize', 'Sugarcane', 'Cotton', 'Soybean', 'Barley', 'Sorghum']
const SOIL_TYPES        = ['Loamy', 'Sandy', 'Clay', 'Silty', 'Peaty', 'Chalky']
const REGIONS           = ['North', 'South', 'East', 'West', 'Central']
const WEATHER_CONDITIONS = ['Sunny', 'Rainy', 'Cloudy', 'Windy', 'Stormy']

const DEFAULT_FORM = {
  crop: 'Rice', rainfall_mm: 900, temperature_c: 27,
  fertilizer_used: 1, irrigation_used: 1,
  weather_condition: 'Sunny', soil_type: 'Loamy', region: 'North',
  nitrogen: 80, phosphorus: 50, potassium: 60, soil_ph: 6.5,
}

const cardStyle = {
  background: 'var(--bg-white)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: '24px',
}

const sectionLabel = {
  fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.07em',
  paddingBottom: '12px', borderBottom: '1px solid var(--border)',
  marginBottom: '14px',
}

export default function PredictPage() {
  const [form, setForm]             = useState(DEFAULT_FORM)
  const [prediction, setPrediction] = useState(null)
  const [insights, setInsights]     = useState(null)
  const [loading, setLoading]       = useState(false)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [error, setError]           = useState('')

  function update(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handlePredict(e) {
    e.preventDefault()
    setError(''); setPrediction(null); setInsights(null); setLoading(true)
    try {
      const res = await predictionAPI.predict(form)
      setPrediction(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed. Ensure backend is running and model is trained.')
    } finally {
      setLoading(false)
    }
  }

  async function handleInsights() {
    if (!prediction) return
    setInsightsLoading(true)
    try {
      const res = await insightsAPI.getInsights({
        ...form, predicted_yield_kg_per_acre: prediction.predicted_yield_kg_per_acre,
      })
      setInsights(res.data)
    } catch (err) {
      setInsights({
        insights: err.response?.data?.detail || 'Failed to get AI insights.',
        provider: 'Groq', model: 'N/A', disclaimer: 'Error occurred.',
      })
    } finally {
      setInsightsLoading(false)
    }
  }

  const toggleStyle = (active) => ({
    flex: 1, padding: '9px 12px',
    borderRadius: 'var(--radius-sm)',
    border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
    background: active ? 'var(--primary-bg)' : 'var(--bg-white)',
    color: active ? 'var(--primary)' : 'var(--text-muted)',
    cursor: 'pointer', fontWeight: active ? 600 : 400,
    fontSize: '0.875rem', transition: 'all var(--transition)',
  })

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">Crop Yield Prediction</h1>
        <p className="page-subtitle">Enter your farm parameters to get an ML-powered yield prediction</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px', alignItems: 'start' }}>

        {/* ─── Left: Input Form ────────────────────────────────────────── */}
        <div style={cardStyle}>
          <form onSubmit={handlePredict} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Crop & Region */}
            <div>
              <div style={sectionLabel}>Crop & Location</div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="crop">Crop</label>
                  <select id="crop" className="form-select" value={form.crop} onChange={e => update('crop', e.target.value)}>
                    {CROPS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="region">Region</label>
                  <select id="region" className="form-select" value={form.region} onChange={e => update('region', e.target.value)}>
                    {REGIONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Weather */}
            <div>
              <div style={sectionLabel}>Weather Parameters</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="rainfall">Rainfall (mm)</label>
                    <input id="rainfall" type="number" className="form-input"
                      value={form.rainfall_mm} min={0} max={5000} step={10}
                      onChange={e => update('rainfall_mm', parseFloat(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="temperature">Temperature (°C)</label>
                    <input id="temperature" type="number" className="form-input"
                      value={form.temperature_c} min={-10} max={60} step={0.5}
                      onChange={e => update('temperature_c', parseFloat(e.target.value))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="weather_condition">Weather Condition</label>
                  <select id="weather_condition" className="form-select" value={form.weather_condition}
                    onChange={e => update('weather_condition', e.target.value)}>
                    {WEATHER_CONDITIONS.map(w => <option key={w}>{w}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Soil */}
            <div>
              <div style={sectionLabel}>Soil Parameters</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="soil_type">Soil Type</label>
                  <select id="soil_type" className="form-select" value={form.soil_type}
                    onChange={e => update('soil_type', e.target.value)}>
                    {SOIL_TYPES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="nitrogen">Nitrogen (kg/ha)</label>
                    <input id="nitrogen" type="number" className="form-input"
                      value={form.nitrogen} min={0} max={200} step={1}
                      onChange={e => update('nitrogen', parseFloat(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="phosphorus">Phosphorus (kg/ha)</label>
                    <input id="phosphorus" type="number" className="form-input"
                      value={form.phosphorus} min={0} max={200} step={1}
                      onChange={e => update('phosphorus', parseFloat(e.target.value))} />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="potassium">Potassium (kg/ha)</label>
                    <input id="potassium" type="number" className="form-input"
                      value={form.potassium} min={0} max={200} step={1}
                      onChange={e => update('potassium', parseFloat(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="soil_ph">Soil pH</label>
                    <input id="soil_ph" type="number" className="form-input"
                      value={form.soil_ph} min={0} max={14} step={0.1}
                      onChange={e => update('soil_ph', parseFloat(e.target.value))} />
                  </div>
                </div>
              </div>
            </div>

            {/* Agricultural Inputs */}
            <div>
              <div style={sectionLabel}>Agricultural Inputs</div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Fertilizer Used</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[['Yes', 1], ['No', 0]].map(([label, val]) => (
                      <button key={val} type="button" id={`fertilizer-${label.toLowerCase()}`}
                        onClick={() => update('fertilizer_used', val)}
                        style={toggleStyle(form.fertilizer_used === val)}>{label}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Irrigation Used</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[['Yes', 1], ['No', 0]].map(([label, val]) => (
                      <button key={val} type="button" id={`irrigation-${label.toLowerCase()}`}
                        onClick={() => update('irrigation_used', val)}
                        style={toggleStyle(form.irrigation_used === val)}>{label}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button type="submit" id="predict-btn" className="btn btn-primary btn-full"
              disabled={loading} style={{ padding: '11px', fontSize: '0.9375rem' }}>
              {loading ? <><span className="spinner" /> Predicting yield...</> : 'Predict Crop Yield'}
            </button>
          </form>
        </div>

        {/* ─── Right: Results ───────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Prediction result */}
          {prediction ? (
            <div className="yield-result">
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                Predicted Yield
              </div>
              <div className="yield-number">
                {prediction.predicted_yield_kg_per_acre.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </div>
              <div className="yield-unit">kg per acre</div>
              <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                <span className="badge badge-green">{prediction.model_used}</span>
                <span className="badge badge-gray">{prediction.prediction_confidence === 'high' ? 'High Confidence' : 'Medium Confidence'}</span>
              </div>
              <div style={{
                marginTop: '14px', padding: '10px 14px',
                background: 'rgba(0,0,0,0.04)', borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5,
              }}>
                This yield is predicted by the ML model. Use AI Insights below for an explanation.
              </div>
            </div>
          ) : (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 24px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px', opacity: 0.3 }}>◎</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Fill in the form and click <strong style={{ color: 'var(--text-secondary)' }}>Predict Crop Yield</strong>
              </p>
            </div>
          )}

          {/* AI Insights button */}
          {prediction && (
            <button id="ai-insights-btn" className="btn btn-outline btn-full"
              onClick={handleInsights} disabled={insightsLoading}
              style={{ padding: '10px', fontSize: '0.875rem' }}>
              {insightsLoading ? <><span className="spinner" /> Generating insights...</> : 'Get AI Agricultural Insights'}
            </button>
          )}

          {/* AI Insights result */}
          {insights && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div className="section-title">AI Agricultural Insights</div>
                <span className="badge badge-blue">{insights.provider}</span>
              </div>
              <div className="insights-box">{insights.insights}</div>
              <div className="alert alert-info" style={{ fontSize: '0.78rem' }}>{insights.disclaimer}</div>
            </div>
          )}

          {/* Input summary */}
          {prediction && (
            <div style={cardStyle}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                Input Summary
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
                {[
                  ['Crop', form.crop], ['Region', form.region],
                  ['Rainfall', `${form.rainfall_mm} mm`], ['Temperature', `${form.temperature_c}°C`],
                  ['Soil Type', form.soil_type], ['Soil pH', form.soil_ph],
                  ['N/P/K', `${form.nitrogen}/${form.phosphorus}/${form.potassium}`],
                  ['Fertilizer', form.fertilizer_used ? 'Yes' : 'No'],
                ].map(([k, v]) => (
                  <div key={k} style={{ padding: '8px 10px', background: 'var(--bg-page)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ color: 'var(--text-faint)', fontSize: '0.7rem', marginBottom: '2px' }}>{k}</div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.8125rem' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
