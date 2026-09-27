"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SoilChart from "../components/SoilChart";
import YieldChart from "../components/YieldChart";
import Sidebar from "../components/Sidebar";

const CROP_TYPES = ["Wheat", "Corn", "Rice", "Soybean", "Barley"];
const REGIONS = ["North", "South", "East", "West", "Central"];
const SEASONS = ["Spring", "Summer", "Autumn"];

const initialForm = {
  crop_type: "Wheat",
  region: "North",
  season: "Autumn",
  harvest_date: "2024-03-09",
  soil_ph: "",
  soil_moisture: "",
  avg_temperature: "",
  total_rainfall: "",
  fertilizer_amount: "",
  pesticide_usage: "",
  sunlight_hours: "",
  nitrogen_content: "",
  phosphorus_content: "",
  potassium_content: "",
  irrigation_frequency: "",
};

const NUMBER_FIELDS = [
  { name: "soil_ph", label: "Soil pH", step: "0.01" },
  { name: "soil_moisture", label: "Soil Moisture (%)", step: "0.01" },
  { name: "avg_temperature", label: "Avg Temperature (°C)", step: "0.01" },
  { name: "total_rainfall", label: "Total Rainfall (mm)", step: "0.01" },
  { name: "fertilizer_amount", label: "Fertilizer Amount", step: "0.01" },
  { name: "pesticide_usage", label: "Pesticide Usage", step: "0.01" },
  { name: "sunlight_hours", label: "Sunlight Hours", step: "0.01" },
  { name: "nitrogen_content", label: "Nitrogen Content", step: "0.01" },
  { name: "phosphorus_content", label: "Phosphorus Content", step: "0.01" },
  { name: "potassium_content", label: "Potassium Content", step: "0.01" },
  { name: "irrigation_frequency", label: "Irrigation Frequency", step: "1" },
];

const FLAG_STYLES = {
  healthy: "bg-green-100 text-green-800 border-green-300",
  "too high": "bg-red-100 text-red-800 border-red-300",
  "too low": "bg-orange-100 text-orange-800 border-orange-300",
};

const RISK_STYLES = {
  Low: "bg-green-100 text-green-800 border-green-300",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  High: "bg-red-100 text-red-800 border-red-300",
};

const INPUT_CLASS =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400";

