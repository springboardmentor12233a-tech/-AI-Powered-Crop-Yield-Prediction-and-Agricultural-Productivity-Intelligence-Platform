/**
 * PageBanner — Compact agricultural hero banner.
 * Accepts a custom `image` path so each page shows a unique crop photograph.
 * Falls back to the existing crop-field.jpg if no image is provided.
 * All text passes WCAG AA contrast over the dark-green gradient overlay.
 */
export default function PageBanner({
  icon = '🌿',
  title,
  subtitle,
  image = '/crop-field.jpg',
  objectPosition = 'center 45%',
  minHeight = '100px',
}) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      borderRadius: '16px', marginBottom: '22px',
      background: '#1a4028', minHeight,
    }}>
      <img
        src={image}
        alt=""
        aria-hidden="true"
        loading="lazy"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition,
          opacity: 0.55,
          transition: 'opacity 0.4s',
        }}
        onError={e => { e.target.style.display = 'none' }}
      />
      {/* Dark gradient overlay for WCAG contrast */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(10,30,14,0.82) 0%, rgba(20,55,30,0.55) 100%)',
      }} />
      <div style={{
        position: 'relative',
        padding: '22px 28px',
        display: 'flex', alignItems: 'center', gap: '14px',
      }}>
        <span style={{ fontSize: '24px', flexShrink: 0 }}>{icon}</span>
        <div>
          <h1 style={{
            fontSize: '1.25rem', fontWeight: 800,
            color: '#fff', marginBottom: '3px',
            textShadow: '0 1px 6px rgba(0,0,0,0.4)',
          }}>{title}</h1>
          {subtitle && (
            <p style={{
              fontSize: '0.8rem', color: 'rgba(255,255,255,0.80)',
              lineHeight: 1.5, maxWidth: '540px',
            }}>{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  )
}
