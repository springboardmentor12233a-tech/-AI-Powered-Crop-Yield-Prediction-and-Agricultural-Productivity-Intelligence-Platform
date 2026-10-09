"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import { getToken, getUser } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { toast, refreshNotifications } from "@/lib/toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

const ROTATION_STYLES = {
  good: "bg-green-100 text-green-800 border-green-300",
  neutral: "bg-zinc-100 text-zinc-700 border-zinc-300",
  avoid: "bg-red-100 text-red-800 border-red-300",
};

const INPUT_CLASS =
  "w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-charcoal-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-lime-500";

function money(n) {
  if (n === null || n === undefined) return "-";
  const sign = n < 0 ? "-" : "";
  return `${sign}₹${Math.abs(Math.round(n)).toLocaleString("en-IN")}`;
}

function formatDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Builds an .ics calendar file (one all-day event per step) and downloads it.
function downloadICS(timeline, t) {
  const esc = (s) =>
    String(s)
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AgriVantage//Farm Planner//EN"];
  timeline.steps.forEach((s, i) => {
    const start = s.date.replace(/-/g, "");
    const next = new Date(`${s.date}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    const end = next.toISOString().slice(0, 10).replace(/-/g, "");
    const description = [t(s.detail), s.warning ? t(s.warning) : ""].filter(Boolean).join(" ");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${timeline.crop_type}-${start}-${i}@agrivantage`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${esc(`${timeline.crop_type}: ${t(s.title)}`)}`,
      `DESCRIPTION:${esc(description)}`,
      "END:VEVENT"
    );
  });
  lines.push("END:VCALENDAR");

  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${timeline.crop_type.toLowerCase()}-timeline.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PlannerPage() {
  const t = useT();
  const router = useRouter();

  const [profiles, setProfiles] = useState([]);
  const [crops, setCrops] = useState([]);
  const [prices, setPrices] = useState({});
  const [costs, setCosts] = useState({});
  const [profileId, setProfileId] = useState("");
  const [previous, setPrevious] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  // Which crop's timeline is open, its sowing date, and the loaded timeline.
  const [openCrop, setOpenCrop] = useState(null);
  const [sowDate, setSowDate] = useState(todayISO());
  const [timeline, setTimeline] = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState(null);
  const [plans, setPlans] = useState([]);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    if (getUser()?.role === "admin") {
      router.push("/admin");
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    loadPlans();

    Promise.all([
      fetch(`${API_URL}/profiles`, { headers }).then((r) => r.json()),
      fetch(`${API_URL}/planner/defaults`, { headers }).then((r) => r.json()),
    ])
      .then(([profilesData, defaults]) => {
        const p = Array.isArray(profilesData) ? profilesData : [];
        setProfiles(p);
        if (p.length > 0) {
          setProfileId(String(p[0].id));
          setPrevious(p[0].crop_type || "");
        }
        const list = defaults?.crops || [];
        setCrops(list.map((c) => c.crop_type));
        setPrices(Object.fromEntries(list.map((c) => [c.crop_type, c.price_per_tonne])));
        setCosts(Object.fromEntries(list.map((c) => [c.crop_type, c.cost_per_ha])));
      })
      .catch(() => setError(t("Could not load your fields.")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  function handleProfileChange(e) {
    const id = e.target.value;
    setProfileId(id);
    const p = profiles.find((x) => String(x.id) === id);
    setPrevious(p?.crop_type || "");
    setResult(null);
  }

  async function handlePlan() {
    setRunning(true);
    setError(null);
    setResult(null);
    setOpenCrop(null);
    setTimeline(null);
    try {
      const res = await fetch(`${API_URL}/planner`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          profile_id: Number(profileId),
          previous_crop: previous || null,
          prices,
          costs,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("Something went wrong"));
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  async function loadPlans() {
    try {
      const res = await fetch(`${API_URL}/planner/plans`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) setPlans(data.plans || []);
    } catch {
      // The planner still works without the list of active plans.
    }
  }

  async function startPlan() {
    if (!openCrop || !timeline) return;
    setStarting(true);
    try {
      const res = await fetch(`${API_URL}/planner/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          profile_id: Number(profileId),
          crop_type: openCrop,
          sowing_date: sowDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("Something went wrong"));
      toast.success(t("Plan started. You'll get reminders in the bell."));
      loadPlans();
      refreshNotifications();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStarting(false);
    }
  }

  async function stopPlan(id) {
    try {
      const res = await fetch(`${API_URL}/planner/plans/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(t("Something went wrong"));
      toast.success(t("Plan stopped"));
      loadPlans();
      refreshNotifications();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function loadTimeline(crop, date) {
    setTimelineLoading(true);
    setTimelineError(null);
    try {
      const res = await fetch(`${API_URL}/planner/timeline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          profile_id: Number(profileId),
          crop_type: crop,
          sowing_date: date,
          previous_crop: previous || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("Something went wrong"));
      setTimeline(data);
    } catch (err) {
      setTimeline(null);
      setTimelineError(err.message);
    } finally {
      setTimelineLoading(false);
    }
  }

  function toggleTimeline(crop) {
    if (openCrop === crop) {
      setOpenCrop(null);
      return;
    }
    setOpenCrop(crop);
    setTimeline(null);
    loadTimeline(crop, sowDate);
  }

  function changeSowDate(date) {
    setSowDate(date);
    if (openCrop && date) loadTimeline(openCrop, date);
  }

  const top = result?.options?.[0];

  return (
    <div className="min-h-screen bg-cream-50 flex">
      <Sidebar />
      <div className="flex-1 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-heading text-4xl font-bold text-charcoal-900 mb-2">
            {t("Farm Planner")}
          </h1>
          <p className="text-charcoal-900/60 text-lg mb-8">
            {t("Pick a field and see which crop to grow next, and in which season, for the best expected profit.")}
          </p>

          {loading && <p className="text-charcoal-900/50 text-base">{t("Loading...")}</p>}

          {!loading && profiles.length === 0 && (
            <div className="bg-white rounded-2xl border border-cream-200 p-8 text-center shadow-lg shadow-charcoal-900/5">
              <p className="text-charcoal-900/60 text-sm mb-4">
                {t("Save a field on your Farm Profile first, so the planner knows your soil and region.")}
              </p>
              <Link
                href="/profile"
                className="inline-block rounded-full bg-lime-400 px-5 py-2 text-sm font-semibold text-charcoal-900 hover:bg-lime-500 transition-colors"
              >
                {t("Go to Farm Profile")}
              </Link>
            </div>
          )}

          {profiles.length > 0 && (
            <div className="bg-white rounded-3xl border border-cream-200 p-6 shadow-lg shadow-charcoal-900/5 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-medium text-charcoal-900/80 mb-1.5">
                    {t("Field")}
                  </label>
                  <select value={profileId} onChange={handleProfileChange} className={INPUT_CLASS}>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.field_name} ({p.crop_type}, {p.region})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-base font-medium text-charcoal-900/80 mb-1.5">
                    {t("Last season's crop")}
                  </label>
                  <select value={previous} onChange={(e) => setPrevious(e.target.value)} className={INPUT_CLASS}>
                    {crops.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowEdit((s) => !s)}
                className="mt-4 text-sm font-medium text-olive-700 hover:text-olive-800"
              >
                {showEdit ? t("Hide prices and costs") : t("Edit prices and costs")}
              </button>

              {showEdit && (
                <div className="mt-3">
                  <p className="text-xs text-charcoal-900/50 mb-3">
                    {t("These are rough placeholder numbers, not live market prices. Change them to match your local market.")}
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-charcoal-900/60">
                          <th className="py-2 pr-3 font-medium">{t("Crop")}</th>
                          <th className="py-2 pr-3 font-medium">{t("Price (₹ per tonne)")}</th>
                          <th className="py-2 font-medium">{t("Cost (₹ per hectare)")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {crops.map((c) => (
                          <tr key={c} className="border-t border-cream-100">
                            <td className="py-2 pr-3 font-medium text-charcoal-900">{c}</td>
                            <td className="py-2 pr-3">
                              <input
                                type="number"
                                min="0"
                                value={prices[c] ?? ""}
                                onChange={(e) => setPrices((p) => ({ ...p, [c]: e.target.value }))}
                                className={INPUT_CLASS}
                              />
                            </td>
                            <td className="py-2">
                              <input
                                type="number"
                                min="0"
                                value={costs[c] ?? ""}
                                onChange={(e) => setCosts((p) => ({ ...p, [c]: e.target.value }))}
                                className={INPUT_CLASS}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handlePlan}
                disabled={running || !profileId}
                className="mt-6 w-full rounded-full bg-lime-400 text-charcoal-900 font-semibold py-3 shadow-md hover:bg-lime-500 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {running ? t("Planning...") : t("Plan my next crop")}
              </button>
            </div>
          )}

          {plans.length > 0 && (
            <div className="bg-white rounded-2xl border border-cream-200 p-5 shadow-lg shadow-charcoal-900/5 mb-6">
              <h2 className="font-heading font-semibold text-charcoal-900 mb-1">
                {t("Your active plans")}
              </h2>
              <p className="text-xs text-charcoal-900/50 mb-3">
                {t("You get a reminder in the bell the day before and on the day of each step.")}
              </p>
              <div className="space-y-3">
                {plans.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cream-200 bg-cream-50 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-charcoal-900">
                        {p.crop_type} · {p.field_name}
                      </p>
                      <p className="text-xs text-charcoal-900/60">
                        {t("Started {date}", { date: formatDate(p.sowing_date) })}
                        {" · "}
                        {t("Harvest around {date}", { date: formatDate(p.harvest_date) })}
                      </p>
                      <p className="text-xs text-olive-700">
                        {p.next_step
                          ? `${t("Next")}: ${t(p.next_step.title)} (${formatDate(p.next_step.date)})`
                          : t("All steps are done.")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => stopPlan(p.id)}
                      className="text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      {t("Stop plan")}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-lg border border-red-300 bg-red-50 text-red-800 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {result && top && (
            <div className="space-y-5">
              <div className="relative bg-olive-700 rounded-3xl p-6 shadow-xl shadow-charcoal-900/10 text-lime-50 overflow-hidden">
                <p className="text-xs uppercase tracking-wide text-lime-400 mb-2">
                  {t("Best next crop for {name}", { name: result.field.field_name })}
                </p>
                <p className="text-4xl font-heading font-bold mb-1">
                  {top.crop_type}
                  {top.season_matters && ` · ${t(top.best_season)}`}
                </p>
                <p className="text-cream-100/80 text-sm mb-4">
                  {t("Expected yield {y} t/ha", { y: top.predicted_yield })}
                  {" · "}
                  {t("Profit {p} per hectare", { p: money(top.profit_per_ha) })}
                  {top.total_profit !== null &&
                    ` · ${t("{p} over {n} ha", { p: money(top.total_profit), n: result.field.field_size_hectares })}`}
                </p>
                {top.rotation_note && <p className="text-sm text-cream-100/70">{t(top.rotation_note)}</p>}
              </div>

              <h2 className="font-heading text-xl font-bold text-charcoal-900">
                {t("All crops, best first")}
              </h2>

              {result.options.map((o) => (
                <div
                  key={o.crop_type}
                  className="bg-white rounded-2xl border border-cream-200 p-5 shadow-lg shadow-charcoal-900/5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h3 className="font-heading text-lg font-semibold text-charcoal-900">
                      #{o.rank} {o.crop_type}{" "}
                      {o.season_matters && (
                        <span className="text-charcoal-900/50 font-normal text-sm">
                          · {t("best in {season}", { season: t(o.best_season) })}
                        </span>
                      )}
                    </h3>
                    {o.rotation !== "neutral" && (
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${ROTATION_STYLES[o.rotation]}`}
                      >
                        {o.rotation === "good" ? t("Good rotation") : t("Same as last season")}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-charcoal-900/50 text-xs">{t("Expected yield")}</p>
                      <p className="font-semibold text-charcoal-900">{o.predicted_yield} t/ha</p>
                    </div>
                    <div>
                      <p className="text-charcoal-900/50 text-xs">{t("Revenue per ha")}</p>
                      <p className="font-semibold text-charcoal-900">{money(o.revenue_per_ha)}</p>
                    </div>
                    <div>
                      <p className="text-charcoal-900/50 text-xs">{t("Cost per ha")}</p>
                      <p className="font-semibold text-charcoal-900">{money(o.cost_per_ha)}</p>
                    </div>
                    <div>
                      <p className="text-charcoal-900/50 text-xs">{t("Profit per ha")}</p>
                      <p
                        className={`font-semibold ${
                          o.profit_per_ha >= 0 ? "text-olive-700" : "text-red-700"
                        }`}
                      >
                        {money(o.profit_per_ha)}
                      </p>
                    </div>
                  </div>

                  {o.season_matters ? (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {o.seasons.map((s) => (
                        <span
                          key={s.season}
                          className={`rounded-full border px-3 py-1 text-xs ${
                            s.season === o.best_season
                              ? "bg-lime-300/40 border-lime-500 text-olive-800 font-semibold"
                              : "bg-cream-100 border-cream-200 text-charcoal-900/60"
                          }`}
                        >
                          {t(s.season)}: {money(s.profit_per_ha)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-charcoal-900/50 mb-3">
                      {t("The data shows almost no difference between seasons for this crop, so choose the sowing time by your local calendar.")}
                    </p>
                  )}

                  {o.soil_checked > 0 && (
                    <p className="text-xs text-charcoal-900/60 mb-1">
                      {t("Soil match: {h} of {c} values in the healthy range for this crop", {
                        h: o.soil_healthy,
                        c: o.soil_checked,
                      })}
                    </p>
                  )}
                  {o.soil_issues.length > 0 && (
                    <ul className="text-xs text-orange-700 space-y-0.5 mb-1">
                      {o.soil_issues.map((i) => (
                        <li key={i.parameter}>
                          ⚠ {t(i.parameter)}: {t(i.status)} ({i.value}, {t("healthy")} {i.low} – {i.high})
                        </li>
                      ))}
                    </ul>
                  )}
                  {o.rotation_note && o.rotation !== "good" && (
                    <p className="text-xs text-charcoal-900/50">{t(o.rotation_note)}</p>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleTimeline(o.crop_type)}
                    className="mt-4 rounded-full border border-lime-500 bg-lime-300/30 px-4 py-2 text-sm font-medium text-olive-800 hover:bg-lime-300/60 transition-colors"
                  >
                    {openCrop === o.crop_type ? t("Hide timeline") : t("View timeline")}
                  </button>

                  {openCrop === o.crop_type && (
                    <div className="mt-4 border-t border-cream-100 pt-4">
                      <div className="flex flex-wrap items-end gap-3 mb-4">
                        <div>
                          <label className="block text-xs font-medium text-charcoal-900/60 mb-1">
                            {t(timeline?.start_label || "Sowing date")}
                          </label>
                          <input
                            type="date"
                            value={sowDate}
                            onChange={(e) => changeSowDate(e.target.value)}
                            className={INPUT_CLASS}
                          />
                        </div>
                        {timeline && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                downloadICS(timeline, t);
                                toast.info(t("Calendar file downloaded"));
                              }}
                              className="rounded-full border border-cream-200 bg-white px-4 py-2 text-sm font-medium text-charcoal-900/70 hover:bg-cream-100 transition-colors"
                            >
                              {t("Add to my calendar")}
                            </button>
                            <button
                              type="button"
                              onClick={startPlan}
                              disabled={starting}
                              className="rounded-full bg-lime-400 px-4 py-2 text-sm font-semibold text-charcoal-900 shadow-md hover:bg-lime-500 transition-colors disabled:opacity-60"
                            >
                              {starting ? t("Starting...") : t("Start this plan")}
                            </button>
                          </>
                        )}
                      </div>

                      {timelineLoading && (
                        <p className="text-sm text-charcoal-900/50">{t("Loading...")}</p>
                      )}
                      {timelineError && (
                        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                          {timelineError}
                        </p>
                      )}

                      {timeline && !timelineLoading && (
                        <div>
                          <p className="text-sm text-charcoal-900/70 mb-1">
                            {t("Expected harvest around {date}, about {n} days after the start.", {
                              date: formatDate(timeline.harvest_date),
                              n: timeline.duration_days,
                            })}
                          </p>
                          {timeline.rotation_note && (
                            <p className="text-xs text-charcoal-900/50 mb-1">{t(timeline.rotation_note)}</p>
                          )}
                          <p className="text-xs text-charcoal-900/50 mb-3">
                            {t("Starting a plan gives you a reminder in the bell the day before and on the day of each step. A new plan replaces this field's current plan.")}
                          </p>

                          <ol className="mt-4 ml-2 border-l-2 border-cream-200">
                            {timeline.steps.map((s, i) => {
                              const isLast = i === timeline.steps.length - 1;
                              return (
                                <li key={`${s.day}-${s.title}`} className="relative pl-6 pb-5 last:pb-0">
                                  <span
                                    className={`absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 ${
                                      isLast
                                        ? "bg-lime-400 border-lime-500"
                                        : s.warning
                                        ? "bg-orange-300 border-orange-500"
                                        : "bg-white border-olive-700"
                                    }`}
                                  />
                                  <p className="text-xs text-charcoal-900/50">
                                    {formatDate(s.date)}
                                    {" · "}
                                    {s.day < 0
                                      ? t("{n} days before", { n: Math.abs(s.day) })
                                      : t("Day {n}", { n: s.day })}
                                  </p>
                                  <p className="font-semibold text-charcoal-900">{t(s.title)}</p>
                                  <p className="text-sm text-charcoal-900/70">{t(s.detail)}</p>
                                  {s.warning && (
                                    <p className="mt-1 text-xs text-orange-700">⚠ {t(s.warning)}</p>
                                  )}
                                </li>
                              );
                            })}
                          </ol>

                          <p className="mt-4 text-xs text-charcoal-900/40">
                            {t("This is general guidance. Real timing depends on the variety, the weather and your local conditions, so check with a local agricultural officer.")}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              <p className="text-xs text-charcoal-900/40">
                {t("Yields come from the same machine-learning model as the Predict page, using your field's soil and region and typical weather for each season. Prices and costs are the numbers you set above. Crops that repeat last season's crop are ranked lower. This is a planning aid, not a guarantee. Ask a local agricultural officer before you decide.")}
              </p>
              {result.assumptions.soil_assumed.length > 0 && (
                <p className="text-xs text-charcoal-900/40">
                  {t("Not saved for this field, so typical values were used for:")}{" "}
                  {result.assumptions.soil_assumed.map((s) => t(s)).join(", ")}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}