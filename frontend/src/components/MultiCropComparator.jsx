import { useState, useEffect } from "react";
import { Scale, Trophy, Sparkles, Check, ArrowRight } from "lucide-react";
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
    <div className="page-container" style={{ maxWidth: "1280px" }}>
      {/* Header Block */}
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
            <span className="badge badge-blue">
              <Scale size={12} /> Multi-Crop ROI Optimizer
            </span>
          </div>
          <h1 className="page-header-title">
            {t("multiCropTitle", currentLang)}
          </h1>
          <p className="page-header-desc">
            {t("multiCropSub", currentLang)}
          </p>
        </div>
      </div>

      {/* Input Selection Form (Fluent Panel) */}
      <div className="fluent-panel" style={{ marginBottom: "2rem" }}>
        <form onSubmit={handleCompare} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">{t("stateName", currentLang)}</label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="input-field select-field"
              >
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t("districtName", currentLang)}</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="input-field select-field"
              >
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t("targetYear", currentLang)}</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t("landArea", currentLang)}</label>
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
            <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>
              {t("selectCropsToCompare", currentLang)} (2 - 5 crops)
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
              {AVAILABLE_CROPS.map(crop => {
                const isSelected = selectedCrops.includes(crop);
                return (
                  <button
                    key={crop}
                    type="button"
                    onClick={() => toggleCrop(crop)}
                    style={{
                      padding: "0.35rem 0.85rem",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.8rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      background: isSelected ? "var(--surface-base)" : "var(--surface-inset)",
                      color: isSelected ? "var(--accent)" : "var(--fg-secondary)",
                      border: isSelected ? "1px solid var(--accent)" : "1px solid var(--border-subtle)",
                      boxShadow: isSelected ? "var(--shadow-sm)" : "none",
                      transition: "all 0.15s ease"
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
            style={{ width: "100%", height: "40px", fontSize: "0.88rem" }}
          >
            {loading ? <span className="spinner"></span> : <><Scale size={15} /> {t("runComparison", currentLang)}</>}
          </button>
        </form>
      </div>

      {error && (
        <div style={{
          background: "var(--danger-subtle)",
          border: "1px solid rgba(239, 68, 68, 0.25)",
          color: "var(--danger)",
          padding: "0.75rem 1rem",
          borderRadius: "var(--radius-md)",
          fontSize: "0.84rem",
          marginBottom: "1.5rem"
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Comparison Results Card */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Best Winner Spotlight Banner */}
          <div className="fluent-panel" style={{
            background: "var(--surface-base)",
            border: "1px solid var(--accent-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
              <div style={{
                width: "42px",
                height: "42px",
                borderRadius: "var(--radius-md)",
                background: "var(--accent-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent)"
              }}>
                <Trophy size={22} />
              </div>
              <div>
                <span className="text-caption" style={{ color: "var(--accent)" }}>
                  {t("bestCropWinner", currentLang)}
                </span>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--fg-primary)", margin: 0 }}>
                  {result.best_crop}
                </h2>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>Projected Net Profit</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-mono)" }}>
                ₹{result.comparisons[0]?.net_profit_inr.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="fluent-panel">
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "1rem", color: "var(--fg-primary)" }}>
              {t("comparisonMatrix", currentLang)}
            </h3>

            <div className="fluent-table-wrapper">
              <table className="fluent-table">
                <thead>
                  <tr>
                    <th>{t("cropLabel", currentLang)}</th>
                    <th>{t("predictedYieldLabel", currentLang)}</th>
                    <th>{t("grossRevenue", currentLang)}</th>
                    <th>{t("estimatedCost", currentLang)}</th>
                    <th>{t("netProfit", currentLang)}</th>
                    <th>{t("roiPercent", currentLang)}</th>
                    <th>{t("riskLevel", currentLang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.comparisons.map((item, idx) => (
                    <tr key={item.crop}>
                      <td style={{ fontWeight: 600, color: idx === 0 ? "var(--accent)" : "var(--fg-primary)" }}>
                        {idx === 0 ? "🏆 " : ""}{item.crop}
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{item.predicted_yield} kg/ha</td>
                      <td style={{ color: "var(--secondary)", fontWeight: 500, fontFamily: "var(--font-mono)" }}>
                        ₹{item.gross_revenue_inr.toLocaleString()}
                      </td>
                      <td style={{ color: "var(--danger)", fontFamily: "var(--font-mono)" }}>
                        ₹{item.estimated_cost_inr.toLocaleString()}
                      </td>
                      <td style={{ 
                        color: item.net_profit_inr >= 0 ? "var(--accent)" : "var(--danger)", 
                        fontWeight: 600, 
                        fontFamily: "var(--font-mono)" 
                      }}>
                        ₹{item.net_profit_inr.toLocaleString()}
                      </td>
                      <td style={{ fontWeight: 600, fontFamily: "var(--font-mono)" }}>{item.roi_percentage}%</td>
                      <td>
                        <span className={item.risk_level === "Low" ? "badge badge-emerald" : item.risk_level === "Moderate" ? "badge badge-amber" : "badge badge-gray"}>
                          {item.risk_level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Agronomy Recommendation */}
          <div className="fluent-panel">
            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--fg-primary)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "6px" }}>
              <Sparkles size={16} color="var(--accent)" /> {t("aiRecommendation", currentLang)}
            </h3>
            <p style={{ color: "var(--fg-secondary)", lineHeight: 1.6, margin: 0, fontSize: "0.88rem" }}>
              {result.ai_recommendation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
