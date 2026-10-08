"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import { getToken, getUser } from "@/lib/auth";
import { downloadCSV } from "@/lib/csv";
import { useLang } from "@/lib/i18n";

const STATUS_STYLES = {
  healthy: "bg-green-100 text-green-800 border-green-300",
  "too low": "bg-orange-100 text-orange-800 border-orange-300",
  "too high": "bg-red-100 text-red-800 border-red-300",
  unknown: "bg-zinc-100 text-zinc-600 border-zinc-300",
};

const RISK_STYLES = {
  Low: "bg-green-100 text-green-800 border-green-300",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  High: "bg-red-100 text-red-800 border-red-300",
};

const SOIL_ROWS = [
  { key: "soil_ph", label: "Soil pH" },
  { key: "nitrogen_content", label: "Nitrogen" },
  { key: "phosphorus_content", label: "Phosphorus" },
  { key: "potassium_content", label: "Potassium" },
];

function Chip({ text, styles }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${styles}`}
    >
      {text}
    </span>
  );
}

export default function ComparePage() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // English message, translated when shown
  const router = useRouter();
  const { t } = useLang();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    if (getUser()?.role === "admin") {
      router.push("/admin");
      return;
    }

    fetch("http://127.0.0.1:5000/reports/compare-fields", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setFields(data);
        else setError("Could not load your fields - try logging in again.");
      })
      .catch(() => setError("Could not load the comparison."))
      .finally(() => setLoading(false));
  }, [router]);

  const bestScore = Math.max(0, ...fields.map((f) => f.healthy_count));

  // CSV stays in English so exported data is consistent in every language.
  function exportCSV() {
    downloadCSV(
      "field-comparison.csv",
      fields.map((f) => ({
        field: f.field_name,
        crop: f.crop_type,
        region: f.region,
        size_hectares: f.field_size_hectares ?? "",
        soil_ph: f.soil.soil_ph.value ?? "",
        soil_ph_status: f.soil.soil_ph.status,
        nitrogen: f.soil.nitrogen_content.value ?? "",
        nitrogen_status: f.soil.nitrogen_content.status,
        phosphorus: f.soil.phosphorus_content.value ?? "",
        phosphorus_status: f.soil.phosphorus_content.status,
        potassium: f.soil.potassium_content.value ?? "",
        potassium_status: f.soil.potassium_content.status,
        healthy_soil_values: `${f.healthy_count}/${f.checked_count}`,
        typical_yield_t_ha: f.typical_yield ?? "",
        latest_predicted_yield_t_ha: f.latest_prediction?.predicted_yield ?? "",
        latest_risk: f.latest_prediction?.risk_level ?? "",
        estimated_production_tonnes: f.estimated_production ?? "",
      }))
    );
  }

  const th = "text-left font-heading font-semibold px-5 py-3.5 min-w-40";
  const label = "px-5 py-3.5 text-charcoal-900/60";

  return (
    <div className="min-h-screen bg-cream-50 flex">
      <Sidebar />
      <div className="flex-1 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="font-heading text-4xl font-bold text-charcoal-900">
              {t("Compare Fields")}
            </h1>
            {fields.length > 0 && (
              <div className="flex gap-2 print:hidden">
                <button
                  onClick={exportCSV}
                  className="rounded-full border border-cream-200 bg-white px-4 py-2 text-sm font-medium text-charcoal-900/70 hover:bg-cream-100 transition-colors"
                >
                  {t("Download CSV")}
                </button>
                <button
                  onClick={() => window.print()}
                  className="rounded-full bg-lime-400 px-4 py-2 text-sm font-semibold text-charcoal-900 shadow-md hover:bg-lime-500 transition-colors"
                >
                  {t("Download PDF")}
                </button>
              </div>
            )}
          </div>
          <p className="text-charcoal-900/60 text-lg mb-10">
            {t("Your saved fields side by side, with soil checked against the healthy range for each crop.")}
          </p>

          {loading && <p className="text-charcoal-900/50 text-sm">{t("Loading...")}</p>}
          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {t(error)}
            </p>
          )}

          {!loading && !error && fields.length < 2 && (
            <div className="bg-white rounded-2xl border border-cream-200 p-8 text-center shadow-lg shadow-charcoal-900/5">
              <p className="text-charcoal-900/60 text-sm mb-4">
                {t("Save at least two fields to compare them.")}
              </p>
              <Link
                href="/profile"
                className="inline-block rounded-full bg-lime-400 px-5 py-2 text-sm font-semibold text-charcoal-900 hover:bg-lime-500 transition-colors"
              >
                {t("Go to Farm Profile")}
              </Link>
            </div>
          )}

          {fields.length >= 2 && (
            <>
              <div className="bg-white rounded-2xl border border-cream-200 shadow-lg shadow-charcoal-900/5 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-olive-700 text-lime-400">
                      <th className="text-left font-heading font-semibold px-5 py-3.5 w-40" />
                      {fields.map((f) => (
                        <th key={f.id} className={th}>
                          {f.field_name}
                          {bestScore > 0 && f.healthy_count === bestScore && (
                            <span className="ml-2 rounded-full bg-lime-400 px-2 py-0.5 text-[11px] font-semibold text-charcoal-900">
                              {t("Best soil")}
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-cream-100">
                      <td className={label}>{t("Crop")}</td>
                      {fields.map((f) => (
                        <td key={f.id} className="px-5 py-3.5 font-medium text-charcoal-900">
                          {t(f.crop_type)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-cream-100 bg-cream-100/30">
                      <td className={label}>{t("Region")}</td>
                      {fields.map((f) => (
                        <td key={f.id} className="px-5 py-3.5 text-charcoal-900/80">
                          {t(f.region)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-cream-100">
                      <td className={label}>{t("Size")}</td>
                      {fields.map((f) => (
                        <td key={f.id} className="px-5 py-3.5 text-charcoal-900/80">
                          {f.field_size_hectares != null ? `${f.field_size_hectares} ha` : "-"}
                        </td>
                      ))}
                    </tr>

                    {SOIL_ROWS.map(({ key, label: soilLabel }, i) => (
                      <tr
                        key={key}
                        className={`border-t border-cream-100 ${i % 2 === 0 ? "bg-cream-100/30" : ""}`}
                      >
                        <td className={label}>{t(soilLabel)}</td>
                        {fields.map((f) => {
                          const s = f.soil[key];
                          return (
                            <td key={f.id} className="px-5 py-3.5">
                              <p className="font-medium text-charcoal-900 mb-1">
                                {s.value ?? "-"}
                              </p>
                              <Chip
                                text={t(s.status)}
                                styles={STATUS_STYLES[s.status] || STATUS_STYLES.unknown}
                              />
                              {s.low != null && (
                                <p className="text-xs text-charcoal-900/40 mt-1">
                                  {t("healthy {low} – {high}", { low: s.low, high: s.high })}
                                </p>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    <tr className="border-t border-cream-100">
                      <td className={label}>{t("Healthy soil values")}</td>
                      {fields.map((f) => (
                        <td key={f.id} className="px-5 py-3.5 font-semibold text-olive-700">
                          {f.healthy_count} / {f.checked_count}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-cream-100 bg-cream-100/30">
                      <td className={label}>{t("Typical yield")}</td>
                      {fields.map((f) => (
                        <td key={f.id} className="px-5 py-3.5 text-charcoal-900/80">
                          {f.typical_yield != null ? `${f.typical_yield} t/ha` : "-"}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-cream-100">
                      <td className={label}>{t("Latest prediction")}</td>
                      {fields.map((f) => (
                        <td key={f.id} className="px-5 py-3.5">
                          {f.latest_prediction ? (
                            <>
                              <p className="font-medium text-charcoal-900 mb-1">
                                {f.latest_prediction.predicted_yield} t/ha
                              </p>
                              {f.latest_prediction.risk_level && (
                                <Chip
                                  text={t("{risk} risk", { risk: t(f.latest_prediction.risk_level) })}
                                  styles={
                                    RISK_STYLES[f.latest_prediction.risk_level] ||
                                    STATUS_STYLES.unknown
                                  }
                                />
                              )}
                            </>
                          ) : (
                            <span className="text-charcoal-900/40">{t("None yet")}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-cream-100 bg-cream-100/30">
                      <td className={label}>{t("Est. production")}</td>
                      {fields.map((f) => (
                        <td key={f.id} className="px-5 py-3.5 font-medium text-charcoal-900">
                          {f.estimated_production != null
                            ? `${f.estimated_production} ${t("tonnes")}`
                            : "-"}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-charcoal-900/40 mt-3">
                {t("Soil moisture isn't saved with a field, so it isn't compared here. The latest prediction is the most recent one made for that field. Healthy ranges come from this app's dataset, not universal agronomy standards.")}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
