import { useState } from "react";
import { FlaskConical, Leaf, Sparkles, CheckCircle2, Zap } from "lucide-react";
import { t } from "../utils/i18n";

const SOIL_TYPES = ["Alluvial", "Black Soil (Regur)", "Red Soil", "Laterite", "Clayey", "Sandy Loam"];

export default function FertilizerCalculator({ currentLang = "en" }) {
  const [crop, setCrop] = useState("RICE");
  const [targetYield, setTargetYield] = useState(3500);
  const [nitrogen, setNitrogen] = useState(40);
  const [phosphorus, setPhosphorus] = useState(20);
  const [potassium, setPotassium] = useState(25);
  const [ph, setPh] = useState(6.5);
  const [soilType, setSoilType] = useState("Alluvial");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleCalculate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/fertilizer/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Crop: crop,
          target_yield: parseFloat(targetYield),
          nitrogen_level: parseFloat(nitrogen),
          phosphorus_level: parseFloat(phosphorus),
          potassium_level: parseFloat(potassium),
          ph_level: parseFloat(ph),
          soil_type: soilType
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Fertilizer calculation failed");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: "1280px" }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
            <span className="badge badge-emerald">
              <FlaskConical size={12} /> Soil Science & Agronomy Engine
            </span>
          </div>
          <h1 className="page-header-title">
            {t("npkTitle", currentLang)}
          </h1>
          <p className="page-header-desc">
            {t("npkSub", currentLang)}
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "1.5rem", alignItems: "start" }}>
        {/* Input Form Panel */}
        <div className="fluent-panel">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
            <Leaf size={18} color="var(--accent)" />
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
              {t("inputParams", currentLang)}
            </h2>
          </div>

          <form onSubmit={handleCalculate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">{t("cropType", currentLang)}</label>
              <select
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                className="input-field select-field"
              >
                {["RICE", "WHEAT", "SUGARCANE", "COTTON", "MAIZE", "POTATO", "SOYABEAN", "GROUNDNUT"].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t("targetYieldGoal", currentLang)}</label>
              <input
                type="number"
                value={targetYield}
                onChange={(e) => setTargetYield(e.target.value)}
                className="input-field"
                required
              />
            </div>

            {/* NPK Inputs Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.65rem" }}>
              <div className="form-group">
                <label className="form-label">{t("currentSoilNitrogen", currentLang)}</label>
                <input
                  type="number"
                  value={nitrogen}
                  onChange={(e) => setNitrogen(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("currentSoilPhosphorus", currentLang)}</label>
                <input
                  type="number"
                  value={phosphorus}
                  onChange={(e) => setPhosphorus(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("currentSoilPotassium", currentLang)}</label>
                <input
                  type="number"
                  value={potassium}
                  onChange={(e) => setPotassium(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            {/* Soil pH & Soil Type */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", alignItems: "center" }}>
              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <label className="form-label">{t("soilPhLevel", currentLang)}</label>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--accent)" }}>{ph}</span>
                </div>
                <input
                  type="range"
                  min="4.5"
                  max="9.0"
                  step="0.1"
                  value={ph}
                  onChange={(e) => setPh(e.target.value)}
                  style={{ width: "100%", accentColor: "var(--accent)", cursor: "pointer", marginTop: "4px" }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("soilTypeLabel", currentLang)}</label>
                <select
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  className="input-field select-field"
                >
                  {SOIL_TYPES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ height: "40px", fontSize: "0.88rem", marginTop: "0.4rem" }}
            >
              {loading ? <span className="spinner"></span> : <><FlaskConical size={15} /> {t("calculateDose", currentLang)}</>}
            </button>
          </form>
        </div>

        {/* Results Column */}
        <div>
          {error && (
            <div style={{
              background: "var(--danger-subtle)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              color: "var(--danger)",
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius-md)",
              fontSize: "0.84rem",
              marginBottom: "1rem"
            }}>
              ⚠️ {error}
            </div>
          )}

          {result ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Dosage Summary Bento Tiles */}
              <div className="fluent-panel">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <Zap size={16} color="var(--accent)" />
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>
                    {t("recommendedDosages", currentLang)}
                  </h3>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                  {/* Urea */}
                  <div style={{ background: "var(--surface-inset)", borderRadius: "var(--radius-md)", padding: "1rem", textAlign: "center" }}>
                    <div className="text-caption" style={{ color: "var(--accent)" }}>{t("ureaDosage", currentLang)}</div>
                    <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-mono)", margin: "4px 0" }}>
                      {result.urea_kg_per_ha}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--fg-muted)" }}>kg / hectare</div>
                  </div>

                  {/* DAP */}
                  <div style={{ background: "var(--surface-inset)", borderRadius: "var(--radius-md)", padding: "1rem", textAlign: "center" }}>
                    <div className="text-caption" style={{ color: "var(--secondary)" }}>{t("dapDosage", currentLang)}</div>
                    <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--secondary)", fontFamily: "var(--font-mono)", margin: "4px 0" }}>
                      {result.dap_kg_per_ha}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--fg-muted)" }}>kg / hectare</div>
                  </div>

                  {/* MOP */}
                  <div style={{ background: "var(--surface-inset)", borderRadius: "var(--radius-md)", padding: "1rem", textAlign: "center" }}>
                    <div className="text-caption" style={{ color: "#8b5cf6" }}>{t("mopDosage", currentLang)}</div>
                    <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#8b5cf6", fontFamily: "var(--font-mono)", margin: "4px 0" }}>
                      {result.mop_kg_per_ha}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--fg-muted)" }}>kg / hectare</div>
                  </div>
                </div>

                <div style={{
                  marginTop: "1rem",
                  padding: "0.65rem 0.85rem",
                  background: "var(--surface-inset)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.82rem",
                  color: "var(--fg-secondary)"
                }}>
                  <strong style={{ color: "var(--fg-primary)" }}>{t("soilHealthStatus", currentLang)}:</strong> {result.soil_status}
                </div>
              </div>

              {/* Agronomy Guidance Panel */}
              <div className="fluent-panel">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
                  <Sparkles size={16} color="var(--accent)" />
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>
                    {t("aiAgronomyAdvice", currentLang)}
                  </h3>
                </div>
                <p style={{ color: "var(--fg-secondary)", lineHeight: 1.6, fontSize: "0.88rem", margin: 0 }}>
                  {result.ai_advice}
                </p>

                {result.organic_recommendations && result.organic_recommendations.length > 0 && (
                  <div style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid var(--border-subtle)" }}>
                    <h4 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent)", marginBottom: "0.4rem" }}>
                      🌿 {t("organicRecommendations", currentLang)}
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                      {result.organic_recommendations.map((rec, idx) => (
                        <div key={idx} style={{ fontSize: "0.82rem", color: "var(--fg-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                          <CheckCircle2 size={13} color="var(--accent)" /> {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="fluent-panel" style={{ padding: "3rem 2rem", textAlign: "center", color: "var(--fg-muted)" }}>
              <FlaskConical size={36} color="var(--accent)" style={{ margin: "0 auto 0.75rem", opacity: 0.6 }} />
              <h3 style={{ color: "var(--fg-primary)", fontSize: "1.1rem", fontWeight: 600 }}>
                Ready for Soil Diagnostic
              </h3>
              <p style={{ maxWidth: "360px", margin: "0.35rem auto 0", fontSize: "0.82rem", color: "var(--fg-secondary)" }}>
                Specify your crop yield target and current laboratory N-P-K nutrient metrics on the left to calculate recommended doses.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
