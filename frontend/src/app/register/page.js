"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <div
      className="min-h-screen bg-cover bg-center relative"
      // PASTE YOUR IMAGE PATH HERE, e.g. /login_bg.jpg (place file in frontend/public/)
      style={{ backgroundImage: "url('/login_bg.jpg')" }}
    >
      <div className="absolute top-8 left-8 sm:top-10 sm:left-16">
        <h1 className="font-heading text-3xl font-bold text-olive-700">
          AgriVantage
        </h1>
        <p className="text-base text-charcoal-900/60 mt-1">
          Agricultural Intelligence Platform
        </p>
      </div>

      <div className="min-h-screen flex items-center px-8 sm:px-16 lg:px-20">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl border border-cream-200 shadow-xl shadow-charcoal-900/10 p-10">
            <h2 className="font-heading text-3xl font-semibold text-charcoal-900 mb-2">
              Create account
            </h2>
            <p className="text-charcoal-900/60 text-base mb-8">
              Register to start predicting your crop yield.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-base font-medium text-charcoal-900/80 mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-cream-200 bg-white px-4 py-3 text-base text-charcoal-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-lime-500 transition-shadow"
                />
              </div>

              <div>
                <label className="block text-base font-medium text-charcoal-900/80 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-cream-200 bg-white px-4 py-3 text-base text-charcoal-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-lime-500 transition-shadow"
                />
              </div>

              <div>
                <label className="block text-base font-medium text-charcoal-900/80 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-cream-200 bg-white px-4 py-3 text-base text-charcoal-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-lime-500 transition-shadow"
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
                className="w-full rounded-full bg-lime-400 text-charcoal-900 font-semibold text-lg py-3.5 shadow-md hover:bg-lime-500 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? "Creating account..." : "Register"}
              </button>
            </form>

            <p className="text-base text-charcoal-900/60 mt-6 text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-olive-700 font-semibold hover:text-olive-800">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}