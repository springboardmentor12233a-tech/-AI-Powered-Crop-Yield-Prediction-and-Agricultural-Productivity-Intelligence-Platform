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
    alert(`⚡ Auto-filled exact weather & soil parameters for ${selectedDistrict}, ${selectedState}!\nObserved Time: ${weatherData.observation_time}\nTemp: ${weatherData.current_temp_c}°C | Humidity: ${weatherData.current_humidity_pct}% | Soil Moisture: ${weatherData.soil_moisture_pct}%`);
  };

  const handleSpeakReport = () => {
    if (!('speechSynthesis' in window) || !result) return;
    if (isSpeakingReport) {
      window.speechSynthesis.cancel();
      setIsSpeakingReport(false);
      return;
    }
    window.speechSynthesis.cancel();
    const textToSpeak = `Yield prediction summary for ${result.Crop} in ${result.Dist_Name}, ${result.State_Name}. Authoritative AI predicted yield is ${result.predicted_yield} kg per hectare. AI Advice: ${result.ai_analysis.replace(/[*#_`]/g, '')}`;
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
        // Fallback to clipboard
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

  // Toggle simple mode for farmer-friendly view
  const toggleSimpleMode = () => {
    setSimpleMode(prev => !prev);
  };

  // Toggle help section
  const toggleHelp = () => {
    setShowHelp(prev => !prev);
  };

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
      const response = await fetch("/api/predict", {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Prediction request failed.");
      }

      data.language_used = LANG_NAME_MAP[currentLang] || "English";
      setResult(data);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      setError(err.message || "An unexpected error occurred during prediction.");
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Language Sync: Auto translate AI Agronomy Advisory when global language changes
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
    const reportText = `AgriYield AI Executive Agronomy Advisory Report\n==============================================\nCrop: ${result.Crop}\nLocation: ${result.Dist_Name}, ${result.State_Name}\nYear: ${result.Year}\nAI Predicted Yield: ${result.predicted_yield} Kg/ha\nAI Engine Used: ${result.ai_provider_used}\n\nAI Agronomic Advisory:\n${result.ai_analysis}`;
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

  // Download Report as HTML
  const handleDownloadReport = () => {
    if (!result) return;
    
    const reportContent = showTranslation && translatedContent ? translatedContent : result.ai_analysis;
    const langName = LANG_NAME_MAP[currentLang] || "English";
    
    const htmlContent = `<!DOCTYPE html>
