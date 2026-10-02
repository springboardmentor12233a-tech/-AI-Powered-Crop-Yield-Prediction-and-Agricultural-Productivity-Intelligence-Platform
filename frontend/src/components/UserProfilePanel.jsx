import React, { useState, useEffect } from 'react';
import { 
  User, 
  Sprout, 
  FileSpreadsheet, 
  ShieldCheck, 
  Save, 
  Trash2, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Database, 
  Building2, 
  MapPin, 
  Layers, 
  Sparkles, 
  Users, 
  Search, 
  Shield 
} from 'lucide-react';

const BACKEND_PORTS = [8000, 8001];

const apiFetch = async (path, options = {}) => {
  let lastError;
  for (const port of BACKEND_PORTS) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, options);
      return response;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('Failed to connect to backend server');
};

export default function UserProfilePanel({ currentUser, token, onRoleUpdated }) {
  const role = currentUser?.role || 'Farmer';
  const userId = currentUser?.id;

  // Farmer Form State
  const [farmName, setFarmName] = useState('Green Valley Agriculture');
  const [region, setRegion] = useState('Punjab');
  const [soilType, setSoilType] = useState('Alluvial / Loamy');
  const [cropPreferences, setCropPreferences] = useState('Wheat, Rice, Maize');
  const [farmSizeHectares, setFarmSizeHectares] = useState(50.0);

  // Consultant Form State
  const [expertise, setExpertise] = useState('Agronomy, Soil Chemistry, Micro-Irrigation & Yield Optimization');
  const [regionsServed, setRegionsServed] = useState('Punjab, Haryana, Uttar Pradesh');
  const [organizationName, setOrganizationName] = useState('CropCast AgTech Advisory Lead');

  // Admin User List State
  const [usersList, setUsersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('All');
  const [editingUserRole, setEditingUserRole] = useState(null);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Fetch initial profile data
  useEffect(() => {
    if (!token) return;

    if (role === 'Farmer') {
      fetchFarmerProfile();
    } else if (role === 'Consultant') {
      fetchConsultantProfile();
    } else if (role === 'Admin') {
      fetchAdminUsersList();
    }
  }, [role, token]);

  const fetchFarmerProfile = async () => {
    try {
      const res = await apiFetch('/api/profile/farmer', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFarmName(data.farm_name || 'Green Valley Agriculture');
        setRegion(data.region || 'Punjab');
        setSoilType(data.soil_type || 'Alluvial / Loamy');
        setCropPreferences(data.crop_preferences || 'Wheat, Rice, Maize');
        setFarmSizeHectares(data.farm_size_hectares || 50.0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchConsultantProfile = async () => {
    try {
      const res = await apiFetch('/api/profile/consultant', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setExpertise(data.expertise || 'Agronomy & Soil Chemistry');
        setRegionsServed(data.regions_served || 'Punjab, Haryana');
        setOrganizationName(data.organization_name || 'AgTech Advisory Corp');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminUsersList = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFarmerProfile = async (e) => {
    e.preventDefault();
    setSaveSuccess('');
    setSaveError('');
    setLoading(true);

    try {
      const res = await apiFetch('/api/profile/farmer', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          farm_name: farmName,
          region,
          soil_type: soilType,
          crop_preferences: cropPreferences,
          farm_size_hectares: parseFloat(farmSizeHectares) || 10.0
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Save failed');

      setSaveSuccess('Farm profile updated successfully! Linked to user ID.');
    } catch (err) {
      setSaveError(err.message || 'Error updating farm profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConsultantProfile = async (e) => {
    e.preventDefault();
    setSaveSuccess('');
    setSaveError('');
    setLoading(true);

    try {
      const res = await apiFetch('/api/profile/consultant', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          expertise,
          regions_served: regionsServed,
          organization_name: organizationName
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Save failed');

      setSaveSuccess('Consultant credentials updated successfully! Linked to user ID.');
    } catch (err) {
      setSaveError(err.message || 'Error updating consultant profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminRoleUpdate = async (targetUserId, newRole) => {
    try {
      const res = await apiFetch(`/api/admin/users/${targetUserId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Role update failed');
      }

      setSaveSuccess(`User role updated to '${newRole}'.`);
      fetchAdminUsersList();
      setEditingUserRole(null);
    } catch (err) {
      setSaveError(err.message);
    }
  };

  const handleAdminDeleteUser = async (targetUserId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user account "${userName}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${targetUserId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Delete failed');

      setSaveSuccess(`User "${userName}" deleted successfully.`);
      fetchAdminUsersList();
    } catch (err) {
      setSaveError(err.message);
    }
  };

  const filteredUsers = usersList.filter(u => {
    const matchesSearch = u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.role?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRoleFilter === 'All' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>

      {/* Profile Header */}
      <div className="glass-card" style={{ padding: '24px 32px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.08) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-emerald"><User size={13} /> Linked User Profile</span>
              <span className="badge badge-gold">{role} Mode</span>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              {role === 'Farmer' && '🌾 Farm Info & Soil Preference Center'}
              {role === 'Consultant' && '👨‍🌾 Agronomic Consultant Expertise & Coverage'}
              {role === 'Admin' && '🛡️ Master Admin User Governance Console'}
              {role === 'Researcher' && '🔬 Agricultural Intelligence & Telemetry Profile'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Linked User ID: <code style={{ color: '#34d399', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>{userId || 'Guest'}</code>
            </p>
          </div>

          {role === 'Admin' && (
            <button className="btn-secondary" onClick={fetchAdminUsersList} style={{ fontSize: '0.8rem' }}>
              <RefreshCw size={14} /> Refresh Users
            </button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', color: '#6ee7b7', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={18} />
          <div>{saveSuccess}</div>
        </div>
      )}

      {saveError && (
        <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', color: '#fca5a5', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={18} />
          <div>{saveError}</div>
        </div>
      )}

      {/* ROLE 1: FARMER PROFILE FORM */}
      {role === 'Farmer' && (
        <div className="glass-card" style={{ padding: '28px' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sprout size={18} color="#10b981" />
            Farmer Field & Farm Characteristics (Personalization Profile)
          </h4>

          <form onSubmit={handleSaveFarmerProfile} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Farm / Enterprise Name
              </label>
              <input
                type="text"
                className="input-field"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="e.g. Green Valley Agricultural Field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Agricultural Region / Belt
              </label>
              <select className="input-field" value={region} onChange={(e) => setRegion(e.target.value)}>
                <option value="Punjab">Punjab (Northern Granary)</option>
                <option value="Haryana">Haryana (Northern Belt)</option>
                <option value="Uttar Pradesh">Uttar Pradesh (Gangetic Plains)</option>
                <option value="Madhya Pradesh">Madhya Pradesh (Central Plateau)</option>
                <option value="Maharashtra">Maharashtra (Deccan Belt)</option>
                <option value="Gujarat">Gujarat (Western Coastal Belt)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Soil Type Classification
              </label>
              <select className="input-field" value={soilType} onChange={(e) => setSoilType(e.target.value)}>
                <option value="Alluvial / Loamy">Alluvial / Loamy (High Nutrient Retention)</option>
                <option value="Black Cotton (Vertisol)">Black Cotton Vertisol (High Clay & Moisture)</option>
                <option value="Red Loam">Red Loam (Iron Rich)</option>
                <option value="Clay Loam">Clay Loam (Moderate Drainage)</option>
                <option value="Peaty & Organic">Peaty & Organic (High Carbon Content)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Primary Crop Preferences
              </label>
              <input
                type="text"
                className="input-field"
                value={cropPreferences}
                onChange={(e) => setCropPreferences(e.target.value)}
                placeholder="e.g. Wheat, Rice, Maize"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Farm Area (Hectares)
              </label>
              <input
                type="number"
                step="0.1"
                className="input-field"
                value={farmSizeHectares}
                onChange={(e) => setFarmSizeHectares(e.target.value)}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
              <button type="submit" className="btn-primary" disabled={loading}>
                <Save size={16} />
                {loading ? 'Saving Farm Profile...' : 'Save Linked Farm Information'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ROLE 4: RESEARCHER DATASETS ACCESS & TELEMETRY */}
      {role === 'Researcher' && (
        <div className="glass-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={20} color="#8b5cf6" />
                Researcher Agricultural Datasets & Telemetry Access
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Access raw environmental data, satellite soil grids, and historical crop yield model training benchmarks.
              </p>
            </div>
            <span className="badge badge-purple" style={{ padding: '6px 12px' }}>
              <Sparkles size={12} style={{ marginRight: '4px' }} /> Full Data API Granted
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {[
              {
                title: 'ISRIC SoilGrids 250m Spatial Dataset',
                format: 'GeoTIFF / CSV',
                size: '4.2 GB',
                desc: 'Global soil property maps (pH, organic carbon, cation exchange) at 250m resolution.',
                tag: 'Soil Chemistry'
              },
              {
                title: 'NASA POWER Agro-Climatology Telemetry',
                format: 'JSON / Parquet',
                size: '1.8 GB',
                desc: 'Daily solar radiation, humidity, precipitation, and thermal degree days (2000-2025).',
                tag: 'Meteorology'
              },
              {
                title: 'IMD Seasonal Rainfall & Drought Index',
                format: 'CSV / NetCDF',
                size: '850 MB',
                desc: 'Sub-divisional monsoon rainfall totals and standardized precipitation evapotranspiration indices.',
                tag: 'Climate Risk'
              },
              {
                title: 'ICAR Historical Crop Yield Telemetry (1995-2024)',
                format: 'CSV / XLSX',
                size: '320 MB',
                desc: 'State & district level crop harvest yield figures across Kharif & Rabi seasons.',
                tag: 'Production Statistics'
              }
            ].map((ds, idx) => (
              <div key={idx} className="glass-card" style={{ padding: '16px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>{ds.tag}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{ds.format} • {ds.size}</span>
                </div>
                <h5 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>{ds.title}</h5>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.4 }}>{ds.desc}</p>
                <button
                  onClick={() => alert(`Downloading ${ds.title} (${ds.format})...`)}
                  className="btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem', borderColor: 'rgba(139, 92, 246, 0.4)', color: '#c084fc' }}
                >
                  <Database size={14} /> Download Dataset Package
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleSaveFarmerProfile} style={{ background: 'rgba(7, 10, 17, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={16} color="#38bdf8" /> Configure Target Research Belt & Default Soil Profile
            </h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Target Region</label>
                <select className="input-field" value={region} onChange={(e) => setRegion(e.target.value)} style={{ padding: '8px' }}>
                  <option value="Punjab">Punjab</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Maharashtra">Maharashtra</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Baseline Soil Model</label>
                <select className="input-field" value={soilType} onChange={(e) => setSoilType(e.target.value)} style={{ padding: '8px' }}>
                  <option value="Alluvial / Loamy">Alluvial / Loamy</option>
                  <option value="Black Cotton (Vertisol)">Black Cotton Vertisol</option>
                  <option value="Red Loam">Red Loam</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Model Training Focus</label>
                <input type="text" className="input-field" value={cropPreferences} onChange={(e) => setCropPreferences(e.target.value)} style={{ padding: '8px' }} />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '14px', fontSize: '0.82rem', padding: '8px 16px' }}>
              <Save size={14} /> Update Research Dataset Parameters
            </button>
          </form>
        </div>
      )}

      {/* ROLE 2: CONSULTANT PROFILE FORM */}
      {role === 'Consultant' && (
        <div className="glass-card" style={{ padding: '28px' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={18} color="#06b6d4" />
            Consultant Expertise & Regional Services
          </h4>

          <form onSubmit={handleSaveConsultantProfile} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Agronomic Expertise Areas
              </label>
              <input
                type="text"
                className="input-field"
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
                placeholder="e.g. Soil Chemistry, Micro-Irrigation & Yield Optimization"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Agricultural Regions Served
              </label>
              <input
                type="text"
                className="input-field"
                value={regionsServed}
                onChange={(e) => setRegionsServed(e.target.value)}
                placeholder="e.g. Punjab, Haryana, Uttar Pradesh"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Firm / Organization Name
              </label>
              <input
                type="text"
                className="input-field"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="e.g. CropCast AgTech Advisory Lead"
              />
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
              <button type="submit" className="btn-primary" disabled={loading}>
                <Save size={16} />
                {loading ? 'Saving Consultant Credentials...' : 'Save Linked Consultant Credentials'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ROLE 3: ADMIN USER MANAGEMENT DASHBOARD */}
      {role === 'Admin' && (
        <div className="glass-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="#f59e0b" />
                Registered System Users ({filteredUsers.length} Accounts)
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                PostgreSQL Relational DB linked profiles (Farmer farm info & Consultant expertise).
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search user name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '36px', padding: '8px 12px 8px 36px', fontSize: '0.82rem' }}
                />
              </div>

              <select
                className="input-field"
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                style={{ width: '130px', padding: '8px', fontSize: '0.82rem' }}
              >
                <option value="All">All Roles</option>
                <option value="Farmer">Farmers</option>
                <option value="Consultant">Consultants</option>
                <option value="Researcher">Researchers</option>
                <option value="Admin">Admins</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 14px' }}>User Details</th>
                  <th style={{ padding: '12px 14px' }}>Role</th>
                  <th style={{ padding: '12px 14px' }}>Linked Profile Summary</th>
                  <th style={{ padding: '12px 14px' }}>Created Date</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isCurrent = u.id === userId;
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: isCurrent ? 'rgba(16, 185, 129, 0.05)' : 'transparent' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#ffffff' }}>{u.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email} ({u.username || 'no-username'})</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {editingUserRole === u.id ? (
                          <select
                            value={u.role}
                            onChange={(e) => handleAdminRoleUpdate(u.id, e.target.value)}
                            style={{ padding: '4px 8px', borderRadius: '6px', background: '#0f172a', color: '#ffffff', border: '1px solid var(--primary-emerald)' }}
                          >
                            <option value="Farmer">Farmer</option>
                            <option value="Consultant">Consultant</option>
                            <option value="Researcher">Researcher</option>
                            <option value="Admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`badge ${
                            u.role === 'Admin' ? 'badge-gold' :
                            u.role === 'Consultant' ? 'badge-cyan' :
                            u.role === 'Researcher' ? 'badge-purple' : 'badge-emerald'
                          }`}>
                            {u.role}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {u.role === 'Farmer' && (
                          <div>
                            <div>🌾 Farm: <strong>{u.farm_name || 'Primary Farm'}</strong> ({u.farmer_region || 'Punjab'})</div>
                            <div>Soil: {u.soil_type || 'Alluvial'} | Crops: {u.crop_preferences || 'Wheat'}</div>
                          </div>
                        )}
                        {u.role === 'Consultant' && (
                          <div>
                            <div>👨‍🌾 Expertise: <strong>{u.expertise || 'Agronomy'}</strong></div>
                            <div>Coverage: {u.consultant_regions || 'Punjab, Haryana'}</div>
                          </div>
                        )}
                        {(u.role === 'Admin' || u.role === 'Researcher') && (
                          <div style={{ fontStyle: 'italic', color: 'var(--text-dim)' }}>System Governance & Research Lead</div>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Active'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setEditingUserRole(editingUserRole === u.id ? null : u.id)}
                            className="btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                          >
                            Role
                          </button>
                          {!isCurrent && (
                            <button
                              onClick={() => handleAdminDeleteUser(u.id, u.full_name)}
                              style={{ padding: '6px 10px', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', borderRadius: '6px', cursor: 'pointer' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
