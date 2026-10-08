"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SoilChart from "../components/SoilChart";
import YieldChart from "../components/YieldChart";
import Sidebar from "../components/Sidebar";
import { CROP_IMAGES } from "@/lib/cropImages";
import { useLang } from "@/lib/i18n";

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
  field_size_hectares: "",
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
  "w-full rounded-lg border border-cream-200 bg-white px-4 py-3 text-base text-charcoal-900 placeholder:text-charcoal-900/30 shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-lime-500 transition-shadow";

const SOIL_LABELS = {
  soil_ph: "Soil pH",
  soil_moisture: "Moisture",
  nitrogen_content: "Nitrogen",
  phosphorus_content: "Phosphorus",
  potassium_content: "Potassium",
};

export default function Home() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherNote, setWeatherNote] = useState(null);
  const router = useRouter();
  const { t } = useLang();

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
      field_size_hectares: profile.field_size_hectares ?? prev.field_size_hectares,
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
        setWeatherNote({
          text: "Live temperature for {city}: {temp}°C",
          vars: { city: data.city_used, temp: data.live_temperature },
        });
      } else {
        setWeatherNote({ text: "Could not fetch live weather - enter it manually." });
      }
    } catch (err) {
      setWeatherNote({ text: "Could not fetch live weather - enter it manually." });
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
    // Field size isn't a model input - it's only used below to turn the
    // per-hectare prediction into an estimated total.
    delete payload.field_size_hectares;
    // Links this prediction to the saved field it was made for, so Compare
    // Fields shows the right "latest prediction" per field. The backend
    // verifies the field belongs to the logged-in user.
    payload.profile_id = selectedProfileId ? Number(selectedProfileId) : null;

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
      // Saved so the chatbot (ChatWidget) can discuss the prediction just made.
      localStorage.setItem("last_prediction", JSON.stringify({ inputs: payload, result: data }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream-50 flex">
      <Sidebar />
      <div className="flex-1 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-heading text-4xl font-bold text-charcoal-900 mb-2">
          {t("Predict Yield")}
        </h1>
        <p className="text-charcoal-900/60 text-lg mb-10">
          {t("Enter your field's conditions to get a yield prediction and farming insight.")}
        </p>

        <div className="mb-6">
          <p className="text-base font-medium text-charcoal-900/80 mb-3">
            {t("Select Crop")}
          </p>
          <div className="grid grid-cols-5 gap-3">
            {CROP_TYPES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, crop_type: c }))}
                className={`rounded-2xl overflow-hidden border-2 transition-all ${
                  form.crop_type === c
                    ? "border-lime-500 shadow-md"
                    : "border-cream-200 hover:border-cream-200/80"
                }`}
              >
                <div className="h-20 bg-cream-100 overflow-hidden">
                  <img
                    src={CROP_IMAGES[c] || ""}
                    alt={c}
                    className="h-full w-full object-cover"
                  />
                </div>
                <p
                  className={`text-sm font-medium text-center py-1.5 ${
                    form.crop_type === c
                      ? "bg-lime-400 text-charcoal-900"
                      : "bg-white text-charcoal-900/70"
                  }`}
                >
                  {t(c)}
                </p>
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-cream-200 p-6 shadow-lg shadow-charcoal-900/5 hover:shadow-xl transition-shadow duration-300"
        >
          {savedProfiles.length > 0 && (
            <div className="mb-5">
              <label className="block text-base font-medium text-charcoal-900/80 mb-1.5">
                {t("Apply Saved Field")}
              </label>
              <select
                value={selectedProfileId}
                onChange={handleApplyProfile}
                className={INPUT_CLASS}
              >
                <option value="">{t("— Select a saved field —")}</option>
                {savedProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.field_name} ({t(p.crop_type)}, {t(p.region)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-medium text-charcoal-900/80 mb-1.5">
                {t("Region")}
              </label>
              <select
                name="region"
                value={form.region}
                onChange={handleChange}
                className={INPUT_CLASS}
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {t(r)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-base font-medium text-charcoal-900/80 mb-1.5">
                {t("Season")}
              </label>
              <select
                name="season"
                value={form.season}
                onChange={handleChange}
                className={INPUT_CLASS}
              >
                {SEASONS.map((s) => (
                  <option key={s} value={s}>
                    {t(s)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-base font-medium text-charcoal-900/80 mb-1.5">
                {t("Harvest Date")}
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
                <label className="block text-base font-medium text-charcoal-900/80 mb-1.5">
                  {t(label)}
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
            <label className="block text-base font-medium text-charcoal-900/80 mb-1.5">
              {t("Field Size (hectares)")} <span className="text-charcoal-900/40 font-normal">{t("- optional, for total production estimate")}</span>
            </label>
            <input
              type="number"
              step="0.01"
              name="field_size_hectares"
              placeholder={t("e.g. 12.5")}
              value={form.field_size_hectares}
              onChange={handleChange}
              className={INPUT_CLASS}
            />
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={handleFetchWeather}
              disabled={weatherLoading}
              className="text-sm font-medium text-green-700 hover:text-green-800 disabled:opacity-60"
            >
              {weatherLoading
                ? t("Fetching...")
                : t("📍 Fetch Live Weather for this Region")}
            </button>
            {weatherNote && (
              <p className="text-xs text-zinc-500 mt-1">{t(weatherNote.text, weatherNote.vars)}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-full bg-lime-400 text-charcoal-900 font-semibold py-3 shadow-md hover:bg-lime-500 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {loading ? t("Predicting...") : t("Predict Yield")}
          </button>
        </form>

        {error && (
          <div className="mt-6 rounded-lg border border-red-300 bg-red-50 text-red-800 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-6">
            <div className="relative bg-white rounded-3xl border border-cream-200 p-8 shadow-xl shadow-charcoal-900/5 text-center overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-lime-400" />
              <p className="text-charcoal-900/40 mb-1 tracking-wide uppercase text-xs font-medium">
                {t("Predicted Yield")}
              </p>
              <p className="text-5xl font-heading font-bold text-charcoal-900">
                {result.predicted_yield}
                <span className="text-2xl text-charcoal-900/40 font-normal ml-1">t/ha</span>
              </p>
              {parseFloat(form.field_size_hectares) > 0 && (
                <p className="mt-3 text-base text-charcoal-900/70">
                  {t("Estimated total production:")}{" "}
                  <span className="font-semibold text-charcoal-900">
                    {(result.predicted_yield * parseFloat(form.field_size_hectares)).toFixed(1)} {t("tonnes")}
                  </span>{" "}
                  {t("over {ha} ha", { ha: parseFloat(form.field_size_hectares) })}
                </p>
              )}
              {result.risk_level && (
                <span
                  className={`inline-block mt-4 rounded-full border px-4 py-1.5 text-xs font-semibold shadow-sm ${
                    RISK_STYLES[result.risk_level] ||
                    "bg-zinc-100 text-zinc-800 border-zinc-300"
                  }`}
                >
                  {t("{risk} risk", { risk: t(result.risk_level) })}
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

            <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-lg shadow-charcoal-900/5 hover:shadow-xl transition-shadow duration-300">
              <h2 className="font-heading text-xl font-bold text-charcoal-900 mb-4">
                {t("Soil Health")}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(result.soil_flags).map(([key, value]) => (
                  <div
                    key={key}
                    className={`rounded-lg border px-3 py-2 text-base shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
                      FLAG_STYLES[value] || "bg-zinc-100 text-zinc-800 border-zinc-300"
                    }`}
                  >
                    <p className="font-medium capitalize">
                      {t(SOIL_LABELS[key] || key.replace(/_/g, " "))}
                    </p>
                    <p className="capitalize">{t(value)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-lg shadow-charcoal-900/5 hover:shadow-xl transition-shadow duration-300">
              <h2 className="font-heading text-xl font-bold text-charcoal-900 mb-4">
                {t("Weather Context")}
              </h2>
              <div className="grid grid-cols-2 gap-4 text-base">
                <div>
                  <p className="text-zinc-500">{t("Your Temperature")}</p>
                  <p className="font-medium text-zinc-900">
                    {form.avg_temperature} °C
                  </p>
                  <p className="text-zinc-400 text-xs mt-1">
                    {t("Typical: {value} °C", { value: result.weather_context?.typical_avg_temperature ?? "-" })}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500">{t("Your Rainfall")}</p>
                  <p className="font-medium text-zinc-900">
                    {form.total_rainfall} mm
                  </p>
                  <p className="text-zinc-400 text-xs mt-1">
                    {t("Typical: {value} mm", { value: result.weather_context?.typical_total_rainfall ?? "-" })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-olive-700 rounded-3xl p-6 shadow-xl shadow-charcoal-900/10">
              <h2 className="font-heading text-lg font-semibold text-lime-400 mb-3 flex items-center gap-2">
                <span>✨</span> {t("AI Insight")}
              </h2>

              {typeof result.llm_insight === "string" ? (
                <p className="text-cream-50/90 leading-relaxed text-sm">
                  {result.llm_insight}
                </p>
              ) : (
                <div className="space-y-4">
                  {result.llm_insight.summary && (
                    <p className="text-cream-50/90 leading-relaxed text-sm">
                      {result.llm_insight.summary}
                    </p>
                  )}

                  {result.llm_insight.strengths?.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-green-300 mb-1.5 font-semibold">
                        {t("Strengths")}
                      </p>
                      <ul className="space-y-1">
                        {result.llm_insight.strengths.map((s, i) => (
                          <li key={i} className="text-cream-50/80 text-sm flex gap-2">
                            <span className="text-green-400">✓</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.llm_insight.concerns?.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-orange-300 mb-1.5 font-semibold">
                        {t("Concerns")}
                      </p>
                      <ul className="space-y-1">
                        {result.llm_insight.concerns.map((c, i) => (
                          <li key={i} className="text-cream-50/80 text-sm flex gap-2">
                            <span className="text-orange-400">⚠</span> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.llm_insight.actions?.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-lime-400 mb-1.5 font-semibold">
                        {t("Recommended Actions")}
                      </p>
                      <ul className="space-y-1">
                        {result.llm_insight.actions.map((a, i) => (
                          <li key={i} className="text-cream-50/80 text-sm flex gap-2">
                            <span className="text-lime-500">→</span> {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Link
              href="/assistant"
              className="block rounded-2xl border border-lime-500 bg-lime-300/30 px-5 py-4 text-center text-base font-medium text-olive-800 hover:bg-lime-300/60 transition-colors"
            >
              {t("💬 Ask the assistant about this result")}
            </Link>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
