"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

export default function Home() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
      const res = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    <div className="min-h-screen bg-zinc-50 py-12 px-4">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold text-zinc-900 mb-1">
          YieldSense AI
        </h1>
        <p className="text-zinc-600 mb-8">
          Enter your field&apos;s conditions to get a yield prediction and
          farming insight.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Crop Type
              </label>
              <select
                name="crop_type"
                value={form.crop_type}
                onChange={handleChange}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
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
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
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
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
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
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
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
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-green-700 text-white font-medium py-2.5 hover:bg-green-800 transition-colors disabled:opacity-60"
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
            <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm text-center">
              <p className="text-sm text-zinc-500 mb-1">Predicted Yield</p>
              <p className="text-4xl font-bold text-green-700">
                {result.predicted_yield} t/ha
              </p>
            </div>

            <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">
                Soil Health
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(result.soil_flags).map(([key, value]) => (
                  <div
                    key={key}
                    className={`rounded-lg border px-3 py-2 text-sm ${
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

            <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">
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

            <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-900 mb-3">
                AI Insight
              </h2>
              <p className="text-zinc-700 leading-relaxed text-sm">
                {result.llm_insight}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}