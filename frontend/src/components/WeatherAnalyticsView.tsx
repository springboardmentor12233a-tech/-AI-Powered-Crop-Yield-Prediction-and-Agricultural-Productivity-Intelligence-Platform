import React, { useState, useEffect } from 'react';
import { CloudRain, Sun, Thermometer, Wind, Info } from 'lucide-react';

interface WeatherProps {
  apiBaseUrl?: string;
}

export const WeatherAnalyticsView: React.FC<WeatherProps> = ({ apiBaseUrl = 'http://localhost:8000' }) => {
  const [selectedRegion, setSelectedRegion] = useState('North India');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeather(selectedRegion);
  }, [selectedRegion]);

  const fetchWeather = async (region: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/weather/analysis?region=${encodeURIComponent(region)}`);
      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.detail || 'Failed to fetch weather analytics');
      }
      const json = await response.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Error fetching weather data.');
    } finally {
      setLoading(false);
    }
  };

  const analytics = data?.analytics;

  return (
    <div className="section-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '1.5rem 1.75rem', background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(16,185,129,0.08) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
              <CloudRain className="gradient-text-green" size={28} />
              <h2 style={{ fontSize: '1.4rem', color: '#ffffff', margin: 0, fontWeight: 800 }}>
                Regional Weather & Climate Impact Analytics
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
              Analyze seasonal rainfall adequacy, temperature stress risks, and sunlight exposure index per agricultural region.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <Info size={16} color="#60a5fa" />
            <span style={{ fontSize: '0.8rem', color: '#93c5fd', fontWeight: 600 }}>
              {data?.status_claim || 'Dataset-based Weather Analytics'}
            </span>
          </div>
        </div>
      </div>

      {/* Region Selector Bar */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <label style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 700 }}>Select Region:</label>
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          style={{
            background: '#0c1610',
            color: '#ffffff',
            border: '1px solid var(--border-color)',
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 600,
            minWidth: '240px',
            outline: 'none'
          }}
        >
          <option value="North India" style={{ background: '#0c1610', color: '#ffffff' }}>North India</option>
          <option value="South India" style={{ background: '#0c1610', color: '#ffffff' }}>South India</option>
          <option value="South USA" style={{ background: '#0c1610', color: '#ffffff' }}>South USA</option>
          <option value="Central USA" style={{ background: '#0c1610', color: '#ffffff' }}>Central USA</option>
          <option value="East Africa" style={{ background: '#0c1610', color: '#ffffff' }}>East Africa</option>
        </select>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Showing telemetry metrics for <strong style={{ color: '#34d399' }}>{selectedRegion}</strong>
        </span>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', padding: '1rem', borderRadius: '8px', color: '#fca5a5' }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
          Loading regional climate telemetry...
        </div>
      )}

      {analytics && !loading && (
        <>
          {/* Top Weather Score Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#60a5fa' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rainfall Adequacy</span>
                <CloudRain size={22} />
              </div>
              <div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#ffffff', margin: '0.4rem 0', letterSpacing: '-0.02em' }}>
                  {analytics.rainfall_adequacy_score} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ 100</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Avg Rainfall: <strong style={{ color: '#93c5fd' }}>{analytics.average_rainfall_mm} mm</strong>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#f59e0b' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Temp Stress Risk</span>
                <Thermometer size={22} />
              </div>
              <div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#ffffff', margin: '0.4rem 0', letterSpacing: '-0.02em' }}>
                  {analytics.temperature_stress_risk} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ 100</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Avg Temp: <strong style={{ color: '#fde68a' }}>{analytics.average_temperature_C} °C</strong>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#34d399' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Humidity Balance</span>
                <Wind size={22} />
              </div>
              <div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#ffffff', margin: '0.4rem 0', letterSpacing: '-0.02em' }}>
                  {analytics.humidity_balance_score} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ 100</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Avg Humidity: <strong style={{ color: '#a7f3d0' }}>{analytics.average_humidity_percent} %</strong>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid #fbbf24' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fbbf24' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sunlight Exposure</span>
                <Sun size={22} />
              </div>
              <div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#ffffff', margin: '0.4rem 0', letterSpacing: '-0.02em' }}>
                  {analytics.sunlight_exposure_score} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ 100</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Avg Sunlight: <strong style={{ color: '#fef08a' }}>{analytics.average_sunlight_hours} hrs/day</strong>
                </div>
              </div>
            </div>

          </div>

          {/* Regional Climate Summary Banner */}
          <div className="glass-card" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(59,130,246,0.06) 100%)' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#ffffff', margin: '0 0 0.75rem 0', fontWeight: 700 }}>
              Overall Weather Climate Score for {selectedRegion}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#34d399' }}>
                {analytics.overall_weather_score} <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ 100</span>
              </div>
              <div style={{ flex: 1, minWidth: '240px', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Evaluated across <strong style={{ color: '#ffffff' }}>{analytics.record_count}</strong> regional telemetry sample records from dataset source <code style={{ color: '#60a5fa' }}>{data?.data_source}</code>.
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
