"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import { getToken, getRole } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { toast } from "@/lib/toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

const CATEGORIES = [
  { id: "General", label: "📢 General Announcement" },
  { id: "Weather", label: "🌧️ Weather Advisory" },
  { id: "Alert", label: "🚨 Critical Alert" },
  { id: "Feature", label: "✨ New Feature / Tip" },
];

const INPUT_CLASS =
  "w-full rounded-lg border border-cream-200 bg-white px-3.5 py-2.5 text-sm text-charcoal-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-lime-500";

export default function AdminAnnouncementsPage() {
  const t = useT();
  const router = useRouter();

  const [announcements, setAnnouncements] = useState([]);
  const [totalFarmers, setTotalFarmers] = useState(0);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("General");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    if (getRole() !== "admin") {
      router.push("/dashboard");
      return;
    }
    loadAnnouncements();
  }, [router]);

  async function loadAnnouncements() {
    try {
      const res = await fetch(`${API_URL}/admin/announcements`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAnnouncements(data.announcements || []);
        setTotalFarmers(data.total_farmers || 0);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  async function handleBroadcast(e) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error(t("Title and message are required."));
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`${API_URL}/admin/announcements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ title, message, category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to broadcast");

      toast.success(t(`Broadcast sent to ${data.delivered_to} farmers' bells!`));
      setTitle("");
      setMessage("");
      loadAnnouncements();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm(t("Are you sure you want to retract this announcement from all farmer bells?"))) return;

    try {
      const res = await fetch(`${API_URL}/admin/announcements/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Could not delete announcement.");
      toast.info(t("Announcement retracted."));
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-cream-50 flex">
      <Sidebar />
      <div className="flex-1 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="font-heading text-3xl font-bold text-charcoal-900">
              {t("Announcements & Farmer Broadcast")}
            </h1>
            <p className="text-charcoal-900/60 mt-1">
              {t("Broadcast urgent alerts, weather notices, or feature announcements directly into every farmer's bell.")}
            </p>
          </div>

          {/* Broadcast Form */}
          <div className="bg-white rounded-3xl border border-cream-200 p-6 shadow-md mb-8">
            <h2 className="font-heading text-xl font-bold text-charcoal-900 mb-1">
              {t("Compose New Broadcast")}
            </h2>
            <p className="text-xs text-charcoal-900/50 mb-5">
              {t("Will instantly notify all {n} registered farmers.", { n: totalFarmers })}
            </p>

            <form onSubmit={handleBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-900/70 mb-1.5">
                  {t("Category")}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`rounded-xl border py-2 px-3 text-xs font-semibold transition-colors text-center ${
                        category === cat.id
                          ? "bg-olive-700 text-lime-400 border-olive-800"
                          : "bg-cream-100 text-charcoal-900/70 border-cream-200 hover:bg-cream-200"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900/70 mb-1">
                  {t("Announcement Title")}
                </label>
                <input
                  type="text"
                  placeholder={t("e.g. Heavy rain expected this week in North region")}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900/70 mb-1">
                  {t("Message Details")}
                </label>
                <textarea
                  rows={3}
                  placeholder={t("e.g. Ensure drainage channels are clear to prevent waterlogging. Check the Farm Planner for schedule updates.")}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="rounded-full bg-lime-400 px-6 py-2.5 text-sm font-bold text-charcoal-900 shadow hover:bg-lime-500 transition-colors disabled:opacity-50"
              >
                {sending ? t("Broadcasting...") : t("📢 Broadcast to All Farmer Bells")}
              </button>
            </form>
          </div>

          {/* Past Broadcasts */}
          <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm">
            <h2 className="font-heading text-lg font-bold text-charcoal-900 mb-4">
              {t("Sent Announcements History")}
            </h2>

            {loading && <p className="text-sm text-charcoal-900/50">{t("Loading history...")}</p>}

            {!loading && announcements.length === 0 && (
              <p className="text-sm text-charcoal-900/50 py-4 text-center">
                {t("No announcements sent yet.")}
              </p>
            )}

            <div className="space-y-3">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-cream-200 bg-cream-50/60 p-4 flex flex-wrap items-start justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="rounded-md bg-cream-200 px-2 py-0.5 text-[11px] font-semibold text-charcoal-900">
                        {a.category}
                      </span>
                      <span className="text-xs text-charcoal-900/40">
                        {a.created_at ? new Date(a.created_at).toLocaleString() : ""}
                      </span>
                    </div>
                    <p className="font-semibold text-charcoal-900">{a.title}</p>
                    <p className="text-sm text-charcoal-900/70 mt-0.5">{a.message}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
                  >
                    {t("Retract")}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}