import { useState, useEffect } from 'react';
import { weatherAPI } from '../services/api';

const DEFAULT_LOC = { name: 'New Delhi, India', lat: 28.6139, lon: 77.2090 };
const CROPS = ['All Crops', 'Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Soybean', 'Potato', 'Tomato'];

export default function LiveWeatherPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState(DEFAULT_LOC);
  const [selectedCrop, setSelectedCrop] = useState('All Crops');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forecastData, setForecastData] = useState(null);

  useEffect(() => {
    fetchWeather(selectedLoc.lat, selectedLoc.lon, selectedLoc.name, selectedCrop);
  }, [selectedLoc, selectedCrop]);

  async function fetchWeather(lat, lon, locName, crop) {
    setLoading(true);
    setError(null);
    try {
      const cropParam = crop === 'All Crops' ? '' : crop;
      const res = await weatherAPI.getForecast(lat, lon, locName, cropParam);
      setForecastData(res.data);
    } catch (err) {
      console.error('Failed to load weather data:', err);
      setError(err.response?.data?.detail || 'Could not load real-time weather data.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await weatherAPI.searchLocation(searchQuery.trim());
      setSearchResults(res.data);
      if (res.data.length === 0) {
        setError(`No locations found for "${searchQuery}"`);
      }
    } catch (err) {
      setError('Location search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  }

  function handleSelectLocation(loc) {
    const newLoc = { name: loc.display_name, lat: loc.latitude, lon: loc.longitude };
    setSelectedLoc(newLoc);
    setSearchResults([]);
    setSearchQuery('');
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const newLoc = { name: `Current Location (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`, lat, lon };
        setSelectedLoc(newLoc);
      },
      (err) => {
        setLoading(false);
        alert('Could not retrieve your current location. Please search manually.');
      }
    );
  }

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'danger':
        return { bg: '#fef2f2', border: '#fecaca', color: '#dc2626', icon: '🚨' };
      case 'warning':
        return { bg: '#fffbe5', border: '#fef08a', color: '#b45309', icon: '⚠️' };
      case 'info':
        return { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', icon: 'ℹ️' };
      case 'success':
      default:
        return { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', icon: '✅' };
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Real-Time Farm Weather</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px', margin: 0 }}>
            Hyper-local weather metrics, 7-day forecasts & personalized agricultural recommendations.
          </p>
        </div>

        {/* Location Search & My Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Search city/region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                outline: 'none',
                fontSize: '0.875rem',
                minWidth: '220px',
              }}
            />
            <button
              type="submit"
              disabled={searching}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </form>

          <button
            onClick={handleUseMyLocation}
            title="Use My Geolocation"
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: '#fff',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            📍 My Location
          </button>

          {/* Search Dropdown Results */}
          {searchResults.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                marginTop: '4px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                zIndex: 50,
                maxHeight: '220px',
                overflowY: 'auto',
              }}
            >
              {searchResults.map((res, i) => (
                <div
                  key={i}
                  onClick={() => handleSelectLocation(res)}
                  style={{
                    padding: '10px 14px',
                    borderBottom: i < searchResults.length - 1 ? '1px solid #f0f0f0' : 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f7faf8')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                >
                  📍 <strong>{res.display_name}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Crop Filter Selector */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '14px 20px', border: '1px solid var(--border)', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>🌾</span>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Personalize Recommendations for Crop:</span>
        </div>
        <select
          value={selectedCrop}
          onChange={(e) => setSelectedCrop(e.target.value)}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            fontSize: '0.875rem',
            fontWeight: 500,
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          {CROPS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px' }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🌤️</div>
          <div>Fetching real-time satellite & meteorological data...</div>
        </div>
      ) : forecastData ? (
        <>
          {/* Current Weather Card */}
          <div style={{ background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)', color: '#fff', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', boxShadow: '0 8px 24px rgba(27,67,50,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>
                  Current Weather • {forecastData.location}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '8px' }}>
                  <span style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1 }}>{Math.round(forecastData.current.temperature_c)}°C</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 500, opacity: 0.9 }}>{forecastData.current.weather_condition}</span>
                </div>
                <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '4px' }}>
                  Feels like {Math.round(forecastData.current.feels_like_c)}°C
                </div>
              </div>

              {/* Quick Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', background: 'rgba(255,255,255,0.1)', padding: '16px 20px', borderRadius: '12px', backdropFilter: 'blur(4px)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Humidity</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{forecastData.current.humidity_percent}%</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Wind Speed</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{forecastData.current.wind_speed_kmh} km/h</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Precipitation</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{forecastData.current.precipitation_mm} mm</div>
                </div>
              </div>
            </div>
          </div>

          {/* Agricultural Farming Recommendations */}
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📢</span> Agricultural Advisory for {selectedCrop === 'All Crops' ? 'General Farming' : selectedCrop}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
              {forecastData.farming_recommendations.map((rec, i) => {
                const style = getSeverityBadge(rec.severity);
                return (
                  <div
                    key={i}
                    style={{
                      background: style.bg,
                      border: `1px solid ${style.border}`,
                      borderRadius: '12px',
                      padding: '16px 20px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '1.1rem' }}>{style.icon}</span>
                      <strong style={{ color: style.color, fontSize: '0.95rem' }}>{rec.title}</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>
                      {rec.message}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 7-Day Forecast */}
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--border)', padding: '20px 24px', marginBottom: '28px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px' }}>📅 7-Day Weather Forecast</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              {forecastData.daily.map((day, i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--bg-page)',
                    borderRadius: '10px',
                    padding: '14px 10px',
                    textAlign: 'center',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, margin: '8px 0 4px' }}>
                    {day.weather_condition}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                    {Math.round(day.temp_max)}° <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 400 }}>{Math.round(day.temp_min)}°</span>
                  </div>
                  {day.precip_prob_max > 0 && (
                    <div style={{ fontSize: '0.75rem', color: '#0284c7', marginTop: '6px', fontWeight: 500 }}>
                      ☔ {day.precip_prob_max}% ({day.precipitation_sum}mm)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Hourly Trend (24h) */}
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--border)', padding: '20px 24px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px' }}>⏱️ Next 24-Hour Outlook</h2>
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
              {forecastData.hourly.map((hr, i) => (
                <div
                  key={i}
                  style={{
                    minWidth: '85px',
                    background: 'var(--bg-page)',
                    borderRadius: '10px',
                    padding: '10px 8px',
                    textAlign: 'center',
                    flexShrink: 0,
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(hr.time).toLocaleTimeString('en-US', { hour: 'numeric' })}
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, margin: '6px 0' }}>
                    {Math.round(hr.temperature_c)}°C
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>💧 {hr.humidity_percent}%</div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
