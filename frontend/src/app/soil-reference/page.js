"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { getToken } from "@/lib/auth";

const PARAMS = [
  { key: "soil_ph", label: "Soil pH" },
  { key: "soil_moisture", label: "Moisture (%)" },
  { key: "nitrogen_content", label: "Nitrogen" },
  { key: "phosphorus_content", label: "Phosphorus" },
  { key: "potassium_content", label: "Potassium" },
];

export default function SoilReferencePage() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    fetch("http://127.0.0.1:5000/soil-ranges", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setCrops(data))
      .catch(() => setError("Could not load soil reference data."))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <Sidebar />
      <div className="flex-1 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-heading text-3xl font-semibold text-earth-900 mb-1">
          Soil Reference
        </h1>
        <p className="text-earth-900/60 mb-8">
          Healthy soil ranges for each crop, derived from historical
          above-average yield fields. Use this to interpret your own soil
          test results, with or without running a prediction.
        </p>

        {loading && <p className="text-earth-900/50 text-sm">Loading...</p>}
        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {crops.length > 0 && (
          <div className="bg-white rounded-2xl border border-earth-100 shadow-lg shadow-earth-900/5 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-earth-900 text-earth-50">
                  <th className="text-left font-heading font-semibold px-5 py-3.5">
                    Crop
                  </th>
                  <th className="text-left font-heading font-semibold px-5 py-3.5">
                    Avg Yield
                  </th>
                  {PARAMS.map((p) => (
                    <th
                      key={p.key}
                      className="text-left font-heading font-semibold px-5 py-3.5 whitespace-nowrap"
                    >
                      {p.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {crops.map((crop, i) => (
                  <tr
                    key={crop.crop_type}
                    className={`border-t border-earth-50 hover:bg-brand-50/50 transition-colors ${
                      i % 2 === 0 ? "bg-white" : "bg-earth-50/30"
                    }`}
                  >
                    <td className="px-5 py-3.5 font-medium text-earth-900">
                      {crop.crop_type}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-brand-700 bg-brand-50 border border-brand-200 rounded-full px-2.5 py-1 font-medium whitespace-nowrap">
                        {crop.avg_yield} t/ha
                      </span>
                    </td>
                    {PARAMS.map((p) => {
                      const range = crop.ranges[p.key];
                      return (
                        <td
                          key={p.key}
                          className="px-5 py-3.5 text-earth-900/80 whitespace-nowrap"
                        >
                          {range.low} – {range.high}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}