"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import Sidebar from "../components/Sidebar";
import { getToken, getUser } from "@/lib/auth";
import { CROP_IMAGES } from "@/lib/cropImages";
import { useLang } from "@/lib/i18n";

const RISK_STYLES = {
  Low: "bg-green-100 text-green-800 border-green-300",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  High: "bg-red-100 text-red-800 border-red-300",
};
const RISK_HEX = { Low: "#22c55e", Medium: "#eab308", High: "#ef4444" };

const SOIL_COLS = [
  { key: "soil_ph" },
  { key: "nitrogen_content" },
  { key: "phosphorus_content" },
  { key: "potassium_content" },
];

const SOIL_LABELS = {
  soil_ph: "Soil pH",
  nitrogen_content: "Nitrogen",
  phosphorus_content: "Phosphorus",
  potassium_content: "Potassium",
};

const LOCALE_TAG = { en: "en-IN", hi: "hi-IN", kn: "kn-IN", ta: "ta-IN", te: "te-IN" };

function flagValue(value, low, high) {
  if (value == null || low == null || high == null) return "unknown";
  if (value < low) return "too low";
  if (value > high) return "too high";
  return "healthy";
}

const SEG_COLOR = {
  healthy: "bg-green-500",
  "too low": "bg-orange-400",
  "too high": "bg-red-500",
  unknown: "bg-cream-200",
};

function StatCard({ icon, label, children, hint }) {
  return (
    <div className="bg-white rounded-2xl border border-cream-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center gap-2 mb-3">
        <span className="h-8 w-8 rounded-full bg-lime-300/50 flex items-center justify-center text-base">
          {icon}
        </span>
        <p className="text-xs uppercase tracking-wide text-charcoal-900/50 font-medium">{label}</p>
      </div>
      <div className="text-3xl font-heading font-bold text-charcoal-900">{children}</div>
      {hint && <p className="text-xs text-charcoal-900/50 mt-1">{hint}</p>}
    </div>
  );
}

