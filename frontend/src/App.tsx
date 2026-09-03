import { useState, useEffect } from 'react';
import './styles/index.css';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { DataExplorer } from './components/DataExplorer';
import { EdaDashboard } from './components/EdaDashboard';
import { ArchitectureView } from './components/ArchitectureView';
import { AuthModal } from './components/AuthModal';
import { YieldPredictor } from './components/YieldPredictor';
import { WeatherAnalyticsView } from './components/WeatherAnalyticsView';
import { SoilAnalysisView } from './components/SoilAnalysisView';

export function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    username: 'farmer',
    role: 'Farmer',
    email: 'farmer@yieldsense.ai'
  });

  // Data states
  const [summary, setSummary] = useState({
    total_farms: 500,
    avg_yield_kg_ha: 4312.45,
    avg_rainfall_mm: 178.62,
    avg_ndvi: 0.61,
    total_regions: 4,
    crops_supported: ['Wheat', 'Rice', 'Maize', 'Soybean', 'Cotton']
  });

  const [records, setRecords] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(500);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(25);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [edaMetrics, setEdaMetrics] = useState<any>({
    crop_breakdown: {
      "Wheat": { count: 104, avg_yield: 4280.15 },
      "Rice": { count: 98, avg_yield: 4450.60 },
      "Maize": { count: 102, avg_yield: 4390.80 },
      "Soybean": { count: 96, avg_yield: 4120.30 },
      "Cotton": { count: 100, avg_yield: 4320.10 }
    }
  });

  // Fetch summary from API (or fallback if backend offline)
  const fetchDataSummary = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/data/summary');
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (e) {
      // Backend fallback handled seamlessly
    }
  };

  // Fetch records from API
  const fetchRecords = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '15'
      });
      if (selectedCrop) queryParams.append('crop_type', selectedCrop);
      if (searchQuery) queryParams.append('search', searchQuery);

      const res = await fetch(`http://localhost:8000/api/data/records?${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.data);
        setTotalRecords(data.total_records);
        setTotalPages(data.total_pages);
        return;
      }
    } catch (e) {
      // Fallback sample data if backend not started yet
    }

    // Default local sample generation
    generateLocalFallbackRecords();
  };

  const fetchEdaMetrics = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/analytics/metrics');
      if (res.ok) {
        const data = await res.json();
        setEdaMetrics(data);
      }
    } catch (e) {
      // Backend fallback handled
    }
  };

  const generateLocalFallbackRecords = () => {
    const crops = ['Wheat', 'Rice', 'Maize', 'Soybean', 'Cotton'];
    const regions = ['North India', 'South USA', 'Central USA', 'East Africa'];
    const sampleData = Array.from({ length: 15 }, (_, i) => ({
      farm_id: `FARM${String((page - 1) * 15 + i + 1).padStart(4, '0')}`,
      region: regions[i % regions.length],
      crop_type: selectedCrop || crops[i % crops.length],
      soil_pH: Number((5.8 + (i % 3) * 0.4).toFixed(2)),
      temperature_C: Number((22.5 + (i % 5) * 2.1).toFixed(1)),
      rainfall_mm: Number((120.0 + (i % 4) * 45.0).toFixed(1)),
      irrigation_type: i % 2 === 0 ? 'Drip' : 'Sprinkler',
      fertilizer_type: i % 3 === 0 ? 'Organic' : 'Mixed',
      sowing_date: '2024-01-15',
      harvest_date: '2024-05-15',
      total_days: 121,
      yield_kg_per_hectare: Math.round(3800 + (i * 120) % 2000),
      NDVI_index: Number((0.45 + (i % 5) * 0.08).toFixed(2)),
      crop_disease_status: i % 4 === 0 ? 'Mild' : 'None'
    }));
    setRecords(sampleData);
  };

  useEffect(() => {
    fetchDataSummary();
    fetchEdaMetrics();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [page, selectedCrop, searchQuery]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onRefreshData={() => {
          fetchDataSummary();
          fetchRecords();
          fetchEdaMetrics();
        }}
      />

      <main style={{ flex: 1, padding: '2rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <MetricCards summary={summary} />
            <DataExplorer
              records={records}
              totalRecords={totalRecords}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              selectedCrop={selectedCrop}
              setSelectedCrop={setSelectedCrop}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              cropsList={summary.crops_supported}
            />
          </div>
        )}

        {activeTab === 'predict' && (
          <YieldPredictor />
        )}

        {activeTab === 'weather' && (
          <WeatherAnalyticsView />
        )}

        {activeTab === 'soil' && (
          <SoilAnalysisView />
        )}

        {activeTab === 'dataset' && (
          <DataExplorer
            records={records}
            totalRecords={totalRecords}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            selectedCrop={selectedCrop}
            setSelectedCrop={setSelectedCrop}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            cropsList={summary.crops_supported}
          />
        )}

        {activeTab === 'eda' && (
          <EdaDashboard metrics={edaMetrics} />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureView />
        )}
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={user => setCurrentUser(user)}
      />
    </div>
  );
}

export default App;
