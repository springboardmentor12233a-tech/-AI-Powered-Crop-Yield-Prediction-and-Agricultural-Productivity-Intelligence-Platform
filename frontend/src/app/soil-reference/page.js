"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { getToken } from "@/lib/auth";
import { CROP_IMAGES } from "@/lib/cropImages";

const PARAM_LABELS = {
  soil_ph: "Soil pH",
  soil_moisture: "Moisture (%)",
  nitrogen_content: "Nitrogen",
  phosphorus_content: "Phosphorus",
  potassium_content: "Potassium",
};

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
      .then((data) => {
        if (Array.isArray(data)) {
          setCrops(data);
        } else {
          setError("Session expired or data unavailable - try logging in again.");
        }
      })
      .catch(() => setError("Could not load soil reference data."))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen bg-cream-50 flex">
      <Sidebar />
      <div className="flex-1 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-heading text-4xl font-bold text-charcoal-900 mb-2">
          Soil Reference
        </h1>
        <p className="text-charcoal-900/60 text-lg mb-10">
          Healthy soil ranges for each crop, derived from historical
          above-average yield fields.
        </p>

        {loading && <p className="text-charcoal-900/50 text-base">Loading...</p>}
        {error && (
          <p className="text-base text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {crops.map((crop) => (
            <div
              key={crop.crop_type}
              className="bg-white rounded-3xl border border-cream-200 shadow-lg shadow-charcoal-900/5 hover:shadow-xl transition-shadow duration-300 overflow-hidden"
            >
              <div
                className="h-36 bg-cover bg-center bg-cream-100"
                style={{ backgroundImage: `url('${CROP_IMAGES[crop.crop_type] || ""}')` }}
              />
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading text-xl font-bold text-charcoal-900">
                    {crop.crop_type}
                  </h2>
                  <span className="text-sm text-olive-700 bg-lime-300/40 border border-lime-500 rounded-full px-3 py-1 font-semibold">
                    {crop.avg_yield} t/ha
                  </span>
                </div>

                <div className="space-y-2">
                  {Object.entries(crop.ranges).map(([param, range]) => (
                    <div
                      key={param}
                      className="flex items-center justify-between text-base py-1 border-b border-cream-100 last:border-0"
                    >
                      <span className="text-charcoal-900/60">
                        {PARAM_LABELS[param] || param}
                      </span>
                      <span className="font-medium text-charcoal-900">
                        {range.low} – {range.high}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}