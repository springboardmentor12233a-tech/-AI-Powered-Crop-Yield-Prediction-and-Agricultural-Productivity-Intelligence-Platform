import { useState, useEffect } from "react";
import { 
  Sprout, Scale, FlaskConical, Bot, TrendingUp, Calendar, Sparkles, 
  ArrowRight, Activity, CloudSun, CloudRain, Droplets, Thermometer, 
  Wind, Bug, IndianRupee, Phone, BookOpen, AlertTriangle, Lightbulb, 
  Users, TrendingDown, Gift, HelpCircle, MessageCircle, Plus, X, 
  CheckCircle2, Compass, ShieldCheck, ChevronRight
} from "lucide-react";
import { t } from "../utils/i18n";

// Weather data mock
const WEATHER_DATA = {
  current: { temp: 28, condition: "Partly Cloudy", humidity: 65, wind: 12, rainfall: 0 },
  forecast: [
    { day: "Today", temp: 28, condition: "Partly Cloudy", rainfall: 0 },
    { day: "Tomorrow", temp: 30, condition: "Sunny", rainfall: 0 },
    { day: "Day 3", temp: 26, condition: "Rainy", rainfall: 15 },
    { day: "Day 4", temp: 24, condition: "Heavy Rain", rainfall: 45 },
    { day: "Day 5", temp: 27, condition: "Cloudy", rainfall: 5 },
  ],
  advice: "Good weather for irrigation. Avoid pesticide spraying due to expected rain in 2 days."
};

// Soil analysis data
const SOIL_DATA = {
  types: ["Alluvial", "Black", "Red", "Laterite", "Mountain", "Desert", "Peaty", "Saline"],
  nutrients: ["Nitrogen (N)", "Phosphorus (P)", "Potassium (K)", "Organic Carbon", "pH Level", "Zinc", "Iron", "Manganese"],
  recommendations: {
    "Low Nitrogen": "Apply Urea 50kg/ha or DAP 25kg/ha within 7 days",
    "Low Phosphorus": "Apply SSP 100kg/ha or DAP 50kg/ha before sowing",
    "Low Potassium": "Apply MOP 25kg/ha within 15 days",
    "Low Organic Carbon": "Apply FYM 10 tonnes/ha or compost 5 tonnes/ha",
    "High pH": "Apply Gypsum 2 tonnes/ha or elemental sulfur 500kg/ha",
    "Low pH": "Apply Lime 1 tonne/ha based on soil test"
  }
};

// Pest and disease guide
const PEST_GUIDE = [
  { name: "Aphids", crop: "Wheat, Mustard", symptom: "Yellowing leaves, stunted growth", treatment: "Imidacloprid 200SL @ 0.5ml/L or Thiametham 25WG @ 0.3g/L", severity: "High" },
  { name: "Stem Borer", crop: "Rice, Maize", symptom: "Dead heart in young plants, white ears", treatment: "Carbofuran 3G @ 1kg/ha or Fipronil 0.3G @ 1kg/ha", severity: "High" },
  { name: "Bollworm", crop: "Cotton", symptom: "Damaged bolls, holes in flowers", treatment: "Emamectin Benzoate 5SG @ 0.4g/L or Spinosad 45SC @ 0.3ml/L", severity: "High" },
  { name: "Rust", crop: "Wheat", symptom: "Orange-brown pustules on leaves", treatment: "Propiconazole 25EC @ 1ml/L or Tebuconazole 25EC @ 1ml/L", severity: "Moderate" },
  { name: "Blast", crop: "Rice", symptom: "Diamond-shaped lesions on leaves", treatment: "Tricyclazole 75WP @ 0.6g/L or Isoprothiolane 40EC @ 1.5ml/L", severity: "High" },
  { name: "Powdery Mildew", crop: "Wheat, Pulses", symptom: "White powdery growth on leaves", treatment: "Sulphur 80WP @ 3g/L or Dinocap 48EC @ 1ml/L", severity: "Moderate" },
  { name: "Leaf Spot", crop: "Groundnut, Soybean", symptom: "Brown spots on leaves", treatment: "Chlorothalonil 75WP @ 2g/L or Mancozeb 75WP @ 2.5g/L", severity: "Moderate" },
  { name: "Root Rot", crop: "Pulses, Cotton", symptom: "Wilting, yellowing, root decay", treatment: "Trichoderma viride @ 5kg/ha or Carbendazim 50WP @ 1g/L", severity: "High" }
];

