import { useEffect, useState } from "react";
import { getPredictionOptions } from "../services/predictionService";

function initials(name) {
  return (name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function memberSince(createdAt) {
  if (!createdAt) return "Unavailable";
  const date = new Date(createdAt);
  return Number.isNaN(date.getTime())
    ? "Unavailable"
    : new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(date);
}

function preferenceKey(userId) {
  return `yieldsense-preferences:${userId}`;
}

function loadPreferences(userId) {
  try {
    return JSON.parse(localStorage.getItem(preferenceKey(userId)) || "{}");
  } catch {
    return {};
  }
}

export default function FarmerProfile({ user, onLogout }) {
  const [preferences, setPreferences] = useState(() => loadPreferences(user?.id));
  const [saved, setSaved] = useState(false);
  const [options, setOptions] = useState({ crop: [], season: [] });
  const [optionsError, setOptionsError] = useState("");

  useEffect(() => {
    let active = true;
    getPredictionOptions()
      .then((result) => {
        if (active) setOptions(result);
      })
      .catch((error) => {
        if (active) setOptionsError(error.message || "Preference options are unavailable.");
      });
    return () => { active = false; };
  }, []);

  const updatePreference = (event) => {
    setPreferences((current) => ({ ...current, [event.target.name]: event.target.value }));
    setSaved(false);
  };

  const savePreferences = (event) => {
    event.preventDefault();
    localStorage.setItem(preferenceKey(user.id), JSON.stringify(preferences));
    setSaved(true);
  };

  return (
    <>
      <div className="page-title">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Profile &amp; settings</h1>
        </div>
      </div>
      <div className="profile-layout">
        <div>
          <section className="card">
            <div className="profile-header">
              <div className="profile-avatar">{initials(user?.name)}</div>
              <div>
                <h2>{user?.name || "Account"}</h2>
                <p>Farmer · Member since {memberSince(user?.created_at)}</p>
              </div>
            </div>
            <div className="form-grid">
              <label className="field"><span>Full name</span><input value={user?.name || ""} readOnly /></label>
              <label className="field"><span>Email address</span><input type="email" value={user?.email || ""} readOnly /></label>
              <label className="field"><span>Role</span><input value={user?.role || "farmer"} readOnly /></label>
            </div>
          </section>
          <section className="card">
            <p className="eyebrow">Your defaults</p>
            <h2>Preferences</h2>
            <p className="soil-assessment-note">These preferences are stored in this browser only; they are not account data in PostgreSQL.</p>
            {optionsError && <p className="form-error" role="alert">{optionsError}</p>}
            <form onSubmit={savePreferences}>
              <div className="form-grid">
                <label className="field">
                  <span>Preferred crop</span>
                  <select name="crop" value={preferences.crop || ""} onChange={updatePreference}>
                    <option value="">Not set</option>
                    {options.crop.map((crop) => <option key={crop} value={crop}>{crop}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span>Preferred location</span>
                  <input value={[user?.location_district, user?.location_state].filter(Boolean).join(", ") || "Not set"} readOnly />
                </label>
                <label className="field">
                  <span>Preferred season</span>
                  <select name="season" value={preferences.season || ""} onChange={updatePreference}>
                    <option value="">Not set</option>
                    {options.season.map((season) => <option key={season} value={season}>{season}</option>)}
                  </select>
                </label>
              </div>
              <button className="button button-primary" type="submit">{saved ? "Preferences saved" : "Save preferences"}</button>
            </form>
          </section>
        </div>
        <div>
          <section className="card settings-card">
            <p className="eyebrow">Security</p>
            <h2>Account settings</h2>
            <button className="setting-row danger" type="button" onClick={onLogout}>
              <span><b>Log out of YieldSense</b><small>End this session on this device</small></span>
              <span>↪</span>
            </button>
          </section>
          <section className="card profile-note">
            <span>✦</span>
            <b>Your data stays yours</b>
            <p>Field history and prediction metrics are loaded from records associated with your authenticated account.</p>
          </section>
        </div>
      </div>
    </>
  );
}