export default function Overview() {
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [history, setHistory] = useState([]);
  const [soilRanges, setSoilRanges] = useState([]);
  const [weatherByRegion, setWeatherByRegion] = useState({});
  const [loading, setLoading] = useState(true);
  const [greetingKey, setGreetingKey] = useState("Good morning");
  const [today, setToday] = useState("");
  const router = useRouter();
  const { t, lang } = useLang();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    setUser(getUser());

    // Computed on the client only, to avoid a server/client text mismatch.
    const hour = new Date().getHours();
    setGreetingKey(
      hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
    );

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch("http://127.0.0.1:5000/profiles", { headers }).then((r) => r.json()),
      fetch("http://127.0.0.1:5000/history", { headers }).then((r) => r.json()),
      fetch("http://127.0.0.1:5000/soil-ranges", { headers }).then((r) => r.json()),
    ])
      .then(([profilesData, historyData, rangesData]) => {
        const p = Array.isArray(profilesData) ? profilesData : [];
        const h = Array.isArray(historyData) ? historyData : [];
        const r = Array.isArray(rangesData) ? rangesData : [];
        setProfiles(p);
        setHistory(h);
        setSoilRanges(r);

        // Live weather once per distinct region across saved fields.
        const regions = [...new Set(p.map((f) => f.region).filter(Boolean))];
        Promise.all(
          regions.map((region) =>
            fetch(`http://127.0.0.1:5000/live-weather?region=${region}`, { headers })
              .then((res) => res.json())
              .then((w) => [region, w])
              .catch(() => [region, null])
          )
        ).then((entries) => setWeatherByRegion(Object.fromEntries(entries)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  // The date text follows the selected language.
  useEffect(() => {
    setToday(
      new Date().toLocaleDateString(LOCALE_TAG[lang] || "en-IN", {
        weekday: "long", day: "numeric", month: "long",
      })
    );
  }, [lang]);

  const totalPredictions = history.length;
  const totalFields = profiles.length;
  const totalHectares = profiles.reduce((sum, f) => sum + (f.field_size_hectares || 0), 0);
  const avgYield =
    totalPredictions > 0
      ? (history.reduce((sum, h) => sum + (h.predicted_yield || 0), 0) / totalPredictions).toFixed(2)
      : null;
  const latest = history[0] || null;

  const riskCounts = history.reduce((acc, h) => {
    if (h.risk_level) acc[h.risk_level] = (acc[h.risk_level] || 0) + 1;
    return acc;
  }, {});
  const totalRiskCount = Object.values(riskCounts).reduce((a, b) => a + b, 0);
  const riskPie = ["Low", "Medium", "High"]
    .filter((l) => riskCounts[l])
    .map((l) => ({ key: l, name: t(l), value: riskCounts[l] }));

  // Oldest-to-newest for the trend chart, last 10 predictions.
  const trendData = [...history]
    .slice(0, 10)
    .reverse()
    .map((h, i) => ({
      label: `#${i + 1}`,
      predicted: h.predicted_yield,
      typical: h.typical_yield_for_crop,
    }));

  const rangesByCrop = Object.fromEntries(soilRanges.map((c) => [c.crop_type, c.ranges]));

  // Per-field soil check + latest prediction made for that field.
  const fieldCards = profiles.map((f) => {
    const ranges = rangesByCrop[f.crop_type];
    const soil = SOIL_COLS.map(({ key }) => ({
      key,
      status: ranges ? flagValue(f[key], ranges[key]?.low, ranges[key]?.high) : "unknown",
    }));
    const healthy = soil.filter((s) => s.status === "healthy").length;
    const issues = soil.filter((s) => s.status === "too low" || s.status === "too high");
    const lastPred = history.find((h) => h.profile_id === f.id) || null;
    return { f, soil, healthy, issues, lastPred, hasRanges: !!ranges };
  });

  const attention = fieldCards.filter((c) => c.issues.length > 0);

  const vsTypical =
    latest && latest.typical_yield_for_crop
      ? ((latest.predicted_yield - latest.typical_yield_for_crop) / latest.typical_yield_for_crop) * 100
      : null;
  const barMax = latest
    ? Math.max(latest.predicted_yield || 0, latest.typical_yield_for_crop || 0) * 1.15 || 1
    : 1;

  const firstName = user?.name?.split(" ")[0];

  const heroText = loading
    ? t("Loading your farm...")
    : totalFields === 0
    ? t("Add your first field to start getting yield predictions and soil insights.")
    : attention.length > 0
    ? t("You farm {fields} field(s) ({ha} ha). Soil needs attention in {count}.", { fields: totalFields, ha: totalHectares.toFixed(1), count: attention.length })
    : t("You farm {fields} field(s) ({ha} ha), and all soil values are in the healthy range.", { fields: totalFields, ha: totalHectares.toFixed(1) });

  return (
    <div className="min-h-screen bg-cream-50 flex">
      <Sidebar />
      <div className="flex-1 py-10 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-3xl bg-olive-700 p-8 mb-6 shadow-xl shadow-charcoal-900/10">
            <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-lime-400/20" />
            <div className="absolute right-24 -bottom-16 h-40 w-40 rounded-full bg-lime-300/10" />
            <div className="relative">
              <p className="text-xs uppercase tracking-wide text-lime-400 mb-2">{today || " "}</p>
              <h1 className="font-heading text-4xl font-bold text-white mb-2">
                {t(greetingKey)}
                {firstName ? `, ${firstName}` : ""} 👋
              </h1>
              <p className="text-cream-100/80 text-base max-w-xl mb-6">
                {heroText}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/predict"
                  className="rounded-full bg-lime-400 text-charcoal-900 font-semibold px-6 py-2.5 shadow-md hover:bg-lime-300 hover:-translate-y-0.5 transition-all"
                >
                  🌾 {t("New prediction")}
                </Link>
                <Link
                  href="/assistant"
                  className="rounded-full border border-lime-400/60 text-lime-300 font-medium px-6 py-2.5 hover:bg-white/10 transition-colors"
                >
                  💬 {t("Ask the assistant")}
                </Link>
              </div>
            </div>
          </div>

          {loading ? (
            <p className="text-charcoal-900/50 text-base">{t("Loading...")}</p>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <StatCard icon="📈" label={t("Predictions")} hint={t("all time")}>
                  {totalPredictions}
                </StatCard>
                <StatCard
                  icon="🧑‍🌾"
                  label={t("Fields")}
                  hint={totalHectares > 0 ? t("{ha} hectares total", { ha: totalHectares.toFixed(1) }) : t("none saved yet")}
                >
                  {totalFields}
                </StatCard>
                <StatCard icon="🌱" label={t("Avg yield")} hint={t("across predictions")}>
                  {avgYield != null ? (
                    <>
                      {avgYield}
                      <span className="text-sm text-charcoal-900/40 font-normal ml-1">t/ha</span>
                    </>
                  ) : (
                    "—"
                  )}
                </StatCard>
                <StatCard icon="🛡️" label={t("Latest risk")} hint={t("from soil checks")}>
                  {latest?.risk_level ? (
                    <span
                      className={`inline-block rounded-full border px-3 py-1 text-base font-semibold ${
                        RISK_STYLES[latest.risk_level] || ""
                      }`}
                    >
                      {t(latest.risk_level)}
                    </span>
                  ) : (
                    "—"
                  )}
                </StatCard>
              </div>

              {totalPredictions === 0 && totalFields === 0 && (
                <div className="bg-lime-300/30 border border-lime-400 rounded-2xl p-6 mb-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-heading font-semibold text-charcoal-900">{t("Get started with AgriVantage")}</p>
                    <p className="text-sm text-charcoal-900/60 mt-0.5">
                      {t("Save a field on your Farm Profile, then run your first prediction.")}
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    className="shrink-0 rounded-full bg-lime-400 text-charcoal-900 text-sm font-semibold px-5 py-2.5 hover:bg-lime-500 transition-colors"
                  >
                    {t("Add a field")}
                  </Link>
                </div>
              )}

              {/* Latest prediction + risk donut */}
              {latest && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                  <div className="sm:col-span-2 bg-white rounded-2xl border border-cream-200 p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-charcoal-900/50 font-medium mb-1">
                          {t("Latest prediction")}
                        </p>
                        <p className="font-heading font-semibold text-charcoal-900">
                          {t(latest.crop_type)} · {t(latest.region)} · {t(latest.season)}
                        </p>
                      </div>
                      {latest.risk_level && (
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            RISK_STYLES[latest.risk_level] || ""
                          }`}
                        >
                          {t("{risk} risk", { risk: t(latest.risk_level) })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-end gap-3 mb-5 flex-wrap">
                      <p className="text-5xl font-heading font-bold text-olive-700 leading-none">
                        {latest.predicted_yield}
                        <span className="text-lg text-charcoal-900/40 font-normal ml-1">t/ha</span>
                      </p>
                      {vsTypical != null && (
                        <span
                          className={`mb-1 rounded-full px-3 py-1 text-xs font-semibold ${
                            vsTypical >= 0 ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {vsTypical >= 0 ? "▲ " : "▼ "}
                          {t(vsTypical >= 0 ? "{pct}% above typical" : "{pct}% below typical", { pct: Math.abs(vsTypical).toFixed(0) })}
                        </span>
                      )}
                    </div>

                    {latest.typical_yield_for_crop && (
                      <div className="mb-5">
                        <div className="relative h-3 rounded-full bg-cream-100">
                          <div
                            className="h-3 rounded-full bg-olive-700"
                            style={{ width: `${Math.min(100, (latest.predicted_yield / barMax) * 100)}%` }}
                          />
                          <div
                            className="absolute -top-1 h-5 w-0.5 bg-lime-500"
                            style={{ left: `${(latest.typical_yield_for_crop / barMax) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-charcoal-900/50 mt-2">
                          {t("Marker = typical {crop} yield ({value} t/ha)", { crop: t(latest.crop_type), value: latest.typical_yield_for_crop })}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <Link href="/history" className="text-sm font-medium text-olive-700 hover:text-olive-800">
                        {t("View history →")}
                      </Link>
                      <Link href="/predict" className="text-sm font-medium text-olive-700 hover:text-olive-800">
                        {t("New prediction →")}
                      </Link>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-charcoal-900/50 font-medium mb-2">
                      {t("Risk breakdown")}
                    </p>
                    {totalRiskCount === 0 ? (
                      <p className="text-sm text-charcoal-900/50">{t("No data yet.")}</p>
                    ) : (
                      <>
                        <div className="h-36 relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={riskPie}
                                dataKey="value"
                                innerRadius={42}
                                outerRadius={62}
                                paddingAngle={3}
                                stroke="none"
                              >
                                {riskPie.map((s) => (
                                  <Cell key={s.key} fill={RISK_HEX[s.key]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <p className="text-2xl font-heading font-bold text-charcoal-900">{totalRiskCount}</p>
                            <p className="text-[10px] text-charcoal-900/40 uppercase">{t("checks")}</p>
                          </div>
                        </div>
                        <div className="flex justify-center gap-3 mt-2 text-xs text-charcoal-900/70">
                          {riskPie.map((s) => (
                            <span key={s.key} className="flex items-center gap-1">
                              <span className="h-2 w-2 rounded-full" style={{ background: RISK_HEX[s.key] }} />
                              {s.name} {s.value}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Yield trend */}
              {trendData.length > 1 && (
                <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-heading font-semibold text-charcoal-900">
                      {t("Yield trend")}
                      <span className="text-sm text-charcoal-900/40 font-normal ml-2">
                        {t("last {n} predictions", { n: trendData.length })}
                      </span>
                    </h2>
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="yieldFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4a5936" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#4a5936" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2d9cb" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12 }} unit=" t/ha" axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v) => `${v} t/ha`} />
                        <Area
                          type="monotone"
                          dataKey="typical"
                          name={t("Typical")}
                          stroke="#c2e02f"
                          strokeWidth={2}
                          strokeDasharray="5 4"
                          fill="none"
                          dot={false}
                        />
                        <Area
                          type="monotone"
                          dataKey="predicted"
                          name={t("Predicted")}
                          stroke="#4a5936"
                          strokeWidth={3}
                          fill="url(#yieldFill)"
                          dot={{ r: 3 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Needs attention */}
              {attention.length > 0 && (
                <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 mb-6">
                  <p className="font-heading font-semibold text-orange-900 mb-2">⚠ {t("Needs attention")}</p>
                  <ul className="space-y-1 text-sm text-orange-900/80">
                    {attention.map(({ f, issues }) => (
                      <li key={f.id}>
                        <span className="font-medium">{f.field_name}</span>:{" "}
                        {issues.map((i) => `${t(SOIL_LABELS[i.key])}: ${t(i.status)}`).join(", ")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* My fields */}
              {fieldCards.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-heading font-semibold text-charcoal-900 text-lg">{t("My fields")}</h2>
                    <Link href="/compare" className="text-sm font-medium text-olive-700 hover:text-olive-800">
                      {t("Compare fields →")}
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {fieldCards.map(({ f, soil, healthy, lastPred, hasRanges }) => {
                      const w = weatherByRegion[f.region];
                      const production =
                        lastPred && f.field_size_hectares
                          ? (lastPred.predicted_yield * f.field_size_hectares).toFixed(1)
                          : null;
                      return (
                        <div
                          key={f.id}
                          className="bg-white rounded-2xl border border-cream-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                        >
                          <div className="flex gap-4 p-5">
                            <div className="h-20 w-20 bg-cream-100 rounded-2xl flex items-center justify-center shrink-0 p-2">
                              <img
                                src={CROP_IMAGES[f.crop_type] || ""}
                                alt={f.crop_type}
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-heading font-semibold text-charcoal-900 truncate">
                                  {f.field_name}
                                </h3>
                                {w?.live_temperature != null && (
                                  <span className="shrink-0 rounded-full bg-lime-300/40 border border-lime-400 px-2.5 py-0.5 text-xs font-semibold text-olive-800">
                                    🌡 {w.live_temperature}°C
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-charcoal-900/60">
                                {t(f.crop_type)} · {t(f.region)}
                                {f.field_size_hectares != null && ` · ${f.field_size_hectares} ha`}
                              </p>
                              {lastPred ? (
                                <p className="text-sm mt-2">
                                  <span className="font-semibold text-olive-700">{lastPred.predicted_yield} t/ha</span>
                                  {production && (
                                    <span className="text-charcoal-900/50"> · {t("~{n} t total", { n: production })}</span>
                                  )}
                                </p>
                              ) : (
                                <p className="text-xs text-charcoal-900/40 mt-2">{t("No prediction for this field yet")}</p>
                              )}
                            </div>
                          </div>

                          {hasRanges && (
                            <div className="px-5 pb-5">
                              <div className="flex gap-1.5 mb-1.5">
                                {soil.map((s) => (
                                  <div
                                    key={s.key}
                                    title={`${t(SOIL_LABELS[s.key])}: ${t(s.status)}`}
                                    className={`h-1.5 flex-1 rounded-full ${SEG_COLOR[s.status]}`}
                                  />
                                ))}
                              </div>
                              <p className="text-xs text-charcoal-900/50">
                                {t("{healthy} of {total} soil values healthy", { healthy, total: soil.length })}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
