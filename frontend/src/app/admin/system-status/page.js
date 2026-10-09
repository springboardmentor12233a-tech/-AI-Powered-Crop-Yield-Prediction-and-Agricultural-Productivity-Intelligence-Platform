"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import { getToken, getRole } from "@/lib/auth";
import { useT } from "@/lib/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

const STATUS_ICONS = {
  operational: "✅",
  degraded: "⚠️",
  down: "❌",
  not_configured: "⚪",
};

const STATUS_COLORS = {
  operational: "text-green-700 bg-green-50 border-green-200",
  degraded: "text-amber-700 bg-amber-50 border-amber-200",
  down: "text-red-700 bg-red-50 border-red-200",
  not_configured: "text-zinc-700 bg-zinc-50 border-zinc-200",
};

export default function AdminSystemStatusPage() {
  const t = useT();
  const router = useRouter();

  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    if (getRole() !== "admin") {
      router.push("/dashboard");
      return;
    }
    runDiagnostics();
  }, [router]);

  async function runDiagnostics() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/admin/system-status`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Diagnostics failed");
      setStatusData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const s = statusData?.services || {};

  return (
    <div className="min-h-screen bg-cream-50 flex">
      <Sidebar />
      <div className="flex-1 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="font-heading text-3xl font-bold text-charcoal-900">
                {t("System Status & Live Diagnostics")}
              </h1>
              <p className="text-charcoal-900/60 mt-1">
                {t("Real-time operational health across database, XGBoost model, Groq LLM, and external APIs.")}
              </p>
            </div>
            <button
              onClick={runDiagnostics}
              disabled={loading}
              className="rounded-full bg-olive-700 px-5 py-2 text-sm font-semibold text-lime-400 hover:bg-olive-800 transition-colors shadow disabled:opacity-50"
            >
              🔄 {loading ? t("Pinging...") : t("Run Live Check")}
            </button>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 mb-6">{error}</p>}

          {/* Overall Health Pill */}
          {statusData && (
            <div
              className={`rounded-2xl border p-4 mb-6 flex items-center justify-between ${
                statusData.status === "healthy"
                  ? "bg-green-50 border-green-300 text-green-900"
                  : "bg-amber-50 border-amber-300 text-amber-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {statusData.status === "healthy" ? "🛡️" : "⚠️"}
                </span>
                <div>
                  <p className="font-bold text-base">
                    {statusData.status === "healthy"
                      ? t("All Core Systems Operational")
                      : t("Degraded Performance Detected")}
                  </p>
                  <p className="text-xs opacity-80">
                    {t("Last verification timestamp:")} {statusData.checked_at}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Subsystems Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Database */}
            <div className="bg-white rounded-2xl border border-cream-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🗄️</span>
                  <h3 className="font-heading font-semibold text-charcoal-900">{t("Database")}</h3>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
                    STATUS_COLORS[s.database?.status] || ""
                  }`}
                >
                  {STATUS_ICONS[s.database?.status]} {s.database?.status}
                </span>
              </div>
              <p className="text-xs text-charcoal-900/70">{s.database?.details || "Checking..."}</p>
              {s.database?.latency_ms != null && (
                <p className="text-[11px] font-mono text-charcoal-900/40 mt-3">
                  Latency: {s.database?.latency_ms} ms
                </p>
              )}
            </div>

            {/* ML Model */}
            <div className="bg-white rounded-2xl border border-cream-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🤖</span>
                  <h3 className="font-heading font-semibold text-charcoal-900">{t("XGBoost Model")}</h3>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
                    STATUS_COLORS[s.model?.status] || ""
                  }`}
                >
                  {STATUS_ICONS[s.model?.status]} {s.model?.status}
                </span>
              </div>
              <p className="text-xs text-charcoal-900/70">{s.model?.details || "Checking..."}</p>
              {s.model?.latency_ms != null && (
                <p className="text-[11px] font-mono text-charcoal-900/40 mt-3">
                  Inference latency: {s.model?.latency_ms} ms
                </p>
              )}
            </div>

            {/* Groq AI */}
            <div className="bg-white rounded-2xl border border-cream-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  <h3 className="font-heading font-semibold text-charcoal-900">{t("Groq GenAI")}</h3>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
                    STATUS_COLORS[s.groq?.status] || ""
                  }`}
                >
                  {STATUS_ICONS[s.groq?.status]} {s.groq?.status}
                </span>
              </div>
              <p className="text-xs text-charcoal-900/70">{s.groq?.details || "Checking..."}</p>
              {s.groq?.latency_ms != null && (
                <p className="text-[11px] font-mono text-charcoal-900/40 mt-3">
                  API latency: {s.groq?.latency_ms} ms
                </p>
              )}
            </div>

            {/* OpenWeather */}
            <div className="bg-white rounded-2xl border border-cream-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⛅</span>
                  <h3 className="font-heading font-semibold text-charcoal-900">{t("OpenWeather")}</h3>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
                    STATUS_COLORS[s.openweather?.status] || ""
                  }`}
                >
                  {STATUS_ICONS[s.openweather?.status]} {s.openweather?.status}
                </span>
              </div>
              <p className="text-xs text-charcoal-900/70">{s.openweather?.details || "Checking..."}</p>
              {s.openweather?.latency_ms != null && (
                <p className="text-[11px] font-mono text-charcoal-900/40 mt-3">
                  API latency: {s.openweather?.latency_ms} ms
                </p>
              )}
            </div>

            {/* Rate Limiting */}
            <div className="bg-white rounded-2xl border border-cream-200 p-5 shadow-sm md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔒</span>
                  <h3 className="font-heading font-semibold text-charcoal-900">{t("Rate Limiter & Security")}</h3>
                </div>
                <span className="rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize bg-green-50 text-green-700 border-green-200">
                  ✅ Active
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-charcoal-900/70 mt-2">
                <p>Storage: <code className="font-mono bg-cream-100 px-1 py-0.5 rounded">{s.rate_limiter?.backend}</code></p>
                <p>Throttling rule: <code className="font-mono bg-cream-100 px-1 py-0.5 rounded">{s.rate_limiter?.rule}</code></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}