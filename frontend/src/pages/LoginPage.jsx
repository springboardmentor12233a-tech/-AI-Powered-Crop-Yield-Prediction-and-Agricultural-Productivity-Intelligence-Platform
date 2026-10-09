import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm]       = useState({ username: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authAPI.login(form)
      localStorage.setItem('ys_token', res.data.access_token)
      localStorage.setItem('ys_user', JSON.stringify(res.data.user))
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* ── Full-bleed background: banana leaves / blue sky ─────────────── */}
      <img
        src="/banana-leaves.jpeg"
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center',
          zIndex: 0,
        }}
      />
      {/* Very light vignette to push card to the front */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'radial-gradient(ellipse 60% 70% at 50% 45%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.38) 100%)',
      }} />

      {/* ── Central Glassmorphism Login Card ────────────────────────────── */}
      <div className="animate-fade-in" style={{
        position: 'relative', zIndex: 2,
        width: '100%', maxWidth: '420px',
        margin: '24px',
        background: 'rgba(255,255,255,0.18)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(255,255,255,0.45)',
        borderRadius: '24px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.5)',
        padding: '44px 40px',
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'rgba(255,255,255,0.25)',
            border: '1.5px solid rgba(255,255,255,0.5)',
            fontSize: '26px', marginBottom: '14px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}>🌿</div>
          <h1 style={{
            fontSize: '1.6rem', fontWeight: 800, lineHeight: 1.2,
            color: '#fff', textShadow: '0 1px 8px rgba(0,0,0,0.4)',
            marginBottom: '5px',
          }}>YieldSense AI</h1>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.82)', fontWeight: 500, letterSpacing: '0.02em' }}>
            Agricultural Intelligence Platform
          </p>
        </div>

        <h2 style={{
          fontSize: '1.05rem', fontWeight: 700, color: '#fff',
          textShadow: '0 1px 6px rgba(0,0,0,0.3)',
          marginBottom: '20px',
        }}>Sign in to your account</h2>

        {error && (
          <div style={{
            marginBottom: '16px', padding: '12px 16px',
            background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.4)',
            borderRadius: '12px', color: '#fff', fontSize: '0.85rem',
            backdropFilter: 'blur(4px)',
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: '6px' }}
              htmlFor="username">Username</label>
            <input
              id="username" type="text"
              placeholder="Enter your username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
              style={{
                width: '100%', padding: '11px 15px',
                background: 'rgba(255,255,255,0.22)',
                border: '1.5px solid rgba(255,255,255,0.4)',
                borderRadius: '12px', outline: 'none',
                color: '#fff', fontSize: '0.9rem',
                backdropFilter: 'blur(6px)',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.85)'; e.target.style.background = 'rgba(255,255,255,0.28)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.4)'; e.target.style.background = 'rgba(255,255,255,0.22)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: '6px' }}
              htmlFor="password">Password</label>
            <input
              id="password" type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              style={{
                width: '100%', padding: '11px 15px',
                background: 'rgba(255,255,255,0.22)',
                border: '1.5px solid rgba(255,255,255,0.4)',
                borderRadius: '12px', outline: 'none',
                color: '#fff', fontSize: '0.9rem',
                backdropFilter: 'blur(6px)',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.85)'; e.target.style.background = 'rgba(255,255,255,0.28)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.4)'; e.target.style.background = 'rgba(255,255,255,0.22)' }}
            />
          </div>

          <button
            id="login-btn"
            type="submit"
            disabled={loading}
            style={{
              marginTop: '6px',
              width: '100%', padding: '13px',
              background: loading ? 'rgba(46,125,50,0.6)' : 'linear-gradient(135deg, #2E7D32 0%, #388E3C 100%)',
              color: '#fff', fontWeight: 700, fontSize: '0.95rem',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '14px', cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 20px rgba(46,125,50,0.5)',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {loading ? (<><span className="spinner" /> Signing in...</>) : 'Sign In'}
          </button>
        </form>

        <div style={{ margin: '22px 0', height: '1px', background: 'rgba(255,255,255,0.25)' }} />

        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)' }}>
          Don&apos;t have an account?{' '}
          <Link to="/register" style={{
            color: '#86efac', fontWeight: 700, textDecoration: 'none',
          }}>Create account</Link>
        </p>

        {/* Feature badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
          {['🌾 ML Prediction', '🌦 Weather AI', '🤖 Groq LLM'].map(badge => (
            <span key={badge} style={{
              padding: '4px 10px', borderRadius: '999px',
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.28)',
              fontSize: '0.68rem', color: 'rgba(255,255,255,0.88)', fontWeight: 500,
            }}>{badge}</span>
          ))}
        </div>
      </div>

      {/* Placeholder text for input colours */}
      <style>{`
        input::placeholder { color: rgba(255,255,255,0.55) !important; }
      `}</style>
    </div>
  )
}
