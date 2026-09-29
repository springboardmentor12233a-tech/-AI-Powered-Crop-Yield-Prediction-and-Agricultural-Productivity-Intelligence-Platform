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
      backdropFilter: "blur(10px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem"
    }}>
      <div className="glass-panel" style={{
        width: "100%",
        maxWidth: "750px",
        maxHeight: "85vh",
        overflowY: "auto",
        padding: "2rem",
        position: "relative",
        border: "1px solid var(--border-glass)",
        boxShadow: "var(--shadow-main)"
      }}>
        <button
          onClick={onClose}
          style={{ position: "absolute", top: "1.25rem", right: "1.25rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
        >
          <X size={20} />
        </button>

        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="badge badge-emerald"><BookOpen size={12} /> System Documentation</span>
            <span className="badge badge-purple">AgriYield AI v2.0</span>
          </div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginTop: "0.4rem", color: "var(--text-main)" }} className="gradient-text">
            {t("sysSpecsTitle", currentLang)}
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            {t("sysSpecsSub", currentLang)}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Section 1: ML Core */}
          <div style={{ background: "var(--bg-glass)", padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#10b981", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Cpu size={18} /> 1. XGBoost Gradient Boosting Regression Model
            </h3>
            <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              The core quantitative prediction engine uses an **XGBoost (eXtreme Gradient Boosting)** regressor trained on 50+ years of high-granularity Indian agricultural district-level data. It analyzes crop acreage, historical baseline yields, and regional multi-year production metrics.
            </p>
          </div>

          {/* Section 2: Dual AI Pipeline */}
          <div style={{ background: "var(--bg-glass)", padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#8b5cf6", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Sparkles size={18} /> 2. Dual AI Intelligence (Google Gemini 3.8 + Groq LLaMA)
            </h3>
            <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              Qualitative agronomic reports and interactive chatbot responses are generated using **Google Gemini 3.8 Flash** with zero-latency failover routing to **Groq LLaMA 3.3 70B**. The system enforces strict grounding rules to prevent fabrication of unverified weather or soil data.
            </p>
          </div>

          {/* Section 3: JWT Security & Access Control */}
          <div style={{ background: "var(--bg-glass)", padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#3b82f6", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Shield size={18} /> 3. Role-Based Access Control & JWT Auth
            </h3>
            <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              Secured with JSON Web Tokens (`HS256` signed) and salted `bcrypt` password hashes. Supports granular role separation between **Farmers** (personalized farm logs & advisory) and **Admins** (system-wide telemetry, user management, and prediction audit logs).
            </p>
          </div>

          {/* Section 4: Dataset Sources */}
          <div style={{ background: "var(--bg-glass)", padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f59e0b", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Database size={18} /> 4. Data Source & Coverage
            </h3>
            <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              Ground truth data compiled from the **ICRISAT District-Level Data repository** covering 20 Indian states, 300+ agricultural districts, and 29 major crops (Wheat, Rice, Barley, Cotton, Sugarcane, Chickpea, Groundnut, etc.).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