<html lang="${currentLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AgriYield AI Report - ${result.Crop} ${result.Year}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 30px; text-align: center; }
    .header h1 { font-size: 1.8rem; margin-bottom: 8px; }
    .header p { opacity: 0.9; font-size: 0.95rem; }
    .content { padding: 30px; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px; }
    .info-card { background: #f1f5f9; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; }
    .info-card .label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .info-card .value { font-size: 1.1rem; font-weight: 700; color: #0f172a; }
    .yield-highlight { background: linear-gradient(135deg, #ecfdf5, #d1fae5); border: 2px solid #10b981; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 25px; }
    .yield-highlight .yield-value { font-size: 2.5rem; font-weight: 800; color: #059669; }
    .yield-highlight .yield-label { font-size: 0.9rem; color: #047857; margin-top: 5px; }
    .report-body { background: #f8fafc; border-radius: 8px; padding: 20px; border: 1px solid #e2e8f0; }
    .report-body h2 { font-size: 1.3rem; color: #0f172a; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #10b981; }
    .report-body h3 { font-size: 1.1rem; color: #1e293b; margin: 15px 0 10px; }
    .report-body p { margin-bottom: 10px; color: #334155; }
    .report-body ul, .report-body ol { margin-left: 20px; margin-bottom: 10px; }
    .report-body li { margin-bottom: 5px; color: #334155; }
    .report-body strong { color: #0f172a; }
    .report-body table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .report-body th, .report-body td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .report-body th { background: #f1f5f9; font-weight: 600; color: #475569; }
    .footer { text-align: center; padding: 20px; background: #f1f5f9; color: #64748b; font-size: 0.85rem; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-info { background: #dbeafe; color: #1e40af; }
    @media print { body { background: white; padding: 0; } .container { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AgriYield AI - Executive Agronomy Report</h1>
      <p>${result.Crop} | ${result.Dist_Name}, ${result.State_Name} | ${result.Year}</p>
    </div>
    <div class="content">
      <div class="info-grid">
        <div class="info-card">
          <div class="label">Crop</div>
          <div class="value">${result.Crop}</div>
        </div>
        <div class="info-card">
          <div class="label">Location</div>
          <div class="value">${result.Dist_Name}, ${result.State_Name}</div>
        </div>
        <div class="info-card">
          <div class="label">Prediction Year</div>
          <div class="value">${result.Year}</div>
        </div>
        <div class="info-card">
          <div class="label">Cultivated Area</div>
          <div class="value">${area} ha</div>
        </div>
        <div class="info-card">
          <div class="label">Previous Year Yield</div>
          <div class="value">${prevYield} Kg/ha</div>
        </div>
        <div class="info-card">
          <div class="label">AI Engine</div>
          <div class="value">${result.ai_provider_used}</div>
        </div>
      </div>
      
      <div class="yield-highlight">
        <div class="yield-value">${result.predicted_yield} Kg/ha</div>
        <div class="yield-label">AI Predicted Yield</div>
      </div>
      
      <div class="report-body">
        <h2>AI Agronomic Advisory Report</h2>
        <p><span class="badge badge-success">Language: ${langName}</span> <span class="badge badge-info">Generated by ${result.ai_provider_used}</span></p>
        ${reportContent.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/### (.*?)(<br>|$)/g, '<h3>$1</h3>').replace(/## (.*?)(<br>|$)/g, '<h2>$1</h2>').replace(/- (.*?)(<br>|$)/g, '<li>$1</li>').replace(/<li>/g, '<ul><li>').replace(/<\/li>/g, '</li></ul>')}
      </div>
    </div>
    <div class="footer">
      <p>Generated by AgriYield AI | ${new Date().toLocaleString()}</p>
      <p>This report is for informational purposes. Please consult with local agricultural experts for specific advice.</p>
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

  const handlePrintReport = () => {
    window.print();
  };

  const getAdjustedYield = () => {
    if (!result) return 0;
    let base = result.predicted_yield;
    const rainFactor = 1 + (rainfallOffset / 100) * 0.15;
    const soilFactor = 1 + ((soilHealthScore - 80) / 100) * 0.3;
    return Number((base * rainFactor * soilFactor).toFixed(2));
  };

  const adjustedYield = getAdjustedYield();

  // Financial Revenue & Profit Calculations derived STRICTLY from AI ML yield
  const totalProductionKg = result ? (adjustedYield * area) : 0;
  const totalProductionQuintals = totalProductionKg / 100;
  
  const grossRevenueINR = Math.round(totalProductionQuintals * marketPricePerQuintal);
  const totalExpensesINR = Math.round(area * costPerHectare);
  const netProfitINR = grossRevenueINR - totalExpensesINR;
  const roiPct = totalExpensesINR > 0 ? ((netProfitINR / totalExpensesINR) * 100).toFixed(1) : 0;

  const plantingAdvice = weatherData?.planting_advice;

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.5rem 1rem" }}>
      {/* Top Banner */}
      <div style={{
        display: "flex",
        justify: "space-between",
        alignItems: "flex-start",
        marginBottom: "2rem",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="badge badge-emerald">
              <Sparkles size={12} /> AI-Powered
            </span>
            {user && (
              <span className="badge badge-blue">
                👤 {user.full_name} ({user.role})
              </span>
            )}
          </div>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 800, marginTop: "0.4rem", color: "var(--text-main)" }}>
            {t("yieldPredictorTitle", currentLang)}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.98rem", marginTop: "0.25rem" }}>
            {t("yieldPredictorSub", currentLang)}
          </p>
        </div>

        {/* Small Compact Weather Box */}
        <div style={{
          background: "var(--bg-glass)",
          border: "1px solid rgba(245, 158, 11, 0.35)",
          padding: "0.75rem 1.15rem",
          borderRadius: "14px",
          display: "flex",
          alignItems: "center",
          gap: "0.85rem",
          boxShadow: "0 4px 15px rgba(245, 158, 11, 0.12)"
        }}>
            <div style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)",
              border: "1px solid rgba(245, 158, 11, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <CloudSun size={20} color="#f59e0b" />
            </div>
            <div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                📍 {selectedDistrict || "District"}, {selectedState || "State"} {weatherLoading && <span className="spinner"></span>}
              </div>
              <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-main)", marginTop: "2px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#f59e0b" }}>{weatherData ? `${weatherData.current_temp_c}°C` : "28°C"}</span>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>
                  {weatherData ? `${weatherData.condition} • 💧${weatherData.current_humidity_pct}%` : "Agro Weather"}
                </span>
                {weatherData && (
                  <button
                    type="button"
                    onClick={handleAutoFillWeather}
                    className="btn btn-secondary"
                    style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", marginLeft: "4px" }}
                    title="Auto-fill climate parameters"
                  >
                    ⚡ Auto-fill
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* Main Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(430px, 1fr))",
        gap: "2rem",
        alignItems: "start"
      }}>
        {/* Left Column: Best Planting Season & Sowing Advice, Farm Parameters Form & Climate Simulator */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* BEST PLANTING SEASON & CROP SOWING ADVICE CARD */}
          {plantingAdvice && (
            <div className="glass-panel" style={{
              padding: "1.65rem",
              border: "1px solid rgba(16, 185, 129, 0.35)",
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, var(--bg-card) 100%)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <span className="badge badge-emerald" style={{ fontSize: "0.7rem" }}>
                    🌱 {t("bestPlantingTimeTitle", currentLang)}
                  </span>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-main)", marginTop: "0.3rem" }}>
                    {selectedCrop} Planting & Sowing Calendar
                  </h3>
                </div>
                <span className="badge badge-purple" style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}>
                  {plantingAdvice.status_badge}
                </span>
              </div>

              {/* Grid Details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "1rem" }}>
                <div style={{ background: "var(--bg-glass)", padding: "0.85rem", borderRadius: "10px", border: "1px solid var(--border-glass)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>{t("bestSowingWindow", currentLang)}</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#10b981", marginTop: "3px" }}>
                    📅 {plantingAdvice.best_months}
                  </div>
                </div>

                <div style={{ background: "var(--bg-glass)", padding: "0.85rem", borderRadius: "10px", border: "1px solid var(--border-glass)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>{t("recommendedSeason", currentLang)}</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#3b82f6", marginTop: "3px" }}>
                    🌾 {plantingAdvice.season}
                  </div>
                </div>

                <div style={{ background: "var(--bg-glass)", padding: "0.85rem", borderRadius: "10px", border: "1px solid var(--border-glass)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>{t("idealGerminationTemp", currentLang)}</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#f59e0b", marginTop: "3px" }}>
                    🌡️ {plantingAdvice.ideal_temp}
                  </div>
                </div>

                <div style={{ background: "var(--bg-glass)", padding: "0.85rem", borderRadius: "10px", border: "1px solid var(--border-glass)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>{t("seedRate", currentLang)}</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#8b5cf6", marginTop: "3px" }}>
                    🧪 {plantingAdvice.seed_rate}
                  </div>
                </div>
              </div>

              {/* Sowing Advice Box */}
              <div style={{ background: "var(--bg-glass)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border-glass)", fontSize: "0.9rem", color: "var(--text-main)", lineHeight: 1.5 }}>
                <strong style={{ color: "#10b981" }}>💡 {t("agronomyTip", currentLang)}:</strong> {plantingAdvice.advice}
              </div>
            </div>
          )}

          {/* Form Card */}
          <div className="glass-panel" style={{ padding: "1.85rem", border: "1px solid var(--border-glass)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-main)" }}>
                <Layers color="#10b981" size={22} /> {t("inputParams", currentLang)}
              </h2>
              <span className="badge badge-emerald">Parameters</span>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Location Selectors */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.4rem", fontWeight: 600 }}>
                    {t("stateName", currentLang)}
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="input-field select-field"
                    style={{ textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}
                  >
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.4rem", fontWeight: 600 }}>
                    {t("districtName", currentLang)}
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="input-field select-field"
                    style={{ textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}
                  >
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Crop & Year Selectors */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.4rem", fontWeight: 600 }}>
                    {t("cropType", currentLang)}
                  </label>
                  <select
                    value={selectedCrop}
                    onChange={(e) => setSelectedCrop(e.target.value)}
                    className="input-field select-field"
                    style={{ textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}
                  >
                    {crops.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.4rem", fontWeight: 600 }}>
                    {t("targetYear", currentLang)}
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="input-field select-field"
                  >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* Land Area */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.4rem", fontWeight: 600 }}>
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

              {/* Previous Year Baseline Data */}
              <div style={{
                background: "var(--bg-glass)",
                border: "1px solid var(--border-glass)",
                borderRadius: "12px",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.85rem"
              }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Historical Baseline (Year {selectedYear - 1})
                </span>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                      {t("prevYearYield", currentLang)}
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={prevYield}
                      onChange={(e) => setPrevYield(e.target.value)}
                      className="input-field"
                      style={{ padding: "0.55rem 0.85rem", fontSize: "0.88rem" }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                      {t("prevYearArea", currentLang)}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={prevArea}
                      onChange={(e) => setPrevArea(e.target.value)}
                      className="input-field"
                      style={{ padding: "0.55rem 0.85rem", fontSize: "0.88rem" }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                    {t("prevYearProd", currentLang)}
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={prevProduction}
                    onChange={(e) => setPrevProduction(e.target.value)}
                    className="input-field"
                    style={{ padding: "0.55rem 0.85rem", fontSize: "0.88rem" }}
                    required
                  />
                </div>
              </div>

              {/* AI Advisory Provider Selector */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.4rem", fontWeight: 600 }}>
                  {t("aiProviderSelect", currentLang)}
                </label>
                <select
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value)}
                  className="input-field select-field"
                >
                  <option value="auto">⚡ Auto AI</option>
                  <option value="gemini">✨ AI Engine</option>
                  <option value="groq">🔥 AI Engine</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary pulse-primary"
                style={{ width: "100%", padding: "0.95rem", fontSize: "1.05rem", marginTop: "0.5rem" }}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span> Running AI Prediction...
                  </>
                ) : (
                  <>
                    <Sprout size={20} /> {t("predictNow", currentLang)}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Climate & Soil Health Sensitivity Simulator */}
          <div className="glass-panel" style={{ padding: "1.5rem", border: "1px solid var(--border-glass)" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Sliders size={18} color="#8b5cf6" /> {t("climateSimulator", currentLang)}
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Rainfall Slider */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
                  <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Droplets size={14} color="#3b82f6" /> {t("rainfallOffsetLabel", currentLang)}
                  </span>
                  <span style={{ fontWeight: 700, color: rainfallOffset >= 0 ? "#10b981" : "#f43f5e" }}>
                    {rainfallOffset > 0 ? `+${rainfallOffset}%` : `${rainfallOffset}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  value={rainfallOffset}
                  onChange={(e) => setRainfallOffset(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: "#3b82f6", cursor: "pointer" }}
                />
              </div>

              {/* Soil Carbon Slider */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
                  <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Thermometer size={14} color="#10b981" /> {t("soilHealthLabel", currentLang)}
                  </span>
                  <span style={{ fontWeight: 700, color: "#10b981" }}>
                    {soilHealthScore} / 100 Index
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="120"
                  value={soilHealthScore}
                  onChange={(e) => setSoilHealthScore(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: "#10b981", cursor: "pointer" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Prediction Results & Financial ROI Calculator */}
        <div>
          {error && (
            <div style={{
              background: "rgba(244, 63, 94, 0.15)",
              border: "1px solid rgba(244, 63, 94, 0.3)",
              borderRadius: "16px",
              padding: "1.25rem",
              color: "#f43f5e",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem"
            }}>
              <AlertTriangle size={24} />
              <div>
                <h4 style={{ fontWeight: 700, margin: 0 }}>Prediction Error</h4>
                <p style={{ fontSize: "0.88rem", margin: 0, marginTop: "2px" }}>{error}</p>
              </div>
            </div>
          )}

          {result ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Quick Stats Summary - Farmer Friendly */}
              <div style={{
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                borderRadius: "16px",
                padding: "1.25rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <Lightbulb size={18} color="#10b981" />
                  <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-main)" }}>{t("quickSummary", currentLang)}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem" }}>
                  <div style={{ background: "var(--bg-card)", padding: "0.75rem", borderRadius: "10px", textAlign: "center" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "4px" }}>{t("predictedYield", currentLang)}</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#10b981" }}>{adjustedYield.toLocaleString()}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Kg/ha</div>
                  </div>
                  <div style={{ background: "var(--bg-card)", padding: "0.75rem", borderRadius: "10px", textAlign: "center" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "4px" }}>{t("totalProduction", currentLang)}</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#3b82f6" }}>{Math.round(totalProductionKg).toLocaleString()}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Kg</div>
                  </div>
                  <div style={{ background: "var(--bg-card)", padding: "0.75rem", borderRadius: "10px", textAlign: "center" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "4px" }}>{t("estimatedRevenue", currentLang)}</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#8b5cf6" }}>₹{grossRevenueINR.toLocaleString()}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>INR</div>
                  </div>
                  <div style={{ background: "var(--bg-card)", padding: "0.75rem", borderRadius: "10px", textAlign: "center" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "4px" }}>{t("netProfit", currentLang)}</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: netProfitINR >= 0 ? "#10b981" : "#f43f5e" }}>₹{netProfitINR.toLocaleString()}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>({roiPct}%)</div>
                  </div>
                </div>
              </div>

              {/* Primary AI Output Card */}
              <div className="glass-panel" style={{
                padding: "1.75rem",
                border: "2px solid #10b981",
                boxShadow: "0 0 30px rgba(16, 185, 129, 0.15)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <span className="badge badge-emerald">
                    <Award size={12} /> {t("mlAuthoritative", currentLang)}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
                    {t("xgboostModel", currentLang)}
                  </span>
                </div>

                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {t("predictedHarvestYield", currentLang)} ({result.Crop})
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", margin: "0.5rem 0" }}>
                  <span style={{ fontSize: "2.8rem", fontWeight: 800, color: "var(--text-main)", lineHeight: 1 }} className="gradient-text">
                    {adjustedYield.toLocaleString()}
                  </span>
                  <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#10b981" }}>
                    Kg per Hectare
                  </span>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-glass)", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  <div>📍 <strong style={{ color: "var(--text-main)" }}>{result.Dist_Name}, {result.State_Name}</strong></div>
                  <div>📅 <strong style={{ color: "var(--text-main)" }}>{result.Year}</strong></div>
                  <div>🌾 <strong style={{ color: "var(--text-main)" }}>{area} ha</strong></div>
                </div>
              </div>

              {/* Financial & ROI Calculator Panel */}
              <div className="glass-panel" style={{ padding: "1.75rem", border: "1px solid var(--border-glass)" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <DollarSign size={20} color="#f59e0b" /> {t("financialCalculator", currentLang)}
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                      Market Rate (₹ / Quintal)
                    </label>
                    <input
                      type="number"
                      value={marketPricePerQuintal}
                      onChange={(e) => setMarketPricePerQuintal(Number(e.target.value))}
                      className="input-field"
                      style={{ padding: "0.5rem 0.8rem", fontSize: "0.9rem" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                      Cultivation Cost (₹ / Hectare)
                    </label>
                    <input
                      type="number"
                      value={costPerHectare}
                      onChange={(e) => setCostPerHectare(Number(e.target.value))}
                      className="input-field"
                      style={{ padding: "0.5rem 0.8rem", fontSize: "0.9rem" }}
                    />
                  </div>
                </div>

                {/* Financial Summary Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.85rem" }}>
                  <div style={{ background: "var(--bg-glass)", padding: "0.85rem", borderRadius: "10px", border: "1px solid var(--border-glass)" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{t("grossRevenue", currentLang)}</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#3b82f6", marginTop: "2px" }}>
                      ₹{grossRevenueINR.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ background: "var(--bg-glass)", padding: "0.85rem", borderRadius: "10px", border: "1px solid var(--border-glass)" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{t("cultivationCost", currentLang)}</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f43f5e", marginTop: "2px" }}>
                      ₹{totalExpensesINR.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ background: "var(--bg-glass)", padding: "0.85rem", borderRadius: "10px", border: "1px solid var(--border-glass)" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{t("netProfit", currentLang)}</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: netProfitINR >= 0 ? "#10b981" : "#f43f5e", marginTop: "2px" }}>
                      ₹{netProfitINR.toLocaleString()} ({roiPct}%)
                    </div>
                  </div>
                </div>
              </div>

              {/* Executive AI Advisory Report */}
              <div className="glass-panel" style={{ padding: "1.85rem", border: "1px solid var(--border-glass)" }}>
                
                {/* Farmer Friendly Bags & Revenue Summary Banner */}
                <div style={{
                  background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  borderRadius: "14px",
                  padding: "1.1rem 1.25rem",
                  marginBottom: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#10b981", fontWeight: 800, fontSize: "0.95rem" }}>
                      🌾 <span>{t("farmerTips", currentLang)} & Quick Acre Conversion</span>
                    </div>
                    <span className="badge badge-emerald" style={{ fontSize: "0.75rem" }}>
                      50kg Bags / Acre Units
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
                    <div style={{ background: "var(--bg-card)", padding: "0.75rem 0.9rem", borderRadius: "10px", border: "1px solid var(--border-glass)" }}>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>Yield per Acre (Approx)</div>
                      <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#10b981", marginTop: "2px" }}>
                        {(adjustedYield / 2.471).toFixed(1)} Kg/Acre
                      </div>
                    </div>

                    <div style={{ background: "var(--bg-card)", padding: "0.75rem 0.9rem", borderRadius: "10px", border: "1px solid var(--border-glass)" }}>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>Bags (50kg) per Acre</div>
                      <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#3b82f6", marginTop: "2px" }}>
                        ~ {((adjustedYield / 2.471) / 50).toFixed(1)} Bags/Acre
                      </div>
                    </div>

                    <div style={{ background: "var(--bg-card)", padding: "0.75rem 0.9rem", borderRadius: "10px", border: "1px solid var(--border-glass)" }}>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>Total Field Bags ({area} ha)</div>
                      <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#8b5cf6", marginTop: "2px" }}>
                        ~ {Math.round((adjustedYield * area) / 50).toLocaleString()} Bags
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <span className="badge badge-purple" style={{ marginBottom: "0.3rem" }}>
                      <Sparkles size={12} /> {result.ai_provider_used}
                    </span>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
                      {t("executiveReport", currentLang)}
                    </h3>
                  </div>

                  {/* Language Selector & Report Actions */}
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <select
                        value={LANG_NAME_MAP[currentLang] || "English"}
                        onChange={(e) => {
                          handleTranslate(e.target.value);
                        }}
                        className="input-field select-field"
                        style={{ padding: "0.35rem 1.8rem 0.35rem 0.6rem", fontSize: "0.78rem" }}
                      >
                        <option value="English">🇬🇧 English</option>
                        <option value="Telugu">🇮🇳 తెలుగు (Telugu)</option>
                        <option value="Hindi">🇮🇳 हिंदी (Hindi)</option>
                        <option value="Tamil">🇮🇳 தமிழ் (Tamil)</option>
                        <option value="Kannada">🇮🇳 ಕನ್ನಡ (Kannada)</option>
                        <option value="Malayalam">🇮🇳 മലയാളം (Malayalam)</option>
                        <option value="Marathi">🇮🇳 मराठी (Marathi)</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleTranslate()}
                      disabled={isTranslating}
                      className="btn btn-secondary"
                      style={{ padding: "0.45rem 0.75rem", fontSize: "0.78rem", background: showTranslation ? "rgba(16, 185, 129, 0.15)" : undefined, border: showTranslation ? "1px solid rgba(16, 185, 129, 0.3)" : undefined }}
                    >
                      {isTranslating ? (
                        <><span className="spinner" style={{ width: "12px", height: "12px", borderWidth: "2px" }} /> {t("translating", currentLang)}</>
                      ) : showTranslation ? (
                        <><Check size={13} color="#10b981" /> {t("showOriginal", currentLang)}</>
                      ) : (
                        <><Sparkles size={13} /> {t("translateButton", currentLang)}</>
                      )}
                    </button>
                    <button
                      onClick={handleSpeakReport}
                      className="btn btn-secondary"
                      style={{ padding: "0.45rem 0.75rem", fontSize: "0.78rem" }}
                    >
                      {isSpeakingReport ? <><VolumeX size={13} color="#10b981" /> {t("stopAudio", currentLang)}</> : <><Volume2 size={13} /> {t("listenReport", currentLang)}</>}
                    </button>
                    <button
                      onClick={handleCopyReport}
                      className="btn btn-secondary"
                      style={{ padding: "0.45rem 0.75rem", fontSize: "0.78rem" }}
                    >
                      {copied ? <><Check size={13} color="#10b981" /> {t("copied", currentLang)}</> : <><Copy size={13} /> {t("copy", currentLang)}</>}
                    </button>
                    <button
                      onClick={handleDownloadReport}
                      className="btn btn-secondary"
                      style={{ padding: "0.45rem 0.75rem", fontSize: "0.78rem", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.25)" }}
                    >
                      <Download size={13} /> {t("downloadReport", currentLang)}
                    </button>
                    <button
                      onClick={handleExportCSV}
                      className="btn btn-secondary"
                      style={{ padding: "0.45rem 0.75rem", fontSize: "0.78rem" }}
                    >
                      <Download size={13} /> {t("csv", currentLang)}
                    </button>
                    <button
                      onClick={handlePrintReport}
                      className="btn btn-secondary"
                      style={{ padding: "0.45rem 0.75rem", fontSize: "0.78rem" }}
                    >
                      <Printer size={13} /> {t("print", currentLang)}
                    </button>
                  </div>
                </div>

                {/* Translation Status */}
                {translationError && (
                  <div style={{ background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.2)", borderRadius: "8px", padding: "0.5rem 0.75rem", marginBottom: "0.75rem", color: "#f43f5e", fontSize: "0.8rem" }}>
                    {translationError}
                  </div>
                )}

                {/* Farmer-Friendly Controls */}
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                  <button
                    onClick={toggleSimpleMode}
                    className="btn btn-secondary"
                    style={{ padding: "0.35rem 0.65rem", fontSize: "0.72rem", background: simpleMode ? "rgba(139, 92, 246, 0.15)" : undefined, border: simpleMode ? "1px solid rgba(139, 92, 246, 0.3)" : undefined }}
                  >
                    {simpleMode ? <><Layers size={12} /> {t("detailedView", currentLang)}</> : <><Info size={12} /> {t("simplifiedView", currentLang)}</>}
                  </button>
                  <button
                    onClick={toggleHelp}
                    className="btn btn-secondary"
                    style={{ padding: "0.35rem 0.65rem", fontSize: "0.72rem", background: showHelp ? "rgba(245, 158, 11, 0.15)" : undefined, border: showHelp ? "1px solid rgba(245, 158, 11, 0.3)" : undefined }}
                  >
                    <Info size={12} /> {t("helpTitle", currentLang)}
                  </button>
                </div>

                {/* Help Section */}
                {showHelp && (
                  <div style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)", borderRadius: "10px", padding: "0.85rem", marginBottom: "0.75rem" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f59e0b", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <Info size={14} /> {t("helpTitle", currentLang)}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                      {t("helpContent", currentLang)}
                    </div>
                    <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                      {t("translationNote", currentLang)}
                    </div>
                  </div>
                )}

                {/* Report Content */}
                <div style={{ background: "var(--bg-glass)", padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border-glass)", maxHeight: "400px", overflowY: "auto" }}>
                  {showTranslation && translatedContent ? (
                    <div>
                      <div style={{ fontSize: "0.7rem", color: "#10b981", fontWeight: 600, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Check size={12} /> {t("translatedText", currentLang)} ({LANG_NAME_MAP[currentLang] || "Selected Language"})
                      </div>
                      <MarkdownReport content={translatedContent} />
                    </div>
                  ) : (
                    <div>
                      {showTranslation && (
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.5rem" }}>
                          {t("originalText", currentLang)}
                        </div>
                      )}
                      <MarkdownReport content={result.ai_analysis} />
                    </div>
                  )}
                </div>

                {/* Farmer Tips Section */}
                {simpleMode && (
                  <div style={{ marginTop: "0.75rem", background: "rgba(16, 185, 129, 0.06)", border: "1px solid rgba(16, 185, 129, 0.15)", borderRadius: "10px", padding: "0.85rem" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#10b981", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <Lightbulb size={14} /> {t("farmerTips", currentLang)}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "flex-start", gap: "0.4rem" }}>
                          <span style={{ color: "#10b981", fontWeight: 700 }}>💡</span>
                          <span>{t(`tip${i}`, currentLang)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Action Buttons */}
                <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
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
                      style={{ padding: "0.5rem 1rem", fontSize: "0.8rem" }}
                    >
                      <MessageSquare size={14} /> {t("shareWithAI", currentLang)}
                    </button>
                    <button
                      onClick={handleDownloadReport}
                      className="btn btn-secondary"
                      style={{ padding: "0.5rem 1rem", fontSize: "0.8rem" }}
                    >
                      <Download size={14} /> {t("downloadReport", currentLang)}
                    </button>
                    <button
                      onClick={handleCopyReport}
                      className="btn btn-secondary"
                      style={{ padding: "0.5rem 1rem", fontSize: "0.8rem" }}
                    >
                      <Copy size={14} /> {t("copy", currentLang)}
                    </button>
                    <button
                      onClick={handlePrintReport}
                      className="btn btn-secondary"
                      style={{ padding: "0.5rem 1rem", fontSize: "0.8rem" }}
                    >
                      <Printer size={14} /> {t("print", currentLang)}
                    </button>
                    <button
                      onClick={handleShareWithExpert}
                      className="btn btn-secondary"
                      style={{ padding: "0.5rem 1rem", fontSize: "0.8rem" }}
                    >
                      <Share2 size={14} /> {t("shareWithExpert", currentLang)}
                    </button>
                    <button
                      onClick={handleSaveForLater}
                      className="btn btn-secondary"
                      style={{ padding: "0.5rem 1rem", fontSize: "0.8rem" }}
                    >
                      <Save size={14} /> {t("saveForLater", currentLang)}
                    </button>
                  </div>
                  <button
                    onClick={onSwitchToChat}
                    className="btn btn-primary"
                    style={{ padding: "0.6rem 1.2rem", fontSize: "0.85rem" }}
                  >
                    <MessageSquare size={15} /> {t("askAI", currentLang)}
                  </button>
                </div>

                {/* Feedback Section */}
                <div style={{ marginTop: "1rem", padding: "0.85rem", background: "var(--bg-glass)", borderRadius: "10px", border: "1px solid var(--border-glass)" }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                    {t("feedbackTitle", currentLang)}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)" }}
                    >
                      👍 {t("feedbackYes", currentLang)}
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}
                    >
                      👎 {t("feedbackNo", currentLang)}
                    </button>
                  </div>
                </div>

                {/* Disclaimer */}
                <div style={{ marginTop: "0.75rem", fontSize: "0.7rem", color: "var(--text-dim)", textAlign: "center", fontStyle: "italic" }}>
                  {t("disclaimer", currentLang)}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: "2.5rem 2rem", textAlign: "center", color: "var(--text-muted)", border: "1px dashed var(--border-glass)" }}>
              <Sprout size={40} color="#10b981" style={{ opacity: 0.5, marginBottom: "0.75rem" }} />
              <h3 style={{ color: "var(--text-main)", fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Ready for Harvest Prediction</h3>
              <p style={{ maxWidth: "400px", margin: "0 auto", fontSize: "0.85rem", lineHeight: 1.5 }}>
                Select your farm parameters on the left panel and click "Predict Crop Yield Now" to execute AI ML forecasting and generate AI advisory reports.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
