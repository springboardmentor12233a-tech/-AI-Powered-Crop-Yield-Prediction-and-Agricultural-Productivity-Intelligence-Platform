import { Sprout, Sparkles, Scale, FlaskConical, Bot, ShieldCheck, ArrowRight, Lock } from "lucide-react";
import { t } from "../utils/i18n";

export default function LandingPage({ onOpenAuth, onQuickDemoLogin, currentLang = "en" }) {
  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 1.5rem" }}>
      {/* Hero Header */}
      <div style={{
        textAlign: "center",
        padding: "4rem 2rem",
        borderRadius: "28px",
        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, var(--bg-card) 100%)",
        border: "1px solid rgba(16, 185, 129, 0.25)",
        backdropFilter: "blur(20px)",
        boxShadow: "var(--shadow-main)",
        marginBottom: "3.5rem"
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 18px",
          borderRadius: "9999px",
          background: "rgba(16, 185, 129, 0.2)",
          color: "#10b981",
          fontSize: "0.88rem",
          fontWeight: 700,
          marginBottom: "1.5rem",
          border: "1px solid rgba(16, 185, 129, 0.3)"
        }}>
          <Sparkles size={16} /> {t("heroBadge", currentLang)}
        </div>

        <h1 style={{
          fontSize: "3.2rem",
          fontWeight: 800,
          lineHeight: 1.15,
          color: "var(--text-main)",
          marginBottom: "1.2rem",
          letterSpacing: "-0.02em"
        }}>
          {t("heroTitlePrefix", currentLang)} <span className="gradient-text">{t("heroTitleSuffix", currentLang)}</span>
        </h1>

        <p style={{
          fontSize: "1.25rem",
          color: "var(--text-muted)",
          maxWidth: "680px",
          margin: "0 auto 2.2rem",
          lineHeight: 1.6
        }}>
          {t("heroDesc", currentLang)}
        </p>

        {/* CTA Buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
          <button
            onClick={onOpenAuth}
            className="btn btn-primary pulse-primary"
            style={{ padding: "0.95rem 2rem", fontSize: "1.05rem", borderRadius: "14px" }}
          >
            <Lock size={18} /> {t("signInAccess", currentLang)}
          </button>

          <button
            onClick={() => onQuickDemoLogin("farmer")}
            className="btn btn-secondary"
            style={{ padding: "0.95rem 1.8rem", fontSize: "1.05rem", borderRadius: "14px", border: "1px solid #10b981", color: "#10b981" }}
          >
            🌾 {t("exploreFarmer", currentLang)}
          </button>

          <button
            onClick={() => onQuickDemoLogin("admin")}
            className="btn btn-secondary"
            style={{ padding: "0.95rem 1.8rem", fontSize: "1.05rem", borderRadius: "14px", border: "1px solid #8b5cf6", color: "#8b5cf6" }}
          >
            👑 {t("exploreAdmin", currentLang)}
          </button>
        </div>
      </div>

      {/* Access Protection Notice */}
      <div style={{
        background: "rgba(245, 158, 11, 0.1)",
        border: "1px solid rgba(245, 158, 11, 0.3)",
        borderRadius: "16px",
        padding: "1.2rem 1.5rem",
        marginBottom: "3rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <ShieldCheck size={24} color="#f59e0b" />
          <div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)" }}>
              {t("secureAccess", currentLang)}
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {t("secureDesc", currentLang)}
            </div>
          </div>
        </div>

        <button
          onClick={onOpenAuth}
          className="btn btn-primary"
          style={{ padding: "0.6rem 1.2rem", fontSize: "0.9rem" }}
        >
          {t("signInNow", currentLang)} <ArrowRight size={16} />
        </button>
      </div>

      {/* Platform Capabilities Grid */}
      <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "1.5rem", textAlign: "center" }}>
        {t("platformCapabilities", currentLang)}
      </h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
        gap: "1.5rem"
      }}>
        {/* Capability 1 */}
        <div className="glass-panel hover-card" style={{ padding: "1.8rem" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981", marginBottom: "1rem" }}>
            <Sprout size={24} />
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.5rem" }}>
            {t("featurePredictorTitle", currentLang)}
          </h3>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "1.2rem" }}>
            {t("featurePredictorDesc", currentLang)}
          </p>
          <button onClick={onOpenAuth} className="btn btn-secondary" style={{ width: "100%", fontSize: "0.85rem" }}>
            {t("loginToPredict", currentLang)}
          </button>
        </div>

        {/* Capability 2 */}
        <div className="glass-panel hover-card" style={{ padding: "1.8rem" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6", marginBottom: "1rem" }}>
            <Scale size={24} />
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.5rem" }}>
            {t("featureCompareTitle", currentLang)}
          </h3>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "1.2rem" }}>
            {t("featureCompareDesc", currentLang)}
          </p>
          <button onClick={onOpenAuth} className="btn btn-secondary" style={{ width: "100%", fontSize: "0.85rem" }}>
            {t("loginToCompare", currentLang)}
          </button>
        </div>

        {/* Capability 3 */}
        <div className="glass-panel hover-card" style={{ padding: "1.8rem" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#8b5cf6", marginBottom: "1rem" }}>
            <FlaskConical size={24} />
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.5rem" }}>
            {t("featureFertilizerTitle", currentLang)}
          </h3>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "1.2rem" }}>
            {t("featureFertilizerDesc", currentLang)}
          </p>
          <button onClick={onOpenAuth} className="btn btn-secondary" style={{ width: "100%", fontSize: "0.85rem" }}>
            {t("loginToCalculate", currentLang)}
          </button>
        </div>

        {/* Capability 4 */}
        <div className="glass-panel hover-card" style={{ padding: "1.8rem" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b", marginBottom: "1rem" }}>
            <Bot size={24} />
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.5rem" }}>
            {t("featureAssistantTitle", currentLang)}
          </h3>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "1.2rem" }}>
            {t("featureAssistantDesc", currentLang)}
          </p>
          <button onClick={onOpenAuth} className="btn btn-secondary" style={{ width: "100%", fontSize: "0.85rem" }}>
            {t("loginToChat", currentLang)}
          </button>
        </div>
      </div>
    </div>
  );
}
