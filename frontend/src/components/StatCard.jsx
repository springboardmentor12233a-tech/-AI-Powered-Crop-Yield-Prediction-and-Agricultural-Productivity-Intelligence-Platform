import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, unit, trend, icon: Icon, color = '#10b981', description }) {
  const isPositive = trend && trend.startsWith('+');

  return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>{title}</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{value}</span>
            {unit && <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 600 }}>{unit}</span>}
          </div>
        </div>
        <div style={{ 
          width: '42px', 
          height: '42px', 
          borderRadius: '12px', 
          background: `${color}18`, 
          border: `1px solid ${color}33`,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: color
        }}>
          {Icon && <Icon size={22} />}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: 0 }}>{description}</p>
        {trend && (
          <span style={{ 
            fontSize: '0.75rem', 
            fontWeight: 700, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '3px',
            color: isPositive ? '#34d399' : '#f87171',
            background: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            padding: '2px 8px',
            borderRadius: '12px'
          }}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
