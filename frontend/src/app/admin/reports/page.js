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
  const [typicalByCrop, setTypicalByCrop] = useState({});
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
      router.push("/dashboard");
      return;
    }

    Promise.all([
      fetch("http://127.0.0.1:5000/admin/seasonal-report", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
      fetch("http://127.0.0.1:5000/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
      fetch("http://127.0.0.1:5000/soil-ranges", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
    ])
      .then(([weather, stats, crops]) => {
        setWeatherData(Array.isArray(weather) ? weather : []);
        setYieldByCrop(stats.avg_yield_by_crop || {});
        setTypicalByCrop(
          Array.isArray(crops)
            ? Object.fromEntries(crops.map((c) => [c.crop_type, c.avg_yield]))
            : {}
        );
      })
      .catch(() => setError("Could not load report data."))
      .finally(() => setLoading(false));
  }, [router]);

  const regionData = weatherData.filter((w) => w.region === selectedRegion);

  // One row per crop from the dataset, so all 5 always appear. "predicted"
  // is undefined (no bar) for crops nobody has run a prediction on yet.
  const yieldChartData = Object.keys(typicalByCrop).map((crop) => ({
    crop,
    typical: typicalByCrop[crop],
    predicted: yieldByCrop[crop],
  }));

  return (
    <div className="min-h-screen bg-cream-50 flex">
      <Sidebar />
      <div className="flex-1 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-heading text-3xl font-semibold text-charcoal-900 mb-1">
          Reports
        </h1>
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
            <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-lg shadow-charcoal-900/5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-semibold text-charcoal-900">
                  Seasonal Weather · {selectedRegion}
                </h2>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="rounded-lg border border-cream-200 bg-white px-3 py-1.5 text-sm text-charcoal-900"
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

            <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-lg shadow-charcoal-900/5">
              <h2 className="font-heading font-semibold text-charcoal-900 mb-1">
                Yield by Crop
              </h2>
              <p className="text-sm text-charcoal-900/50 mb-4">
                Typical yield from the dataset, next to the average predicted
                on this platform. Crops with no predictions yet show only the
                typical bar.
              </p>
              {yieldChartData.length === 0 ? (
                <p className="text-sm text-charcoal-900/50">
                  Crop data unavailable.
                </p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yieldChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2d9cb" />
                      <XAxis dataKey="crop" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} unit=" t/ha" />
                      <Tooltip formatter={(v) => `${v} t/ha`} />
                      <Legend />
                      <Bar dataKey="typical" fill="#c2e02f" name="Typical (dataset)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="predicted" fill="#2f522c" name="Avg predicted (platform)" radius={[6, 6, 0, 0]} />
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