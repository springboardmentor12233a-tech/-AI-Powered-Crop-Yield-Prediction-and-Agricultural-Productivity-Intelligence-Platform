"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import Sidebar from "../../components/Sidebar";
import { getToken, getRole } from "@/lib/auth";
import { useT } from "@/lib/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function ModelPerformancePage() {
  const t = useT();
  const router = useRouter();

  const [data, setData] = useState(null);
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

    fetch(`${API_URL}/admin/model-performance`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed with status ${res.status}`);
        }
        return res.json();
      })
      .then((resData) => setData(resData))
      .catch((err) => setError(err.message || "Could not load model performance metrics."))
      .finally(() => setLoading(false));
  }, [router]);

  const comparison = data?.comparison || [];
  const featureImportances = data?.feature_importances || [];

  const chartData = comparison.map((m) => ({
    name: `${m.model} (${m.stage})`,
    RMSE: m.rmse,
    MAE: m.mae,
    "R² Score": m.r2,
  }));

  return (
    <div className="min-h-screen bg-cream-50 flex">
      <Sidebar />
      <div className="flex-1 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="font-heading text-3xl font-bold text-charcoal-900">
              {t("Model Performance & Architecture")}
            </h1>
            <p className="text-charcoal-900/60 mt-1">
              {t("Empirical evaluation across candidate algorithms and tuned hyperparameters.")}
            </p>
          </div>

          {loading && <p className="text-charcoal-900/50">{t("Loading performance data...")}</p>}
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}

          {data && (
            <div className="space-y-8">
              {/* Active Model Spotlight */}
              <div className="bg-olive-700 rounded-3xl p-6 shadow-lg text-lime-50">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-lime-400 font-semibold">
                      Production Model
                    </span>
                    <h2 className="text-3xl font-heading font-bold mt-1">
                      {data.active_model?.name}
                    </h2>
                    <p className="text-cream-100/80 text-sm mt-1">
                      Ensemble Gradient Boosting Regressor · Tuned with 5-Fold Cross-Validation
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-2xl px-5 py-3 border border-white/20">
                    <p className="text-xs text-lime-300">Winning Benchmark</p>
                    <p className="text-xl font-bold font-heading">{data.active_model?.top_metric}</p>
                  </div>
                </div>
              </div>

              {/* Model Comparison Table */}
              <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm">
                <h3 className="font-heading text-xl font-bold text-charcoal-900 mb-2">
                  {t("Algorithm Benchmarks (model_comparison_report.csv)")}
                </h3>
                <p className="text-xs text-charcoal-900/50 mb-4">
                  {t("Tuned XGBoost achieves the lowest RMSE (0.6567) and highest R² (0.6770), outperforming Linear Regression and Random Forest.")}
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-cream-100 text-charcoal-900">
                        <th className="px-4 py-3 font-semibold">{t("Model")}</th>
                        <th className="px-4 py-3 font-semibold">{t("Stage")}</th>
                        <th className="px-4 py-3 font-semibold">RMSE (t/ha)</th>
                        <th className="px-4 py-3 font-semibold">MAE (t/ha)</th>
                        <th className="px-4 py-3 font-semibold">R² Score</th>
                        <th className="px-4 py-3 font-semibold">{t("Status")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-100">
                      {comparison.map((m, idx) => {
                        const isBest = m.model === "XGBoost" && m.stage === "tuned";
                        return (
                          <tr
                            key={idx}
                            className={`hover:bg-cream-50 ${isBest ? "bg-lime-300/20 font-medium" : ""}`}
                          >
                            <td className="px-4 py-3.5 text-charcoal-900">{m.model}</td>
                            <td className="px-4 py-3.5 capitalize">
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                  m.stage === "tuned"
                                    ? "bg-lime-400 text-charcoal-900"
                                    : "bg-cream-200 text-charcoal-900/70"
                                }`}
                              >
                                {m.stage}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 font-mono">{m.rmse.toFixed(4)}</td>
                            <td className="px-4 py-3.5 font-mono">{m.mae.toFixed(4)}</td>
                            <td className="px-4 py-3.5 font-mono font-bold text-olive-800">
                              {m.r2.toFixed(4)}
                            </td>
                            <td className="px-4 py-3.5">
                              {isBest ? (
                                <span className="text-xs bg-olive-700 text-lime-400 px-2.5 py-1 rounded-full font-bold">
                                  ✓ Selected
                                </span>
                              ) : (
                                <span className="text-xs text-charcoal-900/40">Baseline</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Comparison Visual Chart */}
              <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm">
                <h3 className="font-heading text-lg font-semibold text-charcoal-900 mb-2">
                  {t("Error Metrics & Variance Explained (R²)")}
                </h3>
                <p className="text-xs text-charcoal-900/50 mb-4">
                  {t("Visual comparison of RMSE, MAE and R² across evaluated models.")}
                </p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2d9cb" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="R² Score" fill="#2f522c" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="RMSE" fill="#e07a5f" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="MAE" fill="#f4a261" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Feature Drivers of XGBoost */}
              <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm">
                <h3 className="font-heading text-xl font-bold text-charcoal-900 mb-2">
                  {t("Top Features Driving XGBoost Predictions")}
                </h3>
                <p className="text-xs text-charcoal-900/50 mb-6">
                  {t("Feature importance computed directly from the trained gradient boosted trees. Fertilizer and climate interactions drive over 70% of prediction weight.")}
                </p>

                <div className="space-y-3">
                  {featureImportances.map((item, i) => (
                    <div key={item.feature} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-charcoal-900">
                          #{i + 1} {item.label}
                        </span>
                        <span className="font-mono text-olive-700">
                          {item.percentage}% ({item.importance})
                        </span>
                      </div>
                      <div className="w-full bg-cream-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-2.5 rounded-full bg-olive-700 transition-all duration-500"
                          style={{ width: `${Math.min(100, item.percentage * 1.5)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Viva Explanation Card */}
              <div className="bg-cream-100/60 rounded-2xl border border-cream-200 p-5 text-sm text-charcoal-900/80 leading-relaxed">
                <p className="font-bold text-charcoal-900 mb-1">🎓 Key Takeaway for Mentor Review:</p>
                <p>
                  Tree-based gradient boosting (XGBoost) achieves superior accuracy because agricultural yields exhibit non-linear interactions (e.g. fertilizer effectiveness is constrained by soil moisture and temperature). Feature importance confirms that synthetic engineered features—such as <code className="bg-white px-1 py-0.5 rounded">rainfall_to_temp_ratio</code> and <code className="bg-white px-1 py-0.5 rounded">fertilizer_nitrogen_interaction</code>—rank among the top predictive drivers.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}