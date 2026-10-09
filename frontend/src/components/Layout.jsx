import { Link, useLocation, useNavigate } from 'react-router-dom'

const NAV_GROUPS = [
  {
    label: 'Main',
    links: [
      { path: '/',         label: 'Dashboard' },
      { path: '/predict',  label: 'Yield Prediction' },
      { path: '/history',  label: 'Prediction History' },
      { path: '/chatbot',  label: 'AI Assistant' },
    ],
  },
  {
    label: 'Analytics (M3)',
    links: [
      { path: '/productivity',   label: 'Productivity Analysis' },
      { path: '/recommendation', label: 'Crop Recommendation' },
      { path: '/resources',      label: 'Resource Optimization' },
      { path: '/risk',           label: 'Risk Assessment' },
    ],
  },
]

export default function Layout({ children }) {
  const location = useLocation()
  const navigate  = useNavigate()
  const user      = JSON.parse(localStorage.getItem('ys_user') || '{}')

  function handleLogout() {
    localStorage.removeItem('ys_token')
    localStorage.removeItem('ys_user')
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>

      {/* ─── Sidebar ─────────────────────────────────────────────────────── */}
      <aside style={{
        width: '220px',
        background: 'var(--bg-white)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
        overflowY: 'auto',
      }}>

        {/* Brand */}
        <div style={{ position: 'relative', overflow: 'hidden', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
          {/* Mini field photo strip */}
          <img
            src="/floating-leaves.jpeg"
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center 40%', opacity: 0.22,
            }}
            onError={e => { e.target.style.display = 'none' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(240,250,244,0.95) 100%)' }} />
          <div style={{ position: 'relative', padding: '18px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px', height: '34px', background: 'var(--primary)',
                borderRadius: '9px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#fff', fontSize: '16px', flexShrink: 0,
                boxShadow: '0 2px 8px rgba(45,125,70,0.3)',
              }}>🌿</div>
              <div>
                <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--primary)', lineHeight: 1.2 }}>YieldSense</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>AI Agriculture Platform</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation groups */}
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {NAV_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-faint)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                padding: '0 8px 6px',
              }}>
                {group.label}
              </div>
              {group.links.map(link => {
                const active = location.pathname === link.path
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    style={{
                      display: 'block',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '1px',
                      background: active ? 'var(--primary-bg)' : 'transparent',
                      color: active ? 'var(--primary)' : 'var(--text-muted)',
                      textDecoration: 'none',
                      fontSize: '0.8375rem',
                      fontWeight: active ? 600 : 400,
                      transition: 'all var(--transition)',
                      borderLeft: active ? '3px solid var(--primary)' : '3px solid transparent',
                    }}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* User panel */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 12px', background: 'var(--bg-page)',
            borderRadius: 'var(--radius-md)', marginBottom: '8px',
          }}>
            <div style={{
              width: '28px', height: '28px', background: 'var(--primary)',
              borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 700, flexShrink: 0,
            }}>
              {(user.username || 'U')[0].toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.username || 'Farmer'}
              </div>
              <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {user.role || 'farmer'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '7px 12px',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
              background: 'transparent', color: 'var(--text-muted)',
              fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
              transition: 'all var(--transition)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#b91c1c'; e.currentTarget.style.borderColor = '#fecaca' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <main style={{ flex: 1, marginLeft: '220px', padding: '30px 34px', minHeight: '100vh', background: 'var(--bg-page)' }}>
        {children}
      </main>
    </div>
  )
}
