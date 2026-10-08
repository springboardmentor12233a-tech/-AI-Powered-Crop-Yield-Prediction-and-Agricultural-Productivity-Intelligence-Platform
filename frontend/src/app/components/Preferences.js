"use client";

import { useEffect, useRef, useState } from "react";
import { useLang, LANGS } from "@/lib/i18n";

// Slim header bar rendered once from layout.js (so every page, including
// Login/Register/landing, gets it). It sits in the normal page flow above the
// content instead of floating over it.
export default function Preferences() {
  const { lang, setLang, t, translating } = useLang();
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  // Close the language menu on outside click or Escape.
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

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  const current = LANGS.find((l) => l.code === lang) || LANGS[0];
  const btn =
    "flex items-center gap-2 rounded-lg bg-olive-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-olive-800 transition-colors focus:outline-none focus:ring-2 focus:ring-lime-400";

  return (
    <div className="relative z-40 flex h-12 items-center justify-end gap-2 border-b border-cream-200 bg-cream-50 px-4 print:hidden">
      <button
        type="button"
        onClick={toggleTheme}
        title={dark ? t("Light") : t("Dark")}
        className={btn}
      >
        <span>{dark ? "☀️" : "🌙"}</span>
        <span>{dark ? t("Light") : t("Dark")}</span>
      </button>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={t("Language")}
          className={btn}
        >
          <span>🌐</span>
          <span>{current.label}</span>
          {translating && <span className="animate-pulse text-lime-300">…</span>}
          <span className={`text-[10px] transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
        </button>

        {open && (
          <ul
            role="listbox"
            className="absolute right-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-cream-200 bg-white p-1 shadow-xl"
          >
            {LANGS.map((l) => (
              <li key={l.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={lang === l.code}
                  onClick={() => {
                    setLang(l.code);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    lang === l.code
                      ? "bg-lime-400 font-semibold text-[#1f2317]"
                      : "text-charcoal-900 hover:bg-cream-100"
                  }`}
                >
                  <span>{l.label}</span>
                  {lang === l.code && <span>✓</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
