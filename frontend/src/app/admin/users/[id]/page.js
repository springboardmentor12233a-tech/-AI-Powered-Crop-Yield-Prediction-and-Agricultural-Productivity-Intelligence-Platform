"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "../../../components/Sidebar";
import { getToken, getRole } from "@/lib/auth";
import { useT } from "@/lib/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

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

function formatDate(iso, withTime = false) {
  if (!iso) return "-";
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  return withTime
    ? `${date} ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`
    : date;
}

function formatDay(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function PredictionDetails({ details, t }) {
  if (!details) {
    return (
      <p className="text-sm text-charcoal-900/50">
        {t("Details were not saved for this prediction.")}
      </p>
    );
  }
  const insight = details.llm_insight;
  const insightIsObject = insight && typeof insight === "object";

  return (
    <div className="space-y-4">
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
                {t(k.replace(/_/g, " "))}: {t(v)}
              </span>
            ))}
          </div>
        </div>
      )}
      {insight && (
        <div>
          <p className="text-xs font-semibold text-charcoal-900/50 mb-2">{t("AI insight")}</p>
          <p className="text-sm text-charcoal-900/80 mb-2">{insightIsObject ? insight.summary : insight}</p>
          {insightIsObject && insight.concerns?.length > 0 && (
            <ul className="text-sm text-charcoal-900/70 space-y-1 mb-2">
              {insight.concerns.map((c, i) => (
                <li key={i}>⚠ {c}</li>
              ))}
            </ul>
          )}
          {insightIsObject && insight.actions?.length > 0 && (
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

export default function AdminUserDetailPage() {
  const t = useT();
  const router = useRouter();
  const params = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);

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

    fetch(`${API_URL}/admin/users/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setData)
      .catch(() => setError(t("Could not load this user.")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, params.id]);

  const user = data?.user;
  const profiles = data?.profiles || [];
  const predictions = data?.predictions || [];
  const plans = data?.plans || [];

  const avgYield = predictions.length
    ? (predictions.reduce((s, p) => s + (p.predicted_yield || 0), 0) / predictions.length).toFixed(2)
    : null;
  const highRisk = predictions.filter((p) => p.risk_level === "High").length;
  const lastActive = predictions[0]?.created_at || null;

  const cropCounts = predictions.reduce((acc, p) => {
    if (p.crop_type) acc[p.crop_type] = (acc[p.crop_type] || 0) + 1;
    return acc;
  }, {});

  const th = "text-left font-heading font-semibold px-5 py-3.5";

  return (
    <div className="min-h-screen bg-cream-50 flex">
      <Sidebar />
      <div className="flex-1 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/admin/users"
            className="text-sm font-medium text-olive-700 hover:text-olive-800 mb-4 inline-block"
          >
            ← {t("Back to Users")}
          </Link>

          {loading && <p className="text-charcoal-900/50 text-sm">{t("Loading...")}</p>}
          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          {user && (
            <>
              <div className="flex items-center gap-4 mb-8">
                <div className="h-14 w-14 rounded-full bg-olive-700 text-lime-400 flex items-center justify-center text-xl font-semibold">
                  {user.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <h1 className="font-heading text-3xl font-bold text-charcoal-900">{user.name}</h1>
                  <p className="text-charcoal-900/60">
                    {user.email} · <span className="capitalize">{t(user.role || "")}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-2xl border border-cream-200 p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-charcoal-900/40 mb-1">{t("Saved Fields")}</p>
                  <p className="text-3xl font-heading font-bold text-olive-700">{profiles.length}</p>
                </div>
                <div className="bg-white rounded-2xl border border-cream-200 p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-charcoal-900/40 mb-1">{t("Predictions Made")}</p>
                  <p className="text-3xl font-heading font-bold text-olive-700">{predictions.length}</p>
                  <p className="text-xs text-charcoal-900/40 mt-1">
                    {t("{n} high risk", { n: highRisk })}
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-cream-200 p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-charcoal-900/40 mb-1">{t("Avg Predicted Yield")}</p>
                  <p className="text-3xl font-heading font-bold text-olive-700">
                    {avgYield ?? "-"}
                    {avgYield && <span className="text-sm text-olive-700/60 font-normal ml-1">t/ha</span>}
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-cream-200 p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-charcoal-900/40 mb-1">{t("Last active")}</p>
                  <p className="text-lg font-heading font-bold text-charcoal-900">
                    {lastActive ? formatDate(lastActive) : t("Never")}
                  </p>
                </div>
              </div>

              {plans.length > 0 && (
                <>
                  <h2 className="font-heading text-xl font-bold text-charcoal-900 mb-4">{t("Active crop plans")}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    {plans.map((p) => (
                      <div
                        key={p.id}
                        className="bg-white rounded-2xl border border-cream-200 p-5 shadow-lg shadow-charcoal-900/5"
                      >
                        <h3 className="font-heading font-semibold text-charcoal-900 mb-1">
                          {p.crop_type} · {p.field_name}
                        </h3>
                        <p className="text-xs text-charcoal-900/60">
                          {t("Started {date}", { date: formatDay(p.sowing_date) })}
                          {" · "}
                          {t("Harvest around {date}", { date: formatDay(p.harvest_date) })}
                        </p>
                        <p className="text-xs text-olive-700 mt-1">
                          {p.next_step
                            ? `${t("Next")}: ${t(p.next_step.title)} (${formatDay(p.next_step.date)})`
                            : t("All steps are done.")}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {Object.keys(cropCounts).length > 0 && (
                <>
                  <h2 className="font-heading text-xl font-bold text-charcoal-900 mb-3">{t("Crops predicted")}</h2>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {Object.entries(cropCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([crop, n]) => (
                        <span
                          key={crop}
                          className="rounded-full border border-lime-400 bg-lime-300/30 px-3 py-1 text-sm text-olive-800"
                        >
                          {crop} · {n}
                        </span>
                      ))}
                  </div>
                </>
              )}

              <h2 className="font-heading text-xl font-bold text-charcoal-900 mb-4">{t("Saved Fields")}</h2>
              {profiles.length === 0 ? (
                <p className="text-sm text-charcoal-900/50 mb-8">{t("This farmer hasn't saved any fields yet.")}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {profiles.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl border border-cream-200 p-5 shadow-lg shadow-charcoal-900/5"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-heading font-semibold text-charcoal-900">{p.field_name}</h3>
                        <span className="text-xs text-olive-700 bg-lime-300/30 border border-lime-400 rounded-full px-2.5 py-1">
                          {p.region}
                        </span>
                      </div>
                      <p className="text-sm text-charcoal-900/70 mb-1">
                        {t("Crop")}: <span className="font-medium">{p.crop_type}</span>
                        {p.field_size_hectares != null && (
                          <span className="text-charcoal-900/50"> · {p.field_size_hectares} ha</span>
                        )}
                      </p>
                      <p className="text-xs text-charcoal-900/50">
                        pH {p.soil_ph} · N {p.nitrogen_content} · P {p.phosphorus_content} · K {p.potassium_content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <h2 className="font-heading text-xl font-bold text-charcoal-900 mb-4">{t("Prediction History")}</h2>
              {predictions.length === 0 ? (
                <p className="text-sm text-charcoal-900/50">{t("This farmer hasn't made any predictions yet.")}</p>
              ) : (
                <div className="bg-white rounded-2xl border border-cream-200 shadow-lg shadow-charcoal-900/5 overflow-hidden overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-olive-700 text-lime-400">
                        <th className={th}>{t("Date")}</th>
                        <th className={th}>{t("Crop")}</th>
                        <th className={th}>{t("Region")}</th>
                        <th className={th}>{t("Season")}</th>
                        <th className={th}>{t("Predicted")}</th>
                        <th className={th}>{t("Risk")}</th>
                        <th className="px-5 py-3.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {predictions.map((r, i) => {
                        const open = openId === r.id;
                        return (
                          <Fragment key={r.id}>
                            <tr
                              className={`border-t border-cream-100 ${i % 2 === 0 ? "bg-white" : "bg-cream-100/30"}`}
                            >
                              <td className="px-5 py-3.5 text-charcoal-900/70 whitespace-nowrap">
                                {formatDate(r.created_at, true)}
                              </td>
                              <td className="px-5 py-3.5 font-medium text-charcoal-900">{r.crop_type}</td>
                              <td className="px-5 py-3.5 text-charcoal-900/80">{r.region}</td>
                              <td className="px-5 py-3.5 text-charcoal-900/80">{r.season}</td>
                              <td className="px-5 py-3.5 font-medium text-olive-700 whitespace-nowrap">
                                {r.predicted_yield} t/ha
                              </td>
                              <td className="px-5 py-3.5">
                                <span
                                  className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${
                                    RISK_STYLES[r.risk_level] || "bg-zinc-100 text-zinc-800 border-zinc-300"
                                  }`}
                                >
                                  {r.risk_level}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => setOpenId(open ? null : r.id)}
                                  className="text-xs font-medium text-olive-700 hover:text-olive-800 whitespace-nowrap"
                                >
                                  {open ? t("Hide") : t("Details")}
                                </button>
                              </td>
                            </tr>
                            {open && (
                              <tr className="border-t border-cream-100 bg-cream-50">
                                <td colSpan={7} className="px-5 py-5">
                                  <PredictionDetails details={r.details} t={t} />
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}