// Market prices
const MARKET_PRICES = [
  { crop: "Wheat", msp: 2275, market: 2400, trend: "up" },
  { crop: "Rice (Paddy)", msp: 2183, market: 2350, trend: "up" },
  { crop: "Maize", msp: 2090, market: 2200, trend: "stable" },
  { crop: "Cotton", msp: 6620, market: 7200, trend: "up" },
  { crop: "Sugarcane", msp: 315, market: 340, trend: "stable" },
  { crop: "Groundnut", msp: 6375, market: 6800, trend: "up" },
  { crop: "Soybean", msp: 4600, market: 4900, trend: "up" },
  { crop: "Mustard", msp: 5650, market: 5900, trend: "down" },
  { crop: "Chickpea", msp: 5440, market: 5600, trend: "stable" },
  { crop: "Barley", msp: 1850, market: 1950, trend: "up" }
];

// Government schemes
const GOVERNMENT_SCHEMES = [
  { name: "PM-KISAN", desc: "₹6,000/year income support to farmers", eligibility: "All landholding farmers", benefit: "₹2,000 every 4 months" },
  { name: "PMFBY (Crop Insurance)", desc: "Crop insurance against natural calamities", eligibility: "All farmers (compulsory for loanee)", benefit: "Up to ₹1 lakh per hectare" },
  { name: "Soil Health Card", desc: "Free soil testing and recommendations", eligibility: "All farmers", benefit: "Free soil test + fertilizer recommendations" },
  { name: "Kisan Credit Card", desc: "Easy credit for agricultural needs", eligibility: "All farmers", benefit: "Loan up to ₹3 lakh at 4% interest" },
  { name: "PM-KMY (Organic Farming)", desc: "Support for organic farming practices", eligibility: "Farmers groups", benefit: "₹50,000/ha for 3 years" },
  { name: "NMOOP (Oilseeds)", desc: "Support for oilseed production", eligibility: "Oilseed farmers", benefit: "50% subsidy on seeds" }
];

// Farming calendar activities
const FARMING_CALENDAR = [
  { month: "January", activities: ["Wheat harvesting", "Mustard harvesting", "Vegetable sowing", "Soil preparation for rabi crops"] },
  { month: "February", activities: ["Wheat irrigation", "Mustard harvesting", "Summer ploughing", "Paddy nursery preparation"] },
  { month: "March", activities: ["Paddy transplanting", "Summer crops sowing", "Mango flowering", "Irrigation management"] },
  { month: "April", activities: ["Paddy transplanting", "Cotton sowing", "Maize sowing", "Pest monitoring"] },
  { month: "May", activities: ["Cotton sowing", "Groundnut sowing", "Pest control", "Irrigation scheduling"] },
  { month: "June", activities: ["Kharif sowing starts", "Paddy transplanting", "Fertilizer application", "Weed management"] },
  { month: "July", activities: ["Kharif crop care", "Pest surveillance", "Water management", "Disease monitoring"] },
  { month: "August", activities: ["Crop growth monitoring", "Fertilizer top-dressing", "Pest control", "Irrigation management"] },
  { month: "September", activities: ["Crop maturity assessment", "Harvest preparation", "Post-harvest planning", "Market price monitoring"] },
  { month: "October", activities: ["Kharif harvesting", "Rabi sowing starts", "Wheat sowing", "Mustard sowing"] },
  { month: "November", activities: ["Rabi sowing", "Wheat sowing", "Pulses sowing", "Soil testing"] },
  { month: "December", activities: ["Rabi crop care", "Irrigation scheduling", "Pest management", "Year-end planning"] }
];

