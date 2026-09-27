"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { getToken } from "@/lib/auth";

const RISK_STYLES = {
  Low: "bg-green-100 text-green-800 border-green-300",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  High: "bg-red-100 text-red-800 border-red-300",
};

function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }) + " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function HistoryPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    fetch("http://127.0.0.1:5000/history", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setRecords(data))
      .catch(() => setError("Could not load prediction history."))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <Sidebar />
      <div className="flex-1 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-heading text-3xl font-semibold text-earth-900 mb-1">
          History
        </h1>
        <p className="text-earth-900/60 mb-8">
          Every prediction you&apos;ve made, most recent first.
        </p>

        {loading && <p className="text-earth-900/50 text-sm">Loading...</p>}
        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {!loading && !error && records.length === 0 && (
          <div className="bg-white rounded-2xl border border-earth-100 p-8 text-center shadow-lg shadow-earth-900/5">
            <p className="text-earth-900/60 text-sm">
              No predictions yet. Head to Predict Yield to make your first one.
            </p>
          </div>
        )}

        {records.length > 0 && (
          <div className="bg-white rounded-2xl border border-earth-100 shadow-lg shadow-earth-900/5 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-earth-900 text-earth-50">
                  <th className="text-left font-heading font-semibold px-5 py-3.5">Date</th>
                  <th className="text-left font-heading font-semibold px-5 py-3.5">Crop</th>
                  <th className="text-left font-heading font-semibold px-5 py-3.5">Region</th>
                  <th className="text-left font-heading font-semibold px-5 py-3.5">Season</th>
                  <th className="text-left font-heading font-semibold px-5 py-3.5">Predicted</th>
                  <th className="text-left font-heading font-semibold px-5 py-3.5">Typical</th>
                  <th className="text-left font-heading font-semibold px-5 py-3.5">Risk</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`border-t border-earth-50 hover:bg-brand-50/50 transition-colors ${
                      i % 2 === 0 ? "bg-white" : "bg-earth-50/30"
                    }`}
                  >
                    <td className="px-5 py-3.5 text-earth-900/70 whitespace-nowrap">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-earth-900">
                      {r.crop_type}
                    </td>
                    <td className="px-5 py-3.5 text-earth-900/80">{r.region}</td>
                    <td className="px-5 py-3.5 text-earth-900/80">{r.season}</td>
                    <td className="px-5 py-3.5 font-medium text-brand-700 whitespace-nowrap">
                      {r.predicted_yield} t/ha
                    </td>
                    <td className="px-5 py-3.5 text-earth-900/60 whitespace-nowrap">
                      {r.typical_yield_for_crop} t/ha
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${
                          RISK_STYLES[r.risk_level] ||
                          "bg-zinc-100 text-zinc-800 border-zinc-300"
                        }`}
                      >
                        {r.risk_level}
                      </span>
                    </td>
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