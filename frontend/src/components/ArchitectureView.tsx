import React from 'react';
import { Cpu, CheckCircle2, Database, Code } from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const milestoneRequirements = [
    { title: "Project Initialization & Design", status: "Complete", desc: "System architecture, ER database schema, UI wireframes documentation." },
    { title: "Backend API Setup", status: "Complete", desc: "FastAPI REST server with CORS, data endpoints, and JWT authentication." },
    { title: "Frontend Dashboard Setup", status: "Complete", desc: "React + Vite glassmorphism UI with dataset explorer & live charts." },
    { title: "Data Collection & Ingestion", status: "Complete", desc: "Ingested Smart_Farming_Crop_Yield_2024.csv & YieldSense_AI_Dataset_Collection.xlsx." },
    { title: "Data Preprocessing Pipeline", status: "Complete", desc: "Automated missing value imputation, ISO date formatting, and data quality report." },
    { title: "Exploratory Data Analysis (EDA)", status: "Complete", desc: "Generated 5 statistical visualization plots & summary metrics JSON." }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Cpu size={24} color="#34d399" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Milestone 1 Implementation Status</h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          All objectives specified in the <strong>YieldSense AI Project Specification PDF</strong> for Milestone 1 have been successfully implemented and verified.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {milestoneRequirements.map((r, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#60a5fa' }}>{r.title}</span>
                <span className="badge badge-green" style={{ display: 'flex', gap: '0.3rem', fontSize: '0.7rem' }}>
                  <CheckCircle2 size={12} /> {r.status}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#34d399' }}>
            <Database size={20} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Generated Documentation Files</h3>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <li style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <strong style={{ color: '#60a5fa' }}>docs/system_architecture.md</strong>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>High-level architecture, component flow, and REST API specification</div>
            </li>
            <li style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <strong style={{ color: '#60a5fa' }}>docs/database_schema.md</strong>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Database entity-relationship definitions for Users, Farms, and Telemetry</div>
            </li>
            <li style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <strong style={{ color: '#60a5fa' }}>docs/ui_layout.md</strong>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>UI wireframe layout specs and dashboard screen breakdown</div>
            </li>
            <li style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <strong style={{ color: '#60a5fa' }}>docs/dataset_quality_report.md</strong>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Data quality log, null count audit, and schema data types</div>
            </li>
          </ul>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#60a5fa' }}>
            <Code size={20} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Automated Pipelines & Executables</h3>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <li style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <strong style={{ color: '#34d399' }}>scripts/preprocess_data.py</strong>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Cleans raw datasets and outputs datasets/processed/cleaned_crop_yield.csv</div>
            </li>
            <li style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <strong style={{ color: '#34d399' }}>scripts/run_eda.py</strong>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Computes statistics and outputs 5 visualization plot PNGs to eda_plots/</div>
            </li>
            <li style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <strong style={{ color: '#34d399' }}>backend/app/main.py</strong>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>FastAPI REST server with JWT Auth, Data query, and Analytics APIs</div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
