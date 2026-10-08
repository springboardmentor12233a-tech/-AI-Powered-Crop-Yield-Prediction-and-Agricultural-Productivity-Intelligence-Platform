"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, getRole } from "@/lib/auth";

const FEATURES = [
  {
    icon: "🌾",
    title: "AI Yield Prediction",
    desc: "Get a precise crop yield estimate from your field's own soil, weather, and crop data — powered by a tuned XGBoost model.",
  },
  {
    icon: "🧪",
    title: "Soil Health Analysis",
    desc: "Every soil value is checked against healthy ranges specific to your crop, so you know exactly what's off and why.",
  },
  {
    icon: "🌦️",
    title: "Live Weather Context",
    desc: "Real-time temperature for your region, pulled automatically — no manual lookups needed.",
  },
  {
    icon: "⚠️",
    title: "Risk Assessment",
    desc: "A clear Low/Medium/High risk rating for every prediction, based on how many soil conditions need attention.",
  },
  {
    icon: "🧑‍🌾",
    title: "Multiple Farm Profiles",
    desc: "Save details for every field you farm, and apply any of them to a new prediction in one click.",
  },
  {
    icon: "📊",
    title: "History & Reports",
    desc: "Track every prediction over time, compare fields, and see platform-wide trends if you're an admin.",
  },
];

const STEPS = [
  { num: "01", title: "Save your field", desc: "Enter your crop, region, and latest soil test results once." },
  { num: "02", title: "Run a prediction", desc: "Add this season's conditions and get an instant yield estimate." },
  { num: "03", title: "Act on the insight", desc: "See your risk level and AI-generated recommendations for what to do next." },
];

export default function Landing() {
  const [checked, setChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (token) {
      router.push(getRole() === "admin" ? "/admin" : "/dashboard");
      return;
    }
    setChecked(true);
  }, [router]);

  if (!checked) return null;

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Top nav */}
      <div className="border-b border-cream-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-olive-700 flex items-center justify-center text-lime-400 text-base font-bold">
              A
            </div>
            <span className="font-heading text-lg font-bold text-charcoal-900">
              AgriVantage
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-charcoal-900/70 hover:text-charcoal-900 px-4 py-2"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-lime-400 text-charcoal-900 text-sm font-semibold px-5 py-2 shadow-md hover:bg-lime-500 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="font-heading text-5xl sm:text-6xl font-bold text-charcoal-900 leading-tight mb-6">
          Turn field data into<br />confident harvest decisions.
        </h1>
        <p className="text-lg text-charcoal-900/60 max-w-xl mx-auto mb-8">
          AgriVantage uses AI to predict crop yield, analyze soil health, and
          flag risk — built for farmers, cooperatives, and agricultural
          analysts.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="rounded-full bg-lime-400 text-charcoal-900 font-semibold text-lg px-8 py-3.5 shadow-md hover:bg-lime-500 hover:-translate-y-0.5 transition-all"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-cream-200 bg-white text-charcoal-900 font-semibold text-lg px-8 py-3.5 hover:bg-cream-100 transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>

      {/* Feature grid */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="font-heading text-3xl font-bold text-charcoal-900 text-center mb-2">
          Everything you need to manage your fields
        </h2>
        <p className="text-charcoal-900/60 text-center mb-12">
          No sensors, no guesswork — just your field's data and AI.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="h-11 w-11 rounded-xl bg-lime-300/40 flex items-center justify-center text-xl mb-4">
                {f.icon}
              </div>
              <h3 className="font-heading font-semibold text-charcoal-900 mb-1.5">
                {f.title}
              </h3>
              <p className="text-sm text-charcoal-900/60 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-olive-700 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-heading text-3xl font-bold text-white text-center mb-12">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.num}>
                <p className="font-heading text-4xl font-bold text-lime-400 mb-3">
                  {s.num}
                </p>
                <h3 className="font-heading text-lg font-semibold text-white mb-2">
                  {s.title}
                </h3>
                <p className="text-sm text-cream-100/70 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="font-heading text-3xl font-bold text-charcoal-900 mb-4">
          Ready to get started?
        </h2>
        <p className="text-charcoal-900/60 mb-8">
          Create an account and run your first prediction in minutes.
        </p>
        <Link
          href="/register"
          className="rounded-full bg-lime-400 text-charcoal-900 font-semibold text-lg px-8 py-3.5 shadow-md hover:bg-lime-500 hover:-translate-y-0.5 transition-all inline-block"
        >
          Get Started Free
        </Link>
      </div>

      {/* Footer */}
      <div className="border-t border-cream-200 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <span className="text-sm text-charcoal-900/50">
            © 2026 AgriVantage. Agricultural Intelligence Platform.
          </span>
          <div className="flex gap-4">
            <Link href="/login" className="text-sm text-charcoal-900/50 hover:text-charcoal-900">
              Log In
            </Link>
            <Link href="/register" className="text-sm text-charcoal-900/50 hover:text-charcoal-900">
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}