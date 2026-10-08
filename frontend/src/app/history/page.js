"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { getToken } from "@/lib/auth";
import { downloadCSV } from "@/lib/csv";
import { useLang } from "@/lib/i18n";

const RISK_STYLES = {
  Low: "bg-green-100 text-green-800 border-green-300",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  High: "bg-red-100 text-red-800 border-red-300",
};

const FLAG_STYLES = {
  healthy: "bg-green-100 text-green-800 border-green-300",
  "too high": "bg-red-100 text-red-800 border-red-300",
  "too low": "bg-orange-100 text-orange-800 border-orange-300",
};

const INPUT_LABELS = {
  harvest_date: "Harvest date",
  soil_ph: "Soil pH",
  soil_moisture: "Soil moisture (%)",
  avg_temperature: "Temperature (°C)",
  total_rainfall: "Rainfall (mm)",
  fertilizer_amount: "Fertilizer",
  pesticide_usage: "Pesticide",
  sunlight_hours: "Sunlight hours",
  nitrogen_content: "Nitrogen",
  phosphorus_content: "Phosphorus",
  potassium_content: "Potassium",
  irrigation_frequency: "Irrigation frequency",
};

const SOIL_LABELS = {
  soil_ph: "Soil pH",
  soil_moisture: "Moisture",
  nitrogen_content: "Nitrogen",
  phosphorus_content: "Phosphorus",
  potassium_content: "Potassium",
};

const LOCALE_TAG = { en: "en-US", hi: "hi-IN", kn: "kn-IN", ta: "ta-IN", te: "te-IN" };

