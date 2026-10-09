"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken, getUser } from "@/lib/auth";
import { useT } from "@/lib/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
const POLL_MS = 60000;
const REFRESH_EVENT = "agrivantage:notifications-refresh";

function formatDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

function dayDiff(iso) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((new Date(`${iso}T00:00:00`) - today) / 86400000);
}

function describe(n, t) {
  const d = n.data || {};

  if (n.kind === "announcement") {
    const icon =
      d.category === "Weather"
        ? "🌧️"
        : d.category === "Alert"
        ? "🚨"
        : d.category === "Feature"
        ? "✨"
        : "📢";
    return {
      icon,
      title: d.title || t("Platform Announcement"),
      body: d.message || "",
    };
  }

  if (n.kind === "soil") {
    return {
      icon: "🧪",
      title: t("{parameter} is {status} in {field}", {
        parameter: t(d.parameter),
        status: t(d.status),
        field: d.field,
      }),
      body: t("Healthy range for {crop}: {low} – {high}", { crop: d.crop, low: d.low, high: d.high }),
    };
  }

  if (n.kind === "risk") {
    return {
      icon: "⚠️",
      title: t("High risk prediction"),
      body: t("{crop} in {region}: {y} t/ha. Several soil values are outside the healthy range.", {
        crop: d.crop,
        region: d.region,
        y: d.yield,
      }),
    };
  }

  if (n.kind === "task") {
    const diff = dayDiff(d.date);
    const when =
      diff < 0 ? t("Overdue") : diff === 0 ? t("Today") : diff === 1 ? t("Tomorrow") : formatDate(d.date);
    return {
      icon: "🗓️",
      title: t(d.title),
      body: `${t("{crop} on {field}", { crop: d.crop, field: d.field })} · ${when} (${formatDate(d.date)})`,
    };
  }

  return { icon: "🔔", title: "", body: "" };
}

export default function NotificationBell({ btnClass = "" }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();

  const [enabled, setEnabled] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.notifications || []);
      setUnread(data.unread || 0);
    } catch {}
  }, []);

  useEffect(() => {
    const ok = !!getToken() && getUser()?.role !== "admin";
    setEnabled(ok);
    if (ok) {
      refresh();
    } else {
      setItems([]);
      setUnread(0);
      setOpen(false);
    }
  }, [pathname, refresh]);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(refresh, POLL_MS);
    const onRefresh = () => refresh();
    window.addEventListener(REFRESH_EVENT, onRefresh);
    return () => {
      clearInterval(id);
      window.removeEventListener(REFRESH_EVENT, onRefresh);
    };
  }, [enabled, refresh]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function post(path) {
    try {
      await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    } catch {}
  }

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
    post("/notifications/read-all");
  }

  function openItem(n) {
    if (!n.is_read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      post(`/notifications/${n.id}/read`);
    }
    setOpen(false);
    router.push(n.link || "/dashboard");
  }

  if (!enabled) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => {
          if (!open) refresh();
          setOpen((o) => !o);
        }}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={t("Notifications")}
        className={`${btnClass} relative`}
      >
        <span>🔔</span>
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-96 max-w-[90vw] overflow-hidden rounded-xl border border-cream-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-cream-200 px-4 py-3">
            <p className="font-heading font-semibold text-charcoal-900">{t("Notifications")}</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-olive-700 hover:text-olive-800"
              >
                {t("Mark all as read")}
              </button>
            )}
          </div>

          <div className="max-h-[26rem] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-charcoal-900/50">
                {t("You're all caught up.")}
              </p>
            ) : (
              items.map((n) => {
                const view = describe(n, t);
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => openItem(n)}
                    className={`flex w-full items-start gap-3 border-b border-cream-100 px-4 py-3 text-left transition-colors hover:bg-cream-100 ${
                      n.is_read ? "" : "bg-lime-300/20"
                    }`}
                  >
                    <span className="mt-0.5 text-lg">{view.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm text-charcoal-900 ${n.is_read ? "" : "font-semibold"}`}
                      >
                        {view.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-charcoal-900/60">{view.body}</span>
                    </span>
                    {!n.is_read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-red-500" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}