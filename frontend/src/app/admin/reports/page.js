"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from "recharts";
import Sidebar from "../../components/Sidebar";
import { getToken, getRole } from "@/lib/auth";
import { downloadCSV } from "@/lib/csv";

const REGIONS = ["North", "South", "East", "West", "Central"];
const SEASON_ORDER = ["Spring", "Summer", "Autumn"];
const CROP_COLORS = {
  Wheat: "#3f6b3a",
  Corn: "#98bb8c",
  Rice: "#c2e02f",
  Soybean: "#8a7a4a",
  Barley: "#2f522c",
};

function ExportButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-cream-200 bg-white px-3 py-1.5 text-xs font-medium text-charcoal-900/70 hover:bg-cream-100 transition-colors print:hidden"
    >
      CSV
    </button>
  );
}

export default function AdminReportsPage() {
  const [weatherData, setWeatherData] = useState([]);
  const [yieldByCrop, setYieldByCrop] = useState({});
  const [seasonalYield, setSeasonalYield] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState("North");
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

    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch("http://127.0.0.1:5000/admin/seasonal-report", { headers }).then((r) => r.json()),
      fetch("http://127.0.0.1:5000/admin/stats", { headers }).then((r) => r.json()),
      fetch("http://127.0.0.1:5000/admin/seasonal-yield", { headers }).then((r) => r.json()),
    ])
      .then(([weather, stats, seasonal]) => {
        setWeatherData(weather);
        setYieldByCrop(stats.avg_yield_by_crop || {});
        setSeasonalYield(Array.isArray(seasonal) ? seasonal : []);
      })
      .catch(() => setError("Could not load report data."))
      .finally(() => setLoading(false));
  }, [router]);

  const regionData = weatherData.filter((w) => w.region === selectedRegion);

  const yieldChartData = Object.entries(yieldByCrop).map(([crop, avg]) => ({
    crop,
    avgYield: avg,
  }));

  // Pivot rows like {season, crop_type, avg_yield} into one row per season
  // with a column per crop, which is the shape a grouped bar chart needs.
  const seasonCrops = [...new Set(seasonalYield.map((r) => r.crop_type))];
  const seasonChartData = SEASON_ORDER.filter((s) =>
    seasonalYield.some((r) => r.season === s)
  ).map((season) => {
    const row = { season };
    seasonalYield
      .filter((r) => r.season === season)
      .forEach((r) => {
        row[r.crop_type] = r.avg_yield;
      });
    return row;
  });

  return (
    <div className="min-h-screen bg-cream-50 flex">
      <Sidebar />
      <div className="flex-1 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-1">
          <h1 className="font-heading text-3xl font-semibold text-charcoal-900">
            Reports
          </h1>
          {!loading && !error && (
            <button
              onClick={() => window.print()}
              className="rounded-full bg-lime-400 px-4 py-2 text-sm font-semibold text-charcoal-900 shadow-md hover:bg-lime-500 transition-colors print:hidden"
            >
              Download PDF
            </button>
          )}
        </div>
        <p className="text-charcoal-900/60 mb-8">
          Seasonal weather trends from the dataset, and real yield averages
          from predictions made on the platform.
        </p>

        {loading && <p className="text-charcoal-900/50 text-sm">Loading...</p>}
        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {!loading && !error && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-lg shadow-charcoal-900/5 break-inside-avoid">
              <div className="flex items-center justify-between mb-4 gap-3">
                <h2 className="font-heading font-semibold text-charcoal-900">
                  Seasonal Weather · {selectedRegion}
                </h2>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="rounded-lg border border-cream-200 bg-white px-3 py-1.5 text-sm text-charcoal-900 print:hidden"
                  >
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <ExportButton
                    onClick={() =>
                      downloadCSV(
                        "seasonal-weather.csv",
                        weatherData.map((w) => ({
                          region: w.region,
                          season: w.season,
                          avg_temperature_c: w.avg_temperature,
                          total_rainfall_mm: w.total_rainfall,
                        }))
                      )
                    }
                  />
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2d9cb" />
                    <XAxis dataKey="season" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avg_temperature" fill="#3f6b3a" name="Avg Temp (°C)" />
                    <Bar dataKey="total_rainfall" fill="#98bb8c" name="Rainfall (mm)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-lg shadow-charcoal-900/5 break-inside-avoid">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-semibold text-charcoal-900">
                  Avg Predicted Yield by Season
                </h2>
                {seasonalYield.length > 0 && (
                  <ExportButton
                    onClick={() =>
                      downloadCSV(
                        "seasonal-yield.csv",
                        seasonalYield.map((r) => ({
                          season: r.season,
                          crop: r.crop_type,
                          avg_predicted_yield_t_ha: r.avg_yield,
                          predictions: r.predictions,
                        }))
                      )
                    }
                  />
                )}
              </div>
              {seasonChartData.length === 0 ? (
                <p className="text-sm text-charcoal-900/50">
                  No predictions made yet - this will populate as farmers use
                  the platform.
                </p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={seasonChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2d9cb" />
                      <XAxis dataKey="season" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} unit=" t/ha" />
                      <Tooltip formatter={(v) => `${v} t/ha`} />
                      <Legend />
                      {seasonCrops.map((crop) => (
                        <Bar
                          key={crop}
                          dataKey={crop}
                          fill={CROP_COLORS[crop] || "#a1a1aa"}
                          radius={[4, 4, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-lg shadow-charcoal-900/5 break-inside-avoid">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-semibold text-charcoal-900">
                  Avg Predicted Yield by Crop
                </h2>
                {yieldChartData.length > 0 && (
                  <ExportButton
                    onClick={() =>
                      downloadCSV(
                        "yield-by-crop.csv",
                        yieldChartData.map((d) => ({
                          crop: d.crop,
                          avg_predicted_yield_t_ha: d.avgYield,
                        }))
                      )
                    }
                  />
                )}
              </div>
              {yieldChartData.length === 0 ? (
                <p className="text-sm text-charcoal-900/50">
                  No predictions made yet - this will populate as farmers use
                  the platform.
                </p>
              ) : (
                <div className="h-64">
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
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}