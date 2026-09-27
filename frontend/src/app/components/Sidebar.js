"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getUser, logout } from "@/lib/auth";

const FARMER_LINKS = [
  { href: "/", label: "Overview", icon: "🏠" },
  { href: "/predict", label: "Predict Yield", icon: "🌾" },
  { href: "/soil-reference", label: "Soil Reference", icon: "📖" },
  { href: "/history", label: "History", icon: "📜" },
  { href: "/profile", label: "Farm Profile", icon: "🧑‍🌾" },
];

const ADMIN_LINKS = [
  { href: "/admin", label: "Overview", icon: "📊" },
  { href: "/admin/reports", label: "Reports", icon: "📈" },
  { href: "/admin/users", label: "Users", icon: "👥" },
];

export default function Sidebar() {
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setUser(getUser());
  }, []);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const links = user?.role === "admin" ? ADMIN_LINKS : FARMER_LINKS;

  return (
    <aside className="w-64 shrink-0 min-h-screen bg-gradient-to-b from-earth-900 via-earth-900 to-brand-800 text-earth-50 flex flex-col shadow-2xl">
      <div className="px-6 py-6 border-b border-white/10">
        <h1 className="font-heading text-xl font-semibold tracking-tight text-brand-200">
          AgriVantage
        </h1>
        <p className="text-xs text-earth-200/70 mt-0.5">
          Agricultural Intelligence
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-brand-600 text-white shadow-lg shadow-brand-900/40 scale-[1.02]"
                  : "text-earth-100/80 hover:bg-white/5 hover:text-white hover:translate-x-0.5"
              }`}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-semibold shrink-0">
              {user.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="leading-tight min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.name}
              </p>
              <p className="text-xs text-earth-200/60 capitalize">
                {user.role}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-red-300 hover:bg-white/10 hover:border-white/20 transition-colors"
          >
            Log out
          </button>
        </div>
      )}
    </aside>
  );
}