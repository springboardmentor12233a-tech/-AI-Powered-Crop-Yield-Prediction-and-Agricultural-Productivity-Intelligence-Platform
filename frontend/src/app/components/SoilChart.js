"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useLang } from "@/lib/i18n";

// field: the raw soil values submitted, e.g. { soil_ph: 5.09, soil_moisture: 49.73, ... }
// soilRanges: the "soil_ranges" object returned by /predict, e.g.
//   { soil_ph: { low: 5.61, high: 7.39 }, soil_moisture: { low: 20, high: 39.92 }, ... }
export default function SoilChart({ field, soilRanges }) {
  const { t } = useLang();
  const params = [
    { key: "soil_ph", label: "Soil pH" },
    { key: "soil_moisture", label: "Moisture" },
    { key: "nitrogen_content", label: "Nitrogen" },
    { key: "phosphorus_content", label: "Phosphorus" },
    { key: "potassium_content", label: "Potassium" },
  ];

  const data = params.map((p) => ({
    name: t(p.label),
    actual: parseFloat(field[p.key]),
    healthyLow: soilRanges[p.key]?.low,
    healthyHigh: soilRanges[p.key]?.high,
  }));

  return (
    <div className="w-full h-72 bg-white rounded-2xl border border-cream-200 p-5 shadow-lg shadow-charcoal-900/5 hover:shadow-xl transition-shadow duration-300">
      <h3 className="font-heading text-sm font-semibold text-charcoal-900 mb-2">
        {t("Soil conditions vs healthy range")}
      </h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="actual" fill="#15803d" name={t("Actual")} />
          <Bar dataKey="healthyLow" fill="#a1a1aa" name={t("Range low")} />
          <Bar dataKey="healthyHigh" fill="#d4d4d8" name={t("Range high")} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
