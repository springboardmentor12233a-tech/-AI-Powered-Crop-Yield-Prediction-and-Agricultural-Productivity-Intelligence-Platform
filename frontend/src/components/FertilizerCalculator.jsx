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
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Header Banner */}
      <div style={{
        background: "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, var(--bg-glass) 100%)",
        border: "1px solid rgba(16,185,129,0.25)",
        borderRadius: "20px",
        padding: "2rem",
        marginBottom: "2rem",
        backdropFilter: "blur(12px)",
        textAlign: "center"
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 16px",
          borderRadius: "9999px",
          background: "rgba(16,185,129,0.2)",
          color: "#10b981",
          fontSize: "0.85rem",
          fontWeight: 600,
          marginBottom: "1rem"
        }}>
          <FlaskConical size={16} /> Soil Science & Agronomy Engine
        </div>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.5rem" }}>
          🌱 {t("npkTitle", currentLang)}
        </h1>
        <p style={{ color: "var(--text-muted)", maxWidth: "700px", margin: "0 auto", fontSize: "1rem" }}>
          {t("npkSub", currentLang)}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(430px, 1fr))", gap: "2rem", alignItems: "start" }}>
        {/* Input Form Card */}
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#10b981", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <Leaf size={20} /> {t("inputParams", currentLang)}
          </h2>

          <form onSubmit={handleCalculate} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            <div>
              <label style={{ display: "block", color: "var(--text-main)", fontSize: "0.9rem", marginBottom: "6px", fontWeight: 600 }}>
                {t("cropType", currentLang)}
              </label>
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

            <div>
              <label style={{ display: "block", color: "var(--text-main)", fontSize: "0.9rem", marginBottom: "6px", fontWeight: 600 }}>
                {t("targetYieldGoal", currentLang)}
              </label>
              <input
                type="number"
                value={targetYield}
                onChange={(e) => setTargetYield(e.target.value)}
                className="input-field"
                required
              />
            </div>

            {/* NPK Inputs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.85rem" }}>
              <div>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.78rem", marginBottom: "4px" }}>
                  {t("currentSoilNitrogen", currentLang)}
                </label>
                <input
                  type="number"
                  value={nitrogen}
                  onChange={(e) => setNitrogen(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.78rem", marginBottom: "4px" }}>
                  {t("currentSoilPhosphorus", currentLang)}
                </label>
                <input
                  type="number"
                  value={phosphorus}
                  onChange={(e) => setPhosphorus(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.78rem", marginBottom: "4px" }}>
                  {t("currentSoilPotassium", currentLang)}
                </label>
                <input
                  type="number"
                  value={potassium}
                  onChange={(e) => setPotassium(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            {/* Soil pH & Type */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "4px" }}>
                  {t("soilPhLevel", currentLang)} ({ph})
                </label>
                <input
                  type="range"
                  min="4.5"
                  max="9.0"
                  step="0.1"
                  value={ph}
                  onChange={(e) => setPh(e.target.value)}
                  style={{ width: "100%", accentColor: "#10b981", cursor: "pointer" }}
                />
              </div>

              <div>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "4px" }}>
                  {t("soilTypeLabel", currentLang)}
                </label>
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
              style={{ padding: "0.95rem", fontSize: "1rem", marginTop: "0.5rem" }}
            >
              {loading ? <span className="spinner"></span> : <><FlaskConical size={18} /> {t("calculateDose", currentLang)}</>}
            </button>
          </form>
        </div>

        {/* Results Column */}
        <div>
          {error && (
            <div style={{ background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.3)", color: "#f43f5e", padding: "1rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
              ⚠️ {error}
            </div>
          )}

          {result ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Dosage Summary Cards */}
              <div className="glass-panel" style={{ padding: "1.85rem" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Zap size={20} color="#10b981" /> {t("recommendedDosages", currentLang)}
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                  {/* Urea */}
                  <div style={{ background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "14px", padding: "1.25rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>{t("ureaDosage", currentLang)}</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "#10b981", marginTop: "4px" }}>
                      {result.urea_kg_per_ha}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>kg / hectare</div>
                  </div>

                  {/* DAP */}
                  <div style={{ background: "rgba(59, 130, 246, 0.12)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "14px", padding: "1.25rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>{t("dapDosage", currentLang)}</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "#3b82f6", marginTop: "4px" }}>
                      {result.dap_kg_per_ha}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>kg / hectare</div>
                  </div>

                  {/* MOP */}
                  <div style={{ background: "rgba(139, 92, 246, 0.12)", border: "1px solid rgba(139, 92, 246, 0.3)", borderRadius: "14px", padding: "1.25rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>{t("mopDosage", currentLang)}</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "#8b5cf6", marginTop: "4px" }}>
                      {result.mop_kg_per_ha}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>kg / hectare</div>
                  </div>
                </div>

                <div style={{ marginTop: "1.25rem", padding: "0.85rem 1rem", background: "var(--bg-glass)", borderRadius: "10px", fontSize: "0.88rem", color: "var(--text-main)" }}>
                  <strong>{t("soilHealthStatus", currentLang)}:</strong> {result.soil_status}
                </div>
              </div>

              {/* Organic & Agronomy Advice */}
              <div className="glass-panel" style={{ padding: "1.85rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#8b5cf6", marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={18} /> {t("aiAgronomyAdvice", currentLang)}
                </h3>
                <p style={{ color: "var(--text-main)", lineHeight: 1.65, fontSize: "0.93rem" }}>
                  {result.ai_advice}
                </p>

                {result.organic_recommendations && result.organic_recommendations.length > 0 && (
                  <div style={{ marginTop: "1.25rem" }}>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#10b981", marginBottom: "0.5rem" }}>
                      🌿 {t("organicRecommendations", currentLang)}
                    </h4>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      {result.organic_recommendations.map((rec, idx) => (
                        <li key={idx} style={{ fontSize: "0.88rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                          <CheckCircle2 size={15} color="#10b981" /> {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: "3rem 2rem", textAlign: "center", color: "var(--text-muted)" }}>
              <FlaskConical size={48} color="#10b981" style={{ opacity: 0.6, marginBottom: "1rem" }} />
              <h3 style={{ color: "var(--text-main)", fontSize: "1.25rem", fontWeight: 700 }}>Ready for NPK Soil Analysis</h3>
              <p style={{ maxWidth: "400px", margin: "0.5rem auto 0", fontSize: "0.9rem" }}>
                Fill in your crop yield targets and soil test parameters on the left to calculate exact Urea, DAP, and MOP dosages.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
