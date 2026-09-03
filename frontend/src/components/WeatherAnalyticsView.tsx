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
    <div className="section-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(16,185,129,0.08) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <CloudRain className="gradient-text-green" size={28} />
              <h2 style={{ fontSize: '1.4rem', color: '#ffffff', margin: 0, fontWeight: 700 }}>
                Regional Weather & Climate Impact Analytics
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
              Analyze seasonal rainfall adequacy, temperature stress risks, and sunlight exposure index per agricultural region.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <Info size={16} color="#60a5fa" />
            <span style={{ fontSize: '0.78rem', color: '#93c5fd', fontWeight: 600 }}>
              {data?.status_claim || 'Dataset-based Weather Analytics'}
            </span>
          </div>
        </div>
      </div>

      {/* Region Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Select Region:</label>
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="search-input"
          style={{ width: '220px' }}
        >
          <option value="North India">North India</option>
          <option value="South India">South India</option>
          <option value="South USA">South USA</option>
          <option value="Central USA">Central USA</option>
          <option value="East Africa">East Africa</option>
        </select>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', padding: '1rem', borderRadius: '8px', color: '#fca5a5' }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
          Loading weather analytics...
        </div>
      )}

      {analytics && !loading && (
        <>
          {/* Top Score Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            
            <div className="glass-card" style={{ padding: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#60a5fa' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Rainfall Adequacy</span>
                <CloudRain size={20} />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', margin: '0.4rem 0' }}>
                {analytics.rainfall_adequacy_score} / 100
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Avg Rainfall: {analytics.average_rainfall_mm} mm
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Temp Stress Risk</span>
                <Thermometer size={20} />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', margin: '0.4rem 0' }}>
                {analytics.temperature_stress_risk} / 100
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Avg Temp: {analytics.average_temperature_C} °C
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Humidity Balance</span>
                <Wind size={20} />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', margin: '0.4rem 0' }}>
                {analytics.humidity_balance_score} / 100
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Avg Humidity: {analytics.average_humidity_percent} %
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fbbf24' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Sunlight Exposure</span>
                <Sun size={20} />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', margin: '0.4rem 0' }}>
                {analytics.sunlight_exposure_score} / 100
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Avg Sunlight: {analytics.average_sunlight_hours} hrs/day
              </div>
            </div>

          </div>

          {/* Overall Score Highlight */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#ffffff', margin: 0 }}>
                Overall Weather Impact Score for {data.region}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
                Combined weighted rating across rainfall, thermal stress, humidity, and daily solar exposure.
              </p>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', padding: '0.6rem 1.4rem', borderRadius: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>{analytics.overall_weather_score}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Favorable Index</span>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