export default function FarmerDashboard({ user, token, setActiveTab, currentLang = "en" }) {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soilTestResults] = useState({ N: 40, P: 20, K: 25, pH: 6.5, organicCarbon: 0.5 });
  const [selectedAdvisoryTab, setSelectedAdvisoryTab] = useState("weather");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({ category: "", amount: 0, date: "", description: "" });

  useEffect(() => {
    if (!token) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    fetch("/api/predictions/history", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.predictions) {
          setHistoryItems(data.predictions);
        }
      })
      .catch(err => console.error("Error fetching farmer dashboard predictions:", err))
      .finally(() => setLoading(false));
  }, [token]);

  const totalPredictions = historyItems.length;
  const avgYield = totalPredictions > 0
    ? Math.round(historyItems.reduce((acc, curr) => acc + (curr.predicted_yield || 0), 0) / totalPredictions)
    : 0;

  const uniqueCrops = Array.from(new Set(historyItems.map(i => i.Crop))).length;

  const getSoilHealthScore = () => {
    let score = 0;
    if (soilTestResults.N >= 40) score += 25;
    if (soilTestResults.P >= 20) score += 25;
    if (soilTestResults.K >= 25) score += 25;
    if (soilTestResults.pH >= 6.0 && soilTestResults.pH <= 7.5) score += 25;
    return score;
  };

  const getSoilRecommendations = () => {
    const recs = [];
    if (soilTestResults.N < 40) recs.push(SOIL_DATA.recommendations["Low Nitrogen"]);
    if (soilTestResults.P < 20) recs.push(SOIL_DATA.recommendations["Low Phosphorus"]);
    if (soilTestResults.K < 25) recs.push(SOIL_DATA.recommendations["Low Potassium"]);
    if (soilTestResults.pH > 7.5) recs.push(SOIL_DATA.recommendations["High pH"]);
    if (soilTestResults.pH < 6.0) recs.push(SOIL_DATA.recommendations["Low pH"]);
    return recs;
  };

  const addExpense = () => {
    if (newExpense.category && newExpense.amount > 0) {
      setExpenses([...expenses, { ...newExpense, id: Date.now() }]);
      setNewExpense({ category: "", amount: 0, date: "", description: "" });
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="page-container">
      {/* Page Header Block */}
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
            <span className="badge badge-emerald">
              <ShieldCheck size={12} /> {t("verifiedFarmerPortal", currentLang)}
            </span>
            <span className="badge badge-gray">
              📍 {user?.farm_location || "Ludhiana, Punjab"}
            </span>
          </div>
          <h1 className="page-header-title">
            {t("welcome", currentLang)}, <span style={{ color: "var(--accent)" }}>{user?.full_name || t("roleFarmer", currentLang)}</span>
          </h1>
          <p className="page-header-desc">
            {t("farmerWelcomeDesc", currentLang)}
          </p>
        </div>

        <button
          onClick={() => setActiveTab("predictor")}
          className="btn btn-primary"
          style={{ height: "38px" }}
        >
          <Sprout size={15} /> {t("runNewPrediction", currentLang)}
        </button>
      </div>

      {/* Row 1: Bento KPI Metric Tiles */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "1.25rem",
        marginBottom: "2rem"
      }}>
        {/* Tile 1 */}
        <div className="metric-tile">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span className="metric-tile-label">{t("totalPredictionsRun", currentLang)}</span>
            <Activity size={16} color="var(--accent)" />
          </div>
          <div className="metric-tile-value">{totalPredictions}</div>
          <div className="metric-tile-sub">{t("savedInHistory", currentLang)}</div>
        </div>

        {/* Tile 2 */}
        <div className="metric-tile">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span className="metric-tile-label">{t("avgYieldEstimate", currentLang)}</span>
            <TrendingUp size={16} color="var(--secondary)" />
          </div>
          <div className="metric-tile-value">
            {avgYield.toLocaleString()} <span style={{ fontSize: "0.9rem", color: "var(--fg-muted)", fontWeight: 500 }}>kg/ha</span>
          </div>
          <div className="metric-tile-sub">{t("mlBenchmark", currentLang)}</div>
        </div>

        {/* Tile 3 */}
        <div className="metric-tile">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span className="metric-tile-label">{t("uniqueCropsEvaluated", currentLang)}</span>
            <Sprout size={16} color="var(--warning)" />
          </div>
          <div className="metric-tile-value">
            {uniqueCrops || (totalPredictions > 0 ? 1 : 0)}
          </div>
          <div className="metric-tile-sub">{t("acrossFarmPlots", currentLang)}</div>
        </div>

        {/* Tile 4 */}
        <div className="metric-tile">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span className="metric-tile-label">{t("aiAgronomyReports", currentLang)}</span>
            <Sparkles size={16} color="#8b5cf6" />
          </div>
          <div className="metric-tile-value">{totalPredictions}</div>
          <div className="metric-tile-sub">{t("dualAiEngine", currentLang)}</div>
        </div>
      </div>

      {/* Row 2: Bento Grid (Primary Operations Span 8 + Quick Launchers Span 4) */}
      <div className="bento-grid" style={{ marginBottom: "2.5rem" }}>
        {/* Left Bento Area (Span 8): Field Operations Telemetry Center */}
        <div className="bento-cell col-span-8">
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem",
            marginBottom: "1.25rem",
            paddingBottom: "0.85rem",
            borderBottom: "1px solid var(--border-subtle)"
          }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--fg-primary)", margin: 0 }}>
                Field Operations & Telemetry Center
              </h2>
              <p style={{ fontSize: "0.78rem", color: "var(--fg-muted)", margin: "2px 0 0" }}>
                Live agro-climate metrics, soil diagnostics, and regional mandi prices
              </p>
            </div>

            {/* Segmented Selector Buttons */}
            <div style={{
              display: "flex",
              gap: "2px",
              background: "var(--surface-inset)",
              padding: "2px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
              overflowX: "auto",
              maxWidth: "100%",
              scrollbarWidth: "none"
            }}>
              {[
                { id: "weather", label: t("weather", currentLang), icon: CloudSun },
                { id: "soil", label: t("soilAnalysis", currentLang), icon: FlaskConical },
                { id: "pests", label: t("pestGuide", currentLang), icon: Bug },
                { id: "market", label: t("marketPrices", currentLang), icon: IndianRupee },
                { id: "schemes", label: t("govtSchemes", currentLang), icon: Gift },
                { id: "calendar", label: t("farmingCalendar", currentLang), icon: Calendar },
                { id: "expenses", label: t("expenseTracker", currentLang), icon: IndianRupee },
                { id: "support", label: t("helpSupport", currentLang), icon: Phone }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = selectedAdvisoryTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedAdvisoryTab(tab.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "0.35rem 0.65rem",
                      borderRadius: "calc(var(--radius-sm) - 2px)",
                      border: "none",
                      fontSize: "0.76rem",
                      fontWeight: isActive ? 600 : 500,
                      cursor: "pointer",
                      background: isActive ? "var(--surface-base)" : "transparent",
                      color: isActive ? "var(--accent)" : "var(--fg-secondary)",
                      boxShadow: isActive ? "var(--shadow-sm)" : "none",
                      transition: "all 0.15s ease",
                      whiteSpace: "nowrap"
                    }}
                  >
                    <Icon size={12} /> {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Module Content */}
          <div style={{ flex: 1 }}>
            {/* Weather Module */}
            {selectedAdvisoryTab === "weather" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                  <div style={{
                    background: "var(--surface-inset)",
                    padding: "1rem",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    alignItems: "center",
                    gap: "1.25rem"
                  }}>
                    <div style={{ textAlign: "center" }}>
                      <Thermometer size={28} color="var(--warning)" />
                      <div style={{ fontSize: "1.75rem", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                        {WEATHER_DATA.current.temp}°C
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--fg-muted)" }}>
                        {WEATHER_DATA.current.condition}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", flex: 1 }}>
                      <div style={{ textAlign: "center", background: "var(--surface-base)", padding: "0.5rem", borderRadius: "var(--radius-sm)" }}>
                        <div style={{ fontSize: "0.68rem", color: "var(--fg-muted)" }}>Humidity</div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{WEATHER_DATA.current.humidity}%</div>
                      </div>
                      <div style={{ textAlign: "center", background: "var(--surface-base)", padding: "0.5rem", borderRadius: "var(--radius-sm)" }}>
                        <div style={{ fontSize: "0.68rem", color: "var(--fg-muted)" }}>Wind</div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{WEATHER_DATA.current.wind} km/h</div>
                      </div>
                      <div style={{ textAlign: "center", background: "var(--surface-base)", padding: "0.5rem", borderRadius: "var(--radius-sm)" }}>
                        <div style={{ fontSize: "0.68rem", color: "var(--fg-muted)" }}>Rainfall</div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{WEATHER_DATA.current.rainfall} mm</div>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: "var(--surface-inset)",
                    padding: "1rem",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.35rem" }}>
                      <Lightbulb size={16} color="var(--accent)" />
                      <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--accent)" }}>
                        Agro Advisory Note
                      </span>
                    </div>
                    <p style={{ fontSize: "0.82rem", color: "var(--fg-secondary)", margin: 0, lineHeight: 1.5 }}>
                      {WEATHER_DATA.advice}
                    </p>
                  </div>
                </div>

                {/* 5-Day Forecast Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem" }}>
                  {WEATHER_DATA.forecast.map((d, i) => (
                    <div key={i} style={{
                      background: "var(--surface-inset)",
                      padding: "0.65rem 0.5rem",
                      borderRadius: "var(--radius-sm)",
                      textAlign: "center"
                    }}>
                      <div style={{ fontSize: "0.72rem", color: "var(--fg-muted)", fontWeight: 500 }}>{d.day}</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, fontFamily: "var(--font-mono)", margin: "2px 0" }}>{d.temp}°C</div>
                      <div style={{ fontSize: "0.68rem", color: "var(--fg-secondary)" }}>{d.condition}</div>
                      {d.rainfall > 0 && <div style={{ fontSize: "0.68rem", color: "var(--secondary)" }}>💧 {d.rainfall}mm</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Soil Health Module */}
            {selectedAdvisoryTab === "soil" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem", marginBottom: "1rem" }}>
                  <div style={{ background: "var(--surface-inset)", padding: "1rem", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--fg-muted)", fontWeight: 500 }}>Soil Health Index</div>
                    <div style={{ fontSize: "2.2rem", fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-mono)" }}>
                      {getSoilHealthScore()}%
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--fg-secondary)" }}>Optimal Condition</div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem" }}>
                    <div style={{ background: "var(--surface-inset)", padding: "0.65rem", borderRadius: "var(--radius-sm)" }}>
                      <div className="text-caption" style={{ color: "var(--fg-muted)" }}>Nitrogen (N)</div>
                      <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--accent)" }}>{soilTestResults.N} kg/ha</div>
                    </div>
                    <div style={{ background: "var(--surface-inset)", padding: "0.65rem", borderRadius: "var(--radius-sm)" }}>
                      <div className="text-caption" style={{ color: "var(--fg-muted)" }}>Phosphorus (P)</div>
                      <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--accent)" }}>{soilTestResults.P} kg/ha</div>
                    </div>
                    <div style={{ background: "var(--surface-inset)", padding: "0.65rem", borderRadius: "var(--radius-sm)" }}>
                      <div className="text-caption" style={{ color: "var(--fg-muted)" }}>Potassium (K)</div>
                      <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--accent)" }}>{soilTestResults.K} kg/ha</div>
                    </div>
                    <div style={{ background: "var(--surface-inset)", padding: "0.65rem", borderRadius: "var(--radius-sm)" }}>
                      <div className="text-caption" style={{ color: "var(--fg-muted)" }}>pH Balance</div>
                      <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--accent)" }}>{soilTestResults.pH}</div>
                    </div>
                  </div>
                </div>

                {getSoilRecommendations().length > 0 && (
                  <div style={{ background: "var(--surface-inset)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--warning)", marginBottom: "0.3rem" }}>
                      Nutrient Corrections:
                    </div>
                    {getSoilRecommendations().map((r, i) => (
                      <div key={i} style={{ fontSize: "0.78rem", color: "var(--fg-secondary)", marginBottom: "0.2rem" }}>• {r}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pest Guide Module */}
            {selectedAdvisoryTab === "pests" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.75rem" }}>
                {PEST_GUIDE.slice(0, 4).map((p, i) => (
                  <div key={i} style={{ background: "var(--surface-inset)", padding: "0.85rem", borderRadius: "var(--radius-md)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                      <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>{p.name}</span>
                      <span className="badge badge-amber" style={{ fontSize: "0.62rem" }}>{p.severity}</span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--fg-secondary)", marginBottom: "0.2rem" }}>
                      <strong>Target:</strong> {p.crop}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--accent)", fontWeight: 500 }}>
                      <strong>Remedy:</strong> {p.treatment}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Mandi Market Prices Module */}
            {selectedAdvisoryTab === "market" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.65rem" }}>
                {MARKET_PRICES.slice(0, 6).map((m, i) => (
                  <div key={i} style={{ background: "var(--surface-inset)", padding: "0.75rem", borderRadius: "var(--radius-md)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{m.crop}</span>
                      <span style={{ fontSize: "0.72rem", color: m.trend === "up" ? "var(--accent)" : "var(--fg-muted)" }}>
                        {m.trend === "up" ? "↑ Up" : "● Stable"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem" }}>
                      <span style={{ color: "var(--fg-muted)" }}>MSP: ₹{m.msp}</span>
                      <span style={{ color: "var(--accent)", fontWeight: 600 }}>Market: ₹{m.market}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Govt Schemes Module */}
            {selectedAdvisoryTab === "schemes" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.75rem" }}>
                {GOVERNMENT_SCHEMES.slice(0, 3).map((s, i) => (
                  <div key={i} style={{ background: "var(--surface-inset)", padding: "0.85rem", borderRadius: "var(--radius-md)" }}>
                    <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--accent)", marginBottom: "0.2rem" }}>{s.name}</div>
                    <div style={{ fontSize: "0.76rem", color: "var(--fg-secondary)", marginBottom: "0.35rem" }}>{s.desc}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--fg-primary)", fontWeight: 500 }}>{s.benefit}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Farm Calendar Module */}
            {selectedAdvisoryTab === "calendar" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "0.4rem", marginBottom: "0.85rem" }}>
                  {FARMING_CALENDAR.slice(0, 6).map((cal, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedMonth(i)}
                      style={{
                        padding: "0.5rem 0.3rem",
                        borderRadius: "var(--radius-sm)",
                        border: selectedMonth === i ? "1px solid var(--accent)" : "1px solid var(--border-subtle)",
                        background: selectedMonth === i ? "var(--surface-base)" : "var(--surface-inset)",
                        color: selectedMonth === i ? "var(--accent)" : "var(--fg-secondary)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      {cal.month.slice(0, 3)}
                    </button>
                  ))}
                </div>
                <div style={{ background: "var(--surface-inset)", padding: "0.85rem", borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--accent)", marginBottom: "0.3rem" }}>
                    {FARMING_CALENDAR[selectedMonth].month} Actions:
                  </div>
                  {FARMING_CALENDAR[selectedMonth].activities.map((a, idx) => (
                    <div key={idx} style={{ fontSize: "0.78rem", color: "var(--fg-secondary)", marginBottom: "0.2rem" }}>• {a}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Expenses Module */}
            {selectedAdvisoryTab === "expenses" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.5rem", marginBottom: "0.85rem" }}>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                    className="input-field select-field"
                    style={{ height: "34px", fontSize: "0.78rem" }}
                  >
                    <option value="">Category</option>
                    <option value="Seeds">Seeds</option>
                    <option value="Fertilizer">Fertilizer</option>
                    <option value="Irrigation">Irrigation</option>
                    <option value="Labor">Labor</option>
                  </select>

                  <input
                    type="number"
                    placeholder="Amount (₹)"
                    value={newExpense.amount || ""}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                    className="input-field"
                    style={{ height: "34px", fontSize: "0.78rem" }}
                  />

                  <button onClick={addExpense} className="btn btn-primary" style={{ height: "34px", fontSize: "0.78rem" }}>
                    <Plus size={13} /> Add
                  </button>
                </div>

                <div style={{ fontSize: "0.8rem", color: "var(--fg-secondary)" }}>
                  Total Recorded Outflow: <strong style={{ color: "var(--fg-primary)" }}>₹{totalExpenses.toLocaleString()}</strong>
                </div>
              </div>
            )}

            {/* Kisan Helpline Module */}
            {selectedAdvisoryTab === "support" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
                <div style={{ background: "var(--surface-inset)", padding: "0.85rem", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                  <Phone size={20} color="var(--accent)" style={{ margin: "0 auto 4px" }} />
                  <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>Kisan Call Center</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--accent)", fontWeight: 600 }}>1800-180-1551 (Toll Free)</div>
                </div>

                <div style={{ background: "var(--surface-inset)", padding: "0.85rem", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                  <MessageCircle size={20} color="var(--secondary)" style={{ margin: "0 auto 4px" }} />
                  <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>WhatsApp Agronomy</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--secondary)", fontWeight: 600 }}>+91 98765 43210</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Bento Area (Span 4): Core Intelligence Launchers */}
        <div className="bento-cell col-span-4" style={{ justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--fg-primary)", marginBottom: "0.2rem" }}>
              Intelligence Suite
            </h2>
            <p style={{ fontSize: "0.78rem", color: "var(--fg-muted)", marginBottom: "1rem" }}>
              Quick access to core quantitative models
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {/* Launcher 1 */}
              <div
                onClick={() => setActiveTab("predictor")}
                className="fluent-card fluent-card-interactive"
                style={{ padding: "0.75rem 0.95rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "var(--radius-xs)", background: "var(--accent-subtle)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Sprout size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{t("predictor", currentLang)}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--fg-muted)" }}>Yield forecasting in kg/ha</div>
                  </div>
                </div>
                <ChevronRight size={14} color="var(--fg-muted)" />
              </div>

              {/* Launcher 2 */}
              <div
                onClick={() => setActiveTab("fertilizer")}
                className="fluent-card fluent-card-interactive"
                style={{ padding: "0.75rem 0.95rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "var(--radius-xs)", background: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FlaskConical size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{t("fertilizer", currentLang)}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--fg-muted)" }}>Precision N-P-K dosing</div>
                  </div>
                </div>
                <ChevronRight size={14} color="var(--fg-muted)" />
              </div>

              {/* Launcher 3 */}
              <div
                onClick={() => setActiveTab("compare")}
                className="fluent-card fluent-card-interactive"
                style={{ padding: "0.75rem 0.95rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "var(--radius-xs)", background: "var(--secondary-subtle)", color: "var(--secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Scale size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{t("compare", currentLang)}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--fg-muted)" }}>Multi-crop ROI matrix</div>
                  </div>
                </div>
                <ChevronRight size={14} color="var(--fg-muted)" />
              </div>

              {/* Launcher 4 */}
              <div
                onClick={() => setActiveTab("assistant")}
                className="fluent-card fluent-card-interactive"
                style={{ padding: "0.75rem 0.95rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "var(--radius-xs)", background: "var(--warning-subtle)", color: "var(--warning)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Bot size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{t("assistant", currentLang)}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--fg-muted)" }}>Dual-AI Voice & Chat</div>
                  </div>
                </div>
                <ChevronRight size={14} color="var(--fg-muted)" />
              </div>
            </div>
          </div>

          <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>Active Engine:</span>
            <span className="badge badge-emerald">Dual AI (Gemini + Groq)</span>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Activity / Historical Logs Table */}
      <div className="fluent-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--fg-primary)", margin: 0 }}>
              {t("recentPredictionHistory", currentLang)}
            </h2>
            <p style={{ fontSize: "0.78rem", color: "var(--fg-muted)", margin: "2px 0 0" }}>
              Persistent farm logs verified by XGBoost regression pipeline
            </p>
          </div>

          <button
            onClick={() => setActiveTab("history")}
            className="btn btn-ghost"
            style={{ height: "30px", fontSize: "0.78rem", color: "var(--accent)" }}
          >
            {t("viewAllLogs", currentLang)} <ArrowRight size={13} />
          </button>
        </div>

        {historyItems.length > 0 ? (
          <div className="fluent-table-wrapper">
            <table className="fluent-table">
              <thead>
                <tr>
                  <th>{t("cropLabel", currentLang)}</th>
                  <th>{t("locationLabel", currentLang)}</th>
                  <th>{t("yearLabel", currentLang)}</th>
                  <th>{t("predictedYieldLabel", currentLang)}</th>
                  <th>{t("aiEngineLabel", currentLang)}</th>
                  <th>{t("timestampLabel", currentLang)}</th>
                </tr>
              </thead>
              <tbody>
                {historyItems.slice(0, 5).map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600, color: "var(--accent)" }}>{item.Crop}</td>
                    <td>{item.Dist_Name}, {item.State_Name}</td>
                    <td style={{ fontFamily: "var(--font-mono)" }}>{item.Year}</td>
                    <td style={{ fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                      {item.predicted_yield} kg/ha
                    </td>
                    <td>
                      <span className="badge badge-purple">
                        {item.ai_provider_used}
                      </span>
                    </td>
                    <td style={{ color: "var(--fg-muted)", fontSize: "0.78rem" }}>
                      {item.created_at_formatted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--fg-muted)" }}>
            <Sprout size={32} color="var(--accent)" style={{ margin: "0 auto 0.5rem", opacity: 0.6 }} />
            <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{t("noPredictionsRecorded", currentLang)}</div>
            <p style={{ fontSize: "0.78rem", color: "var(--fg-muted)", marginTop: "2px" }}>
              Run your first yield prediction to generate verifiable soil records.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
