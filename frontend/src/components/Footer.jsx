import { Sprout, Cpu, Sparkles } from "lucide-react";
import { t } from "../utils/i18n";

export default function Footer({ currentLang = "en" }) {
  return (
    <footer style={{
      borderTop: "1px solid var(--border-glass)",
      background: "var(--header-bg)",
      padding: "2.5rem 1.5rem 1.5rem",
      marginTop: "4rem",
      transition: "background 0.3s ease"
    }}>
      <div style={{
        maxWidth: "1350px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Sprout size={20} color="#fff" />
            </div>
            <span style={{ fontSize: "1.2rem", fontWeight: 800 }} className="gradient-text">
              {t("brand", currentLang)}
            </span>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <span className="badge badge-emerald"><Cpu size={12} /> XGBoost Regressor</span>
            <span className="badge badge-purple"><Sparkles size={12} /> Google Gemini 3.8</span>
            <span className="badge badge-amber"><Sparkles size={12} /> Groq LLaMA 70B</span>
          </div>
        </div>

        <div style={{
          borderTop: "1px solid var(--border-glass)",
          paddingTop: "1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          fontSize: "0.82rem",
          color: "var(--text-muted)",
          gap: "0.75rem"
        }}>
          <div>
            © {new Date().getFullYear()} {t("brand", currentLang)} — Intelligent Agricultural Yield Prediction & Farm Advisory System.
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            Powered by Machine Learning & Generative AI
          </div>
        </div>
      </div>
    </footer>
  );
}
