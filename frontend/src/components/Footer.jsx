import { Sprout, Cpu, Sparkles, Shield, Heart } from "lucide-react";
import { t } from "../utils/i18n";

export default function Footer({ currentLang = "en" }) {
  return (
    <footer style={{
      borderTop: "1px solid var(--border-glass)",
      background: "var(--header-bg)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      padding: "2.5rem 1.5rem 1.75rem",
      marginTop: "4rem",
      transition: "background 0.3s ease"
    }}>
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "1.75rem"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1.25rem"
        }}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 12px rgba(16, 185, 129, 0.3)"
            }}>
              <Sprout size={18} color="#fff" />
            </div>
            <div>
              <span style={{ fontSize: "1.15rem", fontWeight: 800 }} className="gradient-text">
                {t("brand", currentLang)}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>
                Enterprise Agronomic Intelligence
              </span>
            </div>
          </div>

          {/* Engine Badges */}
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <span className="badge badge-emerald"><Cpu size={12} /> XGBoost Regressor</span>
            <span className="badge badge-purple"><Sparkles size={12} /> Google Gemini 3.8</span>
            <span className="badge badge-amber"><Sparkles size={12} /> Groq LLaMA 70B</span>
            <span className="badge badge-blue"><Shield size={12} /> JWT Auth</span>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div style={{
          borderTop: "1px solid var(--border-glass)",
          paddingTop: "1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          fontSize: "0.82rem",
          color: "var(--text-muted)",
          gap: "1rem"
        }}>
          <div>
            © {new Date().getFullYear()} {t("brand", currentLang)} • Precision Agriculture, Harvest Forecasts & Soil Science.
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            Built for Farmers with ICAR Agronomy Benchmarks
          </div>
        </div>
      </div>
    </footer>
  );
}
