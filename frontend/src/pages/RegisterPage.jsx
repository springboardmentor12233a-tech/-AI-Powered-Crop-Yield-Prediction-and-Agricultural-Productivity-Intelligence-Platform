import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'

const ROLES = ['farmer', 'researcher', 'admin']

export default function RegisterPage() {
  const navigate  = useNavigate()
  const [form, setForm] = useState({
    username: '', email: '', password: '', confirm_password: '',
    full_name: '', role: 'farmer', farm_name: '', farm_location: '',
  })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  function update(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await authAPI.register({
        username: form.username, email: form.email,
        password: form.password, full_name: form.full_name,
        role: form.role, farm_name: form.farm_name, farm_location: form.farm_location,
      })
      const res = await authAPI.login({ username: form.username, password: form.password })
      localStorage.setItem('ys_token', res.data.access_token)
      localStorage.setItem('ys_user', JSON.stringify(res.data.user))
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = { display: 'flex', flexDirection: 'column', gap: '5px' }
  const labelStyle = { fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-page)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px',
    }}>
      <div className="animate-fade-in" style={{
        background: 'var(--bg-white)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        width: '100%', maxWidth: '540px',
        padding: '40px',
      }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              width: '36px', height: '36px', background: 'var(--primary)',
              borderRadius: '8px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#fff', fontSize: '16px',
            }}>🌿</div>
            <span style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>YieldSense AI</span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Create your account</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Join the platform to start predicting crop yields
          </p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="grid-2">
            <div style={inputStyle}>
              <label style={labelStyle} htmlFor="reg-username">Username *</label>
              <input id="reg-username" type="text" className="form-input" placeholder="johndoe"
                value={form.username} onChange={e => update('username', e.target.value)} required />
            </div>
            <div style={inputStyle}>
              <label style={labelStyle} htmlFor="reg-fullname">Full Name</label>
              <input id="reg-fullname" type="text" className="form-input" placeholder="John Doe"
                value={form.full_name} onChange={e => update('full_name', e.target.value)} />
            </div>
          </div>

          <div style={inputStyle}>
            <label style={labelStyle} htmlFor="reg-email">Email *</label>
            <input id="reg-email" type="email" className="form-input" placeholder="john@farm.com"
              value={form.email} onChange={e => update('email', e.target.value)} required />
          </div>

          <div className="grid-2">
            <div style={inputStyle}>
              <label style={labelStyle} htmlFor="reg-password">Password *</label>
              <input id="reg-password" type="password" className="form-input" placeholder="Min 6 characters"
                value={form.password} onChange={e => update('password', e.target.value)} required />
            </div>
            <div style={inputStyle}>
              <label style={labelStyle} htmlFor="reg-confirm">Confirm Password *</label>
              <input id="reg-confirm" type="password" className="form-input" placeholder="Repeat password"
                value={form.confirm_password} onChange={e => update('confirm_password', e.target.value)} required />
            </div>
          </div>

          <div style={inputStyle}>
            <label style={labelStyle} htmlFor="reg-role">Role</label>
            <select id="reg-role" className="form-select" value={form.role} onChange={e => update('role', e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>

          <div className="grid-2">
            <div style={inputStyle}>
              <label style={labelStyle} htmlFor="reg-farm">Farm Name</label>
              <input id="reg-farm" type="text" className="form-input" placeholder="Green Valley Farm"
                value={form.farm_name} onChange={e => update('farm_name', e.target.value)} />
            </div>
            <div style={inputStyle}>
              <label style={labelStyle} htmlFor="reg-location">Farm Location</label>
              <input id="reg-location" type="text" className="form-input" placeholder="Punjab, India"
                value={form.farm_location} onChange={e => update('farm_location', e.target.value)} />
            </div>
          </div>

          <button type="submit" id="register-btn" className="btn btn-primary btn-full"
            disabled={loading} style={{ marginTop: '6px', padding: '11px', fontSize: '0.9375rem' }}>
            {loading ? <><span className="spinner" /> Creating account...</> : 'Create Account'}
          </button>
        </form>

        <div className="divider" style={{ margin: '22px 0' }} />
        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
