"use client";

// Small pop-up messages ("Field saved", "Field deleted"...).
//
// Use from any client component, no provider needed:
//     import { toast } from "@/lib/toast";
//     toast.success(t("Field saved"));
//     toast.error(err.message);
//     toast.info(t("Calendar file downloaded"));
//
// Pass already-translated text (wrap it in t()). The <Toaster /> that draws the
// messages is rendered once, inside Preferences.js, so every page gets it.

import { useEffect, useState } from "react";

const TOAST_EVENT = "agrivantage:toast";
const REFRESH_EVENT = "agrivantage:notifications-refresh";
let nextId = 1;

function emit(type, message, duration) {
  if (typeof window === "undefined" || !message) return;
  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, { detail: { id: nextId++, type, message: String(message), duration } })
  );
}

export const toast = {
  success: (message, duration = 3500) => emit("success", message, duration),
  error: (message, duration = 5000) => emit("error", message, duration),
  info: (message, duration = 3500) => emit("info", message, duration),
};

// Asks the bell to reload right now (for example after "Start this plan").
export function refreshNotifications() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(REFRESH_EVENT));
}

const STYLES = {
  success: { box: "bg-olive-700 text-lime-50 border-lime-500", icon: "✓" },
  error: { box: "bg-red-700 text-white border-red-400", icon: "!" },
  info: { box: "bg-charcoal-800 text-white border-cream-200/30", icon: "i" },
};

export function Toaster() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    function onToast(e) {
      const item = e.detail;
      setItems((prev) => [...prev.slice(-3), item]); // at most 4 on screen
      setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== item.id)), item.duration);
    }
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-80 max-w-[90vw] flex-col gap-2 print:hidden"
    >
      <style>{`@keyframes toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
      {items.map((item) => {
        const s = STYLES[item.type] || STYLES.info;
        return (
          <div
            key={item.id}
            role="status"
            style={{ animation: "toast-in 180ms ease-out" }}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl ${s.box}`}
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
              {s.icon}
            </span>
            <span className="flex-1">{item.message}</span>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
              className="opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}