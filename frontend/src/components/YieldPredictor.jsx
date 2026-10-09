import { useState, useEffect, useCallback } from "react";
import { Sprout, Sparkles, Layers, Award, Copy, Check, AlertTriangle, Printer, MessageSquare, CloudSun, DollarSign, Download, Sliders, Info, Volume2, VolumeX, Thermometer, Droplets, Lightbulb, Share2, Save } from "lucide-react";
import MarkdownReport from "./MarkdownReport";
import { t, LANG_NAME_MAP } from "../utils/i18n";

const CROP_MSP_RATES = {
  "BARLEY": 1850,
  "WHEAT": 2275,
  "RICE": 2183,
  "PADDY": 2183,
  "COTTON": 6620,
  "SUGARCANE": 315,
  "MAIZE": 2090,
  "GROUNDNUT": 6375,
  "CHICKPEA": 5440,
  "GRAM": 5440,
  "SOYABEAN": 4600,
  "MUSTARD": 5650,
  "SUNFLOWER": 6760
};

export default function YieldPredictor({ user, token, onSaveSuccess, onSwitchToChat, currentLang = "en" }) {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [crops, setCrops] = useState([]);
  const [years, setYears] = useState([]);

  // Form State
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("");
  const [selectedYear, setSelectedYear] = useState(2010);
  const [area, setArea] = useState(100.0);
  const [prevYield, setPrevYield] = useState(1500.0);
  const [prevArea, setPrevArea] = useState(100.0);
  const [prevProduction, setPrevProduction] = useState(150.0);
  const [aiProvider, setAiProvider] = useState("auto");

  // Financial Estimator State
  const [marketPricePerQuintal, setMarketPricePerQuintal] = useState(2200);
  const [costPerHectare, setCostPerHectare] = useState(22000);

  // Climate Simulator Sliders State
  const [rainfallOffset, setRainfallOffset] = useState(0); // -30% to +30%
  const [soilHealthScore, setSoilHealthScore] = useState(80); // 80 baseline = 1.0 multiplier

  // Status & Result State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Dynamic Translation & Farmer-Friendly State
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState("");
  const [showTranslation, setShowTranslation] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [simpleMode, setSimpleMode] = useState(false);
  const [translationError, setTranslationError] = useState("");

  // Initial metadata fetch
  useEffect(() => {
    fetch("/api/states")
      .then(res => res.json())
      .then(data => {
        if (data.states && data.states.length > 0) {
          setStates(data.states);
          setSelectedState(data.states[0]);
        }
      })
      .catch(err => console.error("Error fetching states:", err));

    fetch("/api/crops")
      .then(res => res.json())
      .then(data => {
        if (data.crops && data.crops.length > 0) {
          setCrops(data.crops);
          setSelectedCrop(data.crops[0]);
        }
      })
      .catch(err => console.error("Error fetching crops:", err));

    fetch("/api/years")
      .then(res => res.json())
      .then(data => {
        if (data.years && data.years.length > 0) {
          setYears(data.years);
          const defaultYr = data.years.includes(2026) ? 2026 : data.years[data.years.length - 1];
          setSelectedYear(defaultYr);
        }
      })
      .catch(err => console.error("Error fetching years:", err));
  }, []);

  // Update default MSP rate when crop changes
  useEffect(() => {
    if (selectedCrop) {
      const cropUpper = selectedCrop.toUpperCase();
      let matchedRate = 2500;
      for (const [key, val] of Object.entries(CROP_MSP_RATES)) {
        if (cropUpper.includes(key)) {
          matchedRate = val;
          break;
        }
      }
      queueMicrotask(() => setMarketPricePerQuintal(matchedRate));
    }
  }, [selectedCrop]);

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

  // Fetch Live Agro-Climate Weather Forecast & Crop Planting Advice
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [isSpeakingReport, setIsSpeakingReport] = useState(false);

  useEffect(() => {
    if (!selectedState || !selectedDistrict) return;
    let isCancelled = false;
    queueMicrotask(() => {
      if (!isCancelled) setWeatherLoading(true);
    });
    const cropQuery = selectedCrop ? `&crop=${encodeURIComponent(selectedCrop)}` : "";
    fetch(`/api/weather/forecast?state=${encodeURIComponent(selectedState)}&district=${encodeURIComponent(selectedDistrict)}${cropQuery}`)
      .then(res => res.json())
      .then(data => { if (!isCancelled) setWeatherData(data); })
      .catch(err => console.error("Error fetching weather forecast:", err))
      .finally(() => { if (!isCancelled) setWeatherLoading(false); });
    return () => { isCancelled = true; };
  }, [selectedState, selectedDistrict, selectedCrop]);

  const handleAutoFillWeather = () => {
    if (!weatherData) return;
    setRainfallOffset(Math.round(weatherData.rainfall_mm - 50));
    setSoilHealthScore(Math.round(weatherData.soil_moisture_pct));
    alert(`Auto-filled live weather parameters for ${selectedDistrict}, ${selectedState}!\nTemp: ${weatherData.current_temp_c}°C | Humidity: ${weatherData.current_humidity_pct}% | Soil Moisture: ${weatherData.soil_moisture_pct}%`);
  };

  const handleSpeakReport = () => {
    if (!('speechSynthesis' in window) || !result) return;
    if (isSpeakingReport) {
      window.speechSynthesis.cancel();
      setIsSpeakingReport(false);
      return;
    }
    window.speechSynthesis.cancel();
    const textToSpeak = `Yield prediction summary for ${result.Crop} in ${result.Dist_Name}, ${result.State_Name}. Predicted yield is ${result.predicted_yield} kg per hectare. AI Advice: ${result.ai_analysis.replace(/[*#_`]/g, '')}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = currentLang === "te" ? "te-IN" : currentLang === "hi" ? "hi-IN" : currentLang === "ta" ? "ta-IN" : currentLang === "kn" ? "kn-IN" : currentLang === "ml" ? "ml-IN" : currentLang === "mr" ? "mr-IN" : "en-US";
    utterance.onend = () => setIsSpeakingReport(false);
    utterance.onerror = () => setIsSpeakingReport(false);
    setIsSpeakingReport(true);
    window.speechSynthesis.speak(utterance);
  };

  // Dynamic Translation: Translate AI analysis content to selected language
  const handleTranslate = useCallback(async (targetLangOverride = null) => {
    if (!result || !result.ai_analysis) return;
    
    const targetLangName = targetLangOverride || LANG_NAME_MAP[currentLang] || "English";

    // If target is English and we already have original, show original
    if (targetLangName.toLowerCase() === "english") {
      setShowTranslation(false);
      return;
    }

    setIsTranslating(true);
    setTranslationError("");
    
    try {
      const response = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: result.ai_analysis,
          target_language: targetLangName
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setTranslatedContent(data.translated_text || result.ai_analysis);
        setShowTranslation(true);
      } else {
        setTranslationError("Translation service unavailable. Showing report in current language.");
      }
    } catch (err) {
      console.error("Translation error:", err);
      setTranslationError("Translation request failed. Please try again.");
    } finally {
      setIsTranslating(false);
    }
  }, [result, currentLang]);

  // Share with Expert
  const handleShareWithExpert = () => {
    if (!result) return;
    const shareText = `${t("shareMessage", currentLang)}\n\n${t("cropLabel", currentLang)}: ${result.Crop}\n${t("locationLabel", currentLang)}: ${result.Dist_Name}, ${result.State_Name}\n${t("predictedYield", currentLang)}: ${result.predicted_yield} Kg/ha\n\n${t("reportGenerated", currentLang)}: ${new Date().toLocaleDateString()}`;
    
    if (navigator.share) {
      navigator.share({
        title: `AgriYield AI Report - ${result.Crop}`,
        text: shareText,
      }).catch(() => {
        navigator.clipboard.writeText(shareText);
        alert(t("reportSaved", currentLang));
      });
    } else {
      navigator.clipboard.writeText(shareText);
      alert(t("reportSaved", currentLang));
    }
  };

  // Save for Later
  const handleSaveForLater = () => {
    if (!result) return;
    const savedReports = JSON.parse(localStorage.getItem('agriyield_saved_reports') || '[]');
    savedReports.push({
      id: Date.now(),
      crop: result.Crop,
      location: `${result.Dist_Name}, ${result.State_Name}`,
      year: result.Year,
      yield: result.predicted_yield,
      date: new Date().toISOString(),
      data: result
    });
    localStorage.setItem('agriyield_saved_reports', JSON.stringify(savedReports));
    alert(t("reportSaved", currentLang));
  };

  const toggleSimpleMode = () => setSimpleMode(prev => !prev);
  const toggleHelp = () => setShowHelp(prev => !prev);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const payload = {
      Year: parseInt(selectedYear),
      State_Name: selectedState,
      Dist_Name: selectedDistrict,
      Crop: selectedCrop,
      Area: parseFloat(area),
      Previous_Year_Yield: parseFloat(prevYield),
      Previous_Year_Area: parseFloat(prevArea),
      Previous_Year_Production: parseFloat(prevProduction),
      ai_provider: aiProvider,
      language: LANG_NAME_MAP[currentLang] || "English"
    };

    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 25000);
      const response = await fetch("/api/predict", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      window.clearTimeout(timeoutId);

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Prediction request failed.");
      }

      data.language_used = LANG_NAME_MAP[currentLang] || "English";
      setResult(data);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      setError(err.name === "AbortError"
        ? "The advisory service is taking too long. Try Instant ML result or submit again shortly."
        : (err.message || "An unexpected error occurred during prediction."));
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Language Sync
  useEffect(() => {
    if (!result || !result.ai_analysis) return;
    const targetLangName = LANG_NAME_MAP[currentLang] || "English";
    if (targetLangName === "English") {
      queueMicrotask(() => setShowTranslation(false));
    } else {
      queueMicrotask(() => handleTranslate(targetLangName));
    }
  }, [currentLang, result, handleTranslate]);

  const handleCopyReport = () => {
    if (!result) return;
    const reportText = `AgriYield AI Executive Agronomy Advisory Report\n==============================================\nCrop: ${result.Crop}\nLocation: ${result.Dist_Name}, ${result.State_Name}\nYear: ${result.Year}\nAI Predicted Yield: ${result.predicted_yield} Kg/ha\nAI Engine: ${result.ai_provider_used}\n\nAI Agronomic Advisory:\n${result.ai_analysis}`;
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    if (!result) return;
    const csvRows = [
      ["Parameter", "Value"],
      ["Crop", result.Crop],
      ["State", result.State_Name],
      ["District", result.Dist_Name],
      ["Prediction Year", result.Year],
      ["Cultivated Area (ha)", area],
      ["Previous Year Yield (kg/ha)", prevYield],
      ["AI Predicted Yield (kg/ha)", result.predicted_yield],
      ["Adjusted Forecast Yield (kg/ha)", adjustedYield],
      ["Total Production (Kg)", adjustedYield * area],
      ["AI Engine Used", result.ai_provider_used]
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AgriYield_Report_${result.Crop}_${result.Year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadReport = () => {
    if (!result) return;
    const reportContent = showTranslation && translatedContent ? translatedContent : result.ai_analysis;
    const langName = LANG_NAME_MAP[currentLang] || "English";
    
    const htmlContent = `<!DOCTYPE html>
<html lang="${currentLang}">
<head>
  <meta charset="UTF-8">
  <title>AgriYield AI Report - ${result.Crop} ${result.Year}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; padding: 24px; }
    .container { max-width: 820px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #0f172a; color: white; padding: 28px; }
    .header h1 { font-size: 1.6rem; margin-bottom: 6px; font-weight: 700; }
    .header p { opacity: 0.8; font-size: 0.9rem; }
    .content { padding: 28px; }
    .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
    .info-card { background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .info-card .label { font-size: 0.72rem; color: #64748b; text-transform: uppercase; font-weight: 600; }
    .info-card .value { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin-top: 4px; }
    .yield-highlight { background: #f0fdf4; border: 1px solid #86efac; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px; }
    .yield-highlight .yield-value { font-size: 2.5rem; font-weight: 800; color: #15803d; }
    .yield-highlight .yield-label { font-size: 0.85rem; color: #166534; font-weight: 600; }
    .report-body { background: #ffffff; border-radius: 8px; padding: 20px; border: 1px solid #e2e8f0; line-height: 1.7; }
    .footer { text-align: center; padding: 18px; background: #f8fafc; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AgriYield AI Executive Agronomy Report</h1>
      <p>${result.Crop} • ${result.Dist_Name}, ${result.State_Name} • Harvest Season ${result.Year}</p>
    </div>
    <div class="content">
      <div class="info-grid">
        <div class="info-card"><div class="label">Crop</div><div class="value">${result.Crop}</div></div>
        <div class="info-card"><div class="label">Location</div><div class="value">${result.Dist_Name}, ${result.State_Name}</div></div>
        <div class="info-card"><div class="label">Area</div><div class="value">${area} ha</div></div>
      </div>
      <div class="yield-highlight">
        <div class="yield-value">${result.predicted_yield} Kg/ha</div>
        <div class="yield-label">ML Regression Authoritative Yield Forecast</div>
      </div>
      <div class="report-body">
        <p style="margin-bottom: 12px; font-size: 0.85rem; color: #64748b;"><strong>Language:</strong> ${langName} | <strong>Engine:</strong> ${result.ai_provider_used}</p>
        ${reportContent.replace(/\n/g, '<br/>')}
      </div>
    </div>
    <div class="footer">
      Generated by AgriYield AI • ${new Date().toLocaleString()}
    </div>
  </div>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AgriYield_Report_${result.Crop}_${result.Year}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintReport = () => window.print();

  const getAdjustedYield = () => {
    if (!result) return 0;
    let base = result.predicted_yield;
    const rainFactor = 1 + (rainfallOffset / 100) * 0.15;
    const soilFactor = 1 + ((soilHealthScore - 80) / 100) * 0.3;
    return Number((base * rainFactor * soilFactor).toFixed(2));
  };

  const adjustedYield = getAdjustedYield();
  const totalProductionKg = result ? (adjustedYield * area) : 0;
  const totalProductionQuintals = totalProductionKg / 100;
  const grossRevenueINR = Math.round(totalProductionQuintals * marketPricePerQuintal);
  const totalExpensesINR = Math.round(area * costPerHectare);
  const netProfitINR = grossRevenueINR - totalExpensesINR;
  const roiPct = totalExpensesINR > 0 ? ((netProfitINR / totalExpensesINR) * 100).toFixed(1) : 0;
  const plantingAdvice = weatherData?.planting_advice;

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="badge badge-emerald">
              <Sparkles size={11} /> ML Regression Model
            </span>
            {user && (
              <span className="badge badge-blue">
                {user.full_name} ({user.role})
              </span>
            )}
          </div>
          <h1 className="page-title">
            {t("yieldPredictorTitle", currentLang)}
          </h1>
          <p className="page-subtitle">
            {t("yieldPredictorSub", currentLang)}
          </p>
        </div>

        {/* Live Weather Micro-Tile */}
        <div className="fluent-panel" style={{
          padding: "0.65rem 1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.85rem",
          minWidth: "260px"
        }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "var(--radius-sm)",
            background: "rgba(245, 158, 11, 0.12)",
            border: "1px solid rgba(245, 158, 11, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <CloudSun size={18} color="#d97706" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {selectedDistrict || "District"}, {selectedState || "State"} {weatherLoading && <span className="spinner" style={{ width: "10px", height: "10px" }}></span>}
            </div>
            <div style={{ fontSize: "0.98rem", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>{weatherData ? `${weatherData.current_temp_c}°C` : "28°C"}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>
                {weatherData ? `${weatherData.condition} • 💧${weatherData.current_humidity_pct}%` : "Live Weather"}
              </span>
            </div>
          </div>
          {weatherData && (
            <button
              type="button"
              onClick={handleAutoFillWeather}
              className="btn btn-ghost"
              style={{ padding: "0.3rem 0.6rem", fontSize: "0.72rem" }}
              title="Auto-fill climate parameters"
            >
              Sync
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Bento Layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
        gap: "1.5rem",
        alignItems: "start"
      }}>
        {/* Left Column: Form & Simulator */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Sowing Advice Card */}
          {plantingAdvice && (
            <div className="fluent-panel" style={{ borderLeft: "3px solid var(--accent-primary)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                <div>
                  <span className="badge badge-emerald" style={{ fontSize: "0.7rem" }}>
                    🌱 {t("bestPlantingTimeTitle", currentLang)}
                  </span>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)", marginTop: "0.3rem" }}>
                    {selectedCrop} Sowing Calendar
                  </h3>
                </div>
                <span className="badge badge-purple" style={{ fontSize: "0.72rem" }}>
                  {plantingAdvice.status_badge}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem", marginBottom: "0.85rem" }}>
                <div style={{ background: "var(--bg-inset)", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>{t("bestSowingWindow", currentLang)}</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-primary)", marginTop: "2px" }}>
                    📅 {plantingAdvice.best_months}
                  </div>
                </div>

                <div style={{ background: "var(--bg-inset)", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>{t("recommendedSeason", currentLang)}</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#3b82f6", marginTop: "2px" }}>
                    🌾 {plantingAdvice.season}
                  </div>
                </div>

                <div style={{ background: "var(--bg-inset)", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>{t("idealGerminationTemp", currentLang)}</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f59e0b", marginTop: "2px" }}>
                    🌡️ {plantingAdvice.ideal_temp}
                  </div>
                </div>

                <div style={{ background: "var(--bg-inset)", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>{t("seedRate", currentLang)}</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#8b5cf6", marginTop: "2px" }}>
                    🧪 {plantingAdvice.seed_rate}
                  </div>
                </div>
              </div>

              <div style={{ background: "var(--bg-inset)", padding: "0.85rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)", fontSize: "0.82rem", color: "var(--text-main)", lineHeight: 1.5 }}>
                <strong style={{ color: "var(--accent-primary)" }}>💡 {t("agronomyTip", currentLang)}:</strong> {plantingAdvice.advice}
              </div>
            </div>
          )}

          {/* Form Card */}
          <div className="fluent-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-main)" }}>
                <Layers color="var(--accent-primary)" size={18} /> {t("inputParams", currentLang)}
              </h2>
              <span className="badge badge-emerald">Parameters</span>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Location Selectors */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                <div className="form-group">
                  <label className="input-label">
                    {t("stateName", currentLang)}
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="select-field"
                  >
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="input-label">
                    {t("districtName", currentLang)}
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="select-field"
                  >
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Crop & Year Selectors */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                <div className="form-group">
                  <label className="input-label">
                    {t("cropType", currentLang)}
                  </label>
                  <select
                    value={selectedCrop}
                    onChange={(e) => setSelectedCrop(e.target.value)}
                    className="select-field"
                  >
                    {crops.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="input-label">
                    {t("targetYear", currentLang)}
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="select-field"
                  >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* Land Area */}
              <div className="form-group">
                <label className="input-label">
                  {t("landArea", currentLang)}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              {/* Historical Baseline Group */}
              <div style={{
                background: "var(--bg-inset)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "0.85rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem"
              }}>
                <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--accent-primary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Historical Baseline (Year {selectedYear - 1})
                </span>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label className="input-label" style={{ fontSize: "0.72rem" }}>
                      {t("prevYearYield", currentLang)}
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={prevYield}
                      onChange={(e) => setPrevYield(e.target.value)}
                      className="input-field"
                      style={{ padding: "0.45rem 0.75rem", fontSize: "0.85rem" }}
                      required
                    />
                  </div>

                  <div>
                    <label className="input-label" style={{ fontSize: "0.72rem" }}>
                      {t("prevYearArea", currentLang)}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={prevArea}
                      onChange={(e) => setPrevArea(e.target.value)}
                      className="input-field"
                      style={{ padding: "0.45rem 0.75rem", fontSize: "0.85rem" }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label" style={{ fontSize: "0.72rem" }}>
                    {t("prevYearProd", currentLang)}
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={prevProduction}
                    onChange={(e) => setPrevProduction(e.target.value)}
                    className="input-field"
                    style={{ padding: "0.45rem 0.75rem", fontSize: "0.85rem" }}
                    required
                  />
                </div>
              </div>

              {/* AI Advisory Provider Selector */}
              <div className="form-group">
                <label className="input-label">
                  {t("aiProviderSelect", currentLang)}
                </label>
                <select
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value)}
                  className="select-field"
                >
                  <option value="auto">Auto Orchestrator (Gemini 3.8 + Groq)</option>
                  <option value="gemini">Google Gemini 3.8 Flash</option>
                  <option value="groq">Groq LLaMA 3.3 70B</option>
                  <option value="local">Instant ML result (built-in advisory)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: "100%", padding: "0.75rem", fontSize: "0.95rem", marginTop: "0.25rem" }}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span> Running Regression Predictor...
                  </>
                ) : (
                  <>
                    <Sprout size={16} /> {t("predictNow", currentLang)}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Climate Sensitivity Simulator */}
          <div className="fluent-panel">
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Sliders size={16} color="var(--accent-primary)" /> {t("climateSimulator", currentLang)}
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "0.35rem" }}>
                  <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Droplets size={13} color="#3b82f6" /> {t("rainfallOffsetLabel", currentLang)}
                  </span>
                  <span style={{ fontWeight: 600, color: rainfallOffset >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                    {rainfallOffset > 0 ? `+${rainfallOffset}%` : `${rainfallOffset}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  value={rainfallOffset}
                  onChange={(e) => setRainfallOffset(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--accent-primary)", cursor: "pointer" }}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "0.35rem" }}>
                  <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Thermometer size={13} color="var(--accent-primary)" /> {t("soilHealthLabel", currentLang)}
                  </span>
                  <span style={{ fontWeight: 600, color: "var(--accent-primary)" }}>
                    {soilHealthScore} / 100 Index
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="120"
                  value={soilHealthScore}
                  onChange={(e) => setSoilHealthScore(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--accent-primary)", cursor: "pointer" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Prediction Results & Financial Estimation */}
        <div>
          {error && (
            <div style={{
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              borderRadius: "var(--radius-md)",
              padding: "1rem",
              color: "var(--color-danger)",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem"
            }}>
              <AlertTriangle size={20} />
              <div>
                <h4 style={{ fontWeight: 700, margin: 0, fontSize: "0.92rem" }}>Prediction Notice</h4>
                <p style={{ fontSize: "0.82rem", margin: "2px 0 0" }}>{error}</p>
              </div>
            </div>
          )}

          {result ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Quick KPI Strip */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: "0.65rem"
              }}>
                <div className="metric-tile" style={{ padding: "0.85rem" }}>
                  <div className="metric-label">{t("predictedYield", currentLang)}</div>
                  <div className="metric-value" style={{ color: "var(--accent-primary)", fontSize: "1.25rem" }}>
                    {adjustedYield.toLocaleString()}
                  </div>
                  <div className="metric-subtext">Kg / Hectare</div>
                </div>

                <div className="metric-tile" style={{ padding: "0.85rem" }}>
                  <div className="metric-label">{t("totalProduction", currentLang)}</div>
                  <div className="metric-value" style={{ color: "#3b82f6", fontSize: "1.25rem" }}>
                    {Math.round(totalProductionKg).toLocaleString()}
                  </div>
                  <div className="metric-subtext">Total Kilograms</div>
                </div>

                <div className="metric-tile" style={{ padding: "0.85rem" }}>
                  <div className="metric-label">{t("estimatedRevenue", currentLang)}</div>
                  <div className="metric-value" style={{ color: "#8b5cf6", fontSize: "1.25rem" }}>
                    ₹{grossRevenueINR.toLocaleString()}
                  </div>
                  <div className="metric-subtext">Gross Mandi Value</div>
                </div>

                <div className="metric-tile" style={{ padding: "0.85rem" }}>
                  <div className="metric-label">{t("netProfit", currentLang)}</div>
                  <div className="metric-value" style={{ color: netProfitINR >= 0 ? "var(--color-success)" : "var(--color-danger)", fontSize: "1.25rem" }}>
                    ₹{netProfitINR.toLocaleString()}
                  </div>
                  <div className="metric-subtext">{roiPct}% ROI</div>
                </div>
              </div>

              {/* Primary AI Harvest Spotlight Card */}
              <div className="fluent-panel" style={{
                border: "1px solid var(--accent-subtle)",
                boxShadow: "0 8px 24px rgba(16, 185, 129, 0.08)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span className="badge badge-emerald">
                    <Award size={11} /> {t("mlAuthoritative", currentLang)}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>
                    {t("xgboostModel", currentLang)}
                  </span>
                </div>

                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {t("predictedHarvestYield", currentLang)} ({result.Crop})
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", margin: "0.4rem 0" }}>
                  <span style={{ fontSize: "2.8rem", fontWeight: 800, color: "var(--text-main)", lineHeight: 1, fontFamily: "var(--font-mono)" }}>
                    {adjustedYield.toLocaleString()}
                  </span>
                  <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--accent-primary)" }}>
                    Kg per Hectare
                  </span>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-subtle)", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  <div>📍 <strong style={{ color: "var(--text-main)" }}>{result.Dist_Name}, {result.State_Name}</strong></div>
                  <div>📅 <strong style={{ color: "var(--text-main)" }}>Year {result.Year}</strong></div>
                  <div>🌾 <strong style={{ color: "var(--text-main)" }}>{area} Hectares</strong></div>
                </div>
              </div>

              {/* Financial & ROI Calculator Panel */}
              <div className="fluent-panel">
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <DollarSign size={18} color="#f59e0b" /> {t("financialCalculator", currentLang)}
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "1rem" }}>
                  <div className="form-group">
                    <label className="input-label">
                      Market Rate (₹ / Quintal)
                    </label>
                    <input
                      type="number"
                      value={marketPricePerQuintal}
                      onChange={(e) => setMarketPricePerQuintal(Number(e.target.value))}
                      className="input-field"
                      style={{ padding: "0.45rem 0.75rem", fontSize: "0.85rem" }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="input-label">
                      Cultivation Cost (₹ / Hectare)
                    </label>
                    <input
                      type="number"
                      value={costPerHectare}
                      onChange={(e) => setCostPerHectare(Number(e.target.value))}
                      className="input-field"
                      style={{ padding: "0.45rem 0.75rem", fontSize: "0.85rem" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.65rem" }}>
                  <div style={{ background: "var(--bg-inset)", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{t("grossRevenue", currentLang)}</div>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: "#3b82f6", marginTop: "2px" }}>
                      ₹{grossRevenueINR.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ background: "var(--bg-inset)", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{t("cultivationCost", currentLang)}</div>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-danger)", marginTop: "2px" }}>
                      ₹{totalExpensesINR.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ background: "var(--bg-inset)", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{t("netProfit", currentLang)}</div>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: netProfitINR >= 0 ? "var(--color-success)" : "var(--color-danger)", marginTop: "2px" }}>
                      ₹{netProfitINR.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Farmer Bag Conversion Banner */}
              <div style={{
                background: "var(--bg-inset)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "0.9rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.65rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--accent-primary)" }}>
                    🌾 Bag Yield Breakdown (50kg Standard Units)
                  </span>
                  <span className="badge badge-emerald" style={{ fontSize: "0.7rem" }}>
                    Field Scale
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.6rem" }}>
                  <div style={{ background: "var(--bg-surface)", padding: "0.65rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Per Acre</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-main)" }}>
                      ~{((adjustedYield / 2.471) / 50).toFixed(1)} Bags
                    </div>
                  </div>
                  <div style={{ background: "var(--bg-surface)", padding: "0.65rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Per Hectare</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-main)" }}>
                      ~{(adjustedYield / 50).toFixed(1)} Bags
                    </div>
                  </div>
                  <div style={{ background: "var(--bg-surface)", padding: "0.65rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Total Field ({area} ha)</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-primary)" }}>
                      ~{Math.round((adjustedYield * area) / 50).toLocaleString()} Bags
                    </div>
                  </div>
                </div>
              </div>

              {/* Executive AI Advisory Report */}
              <div className="fluent-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <span className="badge badge-purple" style={{ marginBottom: "0.25rem" }}>
                      <Sparkles size={11} /> {result.ai_provider_used}
                    </span>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
                      {t("executiveReport", currentLang)}
                    </h3>
                  </div>

                  {/* Language Selector & Report Action Buttons */}
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
                    <select
                      value={LANG_NAME_MAP[currentLang] || "English"}
                      onChange={(e) => handleTranslate(e.target.value)}
                      className="select-field"
                      style={{ padding: "0.3rem 1.6rem 0.3rem 0.5rem", fontSize: "0.76rem", width: "auto" }}
                    >
                      <option value="English">🇬🇧 English</option>
                      <option value="Telugu">🇮🇳 తెలుగు (Telugu)</option>
                      <option value="Hindi">🇮🇳 हिंदी (Hindi)</option>
                      <option value="Tamil">🇮🇳 தமிழ் (Tamil)</option>
                      <option value="Kannada">🇮🇳 ಕನ್ನಡ (Kannada)</option>
                      <option value="Malayalam">🇮🇳 മലയാളം (Malayalam)</option>
                      <option value="Marathi">🇮🇳 मराठी (Marathi)</option>
                    </select>

                    <button
                      onClick={() => handleTranslate()}
                      disabled={isTranslating}
                      className="btn btn-secondary"
                      style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem" }}
                    >
                      {isTranslating ? (
                        <><span className="spinner" style={{ width: "11px", height: "11px" }} /> {t("translating", currentLang)}</>
                      ) : showTranslation ? (
                        <><Check size={12} color="var(--accent-primary)" /> {t("showOriginal", currentLang)}</>
                      ) : (
                        <><Sparkles size={12} /> {t("translateButton", currentLang)}</>
                      )}
                    </button>

                    <button
                      onClick={handleSpeakReport}
                      className="btn btn-secondary"
                      style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem" }}
                    >
                      {isSpeakingReport ? <><VolumeX size={12} color="var(--accent-primary)" /> {t("stopAudio", currentLang)}</> : <><Volume2 size={12} /> {t("listenReport", currentLang)}</>}
                    </button>

                    <button
                      onClick={handleCopyReport}
                      className="btn btn-secondary"
                      style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem" }}
                    >
                      {copied ? <><Check size={12} color="var(--accent-primary)" /> {t("copied", currentLang)}</> : <><Copy size={12} /> {t("copy", currentLang)}</>}
                    </button>

                    <button
                      onClick={handleDownloadReport}
                      className="btn btn-secondary"
                      style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem" }}
                    >
                      <Download size={12} /> {t("downloadReport", currentLang)}
                    </button>

                    <button
                      onClick={handleExportCSV}
                      className="btn btn-secondary"
                      style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem" }}
                    >
                      <Download size={12} /> CSV
                    </button>

                    <button
                      onClick={handlePrintReport}
                      className="btn btn-secondary"
                      style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem" }}
                    >
                      <Printer size={12} /> {t("print", currentLang)}
                    </button>
                  </div>
                </div>

                {/* Translation Error alert */}
                {translationError && (
                  <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "var(--radius-sm)", padding: "0.5rem 0.75rem", marginBottom: "0.65rem", color: "var(--color-danger)", fontSize: "0.78rem" }}>
                    {translationError}
                  </div>
                )}

                {/* Farmer-Friendly toggle controls */}
                <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.65rem", flexWrap: "wrap" }}>
                  <button
                    onClick={toggleSimpleMode}
                    className="btn btn-ghost"
                    style={{ padding: "0.25rem 0.6rem", fontSize: "0.72rem" }}
                  >
                    {simpleMode ? <><Layers size={11} /> {t("detailedView", currentLang)}</> : <><Info size={11} /> {t("simplifiedView", currentLang)}</>}
                  </button>
                  <button
                    onClick={toggleHelp}
                    className="btn btn-ghost"
                    style={{ padding: "0.25rem 0.6rem", fontSize: "0.72rem" }}
                  >
                    <Info size={11} /> {t("helpTitle", currentLang)}
                  </button>
                </div>

                {showHelp && (
                  <div style={{ background: "var(--bg-inset)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "0.75rem", marginBottom: "0.75rem", fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 700, color: "var(--text-main)", marginBottom: "0.25rem" }}>
                      {t("helpTitle", currentLang)}
                    </div>
                    {t("helpContent", currentLang)}
                  </div>
                )}

                {/* Report Content Body */}
                <div style={{
                  background: "var(--bg-inset)",
                  padding: "1rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  maxHeight: "380px",
                  overflowY: "auto"
                }}>
                  {showTranslation && translatedContent ? (
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "var(--accent-primary)", fontWeight: 600, marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Check size={11} /> {t("translatedText", currentLang)} ({LANG_NAME_MAP[currentLang] || "Selected Language"})
                      </div>
                      <MarkdownReport content={translatedContent} />
                    </div>
                  ) : (
                    <div>
                      {showTranslation && (
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.4rem" }}>
                          {t("originalText", currentLang)}
                        </div>
                      )}
                      <MarkdownReport content={result.ai_analysis} />
                    </div>
                  )}
                </div>

                {/* Quick Action Navigation Bar */}
                <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    <button
                      onClick={() => {
                        const reportContent = showTranslation && translatedContent ? translatedContent : result.ai_analysis;
                        const prompt = `I have an Executive AI Agronomy Analysis report for ${result.Crop} in ${result.Dist_Name}, ${result.State_Name} (${result.Year}). Predicted yield: ${result.predicted_yield} Kg/ha.\n\nReport Details:\n${reportContent}\n\nPlease explain this report in simple words and give me practical next steps.`;
                        if (onSwitchToChat) {
                          onSwitchToChat();
                          setTimeout(() => {
                            window.dispatchEvent(new CustomEvent("agriyield:prompt", { detail: prompt }));
                          }, 100);
                        }
                      }}
                      className="btn btn-primary"
                      style={{ padding: "0.45rem 0.85rem", fontSize: "0.78rem" }}
                    >
                      <MessageSquare size={13} /> {t("shareWithAI", currentLang)}
                    </button>
                    <button
                      onClick={handleShareWithExpert}
                      className="btn btn-secondary"
                      style={{ padding: "0.45rem 0.85rem", fontSize: "0.78rem" }}
                    >
                      <Share2 size={13} /> {t("shareWithExpert", currentLang)}
                    </button>
                    <button
                      onClick={handleSaveForLater}
                      className="btn btn-secondary"
                      style={{ padding: "0.45rem 0.85rem", fontSize: "0.78rem" }}
                    >
                      <Save size={13} /> {t("saveForLater", currentLang)}
                    </button>
                  </div>
                  <button
                    onClick={onSwitchToChat}
                    className="btn btn-ghost"
                    style={{ padding: "0.45rem 0.85rem", fontSize: "0.78rem" }}
                  >
                    <MessageSquare size={13} /> {t("askAI", currentLang)}
                  </button>
                </div>

                <div style={{ marginTop: "0.75rem", fontSize: "0.7rem", color: "var(--text-dim)", textAlign: "center", fontStyle: "italic" }}>
                  {t("disclaimer", currentLang)}
                </div>
              </div>
            </div>
          ) : (
            <div className="fluent-panel" style={{ padding: "3rem 2rem", textAlign: "center", color: "var(--text-muted)", borderStyle: "dashed" }}>
              <Sprout size={36} color="var(--accent-primary)" style={{ opacity: 0.6, margin: "0 auto 0.75rem" }} />
              <h3 style={{ color: "var(--text-main)", fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                Ready for Harvest Prediction
              </h3>
              <p style={{ maxWidth: "380px", margin: "0 auto", fontSize: "0.82rem", lineHeight: 1.5 }}>
                Configure farm parameters on the left panel and click &ldquo;{t("predictNow", currentLang)}&rdquo; to execute quantitative ML forecasting and generate executive advisory reports.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
