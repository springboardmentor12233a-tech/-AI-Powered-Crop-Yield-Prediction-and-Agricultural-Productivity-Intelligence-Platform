"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { getToken } from "@/lib/auth";
import { useLang } from "@/lib/i18n";

const CROP_TYPES = ["Wheat", "Corn", "Rice", "Soybean", "Barley"];
const REGIONS = ["North", "South", "East", "West", "Central"];

const emptyForm = {
  field_name: "",
  crop_type: "Wheat",
  region: "North",
  soil_ph: "",
  nitrogen_content: "",
  phosphorus_content: "",
  potassium_content: "",
  field_size_hectares: "",
};

const INPUT_CLASS =
  "w-full rounded-lg border border-cream-200 bg-white px-3 py-2.5 text-sm text-charcoal-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-lime-500 transition-shadow";

export default function FarmProfilePage() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null); // null = creating new
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null); // always an English message, translated when shown
  const router = useRouter();
  const { t } = useLang();

  function loadProfiles(token) {
    fetch("http://127.0.0.1:5000/profiles", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setProfiles(Array.isArray(data) ? data : []))
      .catch(() => setError("Could not load saved fields."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    loadProfiles(token);
  }, [router]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function startNew() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setError(null);
  }

  function startEdit(profile) {
    setForm({
      field_name: profile.field_name,
      crop_type: profile.crop_type,
      region: profile.region,
      soil_ph: profile.soil_ph ?? "",
      nitrogen_content: profile.nitrogen_content ?? "",
      phosphorus_content: profile.phosphorus_content ?? "",
      potassium_content: profile.potassium_content ?? "",
      field_size_hectares: profile.field_size_hectares ?? "",
    });
    setEditingId(profile.id);
    setShowForm(true);
    setError(null);
  }

  async function handleDelete(id) {
    if (!window.confirm(t("Delete this field? This cannot be undone."))) return;
    const token = getToken();
    try {
      await fetch(`http://127.0.0.1:5000/profiles/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      loadProfiles(token);
    } catch {
      setError("Could not delete field.");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      soil_ph: parseFloat(form.soil_ph),
      nitrogen_content: parseFloat(form.nitrogen_content),
      phosphorus_content: parseFloat(form.phosphorus_content),
      potassium_content: parseFloat(form.potassium_content),
      field_size_hectares: form.field_size_hectares === "" ? null : parseFloat(form.field_size_hectares),
    };

    const token = getToken();
    const url = editingId
      ? `http://127.0.0.1:5000/profiles/${editingId}`
      : "http://127.0.0.1:5000/profiles";
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save field");
      setShowForm(false);
      loadProfiles(token);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream-50 flex">
      <Sidebar />
      <div className="flex-1 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-heading text-3xl font-semibold text-charcoal-900">
            {t("Farm Profile")}
          </h1>
          {!showForm && (
            <button
              onClick={startNew}
              className="rounded-full bg-lime-400 text-charcoal-900 text-sm font-medium px-4 py-2 shadow-md hover:bg-lime-500 transition-all"
            >
              {t("+ Add Field")}
            </button>
          )}
        </div>
        <p className="text-charcoal-900/60 text-lg mb-10">
          {t("Save details for each field you farm - crop type, region, and soil test results. Pick one on the predict page to pre-fill it.")}
        </p>

        {loading && <p className="text-charcoal-900/50 text-sm">{t("Loading...")}</p>}

        {error && !showForm && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            {t(error)}
          </p>
        )}

        {!loading && !showForm && profiles.length === 0 && (
          <div className="bg-white rounded-2xl border border-cream-200 p-8 text-center shadow-lg shadow-charcoal-900/5">
            <p className="text-charcoal-900/60 text-sm mb-4">
              {t("You haven't saved any fields yet.")}
            </p>
            <button
              onClick={startNew}
              className="rounded-lg bg-lime-400 text-charcoal-900 text-sm font-medium px-4 py-2 hover:bg-lime-500 transition-colors"
            >
              {t("Add your first field")}
            </button>
          </div>
        )}

        {!showForm && profiles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-cream-200 p-5 shadow-lg shadow-charcoal-900/5"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading font-semibold text-charcoal-900">
                    {p.field_name}
                  </h3>
                  <span className="text-xs text-olive-700 bg-lime-300/30 border border-lime-400 rounded-full px-2.5 py-1">
                    {t(p.region)}
                  </span>
                </div>
                <p className="text-sm text-charcoal-900/70 mb-1">
                  {t("Crop:")} <span className="font-medium">{t(p.crop_type)}</span>
                  {p.field_size_hectares != null && (
                    <span className="text-charcoal-900/50"> · {p.field_size_hectares} ha</span>
                  )}
                </p>
                <p className="text-xs text-charcoal-900/50 mb-4">
                  pH {p.soil_ph} · N {p.nitrogen_content} · P {p.phosphorus_content} · K {p.potassium_content}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(p)}
                    className="text-xs font-medium text-olive-700 hover:text-olive-800"
                  >
                    {t("Edit")}
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    {t("Delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-cream-200 p-6 shadow-lg shadow-charcoal-900/5"
          >
            <h2 className="font-heading font-semibold text-charcoal-900 mb-4">
              {editingId ? t("Edit Field") : t("New Field")}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-base font-medium text-charcoal-900/80 mb-1.5">
                  {t("Field Name")}
                </label>
                <input
                  type="text"
                  name="field_name"
                  placeholder={t("e.g. North Field")}
                  value={form.field_name}
                  onChange={handleChange}
                  required
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className="block text-base font-medium text-charcoal-900/80 mb-1.5">
                  {t("Crop Type")}
                </label>
                <select name="crop_type" value={form.crop_type} onChange={handleChange} className={INPUT_CLASS}>
                  {CROP_TYPES.map((c) => <option key={c} value={c}>{t(c)}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-base font-medium text-charcoal-900/80 mb-1.5">
                  {t("Region")}
                </label>
                <select name="region" value={form.region} onChange={handleChange} className={INPUT_CLASS}>
                  {REGIONS.map((r) => <option key={r} value={r}>{t(r)}</option>)}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-base font-medium text-charcoal-900/80 mb-1.5">
                  {t("Field Size (hectares)")} <span className="text-charcoal-900/40 font-normal">{t("- optional")}</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="field_size_hectares"
                  placeholder={t("e.g. 12.5")}
                  value={form.field_size_hectares}
                  onChange={handleChange}
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className="block text-base font-medium text-charcoal-900/80 mb-1.5">
                  {t("Soil pH")}
                </label>
                <input type="number" step="0.01" name="soil_ph" value={form.soil_ph} onChange={handleChange} required className={INPUT_CLASS} />
              </div>

              <div>
                <label className="block text-base font-medium text-charcoal-900/80 mb-1.5">
                  {t("Nitrogen Content")}
                </label>
                <input type="number" step="0.01" name="nitrogen_content" value={form.nitrogen_content} onChange={handleChange} required className={INPUT_CLASS} />
              </div>

              <div>
                <label className="block text-base font-medium text-charcoal-900/80 mb-1.5">
                  {t("Phosphorus Content")}
                </label>
                <input type="number" step="0.01" name="phosphorus_content" value={form.phosphorus_content} onChange={handleChange} required className={INPUT_CLASS} />
              </div>

              <div>
                <label className="block text-base font-medium text-charcoal-900/80 mb-1.5">
                  {t("Potassium Content")}
                </label>
                <input type="number" step="0.01" name="potassium_content" value={form.potassium_content} onChange={handleChange} required className={INPUT_CLASS} />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-4">
                {t(error)}
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-full bg-lime-400 text-charcoal-900 font-medium py-2.5 shadow-md hover:bg-lime-500 transition-all disabled:opacity-60"
              >
                {saving ? t("Saving...") : editingId ? t("Save Changes") : t("Add Field")}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-cream-200 text-charcoal-900/70 font-medium px-5 py-2.5 hover:bg-cream-100 transition-colors"
              >
                {t("Cancel")}
              </button>
            </div>
          </form>
        )}
      </div>
      </div>
    </div>
  );
}
