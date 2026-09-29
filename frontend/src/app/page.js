"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from "recharts";
import Sidebar from "./components/Sidebar";
import { getToken, getUser } from "@/lib/auth";
import { CROP_IMAGES } from "@/lib/cropImages";

const QUICK_LINKS = [
  { href: "/predict", icon: "🌾", title: "Predict Yield" },
  { href: "/soil-reference", icon: "📖", title: "Soil Reference" },
  { href: "/profile", icon: "🧑‍🌾", title: "Farm Profile" },
  { href: "/history", icon: "📜", title: "History" },
];

const RISK_STYLES = {
  Low: "bg-green-100 text-green-800 border-green-300",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  High: "bg-red-100 text-red-800 border-red-300",
};

const RISK_COLORS = {
  Low: "bg-green-500",
  Medium: "bg-yellow-500",
  High: "bg-red-500",
};

const SOIL_COLS = ["soil_ph", "nitrogen_content", "phosphorus_content", "potassium_content"];

function flagValue(value, low, high) {
  if (value == null || low == null || high == null) return "unknown";
  if (value < low) return "too low";
  if (value > high) return "too high";
  return "healthy";
}

export default function Overview() {
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [history, setHistory] = useState([]);
  const [soilRanges, setSoilRanges] = useState([]);
  const [weatherByRegion, setWeatherByRegion] = useState({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    setUser(getUser());

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

        // Fetch live weather once per distinct region across saved fields.
        const regions = [...new Set(p.map((f) => f.region).filter(Boolean))];
        Promise.all(
          regions.map((region) =>
            fetch(`http://127.0.0.1:5000/live-weather?region=${region}`, { headers })
              .then((res) => res.json())
              .then((w) => [region, w])
              .catch(() => [region, null])
          )
        ).then((entries) => {
          setWeatherByRegion(Object.fromEntries(entries));
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

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

  return (
    <div className="min-h-screen bg-cream-50 flex">
      <Sidebar />
      <div className="flex-1 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-heading text-4xl font-bold text-charcoal-900 mb-2">
          Welcome{user?.name ? `, ${user.name}` : ""}
        </h1>
        <p className="text-charcoal-900/60 text-lg mb-8">
          Here&apos;s what&apos;s happening with your farm today.
        </p>

        {loading ? (
          <p className="text-charcoal-900/50 text-base">Loading...</p>
        ) : (
          <>
            {/* Stat row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-2xl border border-cream-200 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-charcoal-900/40 mb-1">Predictions</p>
                <p className="text-3xl font-heading font-bold text-charcoal-900">{totalPredictions}</p>
              </div>
              <div className="bg-white rounded-2xl border border-cream-200 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-charcoal-900/40 mb-1">Fields Saved</p>
                <p className="text-3xl font-heading font-bold text-charcoal-900">
                  {totalFields}
                  {totalHectares > 0 && (
                    <span className="text-sm text-charcoal-900/40 font-normal ml-1">
                      ({totalHectares.toFixed(1)} ha)
                    </span>
                  )}
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-cream-200 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-charcoal-900/40 mb-1">Avg Predicted Yield</p>
                <p className="text-3xl font-heading font-bold text-olive-700">
                  {avgYield != null ? `${avgYield} t/ha` : "—"}
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-cream-200 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-charcoal-900/40 mb-1">Latest Risk</p>
                {latest?.risk_level ? (
                  <span className={`inline-block mt-1 rounded-full border px-3 py-1 text-sm font-semibold ${RISK_STYLES[latest.risk_level] || ""}`}>
                    {latest.risk_level}
                  </span>
                ) : (
                  <p className="text-lg text-charcoal-900/40">—</p>
                )}
              </div>
            </div>

            {totalPredictions === 0 && totalFields === 0 && (
              <div className="bg-lime-300/30 border border-lime-400 rounded-2xl p-5 mb-8 flex items-center justify-between">
                <div>
                  <p className="font-medium text-charcoal-900">Get started with AgriVantage</p>
                  <p className="text-sm text-charcoal-900/60 mt-0.5">
                    Save a field on your Farm Profile, then run your first prediction.
                  </p>
                </div>
                <Link
                  href="/profile"
                  className="shrink-0 rounded-lg bg-lime-400 text-charcoal-900 text-sm font-medium px-4 py-2 hover:bg-lime-500 transition-colors"
                >
                  Add a field
                </Link>
              </div>
            )}

            {/* Latest prediction + risk breakdown */}
            {latest && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                <div className="sm:col-span-2 bg-olive-700 rounded-2xl p-6 shadow-lg shadow-charcoal-900/10 text-lime-50">
                  <p className="text-xs uppercase tracking-wide text-lime-400 mb-2">
                    Latest Prediction · {latest.crop_type} ({latest.region})
                  </p>
                  <div className="flex items-end gap-4 flex-wrap">
                    <p className="text-4xl font-heading font-bold">
                      {latest.predicted_yield}
                      <span className="text-lg font-normal ml-1">t/ha</span>
                    </p>
                    {latest.typical_yield_for_crop && (
                      <p className="text-sm text-cream-100/70 mb-1">
                        vs {latest.typical_yield_for_crop} t/ha typical
                      </p>
                    )}
                    {latest.risk_level && (
                      <span className={`mb-1 inline-block rounded-full border px-3 py-1 text-xs font-semibold ${RISK_STYLES[latest.risk_level] || ""}`}>
                        {latest.risk_level} Risk
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Link href="/history" className="text-sm font-medium text-lime-300 hover:text-lime-200">
                      View History →
                    </Link>
                    <Link href="/predict" className="text-sm font-medium text-lime-300 hover:text-lime-200">
                      New Prediction →
                    </Link>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-charcoal-900/40 mb-3">Risk Breakdown</p>
                  {totalRiskCount === 0 ? (
                    <p className="text-sm text-charcoal-900/50">No data yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {["Low", "Medium", "High"].map((level) =>
                        riskCounts[level] ? (
                          <div key={level}>
                            <div className="flex justify-between text-xs mb-0.5">
                              <span className="text-charcoal-900/70">{level}</span>
                              <span className="text-charcoal-900/40">{riskCounts[level]}</span>
                            </div>
                            <div className="w-full bg-cream-100 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${RISK_COLORS[level]}`}
                                style={{ width: `${(riskCounts[level] / totalRiskCount) * 100}%` }}
                              />
                            </div>
                          </div>
                        ) : null
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Yield trend */}
            {trendData.length > 1 && (
              <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm mb-8">
                <h2 className="font-heading font-semibold text-charcoal-900 mb-4">
                  Yield Trend (last {trendData.length} predictions)
                </h2>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2d9cb" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} unit=" t/ha" />
                      <Tooltip formatter={(v) => `${v} t/ha`} />
                      <Legend />
                      <Line type="monotone" dataKey="predicted" stroke="#2f522c" name="Predicted" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="typical" stroke="#c2e02f" name="Typical" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* My Fields */}
            {profiles.length > 0 && (
              <div className="mb-8">
                <h2 className="font-heading font-semibold text-charcoal-900 mb-4">My Fields</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {profiles.map((f) => {
                    const ranges = rangesByCrop[f.crop_type];
                    const flags = ranges
                      ? SOIL_COLS.map((col) => ({
                          col,
                          status: flagValue(f[col], ranges[col]?.low, ranges[col]?.high),
                        }))
                      : [];
                    const attention = flags.filter((x) => x.status !== "healthy" && x.status !== "unknown");
                    const w = weatherByRegion[f.region];

                    return (
                      <div key={f.id} className="bg-white rounded-2xl border border-cream-200 p-5 shadow-sm flex gap-4">
                        <div className="h-16 w-16 bg-cream-100 rounded-xl flex items-center justify-center shrink-0 p-1.5">
                          <img
                            src={CROP_IMAGES[f.crop_type] || ""}
                            alt={f.crop_type}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-heading font-semibold text-charcoal-900 truncate">
                              {f.field_name}
                            </h3>
                            {w?.live_temperature != null && (
                              <span className="text-sm text-olive-700 font-medium shrink-0 ml-2">
                                {w.live_temperature}°C
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-charcoal-900/60">
                            {f.crop_type} · {f.region}
                            {f.field_size_hectares != null && ` · ${f.field_size_hectares} ha`}
                          </p>
                          {attention.length > 0 ? (
                            <p className="text-xs text-orange-700 mt-1">
                              Needs attention: {attention.map((a) => a.col.replace("_content", "").replace("soil_", "")).join(", ")}
                            </p>
                          ) : ranges ? (
                            <p className="text-xs text-green-700 mt-1">Soil values in healthy range</p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="bg-white rounded-2xl border border-cream-200 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-center"
                >
                  <div className="text-xl mb-1">{link.icon}</div>
                  <p className="text-sm font-medium text-charcoal-900">{link.title}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}