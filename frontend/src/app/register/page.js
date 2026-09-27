"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const FEATURES = [
  { icon: "🌾", text: "AI-powered yield predictions from field-level data" },
  { icon: "🧪", text: "Soil health analysis against crop-specific benchmarks" },
  { icon: "🌦️", text: "Live weather context for every prediction" },
  { icon: "⚠️", text: "Automated risk assessment and recommendations" },
];

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://127.0.0.1:5000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      router.push("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branded panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-earth-900 via-earth-900 to-brand-800 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand-400/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <h1 className="font-heading text-3xl font-bold text-brand-200">
              AgriVantage
            </h1>
            <p className="text-earth-200/60 text-sm mt-1">
              Agricultural Intelligence Platform
            </p>
          </div>

          <div>
            <h2 className="font-heading text-3xl font-semibold text-white leading-snug mb-8">
              Join farmers making<br />data-driven decisions.
            </h2>
            <div className="space-y-4">
              {FEATURES.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center text-lg shrink-0">
                    {f.icon}
                  </div>
                  <p className="text-earth-100/80 text-sm">{f.text}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-earth-200/40 text-xs">
            Built for farmers, cooperatives, and agricultural analysts.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-stone-50 px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <h1 className="font-heading text-2xl font-semibold text-brand-700">
              AgriVantage
            </h1>
          </div>

          <h2 className="font-heading text-2xl font-semibold text-earth-900 mb-1">
            Create account
          </h2>
          <p className="text-earth-900/60 text-sm mb-8">
            Register to start predicting your crop yield.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-earth-900/80 mb-1">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-earth-200 bg-white px-3 py-2.5 text-sm text-earth-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-shadow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-earth-900/80 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-earth-200 bg-white px-3 py-2.5 text-sm text-earth-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-shadow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-earth-900/80 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-earth-200 bg-white px-3 py-2.5 text-sm text-earth-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-shadow"
              />
            </div>

            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-brand-700 to-brand-600 text-white font-medium py-2.5 shadow-md shadow-brand-700/30 hover:shadow-lg hover:shadow-brand-700/40 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>

          <p className="text-sm text-earth-900/60 mt-6 text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-700 font-semibold hover:text-brand-800">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}