import React from 'react';
import { Search, Download, ChevronLeft, ChevronRight, Database } from 'lucide-react';

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
    <div className="glass-card" style={{ padding: '1.75rem' }}>
      
      {/* Header Controls Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Database size={20} color="#10b981" />
            Crop Telemetry & Dataset Explorer
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Showing {records.length} of {totalRecords} agricultural sensor records
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search farm, region..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-control"
              style={{ paddingLeft: '2.4rem', width: '230px' }}
            />
          </div>

          <select
            value={selectedCrop}
            onChange={e => setSelectedCrop(e.target.value)}
            className="input-control"
            style={{ background: '#0e1912', minWidth: '150px' }}
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

      {/* Spacious Data Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: '1.5rem' }}>Farm ID</th>
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
              <th style={{ paddingRight: '1.5rem' }}>Disease</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, idx) => (
              <tr key={idx}>
                <td style={{ paddingLeft: '1.5rem', fontWeight: 800, color: '#60a5fa' }}>{r.farm_id}</td>
                <td style={{ color: 'var(--text-main)' }}>{r.region}</td>
                <td>
                  <span className="badge badge-green">{r.crop_type}</span>
                </td>
                <td style={{ color: 'var(--text-main)', fontWeight: 600 }}>{r.soil_pH}</td>
                <td style={{ color: 'var(--text-main)' }}>{r.temperature_C}°C</td>
                <td style={{ color: 'var(--text-main)' }}>{r.rainfall_mm} mm</td>
                <td style={{ color: 'var(--text-muted)' }}>{r.irrigation_type}</td>
                <td style={{ color: 'var(--text-muted)' }}>{r.fertilizer_type}</td>
                <td style={{ color: 'var(--text-muted)' }}>{r.total_days} days</td>
                <td style={{ fontWeight: 800, color: '#34d399', fontSize: '0.95rem' }}>
                  {r.yield_kg_per_hectare?.toLocaleString()}
                </td>
                <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{r.NDVI_index}</td>
                <td style={{ paddingRight: '1.5rem' }}>
                  <span className={`badge ${r.crop_disease_status === 'None' ? 'badge-green' : r.crop_disease_status === 'Mild' ? 'badge-blue' : r.crop_disease_status === 'Moderate' ? 'badge-amber' : 'badge-red'}`}>
                    {r.crop_disease_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Page <strong style={{ color: '#ffffff' }}>{page}</strong> of <strong style={{ color: '#ffffff' }}>{totalPages}</strong>
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="tab-btn"
            style={{ opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="tab-btn"
            style={{ opacity: page === totalPages ? 0.5 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>

    </div>
  );
};
