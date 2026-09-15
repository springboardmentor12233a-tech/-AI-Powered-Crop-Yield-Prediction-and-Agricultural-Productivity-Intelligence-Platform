import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { BarChart3, TrendingUp, Filter } from 'lucide-react';

const mockHistoricalData = [
  { year: '2019', yieldWheat: 3.8, yieldRice: 3.4, rainfall: 520 },
  { year: '2020', yieldWheat: 4.1, yieldRice: 3.6, rainfall: 580 },
  { year: '2021', yieldWheat: 3.9, yieldRice: 3.5, rainfall: 490 },
  { year: '2022', yieldWheat: 4.4, yieldRice: 3.8, rainfall: 640 },
  { year: '2023', yieldWheat: 4.6, yieldRice: 3.9, rainfall: 610 },
  { year: '2024', yieldWheat: 4.85, yieldRice: 4.1, rainfall: 670 }
];

const mockRegionalData = [
  { region: 'Punjab', yield: 4.95, efficiency: 94 },
  { region: 'Haryana', yield: 4.65, efficiency: 91 },
  { region: 'UP West', yield: 3.90, efficiency: 84 },
  { region: 'MP North', yield: 3.55, efficiency: 79 },
  { region: 'MH Central', yield: 3.20, efficiency: 75 }
];

export default function AnalyticsChart() {
  const [metric, setMetric] = useState('yield');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
      
      {/* Historical Yield Trends Chart */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="#10b981" /> Historical Yield Progression
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tonnes per Hectare (2019 - 2024)</p>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              onClick={() => setMetric('yield')} 
              className={metric === 'yield' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
            >
              Crop Yield
            </button>
            <button 
              onClick={() => setMetric('rainfall')} 
              className={metric === 'rainfall' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
            >
              Rainfall Correlation
            </button>
          </div>
        </div>

        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockHistoricalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="wheatGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="riceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />

              {metric === 'yield' ? (
                <>
                  <Area type="monotone" dataKey="yieldWheat" name="Wheat Yield (T/ha)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#wheatGrad)" />
                  <Area type="monotone" dataKey="yieldRice" name="Rice Yield (T/ha)" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#riceGrad)" />
                </>
              ) : (
                <Area type="monotone" dataKey="rainfall" name="Annual Rainfall (mm)" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#rainGrad)" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Regional Efficiency Bar Chart */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="#f59e0b" /> Regional Yield Comparison
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Average Yield Benchmark by Agriculture Zone</p>
        </div>

        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockRegionalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="region" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
              />
              <Bar dataKey="yield" name="Yield (T/ha)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
