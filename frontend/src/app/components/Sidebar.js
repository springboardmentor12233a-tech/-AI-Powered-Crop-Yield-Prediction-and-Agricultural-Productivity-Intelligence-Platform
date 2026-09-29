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
  { href: "/compare", label: "Compare Fields", icon: "📊" },
  { href: "/assistant", label: "Assistant", icon: "💬" },
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
    <aside className="w-64 shrink-0 min-h-screen bg-cream-50 border-r border-cream-200 flex flex-col print:hidden">
      <div className="px-6 py-7 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-olive-700 flex items-center justify-center text-lime-400 text-lg font-bold">
          A
        </div>
        <div>
          <h1 className="font-heading text-lg font-bold text-charcoal-900 leading-tight">
            AgriVantage
          </h1>
          <p className="text-[11px] text-charcoal-900/50">
            Agricultural Intelligence
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-2">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-full pl-1.5 pr-4 py-1.5 text-base font-medium transition-all duration-200 ${
                active
                  ? "bg-lime-400 text-charcoal-900 shadow-sm"
                  : "text-charcoal-900/60 hover:bg-cream-100 hover:text-charcoal-900"
              }`}
            >
              <span
                className={`h-9 w-9 rounded-full flex items-center justify-center text-base shrink-0 ${
                  active ? "bg-white/70" : "bg-cream-100"
                }`}
              >
                {link.icon}
              </span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="px-4 py-5 border-t border-cream-200">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="h-9 w-9 rounded-full bg-olive-700 text-lime-400 flex items-center justify-center text-sm font-semibold shrink-0">
              {user.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="leading-tight min-w-0">
              <p className="text-sm font-medium text-charcoal-900 truncate">
                {user.name}
              </p>
              <p className="text-xs text-charcoal-900/50 capitalize">
                {user.role}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-full border border-cream-200 bg-cream-100 px-3 py-2 text-sm font-medium text-charcoal-900/70 hover:bg-cream-200 transition-colors"
          >
            Log out
          </button>
        </div>
      )}
    </aside>
  );
}