export default function Home() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherNote, setWeatherNote] = useState(null);
  const router = useRouter();

  const [savedProfiles, setSavedProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Load all saved fields, so the farmer can pick which one to apply -
    // they may farm more than one field in different regions/crops.
    fetch("http://127.0.0.1:5000/profiles", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setSavedProfiles(data))
      .catch(() => {});
  }, [router]);

  function handleApplyProfile(e) {
    const id = e.target.value;
    setSelectedProfileId(id);
    const profile = savedProfiles.find((p) => String(p.id) === id);
    if (!profile) return;

    setForm((prev) => ({
      ...prev,
      crop_type: profile.crop_type || prev.crop_type,
      region: profile.region || prev.region,
      soil_ph: profile.soil_ph ?? prev.soil_ph,
      nitrogen_content: profile.nitrogen_content ?? prev.nitrogen_content,
      phosphorus_content: profile.phosphorus_content ?? prev.phosphorus_content,
      potassium_content: profile.potassium_content ?? prev.potassium_content,
    }));
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleFetchWeather() {
    setWeatherLoading(true);
    setWeatherNote(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://127.0.0.1:5000/live-weather?region=${form.region}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.live_temperature !== null && data.live_temperature !== undefined) {
        setForm((prev) => ({
          ...prev,
          avg_temperature: data.live_temperature,
        }));
        setWeatherNote(
          `Live temperature for ${data.city_used}: ${data.live_temperature}°C`
        );
      } else {
        setWeatherNote("Could not fetch live weather - enter it manually.");
      }
    } catch (err) {
      setWeatherNote("Could not fetch live weather - enter it manually.");
    } finally {
      setWeatherLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    // convert numeric fields from string -> number before sending
    const payload = { ...form };
    for (const { name } of NUMBER_FIELDS) {
      payload[name] = parseFloat(payload[name]);
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <Sidebar />
      <div className="flex-1 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-heading text-3xl font-semibold text-earth-900 mb-1">
          Predict Yield
        </h1>
        <p className="text-earth-900/60 mb-8">
          Enter your field&apos;s conditions to get a yield prediction and
          farming insight.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-earth-100 p-6 shadow-lg shadow-earth-900/5 hover:shadow-xl transition-shadow duration-300"
        >
          {savedProfiles.length > 0 && (
            <div className="mb-5">
              <label className="block text-sm font-medium text-earth-900/80 mb-1">
                Apply Saved Field
              </label>
              <select
                value={selectedProfileId}
                onChange={handleApplyProfile}
                className={INPUT_CLASS}
              >
                <option value="">— Select a saved field —</option>
                {savedProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.field_name} ({p.crop_type}, {p.region})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Crop Type
              </label>
              <select
                name="crop_type"
                value={form.crop_type}
                onChange={handleChange}
                className={INPUT_CLASS}
              >
                {CROP_TYPES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Region
              </label>
              <select
                name="region"
                value={form.region}
                onChange={handleChange}
                className={INPUT_CLASS}
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Season
              </label>
              <select
                name="season"
                value={form.season}
                onChange={handleChange}
                className={INPUT_CLASS}
              >
                {SEASONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Harvest Date
              </label>
              <input
                type="date"
                name="harvest_date"
                value={form.harvest_date}
                onChange={handleChange}
                className={INPUT_CLASS}
              />
            </div>

            {NUMBER_FIELDS.map(({ name, label, step }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  {label}
                </label>
                <input
                  type="number"
                  step={step}
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  required
                  className={INPUT_CLASS}
                />
              </div>
            ))}
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={handleFetchWeather}
              disabled={weatherLoading}
              className="text-sm font-medium text-green-700 hover:text-green-800 disabled:opacity-60"
            >
              {weatherLoading
                ? "Fetching..."
                : "📍 Fetch Live Weather for this Region"}
            </button>
            {weatherNote && (
              <p className="text-xs text-zinc-500 mt-1">{weatherNote}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-gradient-to-r from-brand-700 to-brand-600 text-white font-medium py-2.5 shadow-md shadow-brand-700/30 hover:shadow-lg hover:shadow-brand-700/40 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {loading ? "Predicting..." : "Predict Yield"}
          </button>
        </form>

        {error && (
          <div className="mt-6 rounded-lg border border-red-300 bg-red-50 text-red-800 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-6">
            <div className="relative bg-gradient-to-br from-white to-brand-50 rounded-2xl border border-earth-100 p-8 shadow-xl shadow-brand-900/10 text-center overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-400 via-brand-600 to-brand-800" />
              <p className="text-sm text-earth-900/50 mb-1 tracking-wide uppercase text-xs font-medium">
                Predicted Yield
              </p>
              <p className="text-5xl font-heading font-bold text-brand-700 drop-shadow-sm">
                {result.predicted_yield}
                <span className="text-2xl text-brand-700/60 font-normal ml-1">t/ha</span>
              </p>
              {result.risk_level && (
                <span
                  className={`inline-block mt-4 rounded-full border px-4 py-1.5 text-xs font-semibold shadow-sm ${
                    RISK_STYLES[result.risk_level] ||
                    "bg-zinc-100 text-zinc-800 border-zinc-300"
                  }`}
                >
                  {result.risk_level} Risk
                </span>
              )}
            </div>

            {result.typical_yield_for_crop && (
              <YieldChart
                predictedYield={result.predicted_yield}
                typicalYield={result.typical_yield_for_crop}
                cropType={form.crop_type}
              />
            )}

            {result.soil_ranges && (
              <SoilChart field={form} soilRanges={result.soil_ranges} />
            )}

            <div className="bg-white rounded-2xl border border-earth-100 p-6 shadow-lg shadow-earth-900/5 hover:shadow-xl transition-shadow duration-300">
              <h2 className="font-heading text-lg font-semibold text-earth-900 mb-4">
                Soil Health
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(result.soil_flags).map(([key, value]) => (
                  <div
                    key={key}
                    className={`rounded-lg border px-3 py-2 text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
                      FLAG_STYLES[value] || "bg-zinc-100 text-zinc-800 border-zinc-300"
                    }`}
                  >
                    <p className="font-medium capitalize">
                      {key.replace(/_/g, " ")}
                    </p>
                    <p className="capitalize">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-earth-100 p-6 shadow-lg shadow-earth-900/5 hover:shadow-xl transition-shadow duration-300">
              <h2 className="font-heading text-lg font-semibold text-earth-900 mb-4">
                Weather Context
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-zinc-500">Your Temperature</p>
                  <p className="font-medium text-zinc-900">
                    {form.avg_temperature} °C
                  </p>
                  <p className="text-zinc-400 text-xs mt-1">
                    Typical: {result.weather_context.typical_avg_temperature} °C
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500">Your Rainfall</p>
                  <p className="font-medium text-zinc-900">
                    {form.total_rainfall} mm
                  </p>
                  <p className="text-zinc-400 text-xs mt-1">
                    Typical: {result.weather_context.typical_total_rainfall} mm
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-earth-900 to-brand-800 rounded-2xl p-6 shadow-xl shadow-earth-900/20">
              <h2 className="font-heading text-lg font-semibold text-brand-200 mb-3 flex items-center gap-2">
                <span>✨</span> AI Insight
              </h2>

              {typeof result.llm_insight === "string" ? (
                <p className="text-earth-50/90 leading-relaxed text-sm">
                  {result.llm_insight}
                </p>
              ) : (
                <div className="space-y-4">
                  {result.llm_insight.summary && (
                    <p className="text-earth-50/90 leading-relaxed text-sm">
                      {result.llm_insight.summary}
                    </p>
                  )}

                  {result.llm_insight.strengths?.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-green-300 mb-1.5 font-semibold">
                        Strengths
                      </p>
                      <ul className="space-y-1">
                        {result.llm_insight.strengths.map((s, i) => (
                          <li key={i} className="text-earth-50/80 text-sm flex gap-2">
                            <span className="text-green-400">✓</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.llm_insight.concerns?.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-orange-300 mb-1.5 font-semibold">
                        Concerns
                      </p>
                      <ul className="space-y-1">
                        {result.llm_insight.concerns.map((c, i) => (
                          <li key={i} className="text-earth-50/80 text-sm flex gap-2">
                            <span className="text-orange-400">⚠</span> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.llm_insight.actions?.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-brand-200 mb-1.5 font-semibold">
                        Recommended Actions
                      </p>
                      <ul className="space-y-1">
                        {result.llm_insight.actions.map((a, i) => (
                          <li key={i} className="text-earth-50/80 text-sm flex gap-2">
                            <span className="text-brand-300">→</span> {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}