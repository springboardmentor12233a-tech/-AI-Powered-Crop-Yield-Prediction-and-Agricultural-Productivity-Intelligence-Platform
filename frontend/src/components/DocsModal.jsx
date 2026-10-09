import { X, Cpu, Database, Shield, Sparkles, BookOpen } from "lucide-react";
import { t } from "../utils/i18n";

export default function DocsModal({ isOpen, onClose, currentLang = "en" }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 120,
      background: "var(--modal-overlay)",
      backdropFilter: "blur(12px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem"
    }}>
      <div className="fluent-panel" style={{
        width: "100%",
        maxWidth: "720px",
        maxHeight: "85vh",
        overflowY: "auto",
        padding: "1.75rem",
        position: "relative"
      }}>
        <button
          onClick={onClose}
          className="btn btn-ghost"
          style={{ position: "absolute", top: "1rem", right: "1rem", padding: "0.35rem" }}
        >
          <X size={18} />
        </button>

        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="badge badge-emerald"><BookOpen size={11} /> Specifications</span>
            <span className="badge badge-purple">AgriYield AI v2.0 Production</span>
          </div>
          <h2 style={{ fontSize: "1.45rem", fontWeight: 800, marginTop: "0.35rem", color: "var(--text-main)" }}>
            {t("sysSpecsTitle", currentLang)}
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            {t("sysSpecsSub", currentLang)}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {/* Section 1: ML Core */}
          <div style={{ background: "var(--bg-inset)", padding: "1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-primary)", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Cpu size={16} /> 1. XGBoost Gradient Boosting Regression Engine
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              The core quantitative prediction pipeline utilizes an <strong>XGBoost regressor</strong> trained on 50+ years of high-granularity Indian agricultural district-level data. It analyzes crop acreage, historical baseline yields, and regional multi-year production metrics with high fidelity (R² &gt; 98%).
            </p>
          </div>

          {/* Section 2: Dual AI Pipeline */}
          <div style={{ background: "var(--bg-inset)", padding: "1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#8b5cf6", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Sparkles size={16} /> 2. Dual AI Agronomy Orchestrator (Gemini 3.8 + Groq)
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              Qualitative agronomic advisory reports and interactive chatbot responses are generated using <strong>Google Gemini 3.8 Flash</strong> with automatic low-latency failover routing to <strong>Groq LLaMA 3.3 70B</strong>. Strict agronomic grounding rules prevent fabrication of unverified weather or soil data.
            </p>
          </div>

          {/* Section 3: JWT Security & Access Control */}
          <div style={{ background: "var(--bg-inset)", padding: "1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#3b82f6", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Shield size={16} /> 3. Role-Based Access Control & JWT Cryptography
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              Secured with JSON Web Tokens (<code>HS256</code> signed) and salted <code>bcrypt</code> password hashes. Supports granular role separation between <strong>Farmers</strong> (personalized farm records & advisory) and <strong>Admins</strong> (telemetry command center, user management, and prediction audit logs).
            </p>
          </div>

          {/* Section 4: Dataset Sources */}
          <div style={{ background: "var(--bg-inset)", padding: "1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f59e0b", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Database size={16} /> 4. ICRISAT Agricultural Ground Truth Data
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              Ground truth empirical data is compiled from the <strong>ICRISAT District-Level Data repository</strong> covering 20 Indian states, 300+ agricultural districts, and major crops (Wheat, Rice, Barley, Cotton, Sugarcane, Chickpea, Groundnut, Mustard, and Soybean).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
