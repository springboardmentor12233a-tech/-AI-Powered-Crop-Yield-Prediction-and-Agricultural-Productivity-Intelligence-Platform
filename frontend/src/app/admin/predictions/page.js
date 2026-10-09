"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import { getToken, getRole } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { downloadCSV } from "@/lib/csv";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

const CROPS = ["All", "Wheat", "Corn", "Rice", "Soybean", "Barley"];
const REGIONS = ["All", "North", "South", "East", "West", "Central"];
const RISKS = ["All", "Low", "Medium", "High"];

const RISK_BADGES = {
  Low: "bg-green-100 text-green-800 border-green-300",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  High: "bg-red-100 text-red-800 border-red-300",
};

const INPUT_CLASS =
  "rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-charcoal-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-lime-500";

export default function AdminPredictionsPage() {
  const t = useT();
  const router = useRouter();

  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("All");
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [selectedRisk, setSelectedRisk] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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

    fetch(`${API_URL}/admin/predictions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setPredictions(data.predictions || []))
      .catch(() => setError("Could not load platform predictions."))
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = predictions.filter((p) => {
    if (selectedCrop !== "All" && p.crop_type !== selectedCrop) return false;
    if (selectedRegion !== "All" && p.region !== selectedRegion) return false;
    if (selectedRisk !== "All" && p.risk_level !== selectedRisk) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchUser = p.user_name?.toLowerCase().includes(q) || p.user_email?.toLowerCase().includes(q);
      const matchField = p.field_name?.toLowerCase().includes(q);
      if (!matchUser && !matchField) return false;
    }

    if (startDate && p.created_at) {
      if (new Date(p.created_at) < new Date(startDate)) return false;
    }
    if (endDate && p.created_at) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (new Date(p.created_at) > end) return false;
    }

    return true;
  });

  function handleExportCSV() {
    const rows = filtered.map((p) => ({
      ID: p.id,
      "Farmer Name": p.user_name,
      "Farmer Email": p.user_email,
      Field: p.field_name,
      Crop: p.crop_type,
      Region: p.region,
      Season: p.season,
      "Predicted Yield (t/ha)": p.predicted_yield,
      "Typical Yield (t/ha)": p.typical_yield_for_crop,
      "Risk Level": p.risk_level,
      Date: p.created_at ? p.created_at.replace("T", " ").slice(0, 19) : "",
    }));

    downloadCSV(`agrivantage_predictions_export_${Date.now()}.csv`, rows);
  }

  return (
    <div className="min-h-screen bg-cream-50 flex">
      <Sidebar />
      <div className="flex-1 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="font-heading text-3xl font-bold text-charcoal-900">
                {t("Platform Predictions")}
              </h1>
              <p className="text-charcoal-900/60 mt-1">
                {t("Every crop yield prediction made across all farmers. Filter, analyze, and export.")}
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              disabled={filtered.length === 0}
              className="rounded-full bg-olive-700 px-5 py-2.5 text-sm font-semibold text-lime-400 hover:bg-olive-800 transition-colors shadow-sm disabled:opacity-50"
            >
              📥 {t("Export to CSV")} ({filtered.length})
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
            <div className="bg-white rounded-xl border border-cream-200 p-4 shadow-sm">
              <p className="text-xs uppercase text-charcoal-900/40">{t("Total Predictions")}</p>
              <p className="text-2xl font-heading font-bold text-olive-700">{predictions.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-cream-200 p-4 shadow-sm">
              <p className="text-xs uppercase text-charcoal-900/40">{t("Filtered Results")}</p>
              <p className="text-2xl font-heading font-bold text-charcoal-900">{filtered.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-cream-200 p-4 shadow-sm">
              <p className="text-xs uppercase text-charcoal-900/40">{t("High Risk Count")}</p>
              <p className="text-2xl font-heading font-bold text-red-600">
                {predictions.filter((p) => p.risk_level === "High").length}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-cream-200 p-4 shadow-sm">
              <p className="text-xs uppercase text-charcoal-900/40">{t("Active Farmers")}</p>
              <p className="text-2xl font-heading font-bold text-charcoal-900">
                {new Set(predictions.map((p) => p.user_id)).size}
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-cream-200 p-5 shadow-sm mb-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-charcoal-900/70 mb-1">{t("Search")}</label>
                <input
                  type="text"
                  placeholder={t("Farmer name or email...")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`w-full ${INPUT_CLASS}`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal-900/70 mb-1">{t("Crop")}</label>
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className={`w-full ${INPUT_CLASS}`}
                >
                  {CROPS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal-900/70 mb-1">{t("Region")}</label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className={`w-full ${INPUT_CLASS}`}
                >
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal-900/70 mb-1">{t("Risk")}</label>
                <select
                  value={selectedRisk}
                  onChange={(e) => setSelectedRisk(e.target.value)}
                  className={`w-full ${INPUT_CLASS}`}
                >
                  {RISKS.map((rk) => (
                    <option key={rk} value={rk}>{rk}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSelectedCrop("All");
                    setSelectedRegion("All");
                    setSelectedRisk("All");
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="w-full rounded-lg border border-cream-200 bg-cream-100 px-3 py-2 text-xs font-medium text-charcoal-900 hover:bg-cream-200 transition-colors"
                >
                  {t("Reset Filters")}
                </button>
              </div>
            </div>

            {/* Date Filters */}
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-cream-100 text-xs">
              <span className="font-medium text-charcoal-900/60">{t("Date Range:")}</span>
              <div className="flex items-center gap-2">
                <span>{t("From")}</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="flex items-center gap-2">
                <span>{t("To")}</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </div>

          {loading && <p className="text-charcoal-900/50">{t("Loading predictions...")}</p>}
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}

          {!loading && filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-cream-200 p-8 text-center text-charcoal-900/50">
              {t("No predictions matched your current filters.")}
            </div>
          )}

          {/* Table */}
          {filtered.length > 0 && (
            <div className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-olive-700 text-lime-400">
                    <th className="px-4 py-3 font-semibold">{t("ID")}</th>
                    <th className="px-4 py-3 font-semibold">{t("Farmer")}</th>
                    <th className="px-4 py-3 font-semibold">{t("Field")}</th>
                    <th className="px-4 py-3 font-semibold">{t("Crop")}</th>
                    <th className="px-4 py-3 font-semibold">{t("Region / Season")}</th>
                    <th className="px-4 py-3 font-semibold">{t("Predicted Yield")}</th>
                    <th className="px-4 py-3 font-semibold">{t("Risk")}</th>
                    <th className="px-4 py-3 font-semibold">{t("Date")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {filtered.map((p, i) => (
                    <tr
                      key={p.id}
                      className={`hover:bg-cream-100/60 transition-colors ${
                        i % 2 === 0 ? "bg-white" : "bg-cream-50/50"
                      }`}
                    >
                      <td className="px-4 py-3 text-xs text-charcoal-900/50">#{p.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-charcoal-900">{p.user_name}</p>
                        <p className="text-xs text-charcoal-900/50">{p.user_email}</p>
                      </td>
                      <td className="px-4 py-3 text-charcoal-900/80">{p.field_name}</td>
                      <td className="px-4 py-3 font-semibold text-charcoal-900">{p.crop_type}</td>
                      <td className="px-4 py-3 text-xs text-charcoal-900/70">
                        {p.region} · {p.season}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-olive-700">{p.predicted_yield}</span>
                        <span className="text-xs text-charcoal-900/40 ml-1">t/ha</span>
                        {p.typical_yield_for_crop && (
                          <span className="block text-[11px] text-charcoal-900/40">
                            avg {p.typical_yield_for_crop}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                            RISK_BADGES[p.risk_level] || "bg-zinc-100 text-zinc-700 border-zinc-200"
                          }`}
                        >
                          {p.risk_level}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-charcoal-900/60 whitespace-nowrap">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}