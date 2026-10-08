"use client";

// Auto-translation. Write plain English in the code:
//     t("Predict Yield")                      t("You farm {n} fields", { n: 3 })
// In English the text is shown as is. In Hindi/Kannada the text is looked up in a
// local cache; anything missing is sent (in batches) to the backend /translate
// endpoint, which translates it once with Groq and stores it for everyone.
// Rules: never build sentences by joining strings - use {placeholders} instead.

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

const API_URL = "http://127.0.0.1:5000";
const CACHE_PREFIX = "tr_cache_v1_"; // bump v1 -> v2 to force everyone to re-fetch
const BATCH_MAX = 60;

export const LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "kn", label: "ಕನ್ನಡ" },
];

const LangContext = createContext({
  lang: "en",
  setLang: () => {},
  t: (s) => s,
  translating: false,
});

function interpolate(text, vars) {
  if (!vars) return text;
  let out = text;
  for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  return out;
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState("en");
  const [version, setVersion] = useState(0); // bumps when new translations arrive
  const [translating, setTranslating] = useState(false);

  const langRef = useRef("en");
  const cache = useRef({}); // { hi: { "Predict Yield": "..." } }
  const queue = useRef(new Set()); // English strings waiting to be sent
  const asked = useRef(new Set()); // "hi|text" already requested this session
  const timer = useRef(null);

  const flush = useCallback(async () => {
    timer.current = null;
    const code = langRef.current;
    if (code === "en" || queue.current.size === 0) {
      setTranslating(false);
      return;
    }
    const strings = Array.from(queue.current).slice(0, BATCH_MAX);
    strings.forEach((s) => queue.current.delete(s));
    setTranslating(true);

    try {
      const res = await fetch(`${API_URL}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang: code, strings }),
      });
      if (res.ok) {
        const data = await res.json();
        const failed = new Set(data.failed || []);
        const bucket = (cache.current[code] = cache.current[code] || {});
        for (const s of strings) {
          if (data.translations?.[s] && !failed.has(s)) bucket[s] = data.translations[s];
        }
        try {
          localStorage.setItem(CACHE_PREFIX + code, JSON.stringify(bucket));
        } catch {}
        setVersion((v) => v + 1);
      }
    } catch {
      // Network/backend problem: the English text simply stays on screen.
    } finally {
      if (queue.current.size > 0 && langRef.current === code) {
        timer.current = setTimeout(flush, 50);
      } else {
        setTranslating(false);
      }
    }
  }, []);

  const request = useCallback(
    (text) => {
      const key = `${langRef.current}|${text}`;
      if (asked.current.has(key)) return;
      asked.current.add(key);
      queue.current.add(text);
      if (!timer.current) timer.current = setTimeout(flush, 60);
    },
    [flush]
  );

  const setLang = useCallback((code) => {
    if (!LANGS.some((l) => l.code === code)) return;
    langRef.current = code;
    queue.current.clear();
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (code !== "en" && !cache.current[code]) {
      try {
        cache.current[code] = JSON.parse(localStorage.getItem(CACHE_PREFIX + code) || "{}");
      } catch {
        cache.current[code] = {};
      }
    }
    setLangState(code);
    setTranslating(false);
    try {
      localStorage.setItem("lang", code);
    } catch {}
  }, []);

  // Restore the saved language after mount (localStorage doesn't exist on the server).
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lang");
      if (saved && saved !== "en") setLang(saved);
    } catch {}
  }, [setLang]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // version is listed so components re-render when translations arrive.
  const t = useCallback(
    (text, vars) => {
      if (typeof text !== "string" || !text) return text;
      let out = text;
      if (lang !== "en") {
        const hit = cache.current[lang]?.[text];
        if (hit !== undefined) out = hit;
        else request(text);
      }
      return interpolate(out, vars);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang, version, request]
  );

  return (
    <LangContext.Provider value={{ lang, setLang, t, translating }}>{children}</LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

export function useT() {
  return useContext(LangContext).t;
}