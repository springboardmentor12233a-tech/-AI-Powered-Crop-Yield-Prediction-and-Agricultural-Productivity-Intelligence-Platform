"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import { getToken, getRole } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { downloadCSV } from "@/lib/csv";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
const REGIONS = ["All", "North", "South", "East", "West", "Central"];

const STATUS_BADGES = {
  Optimal: "bg-green-100 text-green-800 border-green-300",
  Attention: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Critical: "bg-red-100 text-red-800 border-red-300",
};

export default function AdminFieldsPage() {
  const t = useT();
  const router = useRouter();

  const [fields, setFields] = useState([]);
  const [insights, setInsights] = useState([]);
  const [regionalCounts, setRegionalCounts] = useState({});
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [search, setSearch] = useState("");
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

    fetch(`${API_URL}/admin/fields`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setFields(data.fields || []);
        setInsights(data.insights || []);
        setRegionalCounts(data.regional_counts || {});
      })
      .catch(() => setError("Could not load fields data."))
      .finally(() => setLoading(false));
  }, [router]);

  const visible = fields.filter((f) => {
    if (selectedRegion !== "All" && f.region !== selectedRegion) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        f.field_name?.toLowerCase().includes(q) ||
        f.user_name?.toLowerCase().includes(q) ||
        f.crop_type?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  function exportCSV() {
    const rows = visible.map((f) => ({
      ID: f.id,
      "Field Name": f.field_name,
      Farmer: f.user_name,
      Email: f.user_email,
      Region: f.region,
      Crop: f.crop_type,
      "Size (ha)": f.field_size_hectares || "",
      "Soil pH": f.soil_ph,
      Nitrogen: f.nitrogen_content,
      Phosphorus: f.phosphorus_content,
      Potassium: f.potassium_content,
      Status: f.status,
      Issues: f.issues.map((i) => `${i.parameter} (${i.status})`).join("; "),
    }));
    downloadCSV("agrivantage_fields_soil_analysis.csv", rows);
  }

  return (
    <div className="min-h-screen bg-cream-50 flex">
      <Sidebar />
      <div className="flex-1 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="font-heading text-3xl font-bold text-charcoal-900">
                {t("Saved Fields & Regional Soil Intelligence")}
              </h1>
              <p className="text-charcoal-900/60 mt-1">
                {t("Cross-user visibility into farmer field health and nutrient deficiencies by region.")}
              </p>
            </div>
            <button
              onClick={exportCSV}
              disabled={visible.length === 0}
              className="rounded-full bg-olive-700 px-5 py-2.5 text-sm font-semibold text-lime-400 hover:bg-olive-800 transition-colors shadow-sm disabled:opacity-50"
            >
              📥 {t("Export Fields CSV")}
            </button>
          </div>

          {/* Regional Deficiency Insights Banner */}
          {insights.length > 0 && (
            <div className="bg-white rounded-2xl border border-cream-200 p-5 shadow-sm mb-6">
              <h2 className="font-heading font-semibold text-charcoal-900 mb-2 flex items-center gap-2">
                <span>🧪</span> {t("Regional Soil Deficiency Insights")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs font-medium text-amber-900"
                  >
                    ⚠️ {insight}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <input
              type="text"
              placeholder={t("Filter by field, farmer, or crop...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-charcoal-900 flex-1 min-w-56"
            />
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-charcoal-900"
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r === "All" ? t("All Regions") : t(r)}
                </option>
              ))}
            </select>
          </div>

          {loading && <p className="text-charcoal-900/50">{t("Loading fields...")}</p>}
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}

          {!loading && visible.length === 0 && (
            <div className="bg-white rounded-2xl border border-cream-200 p-8 text-center text-charcoal-900/50">
              {t("No fields found matching criteria.")}
            </div>
          )}

          {/* Table */}
          {visible.length > 0 && (
            <div className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-olive-700 text-lime-400">
                    <th className="px-4 py-3 font-semibold">{t("Field Name")}</th>
                    <th className="px-4 py-3 font-semibold">{t("Farmer")}</th>
                    <th className="px-4 py-3 font-semibold">{t("Region")}</th>
                    <th className="px-4 py-3 font-semibold">{t("Crop")}</th>
                    <th className="px-4 py-3 font-semibold">pH</th>
                    <th className="px-4 py-3 font-semibold">N</th>
                    <th className="px-4 py-3 font-semibold">P</th>
                    <th className="px-4 py-3 font-semibold">K</th>
                    <th className="px-4 py-3 font-semibold">{t("Health")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {visible.map((f, i) => (
                    <tr
                      key={f.id}
                      className={`hover:bg-cream-100/60 ${i % 2 === 0 ? "bg-white" : "bg-cream-50/50"}`}
                    >
                      <td className="px-4 py-3 font-medium text-charcoal-900">
                        {f.field_name}
                        {f.field_size_hectares && (
                          <span className="block text-xs text-charcoal-900/40">
                            {f.field_size_hectares} ha
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-charcoal-900">{f.user_name}</p>
                        <p className="text-xs text-charcoal-900/40">{f.user_email}</p>
                      </td>
                      <td className="px-4 py-3 text-charcoal-900/80">{f.region || "—"}</td>
                      <td className="px-4 py-3 font-medium text-charcoal-900">{f.crop_type || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs">{f.soil_ph ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs">{f.nitrogen_content ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs">{f.phosphorus_content ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs">{f.potassium_content ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                            STATUS_BADGES[f.status]
                          }`}
                        >
                          {f.status}
                        </span>
                        {f.issues.length > 0 && (
                          <span className="block text-[11px] text-red-600 mt-1">
                            {f.issues.map((x) => `${x.parameter} ${x.status}`).join(", ")}
                          </span>
                        )}
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