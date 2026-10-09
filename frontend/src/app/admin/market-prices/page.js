"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import { getToken, getRole } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { toast } from "@/lib/toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

const INPUT_CLASS =
  "w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-charcoal-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-lime-500 font-mono";

export default function AdminMarketPricesPage() {
  const t = useT();
  const router = useRouter();

  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    loadPrices();
  }, [router]);

  async function loadPrices() {
    try {
      const res = await fetch(`${API_URL}/admin/market-prices`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) setPrices(data.market_prices || []);
    } catch {
      toast.error(t("Failed to load market prices."));
    } finally {
      setLoading(false);
    }
  }

  function handleChange(crop, field, val) {
    setPrices((prev) =>
      prev.map((p) => (p.crop_type === crop ? { ...p, [field]: Number(val) } : p))
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/market-prices`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ prices }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update prices");
      toast.success(t("Market prices updated! Farmers will see these in their Farm Planner."));
      loadPrices();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!confirm(t("Reset all crops to system baseline defaults?"))) return;
    try {
      const res = await fetch(`${API_URL}/admin/market-prices/reset`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Could not reset prices.");
      toast.info(t("Prices reset to defaults."));
      loadPrices();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-cream-50 flex">
      <Sidebar />
      <div className="flex-1 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="font-heading text-3xl font-bold text-charcoal-900">
              {t("Market Prices & Cultivation Economics")}
            </h1>
            <p className="text-charcoal-900/60 mt-1">
              {t("Configure default crop prices and cost per hectare. Replaces hardcoded placeholders in the Farm Planner.")}
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-cream-200 p-6 shadow-sm mb-6">
            {loading ? (
              <p className="text-charcoal-900/50">{t("Loading prices...")}</p>
            ) : (
              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-cream-100 text-charcoal-900">
                        <th className="px-4 py-3 font-semibold">{t("Crop Type")}</th>
                        <th className="px-4 py-3 font-semibold">{t("Market Price (₹ / tonne)")}</th>
                        <th className="px-4 py-3 font-semibold">{t("Cultivation Cost (₹ / ha)")}</th>
                        <th className="px-4 py-3 font-semibold">{t("Last Updated")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-100">
                      {prices.map((p) => (
                        <tr key={p.crop_type} className="hover:bg-cream-50/70">
                          <td className="px-4 py-3 font-bold text-charcoal-900">
                            {p.crop_type}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              value={p.price_per_tonne}
                              onChange={(e) => handleChange(p.crop_type, "price_per_tonne", e.target.value)}
                              className={INPUT_CLASS}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              value={p.cost_per_ha}
                              onChange={(e) => handleChange(p.crop_type, "cost_per_ha", e.target.value)}
                              className={INPUT_CLASS}
                            />
                          </td>
                          <td className="px-4 py-3 text-xs text-charcoal-900/50 whitespace-nowrap">
                            {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : t("System Default")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-cream-100">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs font-semibold text-charcoal-900/60 hover:text-charcoal-900 transition-colors"
                  >
                    {t("Reset to System Defaults")}
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-full bg-lime-400 px-6 py-2.5 text-sm font-bold text-charcoal-900 shadow hover:bg-lime-500 transition-colors disabled:opacity-50"
                  >
                    {saving ? t("Saving...") : t("Save & Update Farm Planner")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}