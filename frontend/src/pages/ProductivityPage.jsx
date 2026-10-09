import { useEffect, useState } from 'react'
import { productivityAPI } from '../services/api'
import PageBanner from '../components/PageBanner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'

const TOOLTIP_STYLE = {
  backgroundColor: '#fff', border: '1px solid #e5e7eb',
  borderRadius: '6px', color: '#111827', fontSize: '0.8rem',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
}

const COLORS = ['#2d7d46', '#3b82f6', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#0d9488', '#f43f5e']

const cardStyle = {
  background: '#fff', border: '1px solid #e5e7eb',
  borderRadius: '12px', padding: '20px 22px',
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

export default function ProductivityPage() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')
  const [tab, setTab]       = useState('crops')

  useEffect(() => {
    productivityAPI.getAnalysis()
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.detail || 'Failed to load productivity data.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minHeight: '60vh', justifyContent: 'center', color: 'var(--text-muted)' }}>
      <div className="spinner" /><span style={{ fontSize: '0.875rem' }}>Loading productivity analysis...</span>
    </div>
  )
  if (error) return <div className="alert alert-error">{error}</div>

  const { overall_statistics: stats, crop_productivity, yield_by_weather_condition,
          yield_by_soil_type, yield_by_region, agricultural_input_impact, yield_by_rainfall_bracket } = data

  return (
    <div className="animate-fade-in">
      <PageBanner
        icon="📊"
        title="Productivity Analysis"
        subtitle={`Condition-based analysis from ${stats.total_records.toLocaleString()} records. ${data.note}`}
        image="/rice-stalk.jpeg"
        objectPosition="center 40%"
        minHeight="110px"
      />

      {/* Summary cards */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <StatCard label="Average Yield"         value={stats.average_yield.toLocaleString()} unit="kg/acre" />
        <StatCard label="Highest-Yielding Crop" value={data.highest_yielding_crop} unit="by avg yield" />
        <StatCard label="Lowest-Yielding Crop"  value={data.lowest_yielding_crop}  unit="by avg yield" />
        <StatCard label="Yield Range"            value={`${stats.min_yield}–${stats.max_yield}`} unit="kg/acre" />
      </div>

      {/* Fertilizer / Irrigation impact summary */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {[
          {
            title: 'Fertilizer Impact',
            gain: agricultural_input_impact.fertilizer.avg_yield_gain_kg_per_acre,
            with: agricultural_input_impact.fertilizer.with_fertilizer,
            without: agricultural_input_impact.fertilizer.without_fertilizer,
            withLabel: 'With fertilizer', withoutLabel: 'Without fertilizer',
          },
          {
            title: 'Irrigation Impact',
            gain: agricultural_input_impact.irrigation.avg_yield_gain_kg_per_acre,
            with: agricultural_input_impact.irrigation.with_irrigation,
            without: agricultural_input_impact.irrigation.without_irrigation,
            withLabel: 'With irrigation', withoutLabel: 'Without irrigation',
          },
        ].map(item => (
          <div key={item.title} style={cardStyle}>
            <div className="section-title" style={{ marginBottom: '14px' }}>{item.title}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.withLabel}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>{item.with} kg/acre</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.withoutLabel}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{item.without} kg/acre</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg Gain</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: item.gain > 0 ? '#16a34a' : '#dc2626' }}>
                  +{item.gain} kg/acre
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[
          { key: 'crops',   label: 'Crop Productivity' },
          { key: 'weather', label: 'By Weather' },
          { key: 'soil',    label: 'By Soil Type' },
          { key: 'rainfall',label: 'By Rainfall' },
          { key: 'region',  label: 'By Region' },
        ].map(t => (
          <button key={t.key} id={`prod-tab-${t.key}`}
            className={`tab-btn ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* Crop Productivity */}
      {tab === 'crops' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={cardStyle}>
            <div className="section-title" style={{ marginBottom: '16px' }}>Crop Productivity Comparison</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={crop_productivity.map(c => ({ name: c.Crop, yield: c.avg_yield }))} barSize={42}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f9fafb' }} />
                <Bar dataKey="yield" name="Avg Yield (kg/acre)" radius={[4, 4, 0, 0]}>
                  {crop_productivity.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={cardStyle}>
            <div className="section-title" style={{ marginBottom: '14px' }}>Crop Productivity Table</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rank</th><th>Crop</th><th>Avg Yield (kg/acre)</th>
                    <th>Median</th><th>Max</th><th>Min</th><th>Records</th>
                  </tr>
                </thead>
                <tbody>
                  {crop_productivity.map((c, i) => (
                    <tr key={c.Crop} className={i === 0 ? 'best-row' : ''}>
                      <td>{i === 0 ? '★ 1' : i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{c.Crop}</td>
                      <td style={{ fontFamily: 'monospace' }}>{c.avg_yield}</td>
                      <td style={{ fontFamily: 'monospace' }}>{c.median_yield}</td>
                      <td style={{ fontFamily: 'monospace' }}>{c.max_yield}</td>
                      <td style={{ fontFamily: 'monospace' }}>{c.min_yield}</td>
                      <td>{c.records}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* By Weather */}
      {tab === 'weather' && (
        <div style={cardStyle}>
          <div className="section-title" style={{ marginBottom: '18px' }}>Avg Yield by Weather Condition</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={yield_by_weather_condition.map(w => ({ name: w.Weather_Condition, yield: w.avg_yield }))} barSize={48}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f9fafb' }} />
              <Bar dataKey="yield" fill="#2d7d46" name="Avg Yield (kg/acre)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* By Soil */}
      {tab === 'soil' && (
        <div style={cardStyle}>
          <div className="section-title" style={{ marginBottom: '18px' }}>Avg Yield by Soil Type</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={yield_by_soil_type.map(s => ({ name: s.Soil_Type, yield: s.avg_yield }))} barSize={48}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f9fafb' }} />
              <Bar dataKey="yield" name="Avg Yield (kg/acre)" radius={[4, 4, 0, 0]}>
                {yield_by_soil_type.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* By Rainfall */}
      {tab === 'rainfall' && (
        <div style={cardStyle}>
          <div className="section-title" style={{ marginBottom: '18px' }}>Avg Yield by Rainfall Bracket</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={yield_by_rainfall_bracket.map(r => ({ name: r.bracket, yield: r.avg_yield }))} barSize={48}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f9fafb' }} />
              <Bar dataKey="yield" fill="#3b82f6" name="Avg Yield (kg/acre)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* By Region */}
      {tab === 'region' && (
        <div style={cardStyle}>
          <div className="section-title" style={{ marginBottom: '18px' }}>Avg Yield by Region</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={yield_by_region.map(r => ({ name: r.Region, yield: r.avg_yield }))} barSize={48}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f9fafb' }} />
              <Bar dataKey="yield" fill="#d97706" name="Avg Yield (kg/acre)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
