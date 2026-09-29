import { useState, useEffect } from "react";
import { Scale, Trophy, Sparkles } from "lucide-react";
import { t } from "../utils/i18n";

const AVAILABLE_CROPS = [
  "RICE", "WHEAT", "SUGARCANE", "COTTON", "MAIZE", "POTATO", "SOYABEAN", "GROUNDNUT"
];

export default function MultiCropComparator({ currentLang = "en" }) {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [year, setYear] = useState(2024);
  const [area, setArea] = useState(1.0);
  const [selectedCrops, setSelectedCrops] = useState(["RICE", "WHEAT", "SUGARCANE", "MAIZE"]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Fetch States on mount
  useEffect(() => {
    fetch("/api/states")
      .then(res => res.json())
      .then(data => {
        if (data.states && data.states.length > 0) {
          setStates(data.states);
          const defaultState = data.states.includes("PUNJAB") ? "PUNJAB" : data.states[0];
          setSelectedState(defaultState);
        }
      })
      .catch(err => console.error("Error fetching states:", err));
  }, []);

  // Fetch Districts when state changes
  useEffect(() => {
    if (!selectedState) return;
    fetch(`/api/districts/${selectedState}`)
      .then(res => res.json())
      .then(data => {
        if (data.districts && data.districts.length > 0) {
          setDistricts(data.districts);
          setSelectedDistrict(data.districts[0]);
        }
      })
      .catch(err => console.error("Error fetching districts:", err));
  }, [selectedState]);

  const toggleCrop = (crop) => {
    if (selectedCrops.includes(crop)) {
      if (selectedCrops.length > 1) {
        setSelectedCrops(selectedCrops.filter(c => c !== crop));
      }
    } else {
      if (selectedCrops.length < 5) {
        setSelectedCrops([...selectedCrops, crop]);
      }
    }
  };

  const handleCompare = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/crops/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Year: parseInt(year),
          State_Name: selectedState,
          Dist_Name: selectedDistrict,
          crops: selectedCrops,
          Area: parseFloat(area),
          Previous_Year_Yield: 2500.0,
          Previous_Year_Area: parseFloat(area),
          Previous_Year_Production: 2500.0 * parseFloat(area)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Multi-crop comparison failed");
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
        background: "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, var(--bg-glass) 100%)",
        border: "1px solid rgba(59,130,246,0.25)",
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
          background: "rgba(59,130,246,0.2)",
          color: "#3b82f6",
          fontSize: "0.85rem",
          fontWeight: 600,
          marginBottom: "1rem"
        }}>
          <Scale size={16} /> Multi-Crop ROI Optimizer
        </div>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.5rem" }}>
          {t("multiCropTitle", currentLang)}
        </h1>
        <p style={{ color: "var(--text-muted)", maxWidth: "700px", margin: "0 auto", fontSize: "1rem" }}>
          {t("multiCropSub", currentLang)}
        </p>
      </div>

      {/* Input Selection Form */}
      <div className="glass-panel" style={{ padding: "2rem", marginBottom: "2rem" }}>
        <form onSubmit={handleCompare} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "6px", fontWeight: 600 }}>
                {t("stateName", currentLang)}
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="input-field select-field"
              >
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "6px", fontWeight: 600 }}>
                {t("districtName", currentLang)}
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="input-field select-field"
              >
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "6px", fontWeight: 600 }}>
                {t("targetYear", currentLang)}
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "6px", fontWeight: 600 }}>
                {t("landArea", currentLang)}
              </label>
              <input
                type="number"
                step="0.5"
                min="0.1"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {/* Crop Selector Pills */}
          <div>
            <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "8px", fontWeight: 600 }}>
              {t("selectCropsToCompare", currentLang)}
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
              {AVAILABLE_CROPS.map(crop => {
                const isSelected = selectedCrops.includes(crop);
                return (
                  <button
                    key={crop}
                    type="button"
                    onClick={() => toggleCrop(crop)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "9999px",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      background: isSelected ? "#3b82f6" : "var(--bg-glass)",
                      color: isSelected ? "#ffffff" : "var(--text-main)",
                      border: isSelected ? "1px solid #3b82f6" : "1px solid var(--border-glass)",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {isSelected ? "✓ " : "+ "}{crop}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || selectedCrops.length < 2}
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.9rem", fontSize: "1rem" }}
          >
            {loading ? <span className="spinner"></span> : <><Scale size={18} /> {t("runComparison", currentLang)}</>}
          </button>
        </form>
      </div>

      {error && (
        <div style={{ background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.3)", color: "#f43f5e", padding: "1rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Comparison Results Card */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Best Winner Banner */}
          <div style={{
            background: "linear-gradient(135deg, rgba(16,185,129,0.2) 0%, var(--bg-card) 100%)",
            border: "1px solid #10b981",
            borderRadius: "20px",
            padding: "1.5rem 2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "14px", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff" }}>
                <Trophy size={28} />
              </div>
              <div>
                <span style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 700, textTransform: "uppercase" }}>{t("bestCropWinner", currentLang)}</span>
                <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>{result.best_crop}</h2>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Projected Net Profit</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#10b981" }}>
                ₹{result.comparisons[0]?.net_profit_inr.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-main)" }}>
              {t("comparisonMatrix", currentLang)}
            </h3>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--text-main)", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ background: "var(--table-head-bg)", borderBottom: "1px solid var(--border-glass)", textAlign: "left", color: "var(--text-muted)" }}>
                    <th style={{ padding: "12px" }}>{t("cropLabel", currentLang)}</th>
                    <th style={{ padding: "12px" }}>{t("predictedYieldLabel", currentLang)}</th>
                    <th style={{ padding: "12px" }}>{t("grossRevenue", currentLang)}</th>
                    <th style={{ padding: "12px" }}>{t("estimatedCost", currentLang)}</th>
                    <th style={{ padding: "12px" }}>{t("netProfit", currentLang)}</th>
                    <th style={{ padding: "12px" }}>{t("roiPercent", currentLang)}</th>
                    <th style={{ padding: "12px" }}>{t("riskLevel", currentLang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.comparisons.map((item, idx) => (
                    <tr key={item.crop} style={{ borderBottom: "1px solid var(--border-glass)", background: idx === 0 ? "rgba(16,185,129,0.06)" : "transparent" }}>
                      <td style={{ padding: "12px", fontWeight: 700, color: idx === 0 ? "#10b981" : "var(--text-main)" }}>
                        {idx === 0 ? "🏆 " : ""}{item.crop}
                      </td>
                      <td style={{ padding: "12px" }}>{item.predicted_yield} kg/ha</td>
                      <td style={{ padding: "12px", color: "#3b82f6", fontWeight: 600 }}>₹{item.gross_revenue_inr.toLocaleString()}</td>
                      <td style={{ padding: "12px", color: "#f43f5e" }}>₹{item.estimated_cost_inr.toLocaleString()}</td>
                      <td style={{ padding: "12px", color: item.net_profit_inr >= 0 ? "#10b981" : "#f43f5e", fontWeight: 700 }}>
                        ₹{item.net_profit_inr.toLocaleString()}
                      </td>
                      <td style={{ padding: "12px", fontWeight: 700 }}>{item.roi_percentage}%</td>
                      <td style={{ padding: "12px" }}>
                        <span className={item.risk_level === "Low" ? "badge badge-emerald" : item.risk_level === "Moderate" ? "badge badge-amber" : "badge badge-purple"}>
                          {item.risk_level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#8b5cf6", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={18} /> {t("aiRecommendation", currentLang)}
            </h3>
            <p style={{ color: "var(--text-main)", lineHeight: 1.6, margin: 0 }}>
              {result.ai_recommendation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
