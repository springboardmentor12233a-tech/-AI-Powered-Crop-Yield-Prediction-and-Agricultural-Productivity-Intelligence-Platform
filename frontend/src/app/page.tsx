"use client";

import React, { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"yield" | "recommendation" | "analytics" | "report">("yield");
  const [apiStatus, setApiStatus] = useState<string>("Checking...");
  const [apiOnline, setApiOnline] = useState<boolean>(false);

  // Yield form state
  const [yieldInput, setYieldInput] = useState({
    Crop: "Wheat",
    Region: "Region_A",
    Soil_Type: "Loam",
    Soil_pH: 6.8,
    Rainfall_mm: 650.0,
    Temperature_C: 22.5,
    Humidity_pct: 60.0,
    Fertilizer_Used_kg: 180.0,
    Irrigation: "Sprinkler",
    Pesticides_Used_kg: 20.0,
    Planting_Density: 15.0,
    Previous_Crop: "Maize",
    farm_id: "FARM-ALPHA-01",
    plot_label: "North Field (Plot 3)"
  });

  const [yieldResult, setYieldResult] = useState<any>(null);
  const [yieldLoading, setYieldLoading] = useState<boolean>(false);
  const [yieldError, setYieldError] = useState<string | null>(null);

  // Recommendation form state
  const [recInput, setRecInput] = useState({
    Temperature: 25.0,
    Humidity: 70.0,
    pH: 6.5,
    Rainfall: 600.0
  });

  const [recResult, setRecResult] = useState<any>(null);
  const [recLoading, setRecLoading] = useState<boolean>(false);
  const [recError, setRecError] = useState<string | null>(null);

  // Analytics state
  const [weatherData, setWeatherData] = useState<any>(null);
  const [soilData, setSoilData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);

  // Report state
  const [reportResult, setReportResult] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState<boolean>(false);

  // Check Backend Connection
  useEffect(() => {
    fetch(`${API_BASE}/`)
      .then((res) => res.json())
      .then((data) => {
        setApiStatus("Online (FastAPI v2.0.0)");
        setApiOnline(true);
      })
      .catch(() => {
        setApiStatus("Offline (Backend not running on :8000)");
        setApiOnline(false);
      });
  }, []);

  // Fetch Analytics on tab switch
  useEffect(() => {
    if (activeTab === "analytics" && !weatherData) {
      setAnalyticsLoading(true);
      Promise.all([
        fetch(`${API_BASE}/api/analytics/weather`).then((r) => r.json()),
        fetch(`${API_BASE}/api/analytics/soil`).then((r) => r.json())
      ])
        .then(([w, s]) => {
          setWeatherData(w);
          setSoilData(s);
          setAnalyticsLoading(false);
        })
        .catch(() => setAnalyticsLoading(false));
    }
  }, [activeTab, weatherData]);

  // Handle Yield Prediction
  const handleYieldSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setYieldLoading(true);
    setYieldError(null);
    try {
      const res = await fetch(`${API_BASE}/api/predict/yield`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(yieldInput)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Prediction request failed");
      }
      const data = await res.json();
      setYieldResult(data);
    } catch (err: any) {
      setYieldError(err.message);
    } finally {
      setYieldLoading(false);
    }
  };

  // Handle Recommendation Prediction
  const handleRecSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecLoading(true);
    setRecError(null);
    try {
      const res = await fetch(`${API_BASE}/api/predict/recommendation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recInput)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Recommendation request failed");
      }
      const data = await res.json();
      setRecResult(data);
    } catch (err: any) {
      setRecError(err.message);
    } finally {
      setRecLoading(false);
    }
  };

  // Handle Report Generation
  const handleReportGenerate = async () => {
    setReportLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/analytics/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(yieldInput)
      });
      const data = await res.json();
      setReportResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xl shadow-lg shadow-emerald-950">
            🌾
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              YieldSense <span className="text-emerald-400">AI</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Milestone 2
              </span>
            </h1>
            <p className="text-xs text-slate-400">Crop Yield Prediction & Agricultural Productivity Intelligence Platform</p>
          </div>
        </div>

        {/* API Status Badge */}
        <div className="flex items-center gap-2 text-xs">
          <span className={`w-2.5 h-2.5 rounded-full ${apiOnline ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`}></span>
          <span className="text-slate-300">API Status: {apiStatus}</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4 mb-8">
          {[
            { id: "yield", label: "🌾 Crop Yield Forecasting", desc: "Ridge Regression Pipeline" },
            { id: "recommendation", label: "🌱 Crop Recommendation", desc: "Random Forest (70 Varieties)" },
            { id: "analytics", label: "📊 Weather & Soil Analytics", desc: "Climatic Envelopes & Edaphic Stats" },
            { id: "report", label: "📋 Prediction Reports", desc: "Exportable Intelligence Summaries" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col text-left px-5 py-3 rounded-xl transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 shadow-md shadow-emerald-950"
                  : "bg-slate-900/60 border border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <span className="font-semibold text-sm">{tab.label}</span>
              <span className="text-xs opacity-70">{tab.desc}</span>
            </button>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: CROP YIELD FORECASTING                                             */}
        {/* ========================================================================= */}
        {activeTab === "yield" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Input Form */}
            <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>🚜</span> Agricultural Management & Environmental Inputs
                </h2>
                <p className="text-xs text-slate-400">Configure parameters matching Dataset B (Smart Crop Yield Prediction Dataset)</p>
              </div>

              <form onSubmit={handleYieldSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Target Crop Species</label>
                    <select
                      value={yieldInput.Crop}
                      onChange={(e) => setYieldInput({ ...yieldInput, Crop: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                      {["Wheat", "Rice", "Maize", "Barley"].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Geographic Region</label>
                    <select
                      value={yieldInput.Region}
                      onChange={(e) => setYieldInput({ ...yieldInput, Region: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                      {["Region_A", "Region_B", "Region_C", "Region_D"].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Soil Texture</label>
                    <select
                      value={yieldInput.Soil_Type}
                      onChange={(e) => setYieldInput({ ...yieldInput, Soil_Type: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                      {["Loam", "Clay", "Sandy"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Soil pH (0–14)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="14"
                      value={yieldInput.Soil_pH}
                      onChange={(e) => setYieldInput({ ...yieldInput, Soil_pH: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Irrigation Method</label>
                    <select
                      value={yieldInput.Irrigation}
                      onChange={(e) => setYieldInput({ ...yieldInput, Irrigation: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                      {["Sprinkler", "Drip", "Flood", "Unknown"].map((i) => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Temperature (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={yieldInput.Temperature_C}
                      onChange={(e) => setYieldInput({ ...yieldInput, Temperature_C: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Humidity (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={yieldInput.Humidity_pct}
                      onChange={(e) => setYieldInput({ ...yieldInput, Humidity_pct: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Rainfall (mm)</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={yieldInput.Rainfall_mm}
                      onChange={(e) => setYieldInput({ ...yieldInput, Rainfall_mm: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Fertilizer Used (kg)</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={yieldInput.Fertilizer_Used_kg}
                      onChange={(e) => setYieldInput({ ...yieldInput, Fertilizer_Used_kg: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Pesticides (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={yieldInput.Pesticides_Used_kg}
                      onChange={(e) => setYieldInput({ ...yieldInput, Pesticides_Used_kg: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Planting Density</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={yieldInput.Planting_Density}
                      onChange={(e) => setYieldInput({ ...yieldInput, Planting_Density: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Previous Crop</label>
                    <select
                      value={yieldInput.Previous_Crop}
                      onChange={(e) => setYieldInput({ ...yieldInput, Previous_Crop: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                      {["Maize", "Rice", "Wheat", "Barley", "Unknown"].map((pc) => (
                        <option key={pc} value={pc}>{pc}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Plot Identification</label>
                    <input
                      type="text"
                      value={yieldInput.plot_label}
                      onChange={(e) => setYieldInput({ ...yieldInput, plot_label: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={yieldLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-6 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 disabled:opacity-50 mt-4"
                >
                  {yieldLoading ? "Computing ML Inference..." : "⚡ Forecast Crop Yield Output"}
                </button>
              </form>
            </div>

            {/* Prediction Result Display */}
            <div className="lg:col-span-5 space-y-6">
              {yieldError && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-300 text-sm">
                  ⚠️ <strong>Error:</strong> {yieldError}
                </div>
              )}

              {yieldResult ? (
                <div className="space-y-6">
                  {/* Primary Forecast Card */}
                  <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-2">
                      <span>PREDICTED CROP HARVEST</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        {yieldResult.algorithm}
                      </span>
                    </div>

                    <div className="text-4xl font-extrabold text-white tracking-tight my-2">
                      {yieldResult.predicted_yield_ton_per_ha}{" "}
                      <span className="text-lg font-normal text-emerald-400">ton/ha</span>
                    </div>

                    <p className="text-xs text-slate-300 mt-2">
                      Estimated harvest yield for <strong>{yieldInput.Crop}</strong> on {yieldInput.Soil_Type} soil in {yieldInput.Region}.
                    </p>

                    <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                      <span>Model Version: {yieldResult.model_version}</span>
                      <span>Accuracy: R² 0.9821</span>
                    </div>
                  </div>

                  {/* Multi-Tier Agricultural Insights */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>💡</span> Automated Agricultural Intelligence
                    </h3>

                    {yieldResult.insights?.data_driven_insights?.map((ins: any, idx: number) => (
                      <div key={idx} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs">
                        <span className="font-bold text-sky-400 block mb-1">📊 [DATA-DRIVEN] {ins.title}</span>
                        <p className="text-slate-300">{ins.description}</p>
                      </div>
                    ))}

                    {yieldResult.insights?.general_guidance?.map((ins: any, idx: number) => (
                      <div key={idx} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs">
                        <span className="font-bold text-emerald-400 block mb-1">🌱 [GUIDANCE] {ins.title}</span>
                        <p className="text-slate-300">{ins.description}</p>
                      </div>
                    ))}

                    {yieldResult.insights?.risk_alerts?.map((ins: any, idx: number) => (
                      <div key={idx} className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs">
                        <span className="font-bold text-amber-400 block mb-1">⚠️ [RISK ALERT] {ins.title}</span>
                        <p className="text-slate-300">{ins.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/40 border border-slate-800/80 border-dashed rounded-2xl p-12 text-center text-slate-500 flex flex-col items-center justify-center">
                  <span className="text-4xl mb-3">📈</span>
                  <p className="text-sm font-medium">Ready for Prediction</p>
                  <p className="text-xs text-slate-600 mt-1">Submit the parameters form to generate real-time ML yield forecasting.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CROP RECOMMENDATION                                                */}
        {/* ========================================================================= */}
        {activeTab === "recommendation" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>🌱</span> Environmental Suitability Matcher
                </h2>
                <p className="text-xs text-slate-400">Classify the optimal crop among 70 species based on Dataset A parameters</p>
              </div>

              <form onSubmit={handleRecSubmit} className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>Ambient Temperature</span>
                    <span className="text-emerald-400 font-bold">{recInput.Temperature} °C</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="0.5"
                    value={recInput.Temperature}
                    onChange={(e) => setRecInput({ ...recInput, Temperature: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>Relative Humidity</span>
                    <span className="text-emerald-400 font-bold">{recInput.Humidity} %</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="1"
                    value={recInput.Humidity}
                    onChange={(e) => setRecInput({ ...recInput, Humidity: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>Soil pH Level</span>
                    <span className="text-emerald-400 font-bold">{recInput.pH}</span>
                  </div>
                  <input
                    type="range"
                    min="3.5"
                    max="10"
                    step="0.1"
                    value={recInput.pH}
                    onChange={(e) => setRecInput({ ...recInput, pH: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>Seasonal Precipitation / Rainfall</span>
                    <span className="text-emerald-400 font-bold">{recInput.Rainfall} mm</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="3000"
                    step="10"
                    value={recInput.Rainfall}
                    onChange={(e) => setRecInput({ ...recInput, Rainfall: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={recLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-6 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 disabled:opacity-50 mt-4"
                >
                  {recLoading ? "Classifying Crop Varieties..." : "🌿 Find Best-Suited Crops"}
                </button>
              </form>
            </div>

            <div className="lg:col-span-6 space-y-6">
              {recError && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-300 text-sm">
                  ⚠️ <strong>Error:</strong> {recError}
                </div>
              )}

              {recResult ? (
                <div className="space-y-6">
                  {/* Top Crop Recommendation */}
                  <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl">
                    <div className="text-xs text-emerald-400 font-semibold mb-1">RECOMMENDED CROP SPECIES</div>
                    <div className="text-4xl font-extrabold text-white tracking-tight my-1">
                      {recResult.recommended_crop}
                    </div>
                    <p className="text-xs text-slate-300">
                      Matches current environmental climate with <strong>{recResult.confidence_pct}</strong> statistical confidence.
                    </p>
                  </div>

                  {/* Top Candidate Probabilities */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-sm font-bold text-white mb-4">Top Ranked Alternatives (Random Forest Classifier)</h3>
                    <div className="space-y-3">
                      {recResult.top_candidates?.map((cand: any, idx: number) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-slate-200">{cand.crop}</span>
                            <span className="text-emerald-400">{cand.confidence_pct}</span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${cand.confidence * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Soil pH Classification */}
                  {recResult.soil_ph_analysis && (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl text-xs space-y-2">
                      <span className="font-bold text-sky-400 block text-sm">
                        🧪 Soil pH Assessment: {recResult.soil_ph_analysis.category}
                      </span>
                      <p className="text-slate-300">{recResult.soil_ph_analysis.guidance}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-900/40 border border-slate-800/80 border-dashed rounded-2xl p-12 text-center text-slate-500 flex flex-col items-center justify-center">
                  <span className="text-4xl mb-3">🌱</span>
                  <p className="text-sm font-medium">No Recommendation Generated</p>
                  <p className="text-xs text-slate-600 mt-1">Adjust the climate sliders and submit to identify the optimal crop species.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: WEATHER & SOIL ANALYTICS                                           */}
        {/* ========================================================================= */}
        {activeTab === "analytics" && (
          <div className="space-y-8">
            {/* Limitation Notice */}
            <div className="bg-sky-950/30 border border-sky-500/30 rounded-xl p-4 text-xs text-sky-200 flex items-start gap-3">
              <span className="text-base">ℹ️</span>
              <div>
                <strong>Agro-Climatic Intelligence Note:</strong> Weather and soil metrics are calculated from project datasets (7,000 Dataset A records and 10,000 Dataset B records). Soil nutrients (N, P, K) are not present in static training datasets and represent future IoT sensor parameters.
              </div>
            </div>

            {analyticsLoading ? (
              <div className="text-center py-12 text-slate-400">Loading statistical intelligence...</div>
            ) : (
              <div className="space-y-8">
                {/* Crop Climate Envelopes Grid */}
                <div>
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span>🌦️</span> Optimal Climatic Envelopes by Crop (Dataset A)
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {weatherData?.crop_climatic_profiles &&
                      Object.entries(weatherData.crop_climatic_profiles).map(([crop, prof]: any) => (
                        <div key={crop} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
                          <span className="font-bold text-emerald-400 text-sm">{crop}</span>
                          <div className="space-y-1 text-slate-300">
                            <div>🌡️ Temp: <span className="text-white">{prof.opt_temp_range}</span></div>
                            <div>💧 Humidity: <span className="text-white">{prof.opt_humidity_range}</span></div>
                            <div>🌧️ Rainfall: <span className="text-white">{prof.opt_rainfall_range}</span></div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Soil Texture Benchmark Performance */}
                <div>
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span>🌍</span> Soil Texture Performance Benchmarks (Dataset B)
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {soilData?.soil_texture_performance &&
                      Object.entries(soilData.soil_texture_performance).map(([soil, stats]: any) => (
                        <div key={soil} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white text-base">{soil} Soil</span>
                            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300">{stats.record_count} plots</span>
                          </div>
                          <div className="text-2xl font-bold text-emerald-400">
                            {stats.avg_yield_ton_ha} <span className="text-xs font-normal text-slate-400">ton/ha mean</span>
                          </div>
                          <div className="text-xs text-slate-400">
                            Yield Range: {stats.min_yield} - {stats.max_yield} ton/ha
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: PREDICTION REPORTS GENERATOR                                      */}
        {/* ========================================================================= */}
        {activeTab === "report" && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">📋 Official Agronomic Prediction Report</h2>
                <p className="text-xs text-slate-400">Generate a comprehensive summary for plot {yieldInput.plot_label} ({yieldInput.Crop})</p>
              </div>
              <button
                onClick={handleReportGenerate}
                disabled={reportLoading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition shadow-lg shadow-emerald-950 disabled:opacity-50"
              >
                {reportLoading ? "Generating..." : "⚡ Generate & Preview Report"}
              </button>
            </div>

            {reportResult ? (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 font-mono text-xs text-slate-200 space-y-4 overflow-x-auto shadow-2xl">
                <div className="flex justify-between border-b border-slate-800 pb-4">
                  <span className="text-emerald-400 font-bold">REPORT ID: {reportResult.report_id}</span>
                  <span className="text-slate-500">{reportResult.generated_at}</span>
                </div>

                <div className="text-slate-300 whitespace-pre-wrap">
                  {reportResult.formatted_markdown}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-slate-800/80 border-dashed rounded-2xl p-12 text-center text-slate-500">
                Click the generate button above to compile and preview the official farm intelligence report.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
