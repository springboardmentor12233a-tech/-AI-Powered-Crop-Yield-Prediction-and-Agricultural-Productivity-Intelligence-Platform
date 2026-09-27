"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { getToken, getRole } from "@/lib/auth";

const RISK_COLORS = {
  Low: "bg-green-500",
  Medium: "bg-yellow-500",
  High: "bg-red-500",
};

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
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
      router.push("/");
      return;
    }

    fetch("http://127.0.0.1:5000/admin/stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => setError("Could not load platform stats."))
      .finally(() => setLoading(false));
  }, [router]);

  const totalRiskCount = stats
    ? Object.values(stats.risk_breakdown || {}).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <Sidebar />
      <div className="flex-1 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-heading text-3xl font-semibold text-earth-900 mb-1">
          Admin Overview
        </h1>
        <p className="text-earth-900/60 mb-8">
          Platform-wide stats across all users and predictions.
        </p>

        {loading && <p className="text-earth-900/50 text-sm">Loading...</p>}
        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {stats && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
              <div className="bg-gradient-to-br from-earth-900 to-brand-800 rounded-2xl p-6 shadow-lg shadow-earth-900/10 text-white">
                <p className="text-xs uppercase tracking-wide text-brand-200 mb-2">
                  Total Users
                </p>
                <p className="text-4xl font-heading font-bold">
                  {stats.total_users}
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-earth-100 p-6 shadow-lg shadow-earth-900/5">
                <p className="text-xs uppercase tracking-wide text-earth-900/40 mb-2">
                  Total Predictions
                </p>
                <p className="text-4xl font-heading font-bold text-brand-700">
                  {stats.total_predictions}
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-earth-100 p-6 shadow-lg shadow-earth-900/5">
                <p className="text-xs uppercase tracking-wide text-earth-900/40 mb-2">
                  Avg Predicted Yield
                </p>
                <p className="text-4xl font-heading font-bold text-brand-700">
                  {stats.avg_predicted_yield != null ? (
                    <>
                      {stats.avg_predicted_yield}
                      <span className="text-lg text-brand-700/60 font-normal ml-1">t/ha</span>
                    </>
                  ) : (
                    <span className="text-lg text-earth-900/40 font-normal">No data yet</span>
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-earth-100 p-6 shadow-lg shadow-earth-900/5">
                <h2 className="font-heading font-semibold text-earth-900 mb-4">
                  Risk Breakdown
                </h2>
                {totalRiskCount === 0 ? (
                  <p className="text-sm text-earth-900/50">No predictions yet.</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(stats.risk_breakdown).map(([level, count]) => (
                      <div key={level}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-earth-900/80">{level}</span>
                          <span className="text-earth-900/50">{count}</span>
                        </div>
                        <div className="w-full bg-earth-50 rounded-full h-2">
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

              <div className="bg-white rounded-2xl border border-earth-100 p-6 shadow-lg shadow-earth-900/5">
                <h2 className="font-heading font-semibold text-earth-900 mb-4">
                  Predictions by Crop
                </h2>
                {Object.keys(stats.predictions_by_crop || {}).length === 0 ? (
                  <p className="text-sm text-earth-900/50">No predictions yet.</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(stats.predictions_by_crop).map(([crop, count]) => (
                      <div
                        key={crop}
                        className="flex justify-between text-sm py-1.5 border-b border-earth-50 last:border-0"
                      >
                        <span className="text-earth-900/80">{crop}</span>
                        <span className="font-medium text-earth-900">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}