"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "./components/Sidebar";
import { getToken, getUser } from "@/lib/auth";

const QUICK_LINKS = [
  {
    href: "/predict",
    icon: "🌾",
    title: "Predict Yield",
    desc: "Enter field conditions and get an AI-powered yield prediction.",
  },
  {
    href: "/soil-reference",
    icon: "📖",
    title: "Soil Reference",
    desc: "Look up healthy soil ranges for each crop type.",
  },
  {
    href: "/profile",
    icon: "🧑‍🌾",
    title: "Farm Profile",
    desc: "Save your crop, region, and soil test results.",
  },
  {
    href: "/history",
    icon: "📜",
    title: "History",
    desc: "Review your past predictions.",
  },
];

export default function Overview() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [hasProfile, setHasProfile] = useState(null);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [typicalYield, setTypicalYield] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    setUser(getUser());

    // Load saved fields - the first one saved is used as the "primary"
    // field for these widgets, since a farmer can have several.
    fetch("http://127.0.0.1:5000/profiles", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const primary = data && data.length > 0 ? data[0] : null;
        setHasProfile(!!primary);
        setProfile(primary);

        if (primary?.region) {
          setWeatherLoading(true);
          fetch(`http://127.0.0.1:5000/live-weather?region=${primary.region}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => res.json())
            .then((w) => setWeather(w))
            .catch(() => setWeather(null))
            .finally(() => setWeatherLoading(false));
        }

        if (primary?.crop_type) {
          fetch("http://127.0.0.1:5000/soil-ranges", {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => res.json())
            .then((allCrops) => {
              const match = allCrops.find(
                (c) => c.crop_type === primary.crop_type
              );
              if (match) setTypicalYield(match.avg_yield);
            })
            .catch(() => {});
        }
      })
      .catch(() => setHasProfile(null));
  }, [router]);

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <Sidebar />
      <div className="flex-1 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-heading text-3xl font-semibold text-earth-900 mb-1">
          Welcome{user?.name ? `, ${user.name}` : ""}
        </h1>
        <p className="text-earth-900/60 mb-8">
          Here&apos;s what&apos;s happening with your farm today.
        </p>

        {hasProfile === false && (
          <div className="bg-brand-50 border border-brand-200 rounded-2xl p-5 mb-8 flex items-center justify-between">
            <div>
              <p className="font-medium text-earth-900">
                You haven&apos;t saved any fields yet
              </p>
              <p className="text-sm text-earth-900/60 mt-0.5">
                Save a field&apos;s crop, region, and soil test results, and
                you can apply it to any prediction from now on - plus see
                live weather and yield stats right here.
              </p>
            </div>
            <Link
              href="/profile"
              className="shrink-0 rounded-lg bg-brand-700 text-white text-sm font-medium px-4 py-2 hover:bg-brand-800 transition-colors"
            >
              Set it up
            </Link>
          </div>
        )}

        {hasProfile && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
            <div className="bg-gradient-to-br from-earth-900 to-brand-800 rounded-2xl p-6 shadow-lg shadow-earth-900/10 text-white">
              <p className="text-xs uppercase tracking-wide text-brand-200 mb-2">
                Live Weather · {profile?.field_name} ({profile?.region})
              </p>
              {weatherLoading ? (
                <p className="text-earth-100/70 text-sm">Fetching...</p>
              ) : weather?.live_temperature != null ? (
                <p className="text-4xl font-heading font-bold">
                  {weather.live_temperature}°C
                </p>
              ) : (
                <p className="text-earth-100/70 text-sm">
                  Weather unavailable right now.
                </p>
              )}
              {weather?.city_used && (
                <p className="text-xs text-earth-200/50 mt-1">
                  via {weather.city_used}
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-earth-100 p-6 shadow-lg shadow-earth-900/5">
              <p className="text-xs uppercase tracking-wide text-earth-900/40 mb-2">
                Typical Yield · {profile?.field_name} ({profile?.crop_type})
              </p>
              {typicalYield != null ? (
                <p className="text-4xl font-heading font-bold text-brand-700">
                  {typicalYield}
                  <span className="text-lg text-brand-700/60 font-normal ml-1">
                    t/ha
                  </span>
                </p>
              ) : (
                <p className="text-earth-900/50 text-sm">Loading...</p>
              )}
              <p className="text-xs text-earth-900/40 mt-1">
                Average across historical fields
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white rounded-2xl border border-earth-100 p-6 shadow-lg shadow-earth-900/5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="text-2xl mb-2">{link.icon}</div>
              <h3 className="font-heading font-semibold text-earth-900 mb-1">
                {link.title}
              </h3>
              <p className="text-sm text-earth-900/60">{link.desc}</p>
            </Link>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}