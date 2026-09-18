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
      display: 'flex',
      background: 'var(--bg-page)',
    }}>
      {/* Left panel */}
      <div style={{
        flex: '0 0 420px',
        background: 'var(--primary)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 48px',
        color: '#fff',
      }}>
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            width: '48px', height: '48px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px',
            marginBottom: '24px',
          }}>🌿</div>
          <h1 style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.2, marginBottom: '10px' }}>
            YieldSense AI
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', lineHeight: 1.7 }}>
            Crop Yield Prediction & Agricultural Productivity Forecasting System
          </p>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '32px' }}>
          {[
            ['Machine Learning Prediction', 'R² = 0.9772 accuracy'],
            ['Weather & Soil Analysis', 'Data-driven insights'],
            ['AI Agricultural Insights', 'Powered by Groq LLM'],
          ].map(([title, sub]) => (
            <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '18px' }}>
              <div style={{ width: '6px', height: '6px', background: 'rgba(255,255,255,0.6)', borderRadius: '50%', marginTop: '7px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>{title}</div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 32px',
      }}>
        <div style={{ width: '100%', maxWidth: '380px' }} className="animate-fade-in">
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '6px' }}>Sign in to your account</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Enter your credentials to continue</p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <input
                id="username" type="text" className="form-input"
                placeholder="Enter your username"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password" type="password" className="form-input"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              id="login-btn"
              className="btn btn-primary btn-full"
              disabled={loading}
              style={{ marginTop: '6px', padding: '11px 20px', fontSize: '0.9375rem' }}
            >
              {loading ? <><span className="spinner" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <div className="divider" style={{ margin: '24px 0' }} />

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Don&apos;t have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
