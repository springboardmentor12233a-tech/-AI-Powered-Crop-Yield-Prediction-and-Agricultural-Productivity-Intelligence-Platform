"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { getToken } from "@/lib/auth";

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
};

const INPUT_CLASS =
  "w-full rounded-lg border border-earth-200 bg-white px-3 py-2.5 text-sm text-earth-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-shadow";

export default function FarmProfilePage() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null); // null = creating new
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  function loadProfiles(token) {
    fetch("http://127.0.0.1:5000/profiles", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setProfiles(data))
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
    });
    setEditingId(profile.id);
    setShowForm(true);
    setError(null);
  }

  async function handleDelete(id) {
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
    <div className="min-h-screen bg-stone-50 flex">
      <Sidebar />
      <div className="flex-1 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-heading text-3xl font-semibold text-earth-900">
            Farm Profile
          </h1>
          {!showForm && (
            <button
              onClick={startNew}
              className="rounded-lg bg-gradient-to-r from-brand-700 to-brand-600 text-white text-sm font-medium px-4 py-2 shadow-md shadow-brand-700/30 hover:shadow-lg transition-all"
            >
              + Add Field
            </button>
          )}
        </div>
        <p className="text-earth-900/60 mb-8">
          Save details for each field you farm - crop type, region, and
          soil test results. Pick one on the predict page to pre-fill it.
        </p>

        {loading && <p className="text-earth-900/50 text-sm">Loading...</p>}

        {!loading && !showForm && profiles.length === 0 && (
          <div className="bg-white rounded-2xl border border-earth-100 p-8 text-center shadow-lg shadow-earth-900/5">
            <p className="text-earth-900/60 text-sm mb-4">
              You haven&apos;t saved any fields yet.
            </p>
            <button
              onClick={startNew}
              className="rounded-lg bg-brand-700 text-white text-sm font-medium px-4 py-2 hover:bg-brand-800 transition-colors"
            >
              Add your first field
            </button>
          </div>
        )}

        {!showForm && profiles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-earth-100 p-5 shadow-lg shadow-earth-900/5"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading font-semibold text-earth-900">
                    {p.field_name}
                  </h3>
                  <span className="text-xs text-brand-700 bg-brand-50 border border-brand-200 rounded-full px-2.5 py-1">
                    {p.region}
                  </span>
                </div>
                <p className="text-sm text-earth-900/70 mb-1">
                  Crop: <span className="font-medium">{p.crop_type}</span>
                </p>
                <p className="text-xs text-earth-900/50 mb-4">
                  pH {p.soil_ph} · N {p.nitrogen_content} · P {p.phosphorus_content} · K {p.potassium_content}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(p)}
                    className="text-xs font-medium text-brand-700 hover:text-brand-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-earth-100 p-6 shadow-lg shadow-earth-900/5"
          >
            <h2 className="font-heading font-semibold text-earth-900 mb-4">
              {editingId ? "Edit Field" : "New Field"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-earth-900/80 mb-1">
                  Field Name
                </label>
                <input
                  type="text"
                  name="field_name"
                  placeholder="e.g. North Field"
                  value={form.field_name}
                  onChange={handleChange}
                  required
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-900/80 mb-1">
                  Crop Type
                </label>
                <select name="crop_type" value={form.crop_type} onChange={handleChange} className={INPUT_CLASS}>
                  {CROP_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-900/80 mb-1">
                  Region
                </label>
                <select name="region" value={form.region} onChange={handleChange} className={INPUT_CLASS}>
                  {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-900/80 mb-1">
                  Soil pH
                </label>
                <input type="number" step="0.01" name="soil_ph" value={form.soil_ph} onChange={handleChange} required className={INPUT_CLASS} />
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-900/80 mb-1">
                  Nitrogen Content
                </label>
                <input type="number" step="0.01" name="nitrogen_content" value={form.nitrogen_content} onChange={handleChange} required className={INPUT_CLASS} />
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-900/80 mb-1">
                  Phosphorus Content
                </label>
                <input type="number" step="0.01" name="phosphorus_content" value={form.phosphorus_content} onChange={handleChange} required className={INPUT_CLASS} />
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-900/80 mb-1">
                  Potassium Content
                </label>
                <input type="number" step="0.01" name="potassium_content" value={form.potassium_content} onChange={handleChange} required className={INPUT_CLASS} />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-4">
                {error}
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-gradient-to-r from-brand-700 to-brand-600 text-white font-medium py-2.5 shadow-md shadow-brand-700/30 hover:shadow-lg transition-all disabled:opacity-60"
              >
                {saving ? "Saving..." : editingId ? "Save Changes" : "Add Field"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-earth-200 text-earth-900/70 font-medium px-5 py-2.5 hover:bg-earth-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
      </div>
    </div>
  );
}