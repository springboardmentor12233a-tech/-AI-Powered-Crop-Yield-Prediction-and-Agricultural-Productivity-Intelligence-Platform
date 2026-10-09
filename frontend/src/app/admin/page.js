"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import Sidebar from "../components/Sidebar";
import { getToken, getRole } from "@/lib/auth";

const RISK_COLORS = {
  Low: "bg-green-500",
  Medium: "bg-yellow-500",
  High: "bg-red-500",
};

const QUICK_LINKS = [
  { href: "/admin/predictions", icon: "🌾", title: "Predictions", desc: "Platform-wide predictions table with filter and CSV export." },
  { href: "/admin/model-performance", icon: "🤖", title: "Model Performance", desc: "Model comparison metrics and XGBoost feature importance." },
  { href: "/admin/announcements", icon: "📢", title: "Announcements", desc: "Broadcast weather alerts and messages to farmers' bells." },
  { href: "/admin/fields", icon: "🌱", title: "Fields", desc: "View all saved fields and regional soil problems." },
  { href: "/admin/market-prices", icon: "💰", title: "Market Prices", desc: "Configure crop prices and costs for the Farm Planner." },
  { href: "/admin/system-status", icon: "⚡", title: "System Status", desc: "Check DB, Groq, OpenWeather and model health." },
  { href: "/admin/reports", icon: "📈", title: "Reports", desc: "Seasonal weather trends and yield averages." },
  { href: "/admin/users", icon: "👥", title: "Users", desc: "Manage registered farmers and drill down into user activity." },
];

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

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

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch("http://127.0.0.1:5000/admin/stats", { headers }).then((r) => r.json()),
      fetch("http://127.0.0.1:5000/admin/users", { headers }).then((r) => r.json()),
    ])
      .then(([statsData, usersData]) => {
        setStats(statsData);
        setUsers(Array.isArray(usersData) ? usersData : []);
      })
      .catch(() => setError("Could not load platform stats."))
      .finally(() => setLoading(false));
  }, [router]);

  const totalRiskCount = stats
    ? Object.values(stats.risk_breakdown || {}).reduce((a, b) => a + b, 0)
    : 0;

  const topCrop = stats?.predictions_by_crop
    ? Object.entries(stats.predictions_by_crop).sort((a, b) => b[1] - a[1])[0]
    : null;

  const farmerCount = users.filter((u) => u.role === "farmer").length;
  const adminCount = users.filter((u) => u.role === "admin").length;

  const yieldChartData = stats?.avg_yield_by_crop
    ? Object.entries(stats.avg_yield_by_crop).map(([crop, avg]) => ({ crop, avgYield: avg }))
    : [];

  return (
    <div className="min-h-screen bg-cream-50 flex">
      <Sidebar />
      <div className="flex-1 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-heading text-4xl font-bold text-charcoal-900 mb-2">
            Admin Overview
          </h1>
          <p className="text-charcoal-900/60 text-lg mb-8">
            Platform-wide management across all users, ML models, and crops.
          </p>

          {loading && <p className="text-charcoal-900/50 text-base">Loading...</p>}
          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {stats && (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-olive-700 rounded-2xl p-5 shadow-lg shadow-charcoal-900/10 text-lime-50">
                  <p className="text-xs uppercase tracking-wide text-lime-400 mb-1">Total Users</p>
                  <p className="text-3xl font-heading font-bold">{stats.total_users}</p>
                  <p className="text-xs text-cream-100/60 mt-1">
                    {farmerCount} farmer{farmerCount !== 1 ? "s" : ""} · {adminCount} admin{adminCount !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-cream-200 p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-charcoal-900/40 mb-1">Total Predictions</p>
                  <p className="text-3xl font-heading font-bold text-olive-700">{stats.total_predictions}</p>
                </div>

                <div className="bg-white rounded-2xl border border-cream-200 p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-charcoal-900/40 mb-1">Avg Predicted Yield</p>
                  <p className="text-3xl font-heading font-bold text-olive-700">
                    {stats.avg_predicted_yield != null ? (
                      <>
                        {stats.avg_predicted_yield}
                        <span className="text-sm text-olive-700/60 font-normal ml-1">t/ha</span>
                      </>
                    ) : (
                      <span className="text-base text-charcoal-900/40 font-normal">No data</span>
                    )}
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-cream-200 p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-charcoal-900/40 mb-1">Top Crop</p>
                  <p className="text-3xl font-heading font-bold text-charcoal-900">
                    {topCrop ? topCrop[0] : "—"}
                  </p>
                  {topCrop && (
                    <p className="text-xs text-charcoal-900/40 mt-1">{topCrop[1]} predictions</p>
                  )}
                </div>
              </div>

              {/* Breakdown Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm">
                  <h2 className="font-heading font-semibold text-charcoal-900 mb-4">
                    Risk Breakdown
                  </h2>
                  {totalRiskCount === 0 ? (
                    <p className="text-sm text-charcoal-900/50">No predictions yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(stats.risk_breakdown).map(([level, count]) => (
                        <div key={level}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-charcoal-900/80">{level}</span>
                            <span className="text-charcoal-900/50">{count}</span>
                          </div>
                          <div className="w-full bg-cream-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${RISK_COLORS[level] || "bg-zinc-400"}`}
                              style={{ width: `${(count / totalRiskCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm">
                  <h2 className="font-heading font-semibold text-charcoal-900 mb-4">
                    Predictions by Crop
                  </h2>
                  {Object.keys(stats.predictions_by_crop || {}).length === 0 ? (
                    <p className="text-sm text-charcoal-900/50">No predictions yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(stats.predictions_by_crop).map(([crop, count]) => (
                        <div
                          key={crop}
                          className="flex justify-between text-sm py-1.5 border-b border-cream-100 last:border-0"
                        >
                          <span className="text-charcoal-900/80">{crop}</span>
                          <span className="font-medium text-charcoal-900">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {yieldChartData.length > 0 && (
                <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm mb-8">
                  <h2 className="font-heading font-semibold text-charcoal-900 mb-4">
                    Avg Predicted Yield by Crop
                  </h2>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={yieldChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2d9cb" />
                        <XAxis dataKey="crop" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} unit=" t/ha" />
                        <Tooltip formatter={(v) => `${v} t/ha`} />
                        <Bar dataKey="avgYield" fill="#2f522c" name="Avg Predicted Yield" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Quick Navigation Cards */}
              <h2 className="font-heading text-2xl font-bold text-charcoal-900 mb-4">
                Admin Management Console
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {QUICK_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="bg-white rounded-2xl border border-cream-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-3xl mb-2">{link.icon}</div>
                      <h3 className="font-heading font-semibold text-charcoal-900 mb-1">{link.title}</h3>
                      <p className="text-xs text-charcoal-900/60 leading-relaxed">{link.desc}</p>
                    </div>
                    <span className="mt-3 text-xs font-semibold text-olive-700">Open module →</span>
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