// Makes a value safe to paste into the HTML of the PDF export window.
function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(iso, lang) {
  if (!iso) return "-";
  const d = new Date(iso);
  const tag = LOCALE_TAG[lang] || "en-US";
  return (
    d.toLocaleDateString(tag, { year: "numeric", month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString(tag, { hour: "2-digit", minute: "2-digit" })
  );
}

// Same flat row shape used for the bulk CSV export (kept in English on purpose,
// so exported data stays consistent whatever language the app is shown in).
function recordToRow(r) {
  const flags = r.details?.soil_flags || {};
  const inputs = r.details?.inputs || {};
  return {
    date: r.created_at || "",
    crop: r.crop_type,
    region: r.region,
    season: r.season,
    predicted_yield_t_ha: r.predicted_yield,
    typical_yield_t_ha: r.typical_yield_for_crop,
    risk: r.risk_level,
    soil_ph: inputs.soil_ph ?? "",
    soil_ph_status: flags.soil_ph ?? "",
    soil_moisture: inputs.soil_moisture ?? "",
    soil_moisture_status: flags.soil_moisture ?? "",
    nitrogen: inputs.nitrogen_content ?? "",
    nitrogen_status: flags.nitrogen_content ?? "",
    phosphorus: inputs.phosphorus_content ?? "",
    phosphorus_status: flags.phosphorus_content ?? "",
    potassium: inputs.potassium_content ?? "",
    potassium_status: flags.potassium_content ?? "",
    temperature_c: inputs.avg_temperature ?? "",
    rainfall_mm: inputs.total_rainfall ?? "",
  };
}

function DetailPanel({ details, t }) {
  if (!details) {
    return (
      <p className="text-sm text-charcoal-900/50">
        {t("Details weren't saved for this prediction (it was made before history started storing them).")}
      </p>
    );
  }

  const insight = details.llm_insight;
  const isObject = insight && typeof insight === "object";

  return (
    <div className="space-y-5">
      {details.soil_flags && (
        <div>
          <p className="text-xs font-semibold text-charcoal-900/50 mb-2">{t("Soil health")}</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(details.soil_flags).map(([k, v]) => (
              <span
                key={k}
                className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${
                  FLAG_STYLES[v] || "bg-zinc-100 text-zinc-800 border-zinc-300"
                }`}
              >
                {t(SOIL_LABELS[k] || k.replace(/_/g, " "))}: {t(v)}
              </span>
            ))}
          </div>
        </div>
      )}

      {details.inputs && (
        <div>
          <p className="text-xs font-semibold text-charcoal-900/50 mb-2">{t("Inputs entered")}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-sm">
            {Object.entries(INPUT_LABELS).map(([k, label]) =>
              details.inputs[k] !== undefined ? (
                <div key={k}>
                  <p className="text-charcoal-900/50 text-xs">{t(label)}</p>
                  <p className="font-medium text-charcoal-900">{String(details.inputs[k])}</p>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}

      {insight && (
        <div>
          <p className="text-xs font-semibold text-charcoal-900/50 mb-2">{t("AI insight")}</p>
          <p className="text-sm text-charcoal-900/80 mb-2">
            {isObject ? insight.summary : insight}
          </p>
          {isObject && insight.concerns?.length > 0 && (
            <ul className="text-sm text-charcoal-900/70 space-y-1 mb-2">
              {insight.concerns.map((c, i) => (
                <li key={i}>⚠ {c}</li>
              ))}
            </ul>
          )}
          {isObject && insight.actions?.length > 0 && (
            <ul className="text-sm text-charcoal-900/70 space-y-1">
              {insight.actions.map((a, i) => (
                <li key={i}>→ {a}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // English message, translated when shown
  const [openId, setOpenId] = useState(null);
  const router = useRouter();
  const { t, lang } = useLang();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    fetch("http://127.0.0.1:5000/history", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setRecords(Array.isArray(data) ? data : []))
      .catch(() => setError("Could not load prediction history."))
      .finally(() => setLoading(false));
  }, [router]);

  function exportCSV() {
    downloadCSV("prediction-history.csv", records.map(recordToRow));
  }

  function exportRowPDF(r) {
    const flags = r.details?.soil_flags || {};
    const inputs = r.details?.inputs || {};
    const insight = r.details?.llm_insight;
    const insightIsObject = insight && typeof insight === "object";
    const when = formatDate(r.created_at, lang);

    const flagRow = (key) =>
      flags[key]
        ? `<span class="chip ${flags[key] === "healthy" ? "chip-green" : flags[key] === "too high" ? "chip-red" : "chip-orange"}">${esc(t(SOIL_LABELS[key]))}: ${esc(t(flags[key]))}</span>`
        : "";

    const inputsHTML = Object.entries(INPUT_LABELS)
      .filter(([k]) => inputs[k] !== undefined)
      .map(
        ([k, label]) =>
          `<div class="input-cell"><p class="input-label">${esc(t(label))}</p><p class="input-value">${esc(inputs[k])}</p></div>`
      )
      .join("");

    let insightHTML = "";
    if (insight) {
      const summary = esc(insightIsObject ? insight.summary : insight);
      const concerns = insightIsObject && insight.concerns?.length
        ? `<ul>${insight.concerns.map((c) => `<li>⚠ ${esc(c)}</li>`).join("")}</ul>`
        : "";
      const actions = insightIsObject && insight.actions?.length
        ? `<ul>${insight.actions.map((a) => `<li>→ ${esc(a)}</li>`).join("")}</ul>`
        : "";
      insightHTML = `
        <h2>${esc(t("AI insight"))}</h2>
        <p>${summary}</p>
        ${concerns}
        ${actions}
      `;
    }

    const title = t("{crop} prediction", { crop: t(r.crop_type) });

    const html = `
      <html lang="${esc(lang)}">
        <head>
          <meta charset="utf-8" />
          <title>${esc(title)} - ${esc(when)}</title>
          <style>
            body { font-family: -apple-system, "Segoe UI", "Nirmala UI", Arial, sans-serif; color: #1f2317; padding: 32px; max-width: 700px; margin: 0 auto; }
            h1 { font-size: 22px; margin-bottom: 4px; }
            h2 { font-size: 15px; margin-top: 24px; margin-bottom: 8px; color: #4a5936; }
            .meta { color: #666; margin-bottom: 20px; font-size: 13px; }
            .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
            .summary-cell { border: 1px solid #e3dfcd; border-radius: 8px; padding: 10px 12px; }
            .summary-cell p:first-child { font-size: 11px; color: #888; margin: 0 0 4px; text-transform: uppercase; }
            .summary-cell p:last-child { font-size: 16px; font-weight: 600; margin: 0; }
            .chip { display: inline-block; border-radius: 999px; padding: 4px 10px; font-size: 12px; margin: 0 6px 6px 0; border: 1px solid; }
            .chip-green { background: #dcfce7; color: #166534; border-color: #86efac; }
            .chip-red { background: #fee2e2; color: #991b1b; border-color: #fca5a5; }
            .chip-orange { background: #ffedd5; color: #9a3412; border-color: #fdba74; }
            .input-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
            .input-label { font-size: 11px; color: #888; margin: 0; }
            .input-value { font-size: 14px; font-weight: 600; margin: 2px 0 0; }
            ul { margin: 8px 0; padding-left: 20px; font-size: 13px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>${esc(title)}</h1>
          <p class="meta">${esc(when)} · ${esc(t(r.region))} · ${esc(t(r.season))}</p>

          <div class="summary-grid">
            <div class="summary-cell"><p>${esc(t("Predicted"))}</p><p>${esc(r.predicted_yield)} t/ha</p></div>
            <div class="summary-cell"><p>${esc(t("Typical"))}</p><p>${esc(r.typical_yield_for_crop)} t/ha</p></div>
            <div class="summary-cell"><p>${esc(t("Risk"))}</p><p>${esc(r.risk_level ? t(r.risk_level) : "-")}</p></div>
          </div>

          <h2>${esc(t("Soil health"))}</h2>
          <div>
            ${flagRow("soil_ph")}
            ${flagRow("soil_moisture")}
            ${flagRow("nitrogen_content")}
            ${flagRow("phosphorus_content")}
            ${flagRow("potassium_content")}
          </div>

          ${inputsHTML ? `<h2>${esc(t("Inputs entered"))}</h2><div class="input-grid">${inputsHTML}</div>` : ""}

          ${insightHTML}
        </body>
      </html>
    `;

    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.onload = () => {
      win.focus();
      win.print();
    };
  }

  const th = "text-left font-heading font-semibold px-5 py-3.5";

  return (
    <div className="min-h-screen bg-cream-50 flex">
      <Sidebar />
      <div className="flex-1 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="font-heading text-4xl font-bold text-charcoal-900">
            {t("History")}
          </h1>
          {records.length > 0 && (
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
          {t("Every prediction you've made, most recent first. Open a row to see the soil results, inputs and advice.")}
        </p>

        {loading && <p className="text-charcoal-900/50 text-sm">{t("Loading...")}</p>}
        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {t(error)}
          </p>
        )}

        {!loading && !error && records.length === 0 && (
          <div className="bg-white rounded-2xl border border-cream-200 p-8 text-center shadow-lg shadow-charcoal-900/5">
            <p className="text-charcoal-900/60 text-sm">
              {t("No predictions yet. Head to Predict Yield to make your first one.")}
            </p>
          </div>
        )}

        {records.length > 0 && (
          <div className="bg-white rounded-2xl border border-cream-200 shadow-lg shadow-charcoal-900/5 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-olive-700 text-lime-400">
                  <th className={th}>{t("Date")}</th>
                  <th className={th}>{t("Crop")}</th>
                  <th className={th}>{t("Region")}</th>
                  <th className={th}>{t("Season")}</th>
                  <th className={th}>{t("Predicted")}</th>
                  <th className={th}>{t("Typical")}</th>
                  <th className={th}>{t("Risk")}</th>
                  <th className="px-5 py-3.5 print:hidden" />
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  const open = openId === r.id;
                  return (
                    <Fragment key={r.id}>
                      <tr
                        className={`border-t border-cream-100 hover:bg-lime-300/20 transition-colors ${
                          i % 2 === 0 ? "bg-white" : "bg-cream-100/30"
                        }`}
                      >
                        <td className="px-5 py-3.5 text-charcoal-900/70 whitespace-nowrap">
                          {formatDate(r.created_at, lang)}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-charcoal-900">
                          {t(r.crop_type)}
                        </td>
                        <td className="px-5 py-3.5 text-charcoal-900/80">{t(r.region)}</td>
                        <td className="px-5 py-3.5 text-charcoal-900/80">{t(r.season)}</td>
                        <td className="px-5 py-3.5 font-medium text-olive-700 whitespace-nowrap">
                          {r.predicted_yield} t/ha
                        </td>
                        <td className="px-5 py-3.5 text-charcoal-900/60 whitespace-nowrap">
                          {r.typical_yield_for_crop} t/ha
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${
                              RISK_STYLES[r.risk_level] ||
                              "bg-zinc-100 text-zinc-800 border-zinc-300"
                            }`}
                          >
                            {r.risk_level ? t(r.risk_level) : "-"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right print:hidden">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => exportRowPDF(r)}
                              title={t("Download this prediction as PDF, with full details")}
                              className="text-xs font-medium text-charcoal-900/50 hover:text-charcoal-900 whitespace-nowrap"
                            >
                              ⬇ {t("PDF")}
                            </button>
                            <button
                              onClick={() => setOpenId(open ? null : r.id)}
                              className="text-xs font-medium text-olive-700 hover:text-olive-800 whitespace-nowrap"
                            >
                              {open ? t("Hide") : t("Details")}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {open && (
                        <tr className="border-t border-cream-100 bg-cream-50">
                          <td colSpan={8} className="px-5 py-5">
                            <DetailPanel details={r.details} t={t} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
