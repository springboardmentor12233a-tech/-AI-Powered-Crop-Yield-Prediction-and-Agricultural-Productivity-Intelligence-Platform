"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
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
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative flex flex-col justify-between"
      style={{ backgroundImage: "url('/login_bg.png')" }}
    >
      {/* Top Brand Header */}
      <div className="absolute top-6 left-6 sm:top-10 sm:left-14 z-20 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-olive-700/90 backdrop-blur-md border border-lime-400/40 flex items-center justify-center text-lime-400 text-lg font-bold shadow-lg">
          A
        </div>
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white drop-shadow-md leading-tight">
            AgriVantage
          </h1>
          <p className="text-xs sm:text-sm text-lime-200/90 font-medium drop-shadow-sm">
            Agricultural Intelligence Platform
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-screen flex items-center px-6 sm:px-14 lg:px-20 pt-24 pb-8 sm:pt-0">
        <div className="max-w-md w-full relative">
          
          {/* Frosted Halo: blurs the background image a little around the box */}
          <div className="relative rounded-[2.25rem] p-3 sm:p-4 bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/15 shadow-2xl">
            
            {/* Login Card: high contrast frosted card adapting to both light and dark modes */}
            <div className="bg-white/95 dark:bg-[#1b2014]/95 backdrop-blur-xl rounded-3xl border border-cream-200 dark:border-[#2a3120] p-8 sm:p-10 shadow-xl">
              <h2 className="font-heading text-3xl font-semibold text-charcoal-900 dark:text-[#ece9dc] mb-2">
                Welcome back
              </h2>
              <p className="text-charcoal-900/70 dark:text-[#ece9dc]/70 text-base mb-8">
                Log in to access your yield predictions.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-base font-medium text-charcoal-900/80 dark:text-[#ece9dc]/80 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="farmer@example.com"
                    className="w-full rounded-lg border border-cream-200 dark:border-[#2a3120] bg-white dark:bg-[#12150e] px-4 py-3 text-base text-charcoal-900 dark:text-[#ece9dc] shadow-sm placeholder:text-charcoal-900/40 dark:placeholder:text-[#ece9dc]/40 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-lime-500 transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-base font-medium text-charcoal-900/80 dark:text-[#ece9dc]/80 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-cream-200 dark:border-[#2a3120] bg-white dark:bg-[#12150e] px-4 py-3 text-base text-charcoal-900 dark:text-[#ece9dc] shadow-sm placeholder:text-charcoal-900/40 dark:placeholder:text-[#ece9dc]/40 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-lime-500 transition-shadow"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg px-3 py-2 font-medium">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-lime-400 text-charcoal-900 font-semibold text-lg py-3.5 shadow-md hover:bg-lime-500 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {loading ? "Logging in..." : "Log In"}
                </button>
              </form>

              <p className="text-base text-charcoal-900/70 dark:text-[#ece9dc]/70 mt-6 text-center">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-olive-700 dark:text-lime-400 font-semibold hover:underline"
                >
                  Register
                </Link>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}