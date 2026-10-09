import { useState, useEffect, useRef } from "react";
import { Sprout, CloudSun, Droplets, Bug, Calendar, Share2, Plus, X, Camera, AlertTriangle, Lightbulb, ShieldCheck, Trash2, BarChart3, RefreshCw, Wind, Thermometer, FlaskConical, CloudRain, Bell } from "lucide-react";

// ============================================================
// DATA CONSTANTS
// ============================================================

const CROP_DATA = {
  "WHEAT": { seedRate: 100, waterPerWeek: 25, daysToHarvest: 120, season: "Rabi", rotation: ["CHICKPEA", "MUSTARD", "GRAM"] },
  "RICE": { seedRate: 25, waterPerWeek: 50, daysToHarvest: 150, season: "Kharif", rotation: ["CHICKPEA", "LENTIL", "MUSTARD"] },
  "MAIZE": { seedRate: 20, waterPerWeek: 30, daysToHarvest: 100, season: "Kharif", rotation: ["SOYABEAN", "GROUNDNUT", "PIGEON PEA"] },
  "COTTON": { seedRate: 5, waterPerWeek: 20, daysToHarvest: 180, season: "Kharif", rotation: ["SOYABEAN", "GROUNDNUT", "MAIZE"] },
  "SUGARCANE": { seedRate: 40000, waterPerWeek: 40, daysToHarvest: 365, season: "Year-round", rotation: ["WHEAT", "CHICKPEA", "MUSTARD"] },
  "GROUNDNUT": { seedRate: 80, waterPerWeek: 20, daysToHarvest: 130, season: "Kharif", rotation: ["MAIZE", "SORGHUM", "PIGEON PEA"] },
  "SOYABEAN": { seedRate: 60, waterPerWeek: 25, daysToHarvest: 110, season: "Kharif", rotation: ["WHEAT", "CHICKPEA", "MAIZE"] },
  "MUSTARD": { seedRate: 10, waterPerWeek: 15, daysToHarvest: 100, season: "Rabi", rotation: ["WHEAT", "CHICKPEA", "LENTIL"] },
  "CHICKPEA": { seedRate: 60, waterPerWeek: 15, daysToHarvest: 110, season: "Rabi", rotation: ["WHEAT", "MUSTARD", "LENTIL"] },
  "BARLEY": { seedRate: 80, waterPerWeek: 20, daysToHarvest: 100, season: "Rabi", rotation: ["CHICKPEA", "MUSTARD", "LENTIL"] }
};

const PESTICIDE_SAFETY = [
  { name: "Glyphosate", type: "Herbicide", safetyLevel: "Moderate", ppe: ["Gloves", "Mask", "Goggles"], precautions: "Avoid spraying on windy days. Keep children and animals away for 24 hours.", firstAid: "If swallowed, do NOT induce vomiting. Seek medical help immediately." },
  { name: "Chlorpyrifos", type: "Insecticide", safetyLevel: "High", ppe: ["Full PPE", "Respirator", "Chemical suit"], precautions: "Extremely toxic to bees and fish. Do not spray near water bodies. Wait 15 days before harvest.", firstAid: "Move to fresh air immediately. Call poison control." },
  { name: "Mancozeb", type: "Fungicide", safetyLevel: "Low", ppe: ["Gloves", "Mask"], precautions: "Wash hands after use. Store in original container away from food.", firstAid: "Rinse skin with water for 15 minutes." },
  { name: "Imidacloprid", type: "Insecticide", safetyLevel: "Moderate", ppe: ["Gloves", "Mask", "Long sleeves"], precautions: "Toxic to bees. Do not apply during flowering. Keep away from water sources.", firstAid: "Rinse immediately with soap and water." },
  { name: "Carbendazim", type: "Fungicide", safetyLevel: "Low", ppe: ["Gloves", "Mask"], precautions: "Avoid inhalation. Do not eat or drink while spraying.", firstAid: "Drink plenty of water. Consult doctor if symptoms persist." },
  { name: "2,4-D", type: "Herbicide", safetyLevel: "Moderate", ppe: ["Gloves", "Mask", "Goggles", "Long sleeves"], precautions: "Can drift to nearby crops. Use only on windless days. Store away from fertilizers.", firstAid: "Remove contaminated clothing. Wash skin thoroughly." }
];

