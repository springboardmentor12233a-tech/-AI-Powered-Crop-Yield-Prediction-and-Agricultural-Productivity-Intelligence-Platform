"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { getToken, getUser } from "@/lib/auth";
import { useLang } from "@/lib/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
const CROPS = ["Wheat", "Corn", "Rice", "Soybean", "Barley"];
const MAX_BYTES = 8 * 1024 * 1024;

const STATUS_STYLES = {
  healthy: "bg-green-100 text-green-800 border-green-300",
  problem: "bg-red-100 text-red-800 border-red-300",
  unclear: "bg-zinc-100 text-zinc-700 border-zinc-300",
};

const CONFIDENCE_STYLES = {
  high: "bg-red-100 text-red-800 border-red-300",
  medium: "bg-orange-100 text-orange-800 border-orange-300",
  low: "bg-zinc-100 text-zinc-700 border-zinc-300",
};

const INPUT_CLASS =
  "w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-charcoal-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-lime-500";

function Section({ title, items, icon }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-900/50 mb-2">{title}</p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-charcoal-900/80 flex gap-2">
            <span className="text-olive-700">{icon}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DiagnosePage() {
  const { t, lang } = useLang();
  const router = useRouter();
  const fileRef = useRef(null);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [crop, setCrop] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    if (getUser()?.role === "admin") router.push("/admin");
  }, [router]);

  // Free the preview URL when it changes or the page closes.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleFile(e) {
    const f = e.target.files?.[0];
    setResult(null);
    setError(null);
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError(t("Please choose an image file."));
      return;
    }
    if (f.size > MAX_BYTES) {
      setError(t("The photo is too large (max 8 MB)."));
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleDiagnose() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const form = new FormData();
    form.append("image", file);
    if (crop) form.append("crop_type", crop);
    if (notes.trim()) form.append("notes", notes.trim());
    form.append("lang", lang);

    try {
      // No Content-Type header here: the browser adds the multipart boundary itself.
      const res = await fetch(`${API_URL}/diagnose`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("Something went wrong"));
      setResult(data.diagnosis);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream-50 flex">
      <Sidebar />
      <div className="flex-1 py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-heading text-4xl font-bold text-charcoal-900 mb-2">
            {t("Crop Doctor")}
          </h1>
          <p className="text-charcoal-900/60 text-lg mb-8">
            {t("Upload a clear photo of the affected leaf or plant and get likely problems and what to do.")}
          </p>

          <div className="bg-white rounded-3xl border border-cream-200 p-6 shadow-lg shadow-charcoal-900/5 mb-6">
            {!preview ? (
              <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cream-200 bg-cream-50 py-12 px-4 text-center cursor-pointer hover:border-lime-500 transition-colors">
                <span className="text-4xl mb-2">📷</span>
                <span className="font-medium text-charcoal-900">{t("Tap to take or choose a photo")}</span>
                <span className="text-xs text-charcoal-900/50 mt-1">
                  {t("JPG, PNG or WEBP, up to 8 MB")}
                </span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFile}
                  className="hidden"
                />
              </label>
            ) : (
              <div>
                <img
                  src={preview}
                  alt={t("Your crop photo")}
                  className="max-h-80 w-full rounded-2xl object-contain bg-cream-100"
                />
                <button
                  type="button"
                  onClick={reset}
                  className="mt-3 text-sm font-medium text-red-600 hover:text-red-700"
                >
                  {t("Remove photo")}
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              <div>
                <label className="block text-base font-medium text-charcoal-900/80 mb-1.5">
                  {t("Crop")} <span className="text-charcoal-900/40 font-normal">- {t("optional")}</span>
                </label>
                <select value={crop} onChange={(e) => setCrop(e.target.value)} className={INPUT_CLASS}>
                  <option value="">{t("Not sure / detect it")}</option>
                  {CROPS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-base font-medium text-charcoal-900/80 mb-1.5">
                  {t("What have you noticed?")}{" "}
                  <span className="text-charcoal-900/40 font-normal">- {t("optional")}</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  maxLength={300}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("e.g. yellow spots since last week")}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleDiagnose}
              disabled={loading || !file}
              className="mt-6 w-full rounded-full bg-lime-400 text-charcoal-900 font-semibold py-3 shadow-md hover:bg-lime-500 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? t("Analysing photo...") : t("Diagnose")}
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-300 bg-red-50 text-red-800 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="bg-white rounded-3xl border border-cream-200 p-6 shadow-xl shadow-charcoal-900/5 space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full border px-4 py-1.5 text-sm font-semibold capitalize ${
                    STATUS_STYLES[result.status] || STATUS_STYLES.unclear
                  }`}
                >
                  {t(result.status)}
                </span>
                {result.crop_guess && (
                  <span className="text-sm text-charcoal-900/60">
                    {t("Looks like")}: <span className="font-medium text-charcoal-900">{result.crop_guess}</span>
                  </span>
                )}
              </div>

              {result.summary && <p className="text-charcoal-900/80">{result.summary}</p>}

              {result.issues.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-900/50 mb-2">
                    {t("Likely problems")}
                  </p>
                  <div className="space-y-3">
                    {result.issues.map((issue, i) => (
                      <div key={i} className="rounded-xl border border-cream-200 bg-cream-50 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-charcoal-900">{issue.name}</p>
                          <span
                            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                              CONFIDENCE_STYLES[issue.confidence]
                            }`}
                          >
                            {t(issue.confidence)} {t("confidence")}
                          </span>
                        </div>
                        {issue.evidence && (
                          <p className="text-sm text-charcoal-900/60 mt-1">{issue.evidence}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Section title={t("Possible causes")} items={result.causes} icon="•" />
              <Section title={t("What you can do now")} items={result.treatment} icon="→" />
              <Section title={t("How to prevent it")} items={result.prevention} icon="✓" />

              {result.see_expert && (
                <div className="rounded-xl border border-orange-300 bg-orange-50 text-orange-800 px-4 py-3 text-sm">
                  {t("This looks serious or uncertain. Please show the plant to a local agricultural officer.")}
                </div>
              )}

              <p className="text-xs text-charcoal-900/40">
                {t("This is an AI estimate from one photo, not a lab test. Several problems can look alike. For the right product and dose, ask a local agricultural officer.")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}