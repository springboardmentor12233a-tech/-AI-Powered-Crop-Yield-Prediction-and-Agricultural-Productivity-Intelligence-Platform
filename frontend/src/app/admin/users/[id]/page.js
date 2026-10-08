"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "../../../components/Sidebar";
import { getToken, getRole } from "@/lib/auth";

const RISK_STYLES = {
  Low: "bg-green-100 text-green-800 border-green-300",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  High: "bg-red-100 text-red-800 border-red-300",
};

function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminUserDetailPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const params = useParams();

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

    fetch(`http://127.0.0.1:5000/admin/users/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setData)
      .catch(() => setError("Could not load this user."))
      .finally(() => setLoading(false));
  }, [router, params.id]);

  const user = data?.user;
  const profiles = data?.profiles || [];
  const predictions = data?.predictions || [];

  const avgYield = predictions.length
    ? (
        predictions.reduce((s, p) => s + (p.predicted_yield || 0), 0) / predictions.length
      ).toFixed(2)
    : null;

  return (
    <div className="min-h-screen bg-cream-50 flex">
      <Sidebar />
      <div className="flex-1 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/admin/users"
            className="text-sm font-medium text-olive-700 hover:text-olive-800 mb-4 inline-block"
          >
            ← Back to Users
          </Link>

          {loading && <p className="text-charcoal-900/50 text-sm">Loading...</p>}
          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {user && (
            <>
              <div className="flex items-center gap-4 mb-8">
                <div className="h-14 w-14 rounded-full bg-olive-700 text-lime-400 flex items-center justify-center text-xl font-semibold">
                  {user.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <h1 className="font-heading text-3xl font-bold text-charcoal-900">
                    {user.name}
                  </h1>
                  <p className="text-charcoal-900/60">{user.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-lg shadow-charcoal-900/5">
                  <p className="text-xs uppercase tracking-wide text-charcoal-900/40 mb-2">
                    Saved Fields
                  </p>
                  <p className="text-4xl font-heading font-bold text-olive-700">
                    {profiles.length}
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-lg shadow-charcoal-900/5">
                  <p className="text-xs uppercase tracking-wide text-charcoal-900/40 mb-2">
                    Predictions Made
                  </p>
                  <p className="text-4xl font-heading font-bold text-olive-700">
                    {predictions.length}
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-lg shadow-charcoal-900/5">
                  <p className="text-xs uppercase tracking-wide text-charcoal-900/40 mb-2">
                    Avg Predicted Yield
                  </p>
                  <p className="text-4xl font-heading font-bold text-olive-700">
                    {avgYield ?? "-"}
                    {avgYield && (
                      <span className="text-lg text-olive-700/60 font-normal ml-1">t/ha</span>
                    )}
                  </p>
                </div>
              </div>

              <h2 className="font-heading text-xl font-bold text-charcoal-900 mb-4">
                Saved Fields
              </h2>
              {profiles.length === 0 ? (
                <p className="text-sm text-charcoal-900/50 mb-8">
                  This farmer hasn&apos;t saved any fields yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {profiles.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl border border-cream-200 p-5 shadow-lg shadow-charcoal-900/5"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-heading font-semibold text-charcoal-900">
                          {p.field_name}
                        </h3>
                        <span className="text-xs text-olive-700 bg-lime-300/30 border border-lime-400 rounded-full px-2.5 py-1">
                          {p.region}
                        </span>
                      </div>
                      <p className="text-sm text-charcoal-900/70 mb-1">
                        Crop: <span className="font-medium">{p.crop_type}</span>
                        {p.field_size_hectares != null && (
                          <span className="text-charcoal-900/50"> · {p.field_size_hectares} ha</span>
                        )}
                      </p>
                      <p className="text-xs text-charcoal-900/50">
                        pH {p.soil_ph} · N {p.nitrogen_content} · P {p.phosphorus_content} · K{" "}
                        {p.potassium_content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <h2 className="font-heading text-xl font-bold text-charcoal-900 mb-4">
                Prediction History
              </h2>
              {predictions.length === 0 ? (
                <p className="text-sm text-charcoal-900/50">
                  This farmer hasn&apos;t made any predictions yet.
                </p>
              ) : (
                <div className="bg-white rounded-2xl border border-cream-200 shadow-lg shadow-charcoal-900/5 overflow-hidden overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-olive-700 text-lime-400">
                        <th className="text-left font-heading font-semibold px-5 py-3.5">Date</th>
                        <th className="text-left font-heading font-semibold px-5 py-3.5">Crop</th>
                        <th className="text-left font-heading font-semibold px-5 py-3.5">Region</th>
                        <th className="text-left font-heading font-semibold px-5 py-3.5">Season</th>
                        <th className="text-left font-heading font-semibold px-5 py-3.5">Predicted</th>
                        <th className="text-left font-heading font-semibold px-5 py-3.5">Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {predictions.map((r, i) => (
                        <tr
                          key={r.id}
                          className={`border-t border-cream-100 ${
                            i % 2 === 0 ? "bg-white" : "bg-cream-100/30"
                          }`}
                        >
                          <td className="px-5 py-3.5 text-charcoal-900/70 whitespace-nowrap">
                            {formatDate(r.created_at)}
                          </td>
                          <td className="px-5 py-3.5 font-medium text-charcoal-900">
                            {r.crop_type}
                          </td>
                          <td className="px-5 py-3.5 text-charcoal-900/80">{r.region}</td>
                          <td className="px-5 py-3.5 text-charcoal-900/80">{r.season}</td>
                          <td className="px-5 py-3.5 font-medium text-olive-700 whitespace-nowrap">
                            {r.predicted_yield} t/ha
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${
                                RISK_STYLES[r.risk_level] || "bg-zinc-100 text-zinc-800 border-zinc-300"
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}