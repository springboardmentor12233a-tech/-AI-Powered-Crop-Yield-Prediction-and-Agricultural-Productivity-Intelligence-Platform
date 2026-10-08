"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { useLang } from "@/lib/i18n";

// predictedYield: result.predicted_yield
// typicalYield: result.typical_yield_for_crop
export default function YieldChart({ predictedYield, typicalYield, cropType }) {
  const { t } = useLang();
  const crop = t(cropType);
  const data = [
    { name: t("Predicted"), value: predictedYield },
    { name: t("Typical {crop}", { crop }), value: typicalYield },
  ];

  const isAboveAverage = predictedYield >= typicalYield;

  return (
    <div className="w-full h-56 bg-white rounded-2xl border border-cream-200 p-5 shadow-lg shadow-charcoal-900/5 hover:shadow-xl transition-shadow duration-300">
      <h3 className="font-heading text-sm font-semibold text-charcoal-900 mb-2">
        {t("Predicted yield vs typical {crop} yield", { crop })}
      </h3>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
          <XAxis type="number" tick={{ fontSize: 12 }} unit=" t/ha" />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={110} />
          <Tooltip formatter={(v) => `${v} t/ha`} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]}>
            <Cell fill={isAboveAverage ? "#15803d" : "#b45309"} />
            <Cell fill="#a1a1aa" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-zinc-500 mt-1">
        {isAboveAverage
          ? t("This field is predicted to yield above the typical average for {crop}.", { crop })
          : t("This field is predicted to yield below the typical average for {crop}.", { crop })}
      </p>
    </div>
  );
}
