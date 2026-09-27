"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from "recharts";
import Sidebar from "../../components/Sidebar";
import { getToken, getRole } from "@/lib/auth";

const REGIONS = ["North", "South", "East", "West", "Central"];

export default function AdminReportsPage() {
  const [weatherData, setWeatherData] = useState([]);
  const [yieldByCrop, setYieldByCrop] = useState({});
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

    Promise.all([
      fetch("http://127.0.0.1:5000/admin/seasonal-report", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
      fetch("http://127.0.0.1:5000/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
    ])
      .then(([weather, stats]) => {
        setWeatherData(weather);
        setYieldByCrop(stats.avg_yield_by_crop || {});
      })
      .catch(() => setError("Could not load report data."))
      .finally(() => setLoading(false));
  }, [router]);

  const regionData = weatherData.filter((w) => w.region === selectedRegion);

  const yieldChartData = Object.entries(yieldByCrop).map(([crop, avg]) => ({
    crop,
    avgYield: avg,
  }));

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <Sidebar />
      <div className="flex-1 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-heading text-3xl font-semibold text-earth-900 mb-1">
          Reports
        </h1>
        <p className="text-earth-900/60 mb-8">
          Seasonal weather trends from the dataset, and real yield averages
          from predictions made on the platform.
        </p>

        {loading && <p className="text-earth-900/50 text-sm">Loading...</p>}
        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {!loading && !error && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-earth-100 p-6 shadow-lg shadow-earth-900/5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-semibold text-earth-900">
                  Seasonal Weather · {selectedRegion}
                </h2>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="rounded-lg border border-earth-200 bg-white px-3 py-1.5 text-sm text-earth-900"
                >
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
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

            <div className="bg-white rounded-2xl border border-earth-100 p-6 shadow-lg shadow-earth-900/5">
              <h2 className="font-heading font-semibold text-earth-900 mb-4">
                Avg Predicted Yield by Crop
              </h2>
              {yieldChartData.length === 0 ? (
                <p className="text-sm text-earth-900/50">
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