const WEATHER_ALERTS = [
  { id: 1, type: "Heavy Rain", severity: "high", message: "Heavy rainfall expected in next 48 hours. Avoid pesticide spraying and ensure proper drainage.", date: "Today", icon: "cloud-rain" },
  { id: 2, type: "Heat Wave", severity: "medium", message: "Temperature may exceed 40°C. Increase irrigation frequency and provide shade for livestock.", date: "Tomorrow", icon: "sun" },
  { id: 3, type: "Frost Warning", severity: "high", message: "Frost expected tonight. Cover sensitive crops and light bonfires if possible.", date: "In 3 days", icon: "snowflake" },
  { id: 4, type: "Strong Winds", severity: "medium", message: "Wind speed may reach 40 km/h. Avoid spraying and secure loose structures.", date: "In 5 days", icon: "wind" }
];

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function FarmerTools({ onSwitchToAssistant }) {
  const [activeTool, setActiveTool] = useState("dashboard");
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  // Multi-farm state
  const [farms, setFarms] = useState(() => {
    const saved = localStorage.getItem("agriyield_farms");
    return saved ? JSON.parse(saved) : [
      { id: 1, name: "Main Field", crop: "Wheat", area: 2.5, sowingDate: "2024-11-15", location: "Ludhiana" }
    ];
  });
  const [showAddFarm, setShowAddFarm] = useState(false);
  const [newFarm, setNewFarm] = useState({ name: "", crop: "", area: 0, sowingDate: "", location: "" });

  // Harvest planner state
  const [harvestCrop, setHarvestCrop] = useState("WHEAT");
  const [sowingDate, setSowingDate] = useState("");

  // Water calculator state
  const [waterCrop, setWaterCrop] = useState("WHEAT");
  const [waterArea, setWaterArea] = useState(1);

  // Seed calculator state
  const [seedCrop, setSeedCrop] = useState("WHEAT");
  const [seedArea, setSeedArea] = useState(1);

  // Crop rotation state
  const [rotationCrop, setRotationCrop] = useState("WHEAT");

  // Insurance state
  const [insuranceReminders] = useState(() => {
    const saved = localStorage.getItem("agriyield_insurance");
    return saved ? JSON.parse(saved) : [
      { id: 1, crop: "Wheat", premium: 4500, dueDate: "2025-01-15", status: "pending" },
      { id: 2, crop: "Rice", premium: 6200, dueDate: "2025-02-01", status: "pending" }
    ];
  });

  // Soil analysis state
  const [soilTestResults] = useState({ N: 45, P: 25, K: 30, pH: 6.8 });

  const getSoilHealthScore = () => {
    let score = 0;
    if (soilTestResults.N >= 40 && soilTestResults.N <= 100) score += 25;
    else score += 15;
    if (soilTestResults.P >= 20 && soilTestResults.P <= 50) score += 25;
    else score += 15;
    if (soilTestResults.K >= 25 && soilTestResults.K <= 60) score += 25;
    else score += 15;
    if (soilTestResults.pH >= 6.0 && soilTestResults.pH <= 7.5) score += 25;
    else score += 15;
    return score;
  };

  const getSoilRecommendations = () => {
    const recs = [];
    if (soilTestResults.N < 40) recs.push("Apply Nitrogen-rich fertilizer (e.g. Urea, 50kg/ha)");
    if (soilTestResults.P < 20) recs.push("Apply Phosphorus fertilizer (e.g. DAP, 30kg/ha)");
    if (soilTestResults.K < 25) recs.push("Apply Potash (MOP) to boost potassium levels");
    if (soilTestResults.pH < 6.0) recs.push("Soil is acidic. Apply agricultural lime to increase pH.");
    if (soilTestResults.pH > 7.5) recs.push("Soil is alkaline. Apply gypsum to lower pH.");
    return recs;
  };

  const WEATHER_DATA = {
    current: { temp: 28, condition: "Partly Cloudy", humidity: 65, wind: 12, rainfall: 0 },
    forecast: [
      { day: "Mon", temp: 29, condition: "Sunny", rainfall: 0 },
      { day: "Tue", temp: 28, condition: "Partly Cloudy", rainfall: 2 },
      { day: "Wed", temp: 26, condition: "Rainy", rainfall: 15 },
      { day: "Thu", temp: 27, condition: "Cloudy", rainfall: 5 },
      { day: "Fri", temp: 30, condition: "Sunny", rainfall: 0 }
    ],
    advice: "Light rainfall expected on Wednesday. Postpone pesticide spraying until Thursday. Maintain regular irrigation for young seedlings."
  };

  // Photo diagnosis state
  const [selectedImage, setSelectedImage] = useState(null);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef(null);

  // Save farms to localStorage
  useEffect(() => {
    localStorage.setItem("agriyield_farms", JSON.stringify(farms));
  }, [farms]);

  // Save insurance to localStorage
  useEffect(() => {
    localStorage.setItem("agriyield_insurance", JSON.stringify(insuranceReminders));
  }, [insuranceReminders]);

  // Check for insurance due dates
  useEffect(() => {
    const today = new Date();
    insuranceReminders.forEach(ins => {
      const dueDate = new Date(ins.dueDate);
      const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7 && diffDays > 0 && ins.status === "pending") {
        setNotificationMessage(`Insurance premium for ${ins.crop} due in ${diffDays} days!`);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    });
  }, [insuranceReminders]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const addFarm = () => {
    if (newFarm.name && newFarm.crop && newFarm.area > 0) {
      setFarms([...farms, { ...newFarm, id: Date.now() }]);
      setNewFarm({ name: "", crop: "", area: 0, sowingDate: "", location: "" });
      setShowAddFarm(false);
    }
  };

  const deleteFarm = (id) => {
    setFarms(farms.filter(f => f.id !== id));
  };

  const calculateHarvestDate = () => {
    if (!sowingDate || !harvestCrop) return null;
    const crop = CROP_DATA[harvestCrop];
    if (!crop) return null;
    const sowing = new Date(sowingDate);
    const harvest = new Date(sowing);
    harvest.setDate(harvest.getDate() + crop.daysToHarvest);
    return harvest.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  };

  const calculateWaterRequirement = () => {
    const crop = CROP_DATA[waterCrop];
    if (!crop) return 0;
    return (crop.waterPerWeek * waterArea).toFixed(1);
  };

  const calculateSeedQuantity = () => {
    const crop = CROP_DATA[seedCrop];
    if (!crop) return 0;
    return (crop.seedRate * seedArea).toFixed(0);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
        setDiagnosisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      const results = [
        { name: "Leaf Rust", confidence: 87, treatment: "Apply Propiconazole 25EC @ 1ml/L within 7 days. Remove severely infected leaves.", severity: "Moderate" },
        { name: "Aphid Infestation", confidence: 92, treatment: "Spray Imidacloprid 200SL @ 0.5ml/L. Release ladybird beetles for biological control.", severity: "High" },
        { name: "Nitrogen Deficiency", confidence: 78, treatment: "Apply Urea 50kg/ha as top dressing. Use foliar spray of 2% urea solution.", severity: "Moderate" },
        { name: "Healthy Crop", confidence: 95, treatment: "No action needed. Continue regular monitoring and maintain current practices.", severity: "None" }
      ];
      setDiagnosisResult(results[Math.floor(Math.random() * results.length)]);
      setIsAnalyzing(false);
    }, 2000);
  };

  const shareWithAssistant = (data, type = "farm") => {
    const prompts = {
      farm: `I need help with my farm: ${data.name || "My Farm"} growing ${data.crop || "crops"} on ${data.area || "?"} hectares in ${data.location || "my area"}. Sowing date: ${data.sowingDate || "recent"}. Please give me simple, practical advice.`,
      soil: `My soil test results: Nitrogen=${data.N}kg/ha, Phosphorus=${data.P}kg/ha, Potassium=${data.K}kg/ha, pH=${data.pH}. What should I do to improve my soil?`,
      weather: `Current weather: ${data.temp}°C, ${data.condition}, Humidity ${data.humidity}%, Wind ${data.wind}km/h. What farming activities should I do today?`,
      diagnosis: `My crop has this issue: ${data.name} (confidence: ${data.confidence}%). Treatment suggested: ${data.treatment}. Please explain this in simple terms and give me more tips.`,
      harvest: `I sowed ${data.crop} on ${data.sowingDate}. When should I harvest? What signs should I look for?`,
      water: `I have ${data.area} hectares of ${data.crop}. How should I plan my irrigation schedule?`,
      seed: `I need to sow ${data.crop} on ${data.area} hectares. Please give me complete sowing guidance.`,
      insurance: `My ${data.crop} insurance premium of ₹${data.premium} is due on ${data.dueDate}. What happens if I don't pay on time?`
    };
    const prompt = prompts[type] || prompts.farm;
    if (onSwitchToAssistant) {
      onSwitchToAssistant(prompt);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  const tools = [
    { id: "dashboard", icon: <BarChart3 size={20} />, label: "Dashboard" },
    { id: "farms", icon: <Sprout size={20} />, label: "My Farms" },
    { id: "soil", icon: <FlaskConical size={20} />, label: "Soil Analysis" },
    { id: "weather", icon: <CloudSun size={20} />, label: "Weather Analysis" },
    { id: "harvest", icon: <Calendar size={20} />, label: "Harvest Planner" },
    { id: "water", icon: <Droplets size={20} />, label: "Water Calculator" },
    { id: "seed", icon: <Sprout size={20} />, label: "Seed Calculator" },
    { id: "rotation", icon: <RefreshCw size={20} />, label: "Crop Rotation" },
    { id: "diagnosis", icon: <Camera size={20} />, label: "Pest Diagnosis" },
    { id: "insurance", icon: <ShieldCheck size={20} />, label: "Insurance" },
    { id: "safety", icon: <AlertTriangle size={20} />, label: "Pesticide Safety" }
  ];

  return (
    <div className="page-container">
      {/* Notification Toast */}
      {showNotification && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 1000,
          background: "var(--accent-primary)", color: "white",
          padding: "0.85rem 1.25rem", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-elevation)",
          display: "flex", alignItems: "center", gap: "0.75rem", maxWidth: "400px"
        }}>
          <Bell size={18} />
          <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{notificationMessage}</span>
          <button onClick={() => setShowNotification(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">
          Farmer Tools & Utilities 🌾
        </h1>
        <p className="page-subtitle">
          Essential agronomy calculators, multi-farm plot records, and pest diagnostic utilities.
        </p>
      </div>

      {/* Tool Navigation Pills */}
      <div className="nav-pill-group" style={{ marginBottom: "1.5rem" }}>
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`nav-pill ${activeTool === tool.id ? "active" : ""}`}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", whiteSpace: "nowrap" }}
          >
            {tool.icon}
            <span>{tool.label}</span>
          </button>
        ))}
      </div>

      {/* Dashboard Overview */}
      {activeTool === "dashboard" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
            {tools.filter(t => t.id !== "dashboard").map(tool => (
              <div
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className="fluent-panel"
                style={{ padding: "1.25rem", cursor: "pointer", transition: "var(--transition-smooth)" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "var(--radius-sm)", background: "var(--accent-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-primary)" }}>
                    {tool.icon}
                  </div>
                  <h3 style={{ fontSize: "0.98rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>{tool.label}</h3>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                  {tool.id === "farms" && "Manage multiple farm plots"}
                  {tool.id === "harvest" && "Predict harvest dates"}
                  {tool.id === "water" && "Calculate water needs"}
                  {tool.id === "seed" && "Calculate seed quantity"}
                  {tool.id === "rotation" && "Plan crop rotation"}
                  {tool.id === "diagnosis" && "AI pest & disease diagnosis"}
                  {tool.id === "weather" && "Weather alerts & warnings"}
                  {tool.id === "insurance" && "Insurance reminders"}
                  {tool.id === "safety" && "Pesticide safety guide"}
                  {tool.id === "forum" && "Ask questions to community"}
                  {tool.id === "groups" && "Connect with local farmers"}
                  {tool.id === "whatsapp" && "Chat on WhatsApp"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multi-Farm Support */}
      {activeTool === "farms" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>My Farms</h2>
            <button onClick={() => setShowAddFarm(true)} className="btn btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
              <Plus size={14} /> Add Farm
            </button>
          </div>

          {showAddFarm && (
            <div style={{ background: "var(--bg-glass)", padding: "1rem", borderRadius: "10px", marginBottom: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem" }}>
                <input placeholder="Farm Name" value={newFarm.name} onChange={(e) => setNewFarm({...newFarm, name: e.target.value})} className="input-field" style={{ padding: "0.5rem" }} />
                <select value={newFarm.crop} onChange={(e) => setNewFarm({...newFarm, crop: e.target.value})} className="input-field" style={{ padding: "0.5rem" }}>
                  <option value="">Select Crop</option>
                  {Object.keys(CROP_DATA).map(crop => <option key={crop} value={crop}>{crop}</option>)}
                </select>
                <input type="number" placeholder="Area (ha)" value={newFarm.area} onChange={(e) => setNewFarm({...newFarm, area: Number(e.target.value)})} className="input-field" style={{ padding: "0.5rem" }} />
                <input type="date" value={newFarm.sowingDate} onChange={(e) => setNewFarm({...newFarm, sowingDate: e.target.value})} className="input-field" style={{ padding: "0.5rem" }} />
                <input placeholder="Location" value={newFarm.location} onChange={(e) => setNewFarm({...newFarm, location: e.target.value})} className="input-field" style={{ padding: "0.5rem" }} />
                <button onClick={addFarm} className="btn btn-primary" style={{ padding: "0.5rem 1rem" }}>Save</button>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.75rem" }}>
            {farms.map(farm => (
              <div key={farm.id} style={{ background: "var(--bg-glass)", padding: "1rem", borderRadius: "10px", border: "1px solid var(--border-glass)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>{farm.name}</h3>
                  <button onClick={() => deleteFarm(farm.id)} style={{ background: "none", border: "none", color: "#f43f5e", cursor: "pointer" }}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  <div><strong>Crop:</strong> {farm.crop}</div>
                  <div><strong>Area:</strong> {farm.area} ha</div>
                  <div><strong>Sowing:</strong> {farm.sowingDate}</div>
                  <div><strong>Location:</strong> {farm.location}</div>
                </div>
                <button onClick={() => shareWithAssistant(farm)} className="btn btn-secondary" style={{ marginTop: "0.5rem", padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}>
                  <Share2 size={12} /> Share with AI
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Harvest Planner */}
      {activeTool === "harvest" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", margin: 0, marginBottom: "1rem" }}>Harvest Planner</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Select Crop</label>
              <select value={harvestCrop} onChange={(e) => setHarvestCrop(e.target.value)} className="input-field" style={{ padding: "0.6rem", width: "100%" }}>
                {Object.keys(CROP_DATA).map(crop => <option key={crop} value={crop}>{crop}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Sowing Date</label>
              <input type="date" value={sowingDate} onChange={(e) => setSowingDate(e.target.value)} className="input-field" style={{ padding: "0.6rem", width: "100%" }} />
            </div>
          </div>
          {calculateHarvestDate() && (
            <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "10px", padding: "1rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Expected Harvest Date</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#10b981" }}>{calculateHarvestDate()}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{CROP_DATA[harvestCrop]?.daysToHarvest} days from sowing</div>
            </div>
          )}
        </div>
      )}

      {/* Water Calculator */}
      {activeTool === "water" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", margin: 0, marginBottom: "1rem" }}>Water Requirement Calculator</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Select Crop</label>
              <select value={waterCrop} onChange={(e) => setWaterCrop(e.target.value)} className="input-field" style={{ padding: "0.6rem", width: "100%" }}>
                {Object.keys(CROP_DATA).map(crop => <option key={crop} value={crop}>{crop}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Area (Hectares)</label>
              <input type="number" value={waterArea} onChange={(e) => setWaterArea(Number(e.target.value))} className="input-field" style={{ padding: "0.6rem", width: "100%" }} />
            </div>
          </div>
          <div style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: "10px", padding: "1rem", textAlign: "center" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Weekly Water Requirement</div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#3b82f6" }}>{calculateWaterRequirement()} Liters/week</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>For {waterArea} hectare(s) of {waterCrop}</div>
          </div>
        </div>
      )}

      {/* Seed Calculator */}
      {activeTool === "seed" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", margin: 0, marginBottom: "1rem" }}>Seed Quantity Calculator</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Select Crop</label>
              <select value={seedCrop} onChange={(e) => setSeedCrop(e.target.value)} className="input-field" style={{ padding: "0.6rem", width: "100%" }}>
                {Object.keys(CROP_DATA).map(crop => <option key={crop} value={crop}>{crop}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Area (Hectares)</label>
              <input type="number" value={seedArea} onChange={(e) => setSeedArea(Number(e.target.value))} className="input-field" style={{ padding: "0.6rem", width: "100%" }} />
            </div>
          </div>
          <div style={{ background: "rgba(139, 92, 246, 0.1)", border: "1px solid rgba(139, 92, 246, 0.2)", borderRadius: "10px", padding: "1rem", textAlign: "center" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Seed Quantity Needed</div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#8b5cf6" }}>{calculateSeedQuantity()} kg</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>For {seedArea} hectare(s) of {seedCrop}</div>
          </div>
        </div>
      )}

      {/* Crop Rotation Planner */}
      {activeTool === "rotation" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", margin: 0, marginBottom: "1rem" }}>Crop Rotation Planner</h2>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Current Crop</label>
            <select value={rotationCrop} onChange={(e) => setRotationCrop(e.target.value)} className="input-field" style={{ padding: "0.6rem", width: "100%", maxWidth: "300px" }}>
              {Object.keys(CROP_DATA).map(crop => <option key={crop} value={crop}>{crop}</option>)}
            </select>
          </div>
          <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "10px", padding: "1rem" }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#10b981", marginBottom: "0.5rem" }}>Recommended Next Season Crops:</div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {CROP_DATA[rotationCrop]?.rotation.map((crop, idx) => (
                <span key={idx} className="badge badge-emerald" style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>{crop}</span>
              ))}
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.75rem" }}>
              Rotating crops improves soil health, reduces pests, and increases yield.
            </p>
          </div>
        </div>
      )}

      {/* Pest/Disease Photo Diagnosis */}
      {activeTool === "diagnosis" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", margin: 0, marginBottom: "1rem" }}>Pest & Disease Photo Diagnosis</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Take a photo of your sick crop and AI will identify the problem and suggest treatment.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
            <div>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed var(--border-glass)", borderRadius: "12px", padding: "2rem",
                  textAlign: "center", cursor: "pointer", background: "var(--bg-glass)"
                }}
              >
                <Camera size={48} color="#10b981" />
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>Click to upload photo</p>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
              </div>
              {selectedImage && (
                <div style={{ marginTop: "1rem", textAlign: "center" }}>
                  <img src={selectedImage} alt="Uploaded" style={{ maxWidth: "100%", borderRadius: "10px", maxHeight: "200px" }} />
                  <button onClick={analyzeImage} disabled={isAnalyzing} className="btn btn-primary" style={{ marginTop: "0.75rem", padding: "0.6rem 1.5rem" }}>
                    {isAnalyzing ? "Analyzing..." : "Analyze Photo"}
                  </button>
                </div>
              )}
            </div>

            <div>
              {diagnosisResult && (
                <div style={{ background: "var(--bg-glass)", padding: "1rem", borderRadius: "10px", border: "1px solid var(--border-glass)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>{diagnosisResult.name}</h3>
                    <span className="badge" style={{
                      fontSize: "0.7rem",
                      background: diagnosisResult.severity === "High" ? "rgba(244, 63, 94, 0.15)" : diagnosisResult.severity === "Moderate" ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)",
                      color: diagnosisResult.severity === "High" ? "#f43f5e" : diagnosisResult.severity === "Moderate" ? "#f59e0b" : "#10b981"
                    }}>
                      {diagnosisResult.severity}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                    Confidence: {diagnosisResult.confidence}%
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>
                    <strong>Treatment:</strong> {diagnosisResult.treatment}
                  </div>
                </div>
              )}
              {!diagnosisResult && !isAnalyzing && (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                  <Bug size={48} style={{ opacity: 0.3, marginBottom: "0.5rem" }} />
                  <p style={{ fontSize: "0.85rem" }}>Upload a photo to get AI diagnosis</p>
                </div>
              )}
              {isAnalyzing && (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <div className="spinner" style={{ width: "40px", height: "40px", margin: "0 auto 1rem" }} />
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>AI is analyzing your crop photo...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Weather Alerts */}
      {activeTool === "weather" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", margin: 0, marginBottom: "1rem" }}>Weather Alerts</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {WEATHER_ALERTS.map(alert => (
              <div key={alert.id} style={{
                background: alert.severity === "high" ? "rgba(244, 63, 94, 0.1)" : "rgba(245, 158, 11, 0.1)",
                border: `1px solid ${alert.severity === "high" ? "rgba(244, 63, 94, 0.2)" : "rgba(245, 158, 11, 0.2)"}`,
                borderRadius: "10px", padding: "1rem", display: "flex", gap: "1rem", alignItems: "flex-start"
              }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "10px",
                  background: alert.severity === "high" ? "rgba(244, 63, 94, 0.15)" : "rgba(245, 158, 11, 0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: alert.severity === "high" ? "#f43f5e" : "#f59e0b", flexShrink: 0
                }}>
                  <AlertTriangle size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-main)" }}>{alert.type}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{alert.date}</span>
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insurance Reminders */}
      {activeTool === "insurance" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", margin: 0, marginBottom: "1rem" }}>Crop Insurance Reminders</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {insuranceReminders.map(ins => {
              const dueDate = new Date(ins.dueDate);
              const today = new Date();
              const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
              const isOverdue = diffDays < 0;
              const isDueSoon = diffDays <= 7 && diffDays >= 0;

              return (
                <div key={ins.id} style={{
                  background: isOverdue ? "rgba(244, 63, 94, 0.1)" : isDueSoon ? "rgba(245, 158, 11, 0.1)" : "var(--bg-glass)",
                  border: `1px solid ${isOverdue ? "rgba(244, 63, 94, 0.2)" : isDueSoon ? "rgba(245, 158, 11, 0.2)" : "var(--border-glass)"}`,
                  borderRadius: "10px", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-main)" }}>{ins.crop} Insurance</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Premium: ₹{ins.premium.toLocaleString()}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Due: {new Date(ins.dueDate).toLocaleDateString()}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {isOverdue ? (
                      <span className="badge" style={{ background: "rgba(244, 63, 94, 0.15)", color: "#f43f5e", fontSize: "0.75rem" }}>Overdue</span>
                    ) : isDueSoon ? (
                      <span className="badge" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", fontSize: "0.75rem" }}>Due in {diffDays} days</span>
                    ) : (
                      <span className="badge badge-emerald" style={{ fontSize: "0.75rem" }}>Active</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pesticide Safety Guide */}
      {activeTool === "safety" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", margin: 0, marginBottom: "1rem" }}>Pesticide Safety Guide</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "0.75rem" }}>
            {PESTICIDE_SAFETY.map((pesticide, idx) => (
              <div key={idx} style={{ background: "var(--bg-glass)", padding: "1rem", borderRadius: "10px", border: "1px solid var(--border-glass)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-main)" }}>{pesticide.name}</span>
                  <span className="badge" style={{
                    fontSize: "0.65rem",
                    background: pesticide.safetyLevel === "High" ? "rgba(244, 63, 94, 0.15)" : pesticide.safetyLevel === "Moderate" ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)",
                    color: pesticide.safetyLevel === "High" ? "#f43f5e" : pesticide.safetyLevel === "Moderate" ? "#f59e0b" : "#10b981"
                  }}>
                    {pesticide.safetyLevel}
                  </span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}><strong>Type:</strong> {pesticide.type}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}><strong>PPE:</strong> {pesticide.ppe.join(", ")}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}><strong>Precautions:</strong> {pesticide.precautions}</div>
                <div style={{ fontSize: "0.75rem", color: "#f43f5e" }}><strong>First Aid:</strong> {pesticide.firstAid}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Soil & Weather Diagnosis Summary */}
      {activeTool === "dashboard" && (
        <div style={{ marginTop: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", margin: 0, marginBottom: "1rem" }}>Soil & Weather Diagnosis</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            {/* Soil Health Card */}
            <div
              onClick={() => setActiveTool("soil")}
              className="glass-panel hover-card"
              style={{ padding: "1.25rem", cursor: "pointer", border: "1px solid rgba(59, 130, 246, 0.25)" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(59, 130, 246, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6" }}>
                  <FlaskConical size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>Soil Analysis</h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.25rem 0 0" }}>Check soil health & get fertilizer recommendations</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <span className="badge badge-emerald" style={{ fontSize: "0.7rem" }}>NPK Levels</span>
                <span className="badge badge-blue" style={{ fontSize: "0.7rem" }}>pH Balance</span>
                <span className="badge badge-purple" style={{ fontSize: "0.7rem" }}>Health Score</span>
              </div>
            </div>

            {/* Weather Diagnosis Card */}
            <div
              onClick={() => setActiveTool("weather")}
              className="glass-panel hover-card"
              style={{ padding: "1.25rem", cursor: "pointer", border: "1px solid rgba(245, 158, 11, 0.25)" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(245, 158, 11, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b" }}>
                  <CloudSun size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>Weather Diagnosis</h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.25rem 0 0" }}>5-day forecast with farming advice</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <span className="badge badge-emerald" style={{ fontSize: "0.7rem" }}>5-Day Forecast</span>
                <span className="badge badge-blue" style={{ fontSize: "0.7rem" }}>Rain Alerts</span>
                <span className="badge badge-purple" style={{ fontSize: "0.7rem" }}>Farming Advice</span>
              </div>
            </div>

            {/* Pest Diagnosis Card */}
            <div
              onClick={() => setActiveTool("diagnosis")}
              className="glass-panel hover-card"
              style={{ padding: "1.25rem", cursor: "pointer", border: "1px solid rgba(244, 63, 94, 0.25)" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(244, 63, 94, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f43f5e" }}>
                  <Camera size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>Pest & Disease Diagnosis</h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.25rem 0 0" }}>AI photo diagnosis for crop diseases</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <span className="badge badge-emerald" style={{ fontSize: "0.7rem" }}>Photo Upload</span>
                <span className="badge badge-blue" style={{ fontSize: "0.7rem" }}>AI Analysis</span>
                <span className="badge badge-purple" style={{ fontSize: "0.7rem" }}>Treatment</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Soil Analysis */}
      {activeTool === "soil" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FlaskConical size={20} color="#3b82f6" /> Soil Analysis
            </h2>
            <button onClick={() => setActiveTool("dashboard")} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>

          {/* Soil Health Score */}
          <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem" }}>
            <div style={{ flex: 1, background: "var(--bg-glass)", padding: "1rem", borderRadius: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Soil Health Score</div>
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
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f59e0b" }}>Recommendations</span>
              </div>
              {getSoilRecommendations().map((rec, idx) => (
                <div key={idx} style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>• {rec}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Weather Diagnosis */}
      {activeTool === "weather" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CloudSun size={20} color="#f59e0b" /> Weather Diagnosis
            </h2>
            <button onClick={() => setActiveTool("dashboard")} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
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
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#10b981" }}>Weather Advice</span>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>{WEATHER_DATA.advice}</p>
          </div>
        </div>
      )}
    </div>
  );
}
