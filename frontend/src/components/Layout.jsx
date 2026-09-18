import { Link, useLocation, useNavigate } from 'react-router-dom'

const NAV_LINKS = [
  { path: '/',        label: 'Dashboard',       icon: '▤' },
  { path: '/predict', label: 'Yield Prediction', icon: '◎' },
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

      {/* ─── Sidebar ────────────────────────────────────────────────────── */}
      <aside style={{
        width: '220px',
        background: 'var(--bg-white)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
      }}>

        {/* Brand */}
        <div style={{
          padding: '22px 20px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px',
              background: 'var(--primary)',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff',
              fontSize: '17px',
              flexShrink: 0,
            }}>🌿</div>
            <div>
              <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                YieldSense
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                AI Platform
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '14px 12px' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 8px 8px' }}>
            Navigation
          </div>
          {NAV_LINKS.map(link => {
            const active = location.pathname === link.path
            return (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '9px',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '2px',
                  background: active ? 'var(--primary-bg)' : 'transparent',
                  color: active ? 'var(--primary)' : 'var(--text-muted)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: active ? 600 : 400,
                  transition: 'all var(--transition)',
                }}
              >
                <span style={{ fontSize: '13px', opacity: 0.8 }}>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User info + logout */}
        <div style={{ padding: '14px 12px', borderTop: '1px solid var(--border)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px',
            background: 'var(--bg-page)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '10px',
          }}>
            <div style={{
              width: '30px', height: '30px',
              background: 'var(--primary)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 700,
              flexShrink: 0,
            }}>
              {(user.username || 'U')[0].toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.username || 'Farmer'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {user.role || 'farmer'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all var(--transition)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#b91c1c'; e.currentTarget.style.borderColor = '#fecaca'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* ─── Main Content ────────────────────────────────────────────── */}
      <main style={{
        flex: 1,
        marginLeft: '220px',
        padding: '32px 36px',
        minHeight: '100vh',
        background: 'var(--bg-page)',
      }}>
        {children}
      </main>
    </div>
  )
}
