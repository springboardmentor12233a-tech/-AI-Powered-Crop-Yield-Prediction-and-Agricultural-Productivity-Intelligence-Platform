import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'

const ROLES = ['farmer', 'researcher', 'admin']

const glassInput = {
  width: '100%', padding: '10px 14px',
  background: 'rgba(255,255,255,0.20)',
  border: '1.5px solid rgba(255,255,255,0.38)',
  borderRadius: '12px', outline: 'none',
  color: '#fff', fontSize: '0.875rem',
  backdropFilter: 'blur(6px)',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s, background 0.2s',
}
const glassLabel = {
  display: 'block', fontSize: '0.78rem', fontWeight: 600,
  color: 'rgba(255,255,255,0.88)', marginBottom: '5px',
}

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
    if (form.password !== form.confirm_password) { setError('Passwords do not match.'); return }
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

  const focusIn  = e => { e.target.style.borderColor = 'rgba(255,255,255,0.85)'; e.target.style.background = 'rgba(255,255,255,0.28)' }
  const focusOut = e => { e.target.style.borderColor = 'rgba(255,255,255,0.38)'; e.target.style.background = 'rgba(255,255,255,0.20)' }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '24px' }}>

      {/* Full-bleed banana-leaves background */}
      <img src="/banana-leaves.jpeg" alt="" aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', zIndex: 0 }} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'radial-gradient(ellipse 65% 75% at 50% 45%, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.42) 100%)' }} />

      {/* Glassmorphism registration card */}
      <div className="animate-fade-in" style={{
        position: 'relative', zIndex: 2,
        width: '100%', maxWidth: '520px',
        background: 'rgba(255,255,255,0.17)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(255,255,255,0.42)',
        borderRadius: '24px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.5)',
        padding: '36px 36px',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(46,125,50,0.75)', border: '1px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🌿</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,0.3)' }}>YieldSense AI</div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.72)' }}>Agricultural Intelligence Platform</div>
          </div>
        </div>

        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,0.3)', marginBottom: '6px' }}>Create your account</h2>
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', marginBottom: '20px' }}>Join the platform to start predicting crop yields</p>

        {error && (
          <div style={{ marginBottom: '14px', padding: '11px 14px', background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.4)', borderRadius: '12px', color: '#fff', fontSize: '0.82rem', backdropFilter: 'blur(4px)' }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={glassLabel} htmlFor="reg-username">Username *</label>
              <input id="reg-username" type="text" style={glassInput} placeholder="johndoe"
                value={form.username} onChange={e => update('username', e.target.value)}
                onFocus={focusIn} onBlur={focusOut} required />
            </div>
            <div>
              <label style={glassLabel} htmlFor="reg-fullname">Full Name</label>
              <input id="reg-fullname" type="text" style={glassInput} placeholder="John Doe"
                value={form.full_name} onChange={e => update('full_name', e.target.value)}
                onFocus={focusIn} onBlur={focusOut} />
            </div>
          </div>

          <div>
            <label style={glassLabel} htmlFor="reg-email">Email *</label>
            <input id="reg-email" type="email" style={glassInput} placeholder="john@farm.com"
              value={form.email} onChange={e => update('email', e.target.value)}
              onFocus={focusIn} onBlur={focusOut} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={glassLabel} htmlFor="reg-password">Password *</label>
              <input id="reg-password" type="password" style={glassInput} placeholder="Min 6 characters"
                value={form.password} onChange={e => update('password', e.target.value)}
                onFocus={focusIn} onBlur={focusOut} required />
            </div>
            <div>
              <label style={glassLabel} htmlFor="reg-confirm">Confirm Password *</label>
              <input id="reg-confirm" type="password" style={glassInput} placeholder="Repeat password"
                value={form.confirm_password} onChange={e => update('confirm_password', e.target.value)}
                onFocus={focusIn} onBlur={focusOut} required />
            </div>
          </div>

          <div>
            <label style={glassLabel} htmlFor="reg-role">Role</label>
            <select id="reg-role" style={{ ...glassInput, cursor: 'pointer' }}
              value={form.role} onChange={e => update('role', e.target.value)}>
              {ROLES.map(r => <option key={r} value={r} style={{ background: '#1a3a1e', color: '#fff' }}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={glassLabel} htmlFor="reg-farm">Farm Name</label>
              <input id="reg-farm" type="text" style={glassInput} placeholder="Green Valley Farm"
                value={form.farm_name} onChange={e => update('farm_name', e.target.value)}
                onFocus={focusIn} onBlur={focusOut} />
            </div>
            <div>
              <label style={glassLabel} htmlFor="reg-location">Farm Location</label>
              <input id="reg-location" type="text" style={glassInput} placeholder="Punjab, India"
                value={form.farm_location} onChange={e => update('farm_location', e.target.value)}
                onFocus={focusIn} onBlur={focusOut} />
            </div>
          </div>

          <button type="submit" id="register-btn" disabled={loading} style={{
            marginTop: '6px', width: '100%', padding: '13px',
            background: loading ? 'rgba(46,125,50,0.55)' : 'linear-gradient(135deg, #2E7D32 0%, #388E3C 100%)',
            color: '#fff', fontWeight: 700, fontSize: '0.95rem',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: '14px', cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 20px rgba(46,125,50,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
            {loading ? <><span className="spinner" /> Creating account...</> : 'Create Account'}
          </button>
        </form>

        <div style={{ margin: '18px 0', height: '1px', background: 'rgba(255,255,255,0.22)' }} />
        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#86efac', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>

      <style>{`input::placeholder, select::placeholder { color: rgba(255,255,255,0.50) !important; }`}</style>
    </div>
  )
}
