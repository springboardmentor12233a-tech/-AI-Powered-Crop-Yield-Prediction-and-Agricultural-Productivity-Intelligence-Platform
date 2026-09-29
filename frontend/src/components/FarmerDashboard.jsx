import { useState, useEffect } from "react";
import { Sprout, Scale, FlaskConical, Bot, TrendingUp, Calendar, Sparkles, ArrowRight, Activity, CloudSun, CloudRain, Droplets, Thermometer, Wind, Bug, IndianRupee, Phone, BookOpen, AlertTriangle, Lightbulb, Users, TrendingDown, Gift, HelpCircle, MessageCircle, Plus, X } from "lucide-react";
import { t } from "../utils/i18n";

// Weather data mock - in production, this would come from a weather API
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

// Market prices (MSP - Minimum Support Price)
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
  const [, setLoading] = useState(true);
  const [soilTestResults] = useState({ N: 40, P: 20, K: 25, pH: 6.5, organicCarbon: 0.5 });
  const [showSoilAnalysis, setShowSoilAnalysis] = useState(false);
  const [showPestGuide, setShowPestGuide] = useState(false);
  const [showMarketPrices, setShowMarketPrices] = useState(false);
  const [showSchemes, setShowSchemes] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({ category: "", amount: 0, date: "", description: "" });
  const [showExpenseTracker, setShowExpenseTracker] = useState(false);
  const [showWeather, setShowWeather] = useState(false);

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

  // Calculate soil health score
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
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "1.5rem 1rem" }}>
      {/* Welcome Banner - Simplified */}
      <div style={{
        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, var(--bg-card) 100%)",
        border: "1px solid rgba(16, 185, 129, 0.3)",
        borderRadius: "20px",
        padding: "1.5rem 2rem",
        marginBottom: "1.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
            {t("welcome", currentLang)}, <span className="gradient-text">{user?.full_name || t("roleFarmer", currentLang)}</span>! 🌾
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px", fontSize: "0.9rem" }}>
            {user?.farm_location || "Ludhiana, Punjab"}
          </p>
        </div>
        <button
          onClick={() => setActiveTab("predictor")}
          className="btn btn-primary"
          style={{ padding: "0.75rem 1.5rem", borderRadius: "10px", fontSize: "0.95rem" }}
        >
          <Sprout size={16} /> {t("runNewPrediction", currentLang)}
        </button>
      </div>

      {/* Quick Action Cards - Big and Simple */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1rem",
        marginBottom: "1.5rem"
      }}>
        <div onClick={() => setActiveTab("predictor")} className="glass-panel hover-card" style={{ padding: "1.25rem", cursor: "pointer", textAlign: "center", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981", margin: "0 auto 0.75rem" }}>
            <Sprout size={24} />
          </div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>{t("predictor", currentLang)}</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.25rem 0 0" }}>{t("featurePredictorDesc", currentLang)}</p>
        </div>

        <div onClick={() => setShowSoilAnalysis(!showSoilAnalysis)} className="glass-panel hover-card" style={{ padding: "1.25rem", cursor: "pointer", textAlign: "center", border: "1px solid rgba(59, 130, 246, 0.25)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(59, 130, 246, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6", margin: "0 auto 0.75rem" }}>
            <FlaskConical size={24} />
          </div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>{t("soilAnalysis", currentLang)}</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.25rem 0 0" }}>{t("soilAnalysisDesc", currentLang)}</p>
        </div>

        <div onClick={() => setShowWeather(!showWeather)} className="glass-panel hover-card" style={{ padding: "1.25rem", cursor: "pointer", textAlign: "center", border: "1px solid rgba(245, 158, 11, 0.25)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(245, 158, 11, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b", margin: "0 auto 0.75rem" }}>
            <CloudSun size={24} />
          </div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>{t("weather", currentLang)}</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.25rem 0 0" }}>{t("weatherDesc", currentLang)}</p>
        </div>

        <div onClick={() => setShowPestGuide(!showPestGuide)} className="glass-panel hover-card" style={{ padding: "1.25rem", cursor: "pointer", textAlign: "center", border: "1px solid rgba(244, 63, 94, 0.25)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(244, 63, 94, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f43f5e", margin: "0 auto 0.75rem" }}>
            <Bug size={24} />
          </div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>{t("pestGuide", currentLang)}</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.25rem 0 0" }}>{t("pestGuideDesc", currentLang)}</p>
        </div>

        <div onClick={() => setShowMarketPrices(!showMarketPrices)} className="glass-panel hover-card" style={{ padding: "1.25rem", cursor: "pointer", textAlign: "center", border: "1px solid rgba(139, 92, 246, 0.25)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(139, 92, 246, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#8b5cf6", margin: "0 auto 0.75rem" }}>
            <IndianRupee size={24} />
          </div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>{t("marketPrices", currentLang)}</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.25rem 0 0" }}>{t("marketPricesDesc", currentLang)}</p>
        </div>

        <div onClick={() => setShowSchemes(!showSchemes)} className="glass-panel hover-card" style={{ padding: "1.25rem", cursor: "pointer", textAlign: "center", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981", margin: "0 auto 0.75rem" }}>
            <Gift size={24} />
          </div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>{t("govtSchemes", currentLang)}</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.25rem 0 0" }}>{t("govtSchemesDesc", currentLang)}</p>
        </div>
      </div>

      {/* Weather Section */}
      {showWeather && (
        <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem", border: "1px solid rgba(245, 158, 11, 0.25)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CloudSun size={20} color="#f59e0b" /> {t("weatherForecast", currentLang)}
            </h2>
            <button onClick={() => setShowWeather(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>
          
          {/* Current Weather */}
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", marginBottom: "1rem", padding: "1rem", background: "var(--bg-glass)", borderRadius: "12px" }}>
            <div style={{ textAlign: "center" }}>
              <Thermometer size={32} color="#f59e0b" />
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-main)" }}>{WEATHER_DATA.current.temp}°C</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{WEATHER_DATA.current.condition}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", flex: 1 }}>
              <div style={{ textAlign: "center" }}>
                <Droplets size={20} color="#3b82f6" />
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Humidity</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{WEATHER_DATA.current.humidity}%</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <Wind size={20} color="#10b981" />
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Wind</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{WEATHER_DATA.current.wind} km/h</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <CloudRain size={20} color="#8b5cf6" />
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Rainfall</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{WEATHER_DATA.current.rainfall} mm</div>
              </div>
            </div>
          </div>

          {/* 5-Day Forecast */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
            {WEATHER_DATA.forecast.map((day, idx) => (
              <div key={idx} style={{ background: "var(--bg-glass)", padding: "0.75rem", borderRadius: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>{day.day}</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-main)" }}>{day.temp}°C</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{day.condition}</div>
                {day.rainfall > 0 && (
                  <div style={{ fontSize: "0.7rem", color: "#3b82f6", marginTop: "0.25rem" }}>💧 {day.rainfall}mm</div>
                )}
              </div>
            ))}
          </div>

          {/* Weather Advice */}
          <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "10px", padding: "0.85rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <Lightbulb size={16} color="#10b981" />
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#10b981" }}>{t("weatherAdvice", currentLang)}</span>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>{WEATHER_DATA.advice}</p>
          </div>
        </div>
      )}

      {/* Soil Analysis Section */}
      {showSoilAnalysis && (
        <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem", border: "1px solid rgba(59, 130, 246, 0.25)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FlaskConical size={20} color="#3b82f6" /> {t("soilAnalysis", currentLang)}
            </h2>
            <button onClick={() => setShowSoilAnalysis(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>

          {/* Soil Health Score */}
          <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem" }}>
            <div style={{ flex: 1, background: "var(--bg-glass)", padding: "1rem", borderRadius: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>{t("soilHealthScore", currentLang)}</div>
              <div style={{ fontSize: "2.5rem", fontWeight: 800, color: getSoilHealthScore() >= 75 ? "#10b981" : getSoilHealthScore() >= 50 ? "#f59e0b" : "#f43f5e" }}>
                {getSoilHealthScore()}%
              </div>
            </div>
            <div style={{ flex: 2, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
              <div style={{ background: "var(--bg-glass)", padding: "0.75rem", borderRadius: "10px" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Nitrogen (N)</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: soilTestResults.N >= 40 ? "#10b981" : "#f43f5e" }}>{soilTestResults.N} kg/ha</div>
              </div>
              <div style={{ background: "var(--bg-glass)", padding: "0.75rem", borderRadius: "10px" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Phosphorus (P)</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: soilTestResults.P >= 20 ? "#10b981" : "#f43f5e" }}>{soilTestResults.P} kg/ha</div>
              </div>
              <div style={{ background: "var(--bg-glass)", padding: "0.75rem", borderRadius: "10px" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Potassium (K)</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: soilTestResults.K >= 25 ? "#10b981" : "#f43f5e" }}>{soilTestResults.K} kg/ha</div>
              </div>
              <div style={{ background: "var(--bg-glass)", padding: "0.75rem", borderRadius: "10px" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>pH Level</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: soilTestResults.pH >= 6.0 && soilTestResults.pH <= 7.5 ? "#10b981" : "#f43f5e" }}>{soilTestResults.pH}</div>
              </div>
            </div>
          </div>

          {/* Soil Recommendations */}
          {getSoilRecommendations().length > 0 && (
            <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)", borderRadius: "10px", padding: "0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <AlertTriangle size={16} color="#f59e0b" />
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f59e0b" }}>{t("soilRecommendations", currentLang)}</span>
              </div>
              {getSoilRecommendations().map((rec, idx) => (
                <div key={idx} style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>• {rec}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pest Guide Section */}
      {showPestGuide && (
        <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem", border: "1px solid rgba(244, 63, 94, 0.25)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Bug size={20} color="#f43f5e" /> {t("pestGuide", currentLang)}
            </h2>
            <button onClick={() => setShowPestGuide(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.75rem" }}>
            {PEST_GUIDE.map((pest, idx) => (
              <div key={idx} style={{ background: "var(--bg-glass)", padding: "0.85rem", borderRadius: "10px", border: "1px solid var(--border-glass)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-main)" }}>{pest.name}</span>
                  <span className="badge" style={{ fontSize: "0.65rem", background: pest.severity === "High" ? "rgba(244, 63, 94, 0.15)" : "rgba(245, 158, 11, 0.15)", color: pest.severity === "High" ? "#f43f5e" : "#f59e0b" }}>
                    {pest.severity}
                  </span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}><strong>Crops:</strong> {pest.crop}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}><strong>Symptoms:</strong> {pest.symptom}</div>
                <div style={{ fontSize: "0.75rem", color: "#10b981" }}><strong>Treatment:</strong> {pest.treatment}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market Prices Section */}
      {showMarketPrices && (
        <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem", border: "1px solid rgba(139, 92, 246, 0.25)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <IndianRupee size={20} color="#8b5cf6" /> {t("marketPrices", currentLang)}
            </h2>
            <button onClick={() => setShowMarketPrices(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
            {MARKET_PRICES.map((item, idx) => (
              <div key={idx} style={{ background: "var(--bg-glass)", padding: "0.85rem", borderRadius: "10px", border: "1px solid var(--border-glass)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-main)" }}>{item.crop}</span>
                  {item.trend === "up" ? <TrendingUp size={16} color="#10b981" /> : item.trend === "down" ? <TrendingDown size={16} color="#f43f5e" /> : <span style={{ color: "var(--text-muted)" }}>—</span>}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>MSP: ₹{item.msp}</span>
                  <span style={{ color: "#10b981", fontWeight: 600 }}>Market: ₹{item.market}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Government Schemes Section */}
      {showSchemes && (
        <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Gift size={20} color="#10b981" /> {t("govtSchemes", currentLang)}
            </h2>
            <button onClick={() => setShowSchemes(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.75rem" }}>
            {GOVERNMENT_SCHEMES.map((scheme, idx) => (
              <div key={idx} style={{ background: "var(--bg-glass)", padding: "0.85rem", borderRadius: "10px", border: "1px solid var(--border-glass)" }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#10b981", marginBottom: "0.25rem" }}>{scheme.name}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>{scheme.desc}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}><strong>Benefit:</strong> {scheme.benefit}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Farming Calendar Section */}
      {showCalendar && (
        <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Calendar size={20} color="#10b981" /> {t("farmingCalendar", currentLang)}
            </h2>
            <button onClick={() => setShowCalendar(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
            {FARMING_CALENDAR.map((month, idx) => (
              <div key={idx} onClick={() => setSelectedMonth(idx)} style={{ background: idx === selectedMonth ? "rgba(16, 185, 129, 0.15)" : "var(--bg-glass)", padding: "0.85rem", borderRadius: "10px", border: idx === selectedMonth ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid var(--border-glass)", cursor: "pointer" }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 700, color: idx === selectedMonth ? "#10b981" : "var(--text-main)", marginBottom: "0.5rem" }}>{month.month}</div>
                {idx === selectedMonth && (
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {month.activities.map((act, i) => (
                      <div key={i} style={{ marginBottom: "0.25rem" }}>• {act}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expense Tracker Section */}
      {showExpenseTracker && (
        <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem", border: "1px solid rgba(245, 158, 11, 0.25)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <IndianRupee size={20} color="#f59e0b" /> {t("expenseTracker", currentLang)}
            </h2>
            <button onClick={() => setShowExpenseTracker(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>
          
          {/* Add Expense Form */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
            <select value={newExpense.category} onChange={(e) => setNewExpense({...newExpense, category: e.target.value})} className="input-field" style={{ padding: "0.5rem", fontSize: "0.85rem" }}>
              <option value="">Select Category</option>
              <option value="Seeds">Seeds</option>
              <option value="Fertilizer">Fertilizer</option>
              <option value="Pesticide">Pesticide</option>
              <option value="Labor">Labor</option>
              <option value="Irrigation">Irrigation</option>
              <option value="Equipment">Equipment</option>
              <option value="Other">Other</option>
            </select>
            <input type="number" placeholder="Amount (₹)" value={newExpense.amount} onChange={(e) => setNewExpense({...newExpense, amount: Number(e.target.value)})} className="input-field" style={{ padding: "0.5rem", fontSize: "0.85rem" }} />
            <input type="date" value={newExpense.date} onChange={(e) => setNewExpense({...newExpense, date: e.target.value})} className="input-field" style={{ padding: "0.5rem", fontSize: "0.85rem" }} />
            <button onClick={addExpense} className="btn btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
              <Plus size={14} /> Add
            </button>
          </div>

          {/* Expense List */}
          {expenses.length > 0 ? (
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border-glass)", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)" }}>
                <span>Category</span>
                <span>Amount</span>
                <span>Date</span>
              </div>
              {expenses.map(exp => (
                <div key={exp.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border-glass)", fontSize: "0.85rem" }}>
                  <span style={{ color: "var(--text-main)" }}>{exp.category}</span>
                  <span style={{ color: "#f43f5e", fontWeight: 600 }}>₹{exp.amount}</span>
                  <span style={{ color: "var(--text-muted)" }}>{exp.date}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0 0", fontSize: "0.9rem", fontWeight: 700 }}>
                <span>Total Expenses</span>
                <span style={{ color: "#f43f5e" }}>₹{totalExpenses.toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              {t("noExpensesRecorded", currentLang)}
            </div>
          )}
        </div>
      )}

      {/* Help & Support Section */}
      <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem", border: "1px solid rgba(59, 130, 246, 0.25)" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", margin: 0, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <HelpCircle size={20} color="#3b82f6" /> {t("helpSupport", currentLang)}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
          <div style={{ background: "var(--bg-glass)", padding: "0.85rem", borderRadius: "10px", textAlign: "center" }}>
            <Phone size={24} color="#10b981" />
            <div style={{ fontSize: "0.85rem", fontWeight: 600, marginTop: "0.5rem" }}>Kisan Call Center</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>1800-180-1551 (Toll Free)</div>
          </div>
          <div style={{ background: "var(--bg-glass)", padding: "0.85rem", borderRadius: "10px", textAlign: "center" }}>
            <MessageCircle size={24} color="#3b82f6" />
            <div style={{ fontSize: "0.85rem", fontWeight: 600, marginTop: "0.5rem" }}>WhatsApp Support</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>+91 98765 43210</div>
          </div>
          <div style={{ background: "var(--bg-glass)", padding: "0.85rem", borderRadius: "10px", textAlign: "center" }}>
            <BookOpen size={24} color="#8b5cf6" />
            <div style={{ fontSize: "0.85rem", fontWeight: 600, marginTop: "0.5rem" }}>User Guide</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Step-by-step instructions</div>
          </div>
          <div style={{ background: "var(--bg-glass)", padding: "0.85rem", borderRadius: "10px", textAlign: "center" }}>
            <Users size={24} color="#f59e0b" />
            <div style={{ fontSize: "0.85rem", fontWeight: 600, marginTop: "0.5rem" }}>Local Expert</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Connect with agri officer</div>
          </div>
        </div>
      </div>

      {/* KPI Stats Counters Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "1.25rem",
        marginBottom: "2.5rem"
      }}>
        {/* Stat 1 */}
        <div className="glass-panel" style={{ padding: "1.5rem", border: "1px solid rgba(16,185,129,0.25)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>{t("totalPredictionsRun", currentLang)}</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981" }}>
              <Activity size={18} />
            </div>
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-main)", marginTop: "8px" }}>
            {totalPredictions}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#10b981", marginTop: "4px" }}>
            {t("savedInHistory", currentLang)}
          </div>
        </div>

        {/* Stat 2 */}
        <div className="glass-panel" style={{ padding: "1.5rem", border: "1px solid rgba(59,130,246,0.25)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>{t("avgYieldEstimate", currentLang)}</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6" }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-main)", marginTop: "8px" }}>
            {avgYield.toLocaleString()} <span style={{ fontSize: "1rem", color: "#3b82f6" }}>kg/ha</span>
          </div>
          <div style={{ fontSize: "0.78rem", color: "#3b82f6", marginTop: "4px" }}>
            {t("mlBenchmark", currentLang)}
          </div>
        </div>

        {/* Stat 3 */}
        <div className="glass-panel" style={{ padding: "1.5rem", border: "1px solid rgba(139,92,246,0.25)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>{t("uniqueCropsEvaluated", currentLang)}</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#8b5cf6" }}>
              <Sprout size={18} />
            </div>
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-main)", marginTop: "8px" }}>
            {uniqueCrops}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#8b5cf6", marginTop: "4px" }}>
            {t("acrossFarmPlots", currentLang)}
          </div>
        </div>

        {/* Stat 4 */}
        <div className="glass-panel" style={{ padding: "1.5rem", border: "1px solid rgba(245,158,11,0.25)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>{t("aiAgronomyReports", currentLang)}</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b" }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-main)", marginTop: "8px" }}>
            {totalPredictions}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#f59e0b", marginTop: "4px" }}>
            {t("dualAiEngine", currentLang)}
          </div>
        </div>
      </div>

      {/* Quick Action Launcher Grid */}
      <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "1.2rem" }}>
        {t("quickActionLauncher", currentLang)}
      </h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "1.25rem",
        marginBottom: "2.5rem"
      }}>
        {/* Action 1 */}
        <div
          onClick={() => setActiveTab("predictor")}
          className="glass-panel hover-card"
          style={{ padding: "1.5rem", cursor: "pointer", border: "1px solid rgba(16, 185, 129, 0.25)" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "0.8rem" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981" }}>
              <Sprout size={20} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>{t("predictor", currentLang)}</h3>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>
            {t("featurePredictorDesc", currentLang)}
          </p>
        </div>

        {/* Action 2 */}
        <div
          onClick={() => setActiveTab("fertilizer")}
          className="glass-panel hover-card"
          style={{ padding: "1.5rem", cursor: "pointer", border: "1px solid rgba(139, 92, 246, 0.25)" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "0.8rem" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(139, 92, 246, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#8b5cf6" }}>
              <FlaskConical size={20} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>{t("fertilizer", currentLang)}</h3>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>
            {t("featureFertilizerDesc", currentLang)}
          </p>
        </div>

        {/* Action 3 */}
        <div
          onClick={() => setActiveTab("compare")}
          className="glass-panel hover-card"
          style={{ padding: "1.5rem", cursor: "pointer", border: "1px solid rgba(59, 130, 246, 0.25)" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "0.8rem" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(59, 130, 246, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6" }}>
              <Scale size={20} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>{t("compare", currentLang)}</h3>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>
            {t("featureCompareDesc", currentLang)}
          </p>
        </div>

        {/* Action 4 */}
        <div
          onClick={() => setActiveTab("assistant")}
          className="glass-panel hover-card"
          style={{ padding: "1.5rem", cursor: "pointer", border: "1px solid rgba(245, 158, 11, 0.25)" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "0.8rem" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b" }}>
              <Bot size={20} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>{t("assistant", currentLang)}</h3>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>
            {t("featureAssistantDesc", currentLang)}
          </p>
        </div>
      </div>

      {/* Recent Predictions Table */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
          {t("recentPredictionHistory", currentLang)}
        </h2>
        <button
          onClick={() => setActiveTab("history")}
          style={{ background: "none", border: "none", color: "#10b981", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
        >
          {t("viewAllLogs", currentLang)} <ArrowRight size={14} />
        </button>
      </div>

      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        {historyItems.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--text-main)", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-glass)", textAlign: "left", color: "var(--text-muted)" }}>
                  <th style={{ padding: "10px" }}>{t("cropLabel", currentLang)}</th>
                  <th style={{ padding: "10px" }}>{t("locationLabel", currentLang)}</th>
                  <th style={{ padding: "10px" }}>{t("yearLabel", currentLang)}</th>
                  <th style={{ padding: "10px" }}>{t("predictedYieldLabel", currentLang)}</th>
                  <th style={{ padding: "10px" }}>{t("aiEngineLabel", currentLang)}</th>
                  <th style={{ padding: "10px" }}>{t("timestampLabel", currentLang)}</th>
                </tr>
              </thead>
              <tbody>
                {historyItems.slice(0, 5).map(item => (
                  <tr key={item.id} style={{ borderBottom: "1px solid var(--border-glass)" }}>
                    <td style={{ padding: "12px 10px", fontWeight: 700, color: "#10b981" }}>{item.Crop}</td>
                    <td style={{ padding: "12px 10px" }}>{item.Dist_Name}, {item.State_Name}</td>
                    <td style={{ padding: "12px 10px" }}>{item.Year}</td>
                    <td style={{ padding: "12px 10px", fontWeight: 700, color: "var(--text-main)" }}>{item.predicted_yield} kg/ha</td>
                    <td style={{ padding: "12px 10px" }}>
                      <span className="badge badge-purple" style={{ fontSize: "0.7rem" }}>{item.ai_provider_used}</span>
                    </td>
                    <td style={{ padding: "12px 10px", color: "var(--text-muted)", fontSize: "0.8rem" }}>{item.created_at_formatted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
            {t("noPredictionsRecorded", currentLang)}
          </div>
        )}
      </div>
    </div>
  );
}
