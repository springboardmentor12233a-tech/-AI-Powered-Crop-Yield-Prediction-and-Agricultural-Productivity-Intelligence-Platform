import React, { useEffect, useState } from 'react';
import { Database, RefreshCw, TableProperties } from 'lucide-react';
import api from '../api';

export default function DatasetPage() {
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDataset = async () => {
      try {
        setLoading(true);
        const response = await api.get('/dataset');
        setColumns(response.data.columns || []);
        setRows(response.data.rows || []);
        setTotalRows(response.data.total_rows || 0);
      } catch (err) {
        console.error('Failed to load dataset:', err);
        setError('Unable to load the crop yield dataset.');
      } finally {
        setLoading(false);
      }
    };

    fetchDataset();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#e3ecd9] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
              <Database size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Dataset Collection</h2>
              <p className="text-slate-500 text-sm mt-1">Cleaned crop yield dataset for analysis and forecasting.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-2xl text-xs font-semibold">
            <TableProperties size={16} />
            {totalRows} rows loaded
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 rounded-r-xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="animate-spin text-brand-500" size={32} />
        </div>
      ) : (
        <div className="bg-white border border-[#e3ecd9] rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[#e3ecd9] text-xs font-bold uppercase tracking-wider text-slate-500">
                  {columns.map((column) => (
                    <th key={column} className="px-4 py-3 whitespace-nowrap">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f8f2] text-sm text-slate-700">
                {rows.map((row, index) => (
                  <tr key={`${index}-${row.Region || 'row'}`} className="hover:bg-brand-50/20 transition-all">
                    {columns.map((column) => (
                      <td key={`${column}-${index}`} className="px-4 py-3 whitespace-nowrap align-top">
                        {row[column] ?? 'N/A'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
