import { useState, useEffect } from 'react';
import { cropDoctorAPI } from '../services/api';

const CROPS_LIST = [
  'Auto-detect',
  'Rice',
  'Wheat',
  'Maize',
  'Cotton',
  'Sugarcane',
  'Potato',
  'Tomato',
  'Soybean',
  'Groundnut',
  'Apple',
  'Grape',
  'Citrus',
  'Other'
];

export default function CropDoctorPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [cropHint, setCropHint] = useState('Auto-detect');
  const [dragActive, setDragActive] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [diagnosisResult, setDiagnosisResult] = useState(null);

  const [activeTab, setActiveTab] = useState('diagnose'); // 'diagnose' | 'history'
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  async function fetchHistory() {
    setHistoryLoading(true);
    try {
      const res = await cropDoctorAPI.getHistory();
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }

  function handleFileSelect(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPEG, PNG, or WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10 MB limit.');
      return;
    }
    setError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select or drag an image of a plant/leaf to analyze.');
      return;
    }

    setLoading(true);
    setError(null);
    setDiagnosisResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (cropHint && cropHint !== 'Auto-detect') {
      formData.append('crop_type', cropHint);
    }

    try {
      const res = await cropDoctorAPI.analyzeImage(formData);
      setDiagnosisResult(res.data);
    } catch (err) {
      console.error('Diagnosis failed:', err);
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'AI Vision diagnosis failed. Please ensure your GROQ_API_KEY is configured.');
    } finally {
      setLoading(false);
    }
  }

  const getConfidenceBadge = (level) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return { bg: '#dcfce7', color: '#15803d', label: 'High Confidence' };
      case 'medium':
        return { bg: '#fef9c3', color: '#a16207', label: 'Medium Confidence' };
      case 'low':
      case 'uncertain':
      default:
        return { bg: '#fee2e2', color: '#b91c1c', label: level || 'Uncertain' };
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', color: 'var(--text-primary)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>AI Crop Doctor 🩺</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px', margin: 0 }}>
            Instant AI crop disease diagnosis, symptom detection & agronomist recommendations.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '10px' }}>
          <button
            onClick={() => setActiveTab('diagnose')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'diagnose' ? '#fff' : 'transparent',
              color: activeTab === 'diagnose' ? 'var(--primary)' : '#64748b',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'diagnose' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
            }}
          >
            📸 New Diagnosis
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'history' ? '#fff' : 'transparent',
              color: activeTab === 'history' ? 'var(--primary)' : '#64748b',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'history' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
            }}
          >
            📜 History
          </button>
        </div>
      </div>

      {activeTab === 'diagnose' ? (
        <div style={{ display: 'grid', gridTemplateColumns: diagnosisResult ? '1fr 1fr' : '1fr', gap: '28px' }}>
          {/* Left Column: Upload Form */}
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px' }}>Upload Plant or Leaf Image</h2>

            <form onSubmit={handleSubmit}>
              {/* Optional Crop Hint */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Crop Type (Optional Hint):
                </label>
                <select
                  value={cropHint}
                  onChange={(e) => setCropHint(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontSize: '0.875rem',
                    background: '#fff',
                  }}
                >
                  {CROPS_LIST.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Drag & Drop Box */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--border)'}`,
                  background: dragActive ? '#f0fdf4' : '#fafafa',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  marginBottom: '20px',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => document.getElementById('crop-image-input').click()}
              >
                <input
                  id="crop-image-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />

                {previewUrl ? (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={previewUrl}
                      alt="Crop preview"
                      style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain' }}
                    />
                    <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Click or drag to change image
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🍃</div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Drag & Drop crop image here</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Supports JPEG, PNG, WebP (Max 10 MB)
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !selectedFile}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: loading || !selectedFile ? 'not-allowed' : 'pointer',
                  opacity: loading || !selectedFile ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {loading ? (
                  <>
                    <span>🔍</span> Analyzing with Groq Vision AI...
                  </>
                ) : (
                  <>
                    <span>✨</span> Diagnose Crop Disease
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Result Card */}
          {diagnosisResult && (
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                    Crop Identified
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {diagnosisResult.crop_identified}
                  </div>
                </div>

                {/* Confidence Badge */}
                {(() => {
                  const conf = getConfidenceBadge(diagnosisResult.confidence_level);
                  return (
                    <span
                      style={{
                        background: conf.bg,
                        color: conf.color,
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                      }}
                    >
                      {conf.label}
                    </span>
                  );
                })()}
              </div>

              {/* Diagnosis Title Box */}
              <div style={{ background: '#f8fafc', borderLeft: '4px solid var(--primary)', padding: '14px 16px', borderRadius: '0 8px 8px 0', marginBottom: '20px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>DIAGNOSIS</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>
                  {diagnosisResult.diagnosis}
                </div>
              </div>

              {/* Symptoms */}
              {diagnosisResult.symptoms?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '6px' }}>Visual Symptoms Observed:</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#475569' }}>
                    {diagnosisResult.symptoms.map((s, i) => (
                      <li key={i} style={{ marginBottom: '3px' }}>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Immediate Actions */}
              {diagnosisResult.immediate_actions?.length > 0 && (
                <div style={{ marginBottom: '16px', background: '#f0fdf4', padding: '12px 16px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#166534', margin: '0 0 6px 0' }}>
                    🟢 Immediate Actions for Farmer:
                  </h4>
                  <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#15803d' }}>
                    {diagnosisResult.immediate_actions.map((act, i) => (
                      <li key={i} style={{ marginBottom: '4px' }}>
                        {act}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Prevention & Monitoring */}
              {diagnosisResult.prevention_and_monitoring?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '6px' }}>Prevention & Long-term Care:</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#475569' }}>
                    {diagnosisResult.prevention_and_monitoring.map((p, i) => (
                      <li key={i} style={{ marginBottom: '3px' }}>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Expert Inspection Needed Warning */}
              {diagnosisResult.expert_inspection_needed && (
                <div style={{ background: '#fffbe5', border: '1px solid #fef08a', padding: '10px 14px', borderRadius: '8px', fontSize: '0.825rem', color: '#854d0e', marginBottom: '16px' }}>
                  ⚠️ <strong>Agronomist Consultation Recommended:</strong> This condition shows symptoms of high severity or ambiguity. We recommend getting field verification from a local agricultural extension officer.
                </div>
              )}

              {/* Disclaimer */}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', pt: '10px', marginTop: '16px' }}>
                ℹ️ {diagnosisResult.disclaimer}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* History Tab Content */
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>Past Diagnosis Records</h2>

          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Loading history...</div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              No crop diagnosis history recorded yet. Upload a leaf image to start!
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {history.map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '14px 18px',
                    background: 'var(--bg-page)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--primary)' }}>
                        {item.crop_type || 'Crop'}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginTop: '4px' }}>
                      {item.diagnosis}
                    </div>
                    {item.symptoms_summary && (
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                        Symptoms: {item.symptoms_summary}
                      </div>
                    )}
                  </div>

                  <span
                    style={{
                      background: item.confidence_level === 'High' ? '#dcfce7' : '#fef9c3',
                      color: item.confidence_level === 'High' ? '#15803d' : '#a16207',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {item.confidence_level} Confidence
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
