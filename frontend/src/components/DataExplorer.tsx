import React from 'react';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';

interface CropRecord {
  farm_id: string;
  region: string;
  crop_type: string;
  soil_moisture_pct?: number;
  "soil_moisture_%"?: number;
  soil_pH: number;
  temperature_C: number;
  rainfall_mm: number;
  humidity_pct?: number;
  "humidity_%"?: number;
  irrigation_type: string;
  fertilizer_type: string;
  sowing_date: string;
  harvest_date: string;
  total_days: number;
  yield_kg_per_hectare: number;
  NDVI_index: number;
  crop_disease_status: string;
}

interface DataExplorerProps {
  records: CropRecord[];
  totalRecords: number;
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  selectedCrop: string;
  setSelectedCrop: (crop: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  cropsList: string[];
}

export const DataExplorer: React.FC<DataExplorerProps> = ({
  records,
  totalRecords,
  page,
  totalPages,
  onPageChange,
  selectedCrop,
  setSelectedCrop,
  searchQuery,
  setSearchQuery,
  cropsList
}) => {
  const exportCSV = () => {
    if (!records.length) return;
    const keys = Object.keys(records[0]);
    const csvContent = [
      keys.join(','),
      ...records.map(r => keys.map(k => `"${(r as any)[k]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'YieldSense_Exported_Records.csv';
    a.click();
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Crop Telemetry & Dataset Explorer
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Showing {records.length} of {totalRecords} agricultural sensor records
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search farm, region..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-control"
              style={{ paddingLeft: '2.2rem', width: '210px' }}
            />
          </div>

          <select
            value={selectedCrop}
            onChange={e => setSelectedCrop(e.target.value)}
            className="input-control"
            style={{ background: '#121a29' }}
          >
            <option value="">All Crop Types</option>
            {cropsList.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button className="btn-primary" onClick={exportCSV}>
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Farm ID</th>
              <th>Region</th>
              <th>Crop</th>
              <th>Soil pH</th>
              <th>Temp (°C)</th>
              <th>Rainfall (mm)</th>
              <th>Irrigation</th>
              <th>Fertilizer</th>
              <th>Duration</th>
              <th>Yield (kg/ha)</th>
              <th>NDVI</th>
              <th>Disease</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 700, color: '#60a5fa' }}>{r.farm_id}</td>
                <td>{r.region}</td>
                <td>
                  <span className="badge badge-green">{r.crop_type}</span>
                </td>
                <td>{r.soil_pH}</td>
                <td>{r.temperature_C}°C</td>
                <td>{r.rainfall_mm} mm</td>
                <td>{r.irrigation_type}</td>
                <td>{r.fertilizer_type}</td>
                <td>{r.total_days} days</td>
                <td style={{ fontWeight: 800, color: '#34d399' }}>{r.yield_kg_per_hectare?.toLocaleString()}</td>
                <td>{r.NDVI_index}</td>
                <td>
                  <span className={`badge ${r.crop_disease_status === 'None' ? 'badge-green' : r.crop_disease_status === 'Mild' ? 'badge-blue' : 'badge-amber'}`}>
                    {r.crop_disease_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Page {page} of {totalPages}
        </span>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: page <= 1 ? 'transparent' : 'rgba(255,255,255,0.05)',
              color: page <= 1 ? 'var(--text-dim)' : 'var(--text-main)',
              cursor: page <= 1 ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronLeft size={16} />
          </button>

          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: page >= totalPages ? 'transparent' : 'rgba(255,255,255,0.05)',
              color: page >= totalPages ? 'var(--text-dim)' : 'var(--text-main)',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
