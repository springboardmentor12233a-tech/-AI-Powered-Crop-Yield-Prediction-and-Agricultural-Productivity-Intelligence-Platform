import { useEffect, useState, useCallback } from 'react'
import { historyAPI, reportAPI } from '../services/api'

const CROPS = ['All', 'Rice', 'Wheat', 'Maize', 'Sugarcane', 'Cotton', 'Soybean', 'Barley', 'Sorghum']

const cardStyle = {
  background: '#fff', border: '1px solid #e5e7eb',
  borderRadius: '12px', padding: '20px 24px',
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function DetailModal({ record, onClose }) {
  const [dlLoading, setDlLoading] = useState(false)

  async function handleDownload() {
    setDlLoading(true)
    try {
      const r = await reportAPI.downloadById(record.id)
      downloadBlob(r.data, `YieldSense_${record.crop}_${record.id}.pdf`)
    } catch { alert('Report download failed. Please try again.') }
    finally { setDlLoading(false) }
  }

  const rows = [
    ['Crop',               record.crop],
    ['Region',             record.region],
    ['Rainfall',           `${record.rainfall_mm} mm`],
    ['Temperature',        `${record.temperature_c}°C`],
    ['Weather Condition',  record.weather_condition],
    ['Soil Type',          record.soil_type],
    ['Soil pH',            record.soil_ph],
    ['Nitrogen',           `${record.nitrogen} kg/ha`],
    ['Phosphorus',         `${record.phosphorus} kg/ha`],
    ['Potassium',          `${record.potassium} kg/ha`],
    ['Fertilizer Used',    record.fertilizer_used ? 'Yes' : 'No'],
    ['Irrigation Used',    record.irrigation_used ? 'Yes' : 'No'],
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '24px',
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: '12px', maxWidth: '560px', width: '100%',
        maxHeight: '90vh', overflowY: 'auto', padding: '28px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Prediction #{record.id}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {record.crop} — {record.predicted_yield_kg_per_acre.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg/acre
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {new Date(record.created_at).toLocaleString()}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1.4rem', color: 'var(--text-muted)', padding: '0 4px',
          }}>×</button>
        </div>

        {/* Prediction result highlight */}
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px',
          padding: '14px 18px', marginBottom: '18px', display: 'flex', gap: '24px',
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Predicted Yield</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
              {record.predicted_yield_kg_per_acre.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg/acre
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ML Model</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{record.model_used}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Confidence</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', textTransform: 'capitalize' }}>{record.prediction_confidence}</div>
          </div>
        </div>

        {/* Parameters table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '20px' }}>
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '7px 10px', color: 'var(--text-muted)', width: '50%' }}>{k}</td>
                <td style={{ padding: '7px 10px', color: 'var(--text-primary)', fontWeight: 500 }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleDownload} disabled={dlLoading}
            className="btn btn-primary" style={{ flex: 1, padding: '9px' }}>
            {dlLoading ? <><span className="spinner" /> Generating...</> : 'Download PDF Report'}
          </button>
          <button onClick={onClose}
            className="btn btn-outline" style={{ flex: 1, padding: '9px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default function HistoryPage() {
  const [records, setRecords]   = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [cropFilter, setCropFilter] = useState('All')
  const [selected, setSelected] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const PAGE_SIZE = 20
  const [offset, setOffset]     = useState(0)

  const load = useCallback(async (off = 0, crop = cropFilter) => {
    setLoading(true); setError('')
    try {
      const params = { limit: PAGE_SIZE, offset: off }
      if (crop !== 'All') params.crop = crop
      const r = await historyAPI.getHistory(params)
      setRecords(r.data.predictions)
      setTotal(r.data.total)
      setOffset(off)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load prediction history.')
    } finally {
      setLoading(false)
    }
  }, [cropFilter])

  useEffect(() => { load(0) }, [])

  function handleCropFilter(crop) {
    setCropFilter(crop)
    load(0, crop)
  }

  async function handleDelete(id) {
    if (!window.confirm(`Delete prediction #${id}? This cannot be undone.`)) return
    setDeleting(id)
    try {
      await historyAPI.deleteHistory(id)
      load(offset)
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to delete prediction.')
    } finally {
      setDeleting(null)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  return (
    <div className="animate-fade-in">
      {selected && <DetailModal record={selected} onClose={() => setSelected(null)} />}

      {/* Header banner */}
      <div style={{
        position: 'relative', overflow: 'hidden', borderRadius: '12px',
        marginBottom: '22px', background: '#1a4028', minHeight: '100px',
      }}>
        <img src="/floating-leaves.jpeg" alt="" aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 50%', opacity: 0.3 }}
          onError={e => { e.target.style.display = 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(15,40,20,0.9) 0%, rgba(25,65,38,0.65) 100%)' }} />
        <div style={{ position: 'relative', padding: '22px 28px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '24px' }}>📋</span>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '3px' }}>Prediction History</h1>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Your saved crop yield predictions — newest first</p>
          </div>
        </div>
      </div>

      {/* Filters row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Filter by crop:</span>
        {CROPS.map(c => (
          <button key={c} id={`filter-${c.toLowerCase()}`}
            onClick={() => handleCropFilter(c)}
            style={{
              padding: '5px 14px', borderRadius: '999px', fontSize: '0.8rem',
              cursor: 'pointer', fontWeight: cropFilter === c ? 600 : 400,
              background: cropFilter === c ? 'var(--primary-bg)' : '#fff',
              color: cropFilter === c ? 'var(--primary)' : 'var(--text-muted)',
              border: `1px solid ${cropFilter === c ? '#bbf7d0' : '#e5e7eb'}`,
              transition: 'all 0.15s',
            }}>{c}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {total} prediction{total !== 1 ? 's' : ''} total
        </span>
      </div>

      {/* Error */}
      {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{error}</div>}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', padding: '40px', justifyContent: 'center' }}>
          <div className="spinner" /><span>Loading history...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && records.length === 0 && (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: '2.5rem', opacity: 0.15, marginBottom: '14px' }}>📋</div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>No predictions yet</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {cropFilter !== 'All'
              ? `No predictions found for ${cropFilter}. Try a different filter.`
              : 'Go to Yield Prediction to run your first prediction — it will appear here automatically.'}
          </p>
        </div>
      )}

      {/* Records table */}
      {!loading && records.length > 0 && (
        <div style={cardStyle}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Crop</th>
                  <th>Region</th>
                  <th>Predicted Yield</th>
                  <th>ML Model</th>
                  <th>Confidence</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{r.id}</td>
                    <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {new Date(r.created_at).toLocaleDateString()}<br />
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                        {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{r.crop}</td>
                    <td>{r.region}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>
                      {r.predicted_yield_kg_per_acre.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg/acre
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{r.model_used}</td>
                    <td>
                      <span className={`badge ${r.prediction_confidence === 'high' ? 'badge-green' : 'badge-gray'}`}
                        style={{ textTransform: 'capitalize' }}>{r.prediction_confidence}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          id={`view-${r.id}`}
                          onClick={() => setSelected(r)}
                          style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          View
                        </button>
                        <button
                          id={`delete-${r.id}`}
                          onClick={() => handleDelete(r.id)}
                          disabled={deleting === r.id}
                          style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', fontSize: '0.78rem', color: '#dc2626' }}>
                          {deleting === r.id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
              <button
                id="prev-page"
                disabled={offset === 0}
                onClick={() => load(offset - PAGE_SIZE)}
                style={{ padding: '5px 14px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: offset === 0 ? 'not-allowed' : 'pointer', color: offset === 0 ? '#d1d5db' : 'var(--text-secondary)', fontSize: '0.8rem' }}>
                ← Prev
              </button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                id="next-page"
                disabled={offset + PAGE_SIZE >= total}
                onClick={() => load(offset + PAGE_SIZE)}
                style={{ padding: '5px 14px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: offset + PAGE_SIZE >= total ? 'not-allowed' : 'pointer', color: offset + PAGE_SIZE >= total ? '#d1d5db' : 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
