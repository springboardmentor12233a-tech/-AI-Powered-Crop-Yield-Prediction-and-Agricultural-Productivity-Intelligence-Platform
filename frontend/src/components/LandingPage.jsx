import { 
  Sprout, Sparkles, Scale, FlaskConical, Bot, ShieldCheck, 
  ArrowRight, Lock, CheckCircle2, TrendingUp, Cpu, Award, Zap, ChevronRight
} from "lucide-react";
import { t } from "../utils/i18n";

export default function LandingPage({ onOpenAuth, currentLang = "en" }) {
  return (
    <div className="page-container" style={{ maxWidth: "1280px" }}>
      {/* Hero Section — Minimal, Editorial, High-Clarity */}
      <div style={{
        textAlign: "center",
        padding: "3.5rem 1.5rem 2.5rem",
        marginBottom: "2rem"
      }}>
        {/* Subtle Badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 12px",
          borderRadius: "var(--radius-full)",
          background: "var(--surface-inset)",
          border: "1px solid var(--border-subtle)",
          color: "var(--fg-secondary)",
          fontSize: "0.78rem",
          fontWeight: 500,
          marginBottom: "1.5rem"
        }}>
          <span className="live-dot"></span>
          <span>Enterprise Agricultural Intelligence</span>
        </div>

        {/* Hero Title */}
        <h1 style={{
          fontSize: "clamp(2.2rem, 4.5vw, 3.4rem)",
          fontWeight: 800,
          lineHeight: 1.15,
          color: "var(--fg-primary)",
          letterSpacing: "-0.03em",
          maxWidth: "850px",
          margin: "0 auto 1.25rem"
        }}>
          Precision Crop Forecasting & Agronomic Intelligence
        </h1>

        {/* Hero Supporting Text */}
        <p style={{
          fontSize: "1.05rem",
          color: "var(--fg-secondary)",
          maxWidth: "680px",
          margin: "0 auto 2rem",
          lineHeight: 1.6
        }}>
          Calibrated XGBoost yield regression paired with real-time agro-meteorology and dual generative AI advisory for modern farm operations.
        </p>

        {/* Action Controls */}
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center",
          gap: "0.75rem", 
          flexWrap: "wrap"
        }}>
          <button
            onClick={onOpenAuth}
            className="btn btn-primary"
            style={{ height: "42px", padding: "0 1.5rem", fontSize: "0.9rem" }}
          >
            <Lock size={15} /> {t("signInAccess", currentLang)}
          </button>
        </div>
      </div>

      {/* Bento Grid Layout — Primary Features & Live Preview */}
      <div className="bento-grid" style={{ marginBottom: "3rem" }}>
        {/* Bento Cell 1: Live Model Telemetry (Span 7) */}
        <div className="bento-cell col-span-7" style={{ justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--accent-subtle)",
                  color: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Zap size={15} />
                </div>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--fg-primary)" }}>
                  Live Model Telemetry Preview
                </span>
              </div>
              <span className="badge badge-emerald">
                Calibrated Model v2.0
              </span>
            </div>

            <p style={{ fontSize: "0.82rem", color: "var(--fg-muted)", marginBottom: "1.25rem" }}>
              Simulated harvest prediction based on historical ICRISAT district baseline datasets.
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "0.75rem",
              marginBottom: "1rem"
            }}>
              <div style={{ background: "var(--surface-inset)", padding: "0.75rem", borderRadius: "var(--radius-md)" }}>
                <div className="text-caption" style={{ color: "var(--fg-muted)" }}>Target Plot</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, marginTop: "2px" }}>Punjab, Ludhiana</div>
                <div style={{ fontSize: "0.75rem", color: "var(--fg-secondary)" }}>10.0 ha • Alluvial</div>
              </div>

              <div style={{ background: "var(--surface-inset)", padding: "0.75rem", borderRadius: "var(--radius-md)" }}>
                <div className="text-caption" style={{ color: "var(--fg-muted)" }}>Crop Variety</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, marginTop: "2px" }}>Wheat (PBW 550)</div>
                <div style={{ fontSize: "0.75rem", color: "var(--fg-secondary)" }}>Rabi Season</div>
              </div>

              <div style={{ background: "var(--surface-inset)", padding: "0.75rem", borderRadius: "var(--radius-md)" }}>
                <div className="text-caption" style={{ color: "var(--accent)" }}>Predicted Yield</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-mono)" }}>
                  4,320 kg/ha
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--accent)", fontWeight: 500 }}>
                  ↑ +14.2% vs Regional
                </div>
              </div>
            </div>
          </div>

          <div style={{
            background: "var(--surface-inset)",
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.82rem"
          }}>
            <span style={{ color: "var(--fg-secondary)" }}>
              Recommended N-P-K Dosing: <strong style={{ color: "var(--fg-primary)" }}>Urea 120kg • DAP 55kg • MOP 30kg</strong>
            </span>
            <button
              onClick={onOpenAuth}
              className="btn btn-ghost"
              style={{ height: "26px", fontSize: "0.75rem", color: "var(--accent)" }}
            >
              Test Custom Plot <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* Bento Cell 2: System Accuracy & Metrics (Span 5) */}
        <div className="bento-cell col-span-5" style={{ justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <div style={{
                width: "28px",
                height: "28px",
                borderRadius: "var(--radius-sm)",
                background: "var(--secondary-subtle)",
                color: "var(--secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Cpu size={15} />
              </div>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--fg-primary)" }}>
                Quantitative Regression Performance
              </span>
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--fg-muted)", marginBottom: "1.25rem" }}>
              Validation metrics across 50 years of agricultural harvest records.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div style={{ background: "var(--surface-inset)", padding: "0.85rem", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-mono)" }}>
                98.4%
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--fg-secondary)", marginTop: "2px" }}>
                R² Test Coefficient
              </div>
            </div>

            <div style={{ background: "var(--surface-inset)", padding: "0.85rem", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--secondary)", fontFamily: "var(--font-mono)" }}>
                28+
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--fg-secondary)", marginTop: "2px" }}>
                States & UTs Covered
              </div>
            </div>

            <div style={{ background: "var(--surface-inset)", padding: "0.85rem", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--fg-primary)", fontFamily: "var(--font-mono)" }}>
                10+
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--fg-secondary)", marginTop: "2px" }}>
                Commercial Crops
              </div>
            </div>

            <div style={{ background: "var(--surface-inset)", padding: "0.85rem", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--warning)", fontFamily: "var(--font-mono)" }}>
                Dual-AI
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--fg-secondary)", marginTop: "2px" }}>
                Gemini + Groq LLaMA
              </div>
            </div>
          </div>
        </div>

        {/* Bento Cell 3: Multi-Crop ROI Optimizer (Span 4) */}
        <div className="bento-cell col-span-4" style={{ justifyContent: "space-between" }}>
          <div>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "var(--radius-md)",
              background: "var(--secondary-subtle)",
              color: "var(--secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "0.85rem"
            }}>
              <Scale size={18} />
            </div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--fg-primary)", marginBottom: "0.4rem" }}>
              {t("featureCompareTitle", currentLang)}
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--fg-secondary)", lineHeight: 1.55 }}>
              {t("featureCompareDesc", currentLang)}
            </p>
          </div>
          <button
            onClick={onOpenAuth}
            className="btn btn-secondary"
            style={{ width: "100%", marginTop: "1.25rem", height: "34px", fontSize: "0.8rem" }}
          >
            {t("loginToCompare", currentLang)} <ArrowRight size={13} />
          </button>
        </div>

        {/* Bento Cell 4: Soil N-P-K Dosage Calculator (Span 4) */}
        <div className="bento-cell col-span-4" style={{ justifyContent: "space-between" }}>
          <div>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "var(--radius-md)",
              background: "var(--accent-subtle)",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "0.85rem"
            }}>
              <FlaskConical size={18} />
            </div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--fg-primary)", marginBottom: "0.4rem" }}>
              {t("featureFertilizerTitle", currentLang)}
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--fg-secondary)", lineHeight: 1.55 }}>
              {t("featureFertilizerDesc", currentLang)}
            </p>
          </div>
          <button
            onClick={onOpenAuth}
            className="btn btn-secondary"
            style={{ width: "100%", marginTop: "1.25rem", height: "34px", fontSize: "0.8rem" }}
          >
            {t("loginToCalculate", currentLang)} <ArrowRight size={13} />
          </button>
        </div>

        {/* Bento Cell 5: Dual-AI Farm Assistant (Span 4) */}
        <div className="bento-cell col-span-4" style={{ justifyContent: "space-between" }}>
          <div>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "var(--radius-md)",
              background: "var(--warning-subtle)",
              color: "var(--warning)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "0.85rem"
            }}>
              <Bot size={18} />
            </div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--fg-primary)", marginBottom: "0.4rem" }}>
              {t("featureAssistantTitle", currentLang)}
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--fg-secondary)", lineHeight: 1.55 }}>
              {t("featureAssistantDesc", currentLang)}
            </p>
          </div>
          <button
            onClick={onOpenAuth}
            className="btn btn-secondary"
            style={{ width: "100%", marginTop: "1.25rem", height: "34px", fontSize: "0.8rem" }}
          >
            {t("loginToChat", currentLang)} <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Trust & Governance Strip */}
      <div style={{
        background: "var(--surface-base)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding: "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: "30px",
            height: "30px",
            borderRadius: "var(--radius-sm)",
            background: "var(--surface-inset)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent)"
          }}>
            <ShieldCheck size={16} />
          </div>
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--fg-primary)" }}>
              {t("secureAccess", currentLang)}
            </div>
            <div style={{ fontSize: "0.76rem", color: "var(--fg-muted)" }}>
              {t("secureDesc", currentLang)}
            </div>
          </div>
        </div>

        <button
          onClick={onOpenAuth}
          className="btn btn-primary"
          style={{ height: "32px", fontSize: "0.8rem" }}
        >
          {t("signInNow", currentLang)} <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
