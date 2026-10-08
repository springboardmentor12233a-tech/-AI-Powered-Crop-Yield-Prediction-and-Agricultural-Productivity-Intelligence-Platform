import { createContext, useContext, useEffect, useState } from "react";
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { fetchWeather } from "./services/weatherService";
import { API_BASE_URL } from "./services/apiConfig";
import { getSoilData, loadSoilData, loadSoilTest, saveSoilTest } from "./services/soilService";
import { analyzeSoil, classifyParameter } from "./utils/soilAnalysis";
import { generateAIInsights } from "./services/aiInsightService";
import { getPredictionOptions, predictYield } from "./services/predictionService";
import {
  getAnalyticsDashboard,
  getAnalyticsHistory,
} from "./services/analyticsService";
import {
  AnalyticsBarChart,
  AnalyticsFilters,
  AnalyticsTrendChart,
} from "./components/AnalyticsCharts";
import ThemeToggle from "./components/ThemeToggle";
import { analyzeWeather } from "./utils/weatherAnalysis";
import { INDIA_LOCATIONS } from "./utils/indiaLocations";
import AdminDashboard from "./pages/AdminDashboard";
import FarmerProfile from "./pages/FarmerProfile";

const navItems = [
  ["/dashboard", "Overview", "⌂"], ["/yield-prediction", "Yield prediction", "↗"], ["/recommendations", "AI recommendations", "✦"],
  ["/weather", "Weather", "☁"], ["/soil", "Soil health", "♧"], ["/analytics", "Analytics & reports", "▥"], ["/profile", "Profile & settings", "○"],
];

const defaultLocation = { state: "", district: "" };
const PREDICTION_CROPS = [
  { label: "Rice", modelValue: "Rice" },
  { label: "Soybean", modelValue: "Soyabean" },
  { label: "Wheat", modelValue: "Wheat" },
  { label: "Barley", modelValue: "Barley" },
  { label: "Corn", modelValue: "Maize" },
];
const AUTH_TOKEN_KEY = "yieldsense-auth-token";
const AUTH_USER_KEY = "yieldsense-user";
let verifiedSession = null;
const WeatherContext = createContext(null);
const AuthUserContext = createContext(null);

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || "null");
  } catch {
    return null;
  }
}

function userStorageKey(key, userId = getStoredUser()?.id) {
  return `${key}:${userId || "anonymous"}`;
}

function getUserStorageItem(key) {
  return localStorage.getItem(userStorageKey(key));
}

function setUserStorageItem(key, value) {
  localStorage.setItem(userStorageKey(key), value);
}

function getInitials(name) {
  return (name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function setAuthSession(user, token) {
  localStorage.setItem("yieldsense-auth", "true");
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  verifiedSession = { token, user };
}

function clearAuthSession() {
  localStorage.removeItem("yieldsense-auth");
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  verifiedSession = null;
}

async function fetchWithAuth(path, options = {}) {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || "Request failed.");
  }

  return response.json();
}

function getInitialLocation() {
  const user = getStoredUser();
  if (user?.location_state) {
    return {
      state: user.location_state,
      district: user.location_district || "",
    };
  }
  try {
    const saved = JSON.parse(getUserStorageItem("yieldsense-location") || "null");
    if (saved?.state) return saved;
  } catch {
    return defaultLocation;
  }
  return defaultLocation;
}

function WeatherProvider({ children }) {
  const [location, setLocation] = useState(getInitialLocation);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshWeather = async (nextLocation = location) => {
    const resolvedLocation = nextLocation || defaultLocation;
    setLocation(resolvedLocation);
    setUserStorageItem("yieldsense-location", JSON.stringify(resolvedLocation));
    setLoading(true);
    setError("");
    try {
      if (!resolvedLocation.state || !resolvedLocation.district) {
        setWeather(null);
        setError(resolvedLocation.state
          ? "Select a district in Yield Prediction to load local weather."
          : "Set a farm location in Yield Prediction to load local weather.");
        return;
      }
      setWeather(null);
      const result = await fetchWeather(resolvedLocation);
      setWeather(result);
    } catch (requestError) {
      setWeather(null);
      setError(requestError.message || "Weather data is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshWeather(); }, []);
  return <WeatherContext.Provider value={{ location, weather, loading, error, refreshWeather }}>{children}</WeatherContext.Provider>;
}

function useWeather() { return useContext(WeatherContext); }

function Icon({ children }) { return <span className="icon" aria-hidden="true">{children}</span>; }
function Logo({ compact = false }) { return <Link className="brand" to="/dashboard"><span className="brand-mark">⌁</span>{!compact && <span><b>YieldSense</b> <em>AI</em><small>Smarter farms. Brighter tomorrows.</small></span>}</Link>; }
function Button({ children, variant = "primary", type = "button", onClick, to, icon }) { const body = <>{icon && <Icon>{icon}</Icon>}{children}</>; return to ? <Link className={`button button-${variant}`} to={to}>{body}</Link> : <button className={`button button-${variant}`} type={type} onClick={onClick}>{body}</button>; }
function Card({ children, className = "" }) { return <section className={`card ${className}`}>{children}</section>; }
function Badge({ children, tone = "green" }) { return <span className={`badge badge-${tone}`}>{children}</span>; }
function Field({ label, name, value, onChange, type = "text", placeholder, options, disabled = false, required = false, min, max, step }) { const displayLabel = label === "Nitrogen (N)" ? "Total Nitrogen (N)" : label; return <label className="field"><span>{displayLabel}</span>{options ? <select name={name} value={value} onChange={onChange} disabled={disabled} required={required}><option value="">Select {displayLabel.toLowerCase()}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} required={required} min={min} max={max} step={step} />}</label>; }
function PageTitle({ eyebrow, title, children }) { return <div className="page-title"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div>{children}</div>; }
function Metric({ label, value, detail, accent = "green" }) { return <Card className="metric"><div className={`metric-icon ${accent}`}>{accent === "soil" ? "♧" : accent === "blue" ? "☁" : "↗"}</div><div><p>{label}</p><strong>{value}</strong>{detail && <small>{detail}</small>}</div></Card>; }

function Sidebar({ onClose }) { const navigate = useNavigate(); return <aside className="sidebar"><div className="sidebar-top"><Logo /><button className="mobile-close" onClick={onClose}>×</button></div><p className="nav-label">Workspace</p><nav>{navItems.map(([path, label, icon]) => <NavLink key={path} to={path} onClick={onClose} className={({ isActive }) => isActive ? "active" : ""}><Icon>{icon}</Icon>{label}</NavLink>)}</nav><div className="sidebar-foot"><div className="help-card"><span>✦</span><b>Need a fresh forecast?</b><small>Run a new prediction with your latest farm data.</small><Button to="/yield-prediction" variant="soft">New prediction</Button></div><button className="logout" onClick={() => { clearAuthSession(); navigate("/roles"); }}><Icon>↪</Icon> Log out</button></div></aside>; }
function Header({ onMenu }) { const location = useLocation(); const user = useContext(AuthUserContext); const current = navItems.find(([path]) => path === location.pathname)?.[1] || "Overview"; const name = user?.name || "Account"; return <header className="header"><button className="menu-button" onClick={onMenu}>☰</button><div><span className="crumb">Workspace /</span> <b>{current}</b></div><div className="header-actions"><ThemeToggle /><button className="header-icon" aria-label="Notifications">♢</button><div className="avatar">{getInitials(user?.name)}</div><span className="user-name">{name}</span></div></header>; }
function LaunchPage() { return <div className="auth-page"><div className="auth-visual"><Logo /><div className="auth-quote"><span>“</span><h2>Smarter farming<br />starts with better<br /><em>signals.</em></h2><p>YieldSense AI brings crop forecasts, weather insights, soil intelligence, and operational recommendations together in one platform.</p></div><div className="auth-footer">YieldSense AI · Agricultural intelligence for growing teams</div></div><div className="auth-form"><div className="auth-form-inner"><p className="eyebrow">Welcome</p><h1>YieldSense AI</h1><p className="auth-subtitle">A unified platform for yield prediction, crop planning, soil health, weather intelligence, and data-driven farm decisions.</p><Button to="/roles">Get Started <span>→</span></Button></div></div></div>; }
function RoleSelectionPage() { return <div className="auth-page"><div className="auth-visual"><Logo /><div className="auth-quote"><span>“</span><h2>Choose your<br />workspace.</h2><p>Select the role that matches your access and workflow.</p></div><div className="auth-footer">YieldSense AI · Secure access</div></div><div className="auth-form"><div className="auth-form-inner"><p className="eyebrow">Role selection</p><h1>Who are you?</h1><div className="card" style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}><Link className="button button-primary" to="/farmer-login" style={{ display: "flex", justifyContent: "center" }}>Farmer</Link><Link className="button button-soft" to="/admin-login" style={{ display: "flex", justifyContent: "center" }}>Admin</Link></div></div></div></div>; }
function FarmerLoginPage() { const navigate = useNavigate(); const [form, setForm] = useState({ email: "", password: "" }); const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const [showPassword, setShowPassword] = useState(false); const change = (event) => setForm({ ...form, [event.target.name]: event.target.value }); const submit = async (event) => { event.preventDefault(); setError(""); if (!form.email || !form.password) { setError("Email and password are required."); return; } setLoading(true); try { const response = await fetch(`${API_BASE_URL}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.email, password: form.password }), }); const payload = await response.json().catch(() => ({})); if (!response.ok) { throw new Error(payload.detail || "Invalid login."); } setAuthSession(payload.user, payload.access_token); navigate("/dashboard"); } catch (requestError) { setError(requestError.message || "Unable to sign in."); } finally { setLoading(false); } }; return <div className="auth-page"><div className="auth-visual"><Logo /><div className="auth-quote"><span>“</span><h2>Farm smarter,<br />plan sooner,<br /><em>grow better.</em></h2><p>Sign in to continue to the existing YieldSense operations dashboard.</p></div><div className="auth-footer">YieldSense AI · Farmer portal</div></div><div className="auth-form"><div className="auth-form-inner"><p className="eyebrow">Farmer sign in</p><h1>Welcome back.</h1><p className="auth-subtitle">Use your YieldSense account to access the existing farmer workspace.</p>{error && <div className="form-error">{error}</div>}<form onSubmit={submit}><Field label="Email address" name="email" value={form.email} onChange={change} type="email" placeholder="you@example.com" /><Field label="Password" name="password" value={form.password} onChange={change} type={showPassword ? "text" : "password"} placeholder="Enter your password" /><button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide password" : "Show password"}</button><Button type="submit">{loading ? "Signing in..." : "Sign in"} <span>→</span></Button></form><p className="auth-switch">Need another role? <Link to="/roles">Back to roles</Link></p><p className="auth-switch">New farmer? <Link to="/register">Register here</Link></p></div></div></div>; }
function FarmerRegistrationPage() { const navigate = useNavigate(); const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" }); const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const [showPassword, setShowPassword] = useState(false); const change = (event) => setForm({ ...form, [event.target.name]: event.target.value }); const submit = async (event) => { event.preventDefault(); setError(""); if (!form.name.trim() || !form.email.trim() || !form.password || !form.confirmPassword) { setError("Please complete all fields."); return; } if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; } setLoading(true); try { const response = await fetch(`${API_BASE_URL}/api/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name, email: form.email, password: form.password }), }); const payload = await response.json().catch(() => ({})); if (!response.ok) { throw new Error(payload.detail || "Unable to register."); } navigate("/farmer-login"); } catch (requestError) { setError(requestError.message || "Unable to register."); } finally { setLoading(false); } }; return <div className="auth-page"><div className="auth-visual"><Logo /><div className="auth-quote"><span>“</span><h2>Start growing<br />with better<br /><em>insight.</em></h2><p>Create a farmer account to access the YieldSense workspace.</p></div><div className="auth-footer">YieldSense AI · Farmer portal</div></div><div className="auth-form"><div className="auth-form-inner"><p className="eyebrow">Farmer registration</p><h1>Create your account.</h1><p className="auth-subtitle">Register to access the existing farmer workspace.</p>{error && <div className="form-error" role="alert">{error}</div>}<form onSubmit={submit}><Field label="Full Name" name="name" value={form.name} onChange={change} placeholder="Your full name" /><Field label="Email address" name="email" value={form.email} onChange={change} type="email" placeholder="you@example.com" /><Field label="Password" name="password" value={form.password} onChange={change} type={showPassword ? "text" : "password"} placeholder="Create a password" /><Field label="Confirm Password" name="confirmPassword" value={form.confirmPassword} onChange={change} type={showPassword ? "text" : "password"} placeholder="Confirm your password" /><button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide passwords" : "Show passwords"}</button><Button type="submit">{loading ? "Registering..." : "Register"}</Button></form><p className="auth-switch">Already registered? <Link to="/farmer-login">Sign in</Link></p></div></div></div>; }
function AdminLoginPage() { const navigate = useNavigate(); const [form, setForm] = useState({ email: "", password: "" }); const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const [showPassword, setShowPassword] = useState(false); const change = (event) => setForm({ ...form, [event.target.name]: event.target.value }); const submit = async (event) => { event.preventDefault(); setError(""); if (!form.email || !form.password) { setError("Email and password are required."); return; } setLoading(true); try { const response = await fetch(`${API_BASE_URL}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.email, password: form.password }), }); const payload = await response.json().catch(() => ({})); if (!response.ok) { throw new Error(payload.detail || "Invalid login."); } if (payload.user.role !== "admin") { throw new Error("This account does not have admin access."); } setAuthSession(payload.user, payload.access_token); navigate("/admin/dashboard"); } catch (requestError) { setError(requestError.message || "Unable to sign in."); } finally { setLoading(false); } }; return <div className="auth-page"><div className="auth-visual"><Logo /><div className="auth-quote"><span>“</span><h2>Administrative<br />oversight,<br /><em>actionable insight.</em></h2><p>Review users, predictions and system performance from the admin workspace.</p></div><div className="auth-footer">YieldSense AI · Admin control center</div></div><div className="auth-form"><div className="auth-form-inner"><p className="eyebrow">Admin sign in</p><h1>Secure access.</h1><p className="auth-subtitle">Only authorized administrators can enter the admin dashboard.</p>{error && <div className="form-error">{error}</div>}<form onSubmit={submit}><Field label="Email address" name="email" value={form.email} onChange={change} type="email" placeholder="admin@company.com" /><Field label="Password" name="password" value={form.password} onChange={change} type={showPassword ? "text" : "password"} placeholder="Enter your password" /><button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide password" : "Show password"}</button><Button type="submit">{loading ? "Verifying..." : "Access admin"} <span>→</span></Button></form><p className="auth-switch">Need another role? <Link to="/roles">Back to roles</Link></p></div></div></div>; }
function RecommendationsLiveWithSoil() { return <RecommendationsLive />; }
function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = useContext(AuthUserContext);
  const farmerPages = {
    "/dashboard": <DashboardMilestone3 />,
    "/farmer/dashboard": <DashboardMilestone3 />,
    "/yield-prediction": <YieldPredictionWithDistrict />,
    "/farmer/yield-prediction": <YieldPredictionWithDistrict />,
    "/recommendations": <RecommendationsMilestone3 />,
    "/farmer/recommendations": <RecommendationsMilestone3 />,
    "/weather": <WeatherLive />,
    "/farmer/weather": <WeatherLive />,
    "/soil": <SoilLive />,
    "/farmer/soil": <SoilLive />,
    "/analytics": <AnalyticsMilestone3 />,
    "/farmer/analytics": <AnalyticsMilestone3 />,
    "/profile": <FarmerProfile user={user} onLogout={() => { clearAuthSession(); navigate("/farmer-login"); }} />,
    "/farmer/profile": <FarmerProfile user={user} onLogout={() => { clearAuthSession(); navigate("/farmer-login"); }} />,
  };
  const page = farmerPages[pathname] || <Navigate to="/dashboard" replace />;

  return (
    <WeatherProvider>
      <div className="app-shell">
        <div className={`mobile-overlay ${menuOpen ? "show" : ""}`} onClick={() => setMenuOpen(false)} />
        <div className={menuOpen ? "sidebar-wrap open" : "sidebar-wrap"}>
          <Sidebar onClose={() => setMenuOpen(false)} />
        </div>
        <div className="main-area">
          <Header onMenu={() => setMenuOpen(true)} />
          <main className="content">{page}</main>
        </div>
      </div>
    </WeatherProvider>
  );
}

function weatherText(value, suffix = "") { return value === null || value === undefined ? "Unavailable" : `${value}${suffix}`; }
function weatherTime(value) { return value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Not updated"; }
function WeatherState({ weather, loading, error }) { if (loading && !weather) return <p className="weather-message">Loading weather...</p>; if (error) return <p className="weather-message error-text">{error}</p>; return null; }
function useSoilData(location) { const state = location.state; const district = location.district; const [sourceData, setSourceData] = useState(() => loadSoilData(location)); const [loading, setLoading] = useState(!sourceData); const [error, setError] = useState(""); useEffect(() => { let active = true; setLoading(true); setError(""); getSoilData({ state, district }).then((data) => { if (active) setSourceData(data); }).catch(() => { if (active) setError("Soil data temporarily unavailable"); }).finally(() => active && setLoading(false)); return () => { active = false; }; }, [state, district]); return { sourceData, loading, error }; }
function SoilDashboardSummary() {
  const { location } = useWeather();
  const { sourceData, loading } = useSoilData(location);
  const values = loadSoilTest(location) || sourceData?.parameters || {};
  const crop = getUserStorageItem("yieldsense-crop") || "";
  const analysis = analyzeSoil(values, crop);
  const readings = [
    ["nitrogen", "Total Nitrogen", "mg/kg"],
    ["phosphorus", "Phosphorus", "mg/kg"],
    ["potassium", "Potassium", "mg/kg"],
    ["ph", "pH level", ""],
  ];
  return (
    <Card>
      <div className="card-heading">
        <div><p className="eyebrow">Field snapshot</p><h2>Soil health</h2></div>
        <Badge tone={analysis.availableCount ? "green" : "neutral"}>{analysis.health}</Badge>
      </div>
      <div className="soil-readings">
        {readings.map(([key, label, unit]) => (
          <div key={key}>
            <b>{values[key] == null ? "Not available" : values[key]}</b>
            <span>{label}</span>
            <i>{values[key] == null ? "" : unit || classifyParameter(key, values[key], crop).label}</i>
          </div>
        ))}
      </div>
      <p className="soil-source-note">
        {loading ? "Checking location-based soil coverage..." : sourceData?.dataType || "Soil coverage has not been checked."}
      </p>
      <Link className="text-link" to="/soil">View soil analysis →</Link>
    </Card>
  );
}
function WeatherRuleAnalysis({ weather, crop }) { const analysis = analyzeWeather(weather, crop); const labels = { temperature: "Temperature", rainfall: "Rainfall", humidity: "Humidity", windSpeed: "Wind speed", precipitationProbability: "Precipitation probability" }; return <Card><div className="card-heading"><div><p className="eyebrow">Numeric crop rules</p><h2>{crop} weather analysis</h2></div><Badge tone={analysis.risks.some((risk) => risk.includes("critical")) ? "amber" : "green"}>{analysis.availableCount} values analyzed</Badge></div><div className="risk-list">{Object.entries(analysis.parameters).map(([name, result]) => <div key={name}><Badge tone={result.tone}>{result.label}</Badge><span>{labels[name]}</span><small>{result.value === null ? "Data unavailable" : `${result.value} ${result.unit}`}</small></div>)}</div></Card>; }
function WeatherLive() {
  const { location, weather, loading, error, refreshWeather } = useWeather();
  const crop = getUserStorageItem("yieldsense-crop") || "";
  return (
    <>
      <PageTitle eyebrow="Field conditions" title="Weather analysis">
        <Button variant="outline" icon="↻" onClick={() => refreshWeather()}>Refresh data</Button>
      </PageTitle>
      <Card className="location-card">
        <div><p className="eyebrow">Saved farm location</p><h2>{[location.district, location.state].filter(Boolean).join(", ") || "Not set"}</h2><p>Last updated: {weatherTime(weather?.lastUpdated)}</p></div>
        <Badge tone={error ? "amber" : weather ? "green" : "neutral"}>{error ? "Unavailable" : weather ? "Live data" : "Not configured"}</Badge>
      </Card>
      <div className="weather-details">
        <Card className="current-weather">
          <p className="eyebrow">Current weather</p>
          <WeatherState weather={weather} loading={loading} error={error} />
          {weather && !error && (
            <>
              <div className="big-weather"><span>☼</span><strong>{weatherText(weather.temperature, "°C")}</strong><div>{weather.condition}<br /><small>Feels like {weatherText(weather.apparentTemperature, "°C")}</small></div></div>
              <div className="stat-row">
                <div><small>Rainfall</small><b>{weatherText(weather.precipitation, " mm")}</b></div>
                <div><small>Humidity</small><b>{weatherText(weather.humidity, "%")}</b></div>
                <div><small>Wind</small><b>{weatherText(weather.windSpeed, " km/h")}</b></div>
              </div>
            </>
          )}
          {!weather && !loading && !error && <p className="weather-message">Choose a farm location in Yield Prediction to request weather data.</p>}
        </Card>
        {weather && <WeatherRuleAnalysis weather={weather} crop={crop} />}
      </div>
      <p className="service-note">Weather observations are supplied by Open-Meteo for the saved farm location. No forecast or seasonal conditions are invented.</p>
    </>
  );
}
function YieldPredictionWithDistrict() {
  const { location, refreshWeather } = useWeather();
  const [options, setOptions] = useState(null);
  const [optionsError, setOptionsError] = useState("");
  const [form, setForm] = useState(() => ({
    year: "",
    state: INDIA_LOCATIONS[location.state] ? location.state : "",
    district: INDIA_LOCATIONS[location.state]?.includes(location.district) ? location.district : "",
    crop: PREDICTION_CROPS.some(({ modelValue }) => modelValue === getUserStorageItem("yieldsense-crop"))
      ? getUserStorageItem("yieldsense-crop")
      : "",
    season: getUserStorageItem("yieldsense-season") || "",
    area: "",
    annualRainfall: "",
    fertilizer: "",
    pesticide: "",
  }));
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [formError, setFormError] = useState("");
  const availableStates = (options?.state || []).filter((state) => INDIA_LOCATIONS[state]);
  const districtOptions = INDIA_LOCATIONS[form.state] || [];
  const selectedCrop = PREDICTION_CROPS.find(({ modelValue }) => modelValue === form.crop);

  useEffect(() => {
    let active = true;
    getPredictionOptions()
      .then((data) => { if (active) setOptions(data); })
      .catch((requestError) => {
        if (active) setOptionsError(requestError.message || "Prediction options are unavailable.");
      });
    return () => { active = false; };
  }, []);

  const change = (event) => {
    const { name, value } = event.target;
    const next = {
      ...form,
      [name]: value,
      ...(name === "state" ? { district: "" } : {}),
    };
    setForm(next);
    if (name === "state" || name === "district") {
      const nextLocation = {
        state: name === "state" ? value : form.state,
        district: name === "district" ? value : "",
      };
      setUserStorageItem("yieldsense-location", JSON.stringify(nextLocation));
      refreshWeather(nextLocation);
    }
    if (name === "crop") {
      const crop = PREDICTION_CROPS.find(({ modelValue }) => modelValue === value);
      setUserStorageItem("yieldsense-crop", crop?.label || "");
    }
    if (name === "season") setUserStorageItem("yieldsense-season", value);
  };

  const submit = async (event) => {
    event.preventDefault();
    const numericInputs = [
      ["Year", Number(form.year), Boolean(form.year) && Number.isInteger(Number(form.year)) && Number(form.year) > 0],
      ["Area", Number(form.area), Boolean(form.area) && Number.isFinite(Number(form.area)) && Number(form.area) > 0],
      ["Annual rainfall", Number(form.annualRainfall), Boolean(form.annualRainfall) && Number.isFinite(Number(form.annualRainfall)) && Number(form.annualRainfall) >= 0],
      ["Fertilizer", Number(form.fertilizer), Boolean(form.fertilizer) && Number.isFinite(Number(form.fertilizer)) && Number(form.fertilizer) >= 0],
      ["Pesticide", Number(form.pesticide), Boolean(form.pesticide) && Number.isFinite(Number(form.pesticide)) && Number(form.pesticide) >= 0],
    ];
    const invalidInput = numericInputs.find(([, , valid]) => !valid);
    if (
      !form.state
      || !form.district
      || !districtOptions.includes(form.district)
      || !selectedCrop
      || !form.season
      || invalidInput
    ) {
      setFormError(invalidInput
        ? `${invalidInput[0]} must contain a valid ${invalidInput[0] === "Year" ? "whole year" : "non-negative number"} value.`
        : "Select a state, a district from that state, a supported crop, and a season.");
      return;
    }
    setProcessing(true);
    setFormError("");
    try {
      const response = await predictYield({
        Year: Number(form.year),
        State: form.state,
        District: form.district,
        Crop: form.crop,
        Season: form.season,
        Area: Number(form.area),
        Annual_Rainfall: Number(form.annualRainfall),
        Fertilizer: Number(form.fertilizer),
        Pesticide: Number(form.pesticide),
      });
      const predictedYield = Number(response.predicted_yield);
      if (!Number.isFinite(predictedYield)) throw new Error("Prediction service returned no yield value.");
      setResult(predictedYield);
      setUserStorageItem("yieldsense-predicted-yield", String(predictedYield));
      setUserStorageItem("yieldsense-crop", selectedCrop.label);
      setUserStorageItem("yieldsense-season", form.season);
      const nextLocation = { state: form.state, district: form.district };
      setUserStorageItem("yieldsense-location", JSON.stringify(nextLocation));
      refreshWeather(nextLocation);
    } catch (requestError) {
      setFormError(requestError.message || "Unable to generate a yield prediction.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <PageTitle eyebrow="Model workspace" title="Predict crop yield">
        <p className="title-note">Enter the eight input features required by the saved CatBoost model.</p>
      </PageTitle>
      {optionsError && <Card className="form-error" role="alert">{optionsError}</Card>}
      {!options && !optionsError && <Card><p className="admin-status" role="status">Loading supported model categories...</p></Card>}
      {options && (
        <form onSubmit={submit} className="prediction-layout">
          <div>
            <Card>
              <FormSection number="01" title="Model inputs" description="Choose categories supported by the loaded model. District is used for local context, not CatBoost.">
                <div className="form-grid">
                  <Field label="Year" name="year" value={form.year} onChange={change} type="number" min="1" max={new Date().getFullYear()} step="1" required />
                  <Field label="State" name="state" value={form.state} onChange={change} options={availableStates} required />
                  <label className="field"><span>District / local area</span><select name="district" value={form.district} onChange={change} disabled={!form.state || !districtOptions.length} required>
                    <option value="">{form.state ? "Select district" : "Select a state first"}</option>
                    {districtOptions.map((district) => <option key={district} value={district}>{district}</option>)}
                  </select></label>
                  <label className="field"><span>Crop</span><select name="crop" value={form.crop} onChange={change} required>
                    <option value="">Select crop</option>
                    {PREDICTION_CROPS.map(({ label, modelValue }) => <option key={modelValue} value={modelValue}>{label}</option>)}
                  </select></label>
                  <Field label="Season" name="season" value={form.season} onChange={change} options={options.season || []} required />
                  <Field label="Area (hectares)" name="area" value={form.area} onChange={change} type="number" min="0.01" step="0.01" required />
                  <Field label="Annual Rainfall (mm)" name="annualRainfall" value={form.annualRainfall} onChange={change} type="number" min="0" step="0.01" required />
                  <Field label="Fertilizer (kg/ha)" name="fertilizer" value={form.fertilizer} onChange={change} type="number" min="0" step="0.01" required />
                  <Field label="Pesticide (kg/ha)" name="pesticide" value={form.pesticide} onChange={change} type="number" min="0" step="0.01" required />
                </div>
              </FormSection>
            </Card>
            {formError && <Card className="form-error" role="alert">{formError}</Card>}
            <button className="button" type="submit" disabled={processing}>{processing ? "Processing forecast..." : "Predict yield"}</button>
          </div>
          <div className="sticky-result">
            <Card className={result !== null ? "result-card ready" : "result-card"}>
              <p className="eyebrow">Forecast result</p>
              {result !== null ? (
                <>
                  <div className="result-number">{result.toFixed(2)} <span>t/ha</span></div>
                  <p>Predicted productivity for {selectedCrop.label} in {[form.district, form.state].filter(Boolean).join(", ")}.</p>
                  <Badge>Forecast ready</Badge>
                  <Button to="/recommendations" variant="soft" icon="✦">Get AI recommendations</Button>
                </>
              ) : (
                <div className="empty-result"><span>↗</span><h3>Your forecast will appear here</h3><p>Complete the model inputs and run a prediction to see the result.</p></div>
              )}
            </Card>
            <p className="privacy-note">Weather remains a separate live service and is not added to the model features.</p>
          </div>
        </form>
      )}
    </>
  );
}
function FormSection({ number, title, description, children }) { return <div className="form-section"><div className="section-number">{number}</div><div className="section-content"><h2>{title}</h2><p>{description}</p>{children}</div></div>; }
function DashboardMilestone3() { const user = useContext(AuthUserContext); const { location, weather, loading, error } = useWeather(); const [latest, setLatest] = useState(null); const [status, setStatus] = useState("Loading dashboard data..."); useEffect(() => { getAnalyticsHistory({}).then((data) => { setLatest(data.items?.[0] || null); setStatus(data.items?.length ? "" : "No predictions recorded yet."); }).catch(() => setStatus("Analytics data unavailable.")); }, []); const crop = latest?.crop || "Unavailable"; const season = latest?.season || "Unavailable"; const yieldValue = latest ? `${Number(latest.predicted_yield).toFixed(2)} t/ha` : "Unavailable"; const risk = latest ? (Number(latest.predicted_yield) < 2 ? "High" : Number(latest.predicted_yield) < 4 ? "Moderate" : "Low") : "Unavailable"; return <><PageTitle eyebrow="Agricultural overview" title={`Good morning, ${user?.name || "Farmer"}`}><Button to="/yield-prediction" icon="+">New prediction</Button></PageTitle>{status && <p className="weather-message">{status}</p>}<div className="metric-grid"><Metric label="Predicted yield" value={yieldValue} detail={latest ? `Prediction ${String(latest.prediction_id).slice(0, 8)}` : "No prediction available"} /><Metric label="Current crop" value={crop} detail={latest ? `${latest.state} · ${season}` : "Select a crop and predict"} accent="soil" /><Metric label="Season progress" value="Unavailable" detail="No harvest calendar is connected" accent="blue" /><Metric label="Risk level" value={risk} detail="Calculated from available yield data" accent="earth" /></div><div className="dashboard-grid"><Card className="weather-card"><div className="card-heading"><div><p className="eyebrow">{location.district}, {location.state}</p><h2>Weather overview</h2></div><span className="weather-symbol">☼</span></div><WeatherState weather={weather} loading={loading} error={error} />{weather && !error && <><div className="weather-main"><strong>{weatherText(weather.temperature, "°C")}</strong><span>{weather.condition}<br /><small>Feels like {weatherText(weather.apparentTemperature, "°C")}</small></span></div><div className="stat-row"><div><small>Rainfall</small><b>{weatherText(weather.precipitation, " mm")}</b></div><div><small>Humidity</small><b>{weatherText(weather.humidity, "%")}</b></div><div><small>Wind</small><b>{weatherText(weather.windSpeed, " km/h")}</b></div></div></>}</Card><SoilDashboardSummary /><Card className="recent-card"><div className="card-heading"><div><p className="eyebrow">Latest persisted record</p><h2>Recent prediction</h2></div><Link className="text-link" to="/analytics">View history</Link></div>{latest ? <div className="recent-item"><span className="crop-avatar">{latest.crop.slice(0, 1)}</span><div><b>{latest.crop} · {latest.district || latest.state}</b><small>{latest.season} {latest.year} · {new Date(latest.created_at).toLocaleDateString()}</small></div><strong>{Number(latest.predicted_yield).toFixed(2)} <small>t/ha</small></strong></div> : <p className="soil-assessment-note">No prediction history yet.</p>}</Card><Card className="recommend-card"><div className="recommend-mark">✦</div><div><p className="eyebrow">AI recommendation</p><h2>{getUserStorageItem("yieldsense-ai-summary") || "Generate insights from your latest prediction."}</h2><Link className="text-link" to="/recommendations">Open AI insights →</Link></div></Card></div><div className="quick-actions"><span>Quick actions</span><Button to="/yield-prediction" variant="outline" icon="↗">Predict yield</Button><Button to="/recommendations" variant="outline" icon="✦">Get recommendations</Button><Button to="/weather" variant="outline" icon="☁">Weather analysis</Button><Button to="/soil" variant="outline" icon="♧">Soil analysis</Button></div></>; }
function AnalyticsMilestone3() {
  const [filters, setFilters] = useState({
    crop: "",
    state: "",
    season: "",
    year: "",
  });

  const [data, setData] = useState(null);
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState("");

  const change = (event) =>
    setFilters({
      ...filters,
      [event.target.name]: event.target.value,
    });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getAnalyticsDashboard(filters)
      .then((result) => {
        if (!active) return;
        setData(result);
        setOptions(result.options || {});
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Analytics data is unavailable.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [filters]);

  // Download PDF report
  const download = async () => {
    setPdfLoading(true);
    setError("");
    try {
      const query = new URLSearchParams(
        Object.entries(filters).filter(([, value]) => value)
      ).toString();

      const response = await fetch(
        `${API_BASE_URL}/api/reports/pdf?${query}`,
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );

      if (!response.ok) {
        throw new Error("Failed to generate PDF report");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "yieldsense-farmer-report.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError("Unable to generate PDF report.");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <>
      <PageTitle eyebrow="Performance history" title="Analytics & reports">
        <button className="button" onClick={download} disabled={pdfLoading}>
          {pdfLoading ? "Preparing report..." : "Download report"}
        </button>
      </PageTitle>
      <AnalyticsFilters filters={filters} options={options} onChange={change} />
      {error && <Card className="form-error">{error}</Card>}
      {loading && <Card><p className="admin-status" role="status">Loading analytics for the selected filters...</p></Card>}
      {!loading && data && data.summary.count === 0 && <Card><p className="admin-status">No data available for the selected filters.</p></Card>}
      {!loading && data && data.summary.count > 0 && (
        <>
          <div className="metric-grid analytics-metrics">
            <Metric label="Average yield" value={`${Number(data.summary.average_yield).toFixed(2)} t/ha`} detail={`${data.summary.count} matching predictions`} />
            <Metric label="Highest yield" value={`${Number(data.summary.highest_yield).toFixed(2)} t/ha`} detail="From selected records" accent="blue" />
            <Metric label="Lowest yield" value={`${Number(data.summary.lowest_yield).toFixed(2)} t/ha`} detail="From selected records" accent="earth" />
            <Metric label="Best season" value={data.seasons.length ? [...data.seasons].sort((left, right) => right.average_yield - left.average_yield)[0].name : "Insufficient data"} detail="From selected records" accent="soil" />
          </div>
          <div className="analytics-chart-grid">
            <AnalyticsTrendChart title="Yield by prediction date" items={data.trend} />
            <AnalyticsTrendChart title="Yield by crop year" items={data.yearly} />
            <AnalyticsBarChart title="Crop comparison" items={data.crops} />
            <AnalyticsBarChart title="Season comparison" items={data.seasons} />
          </div>
          <Card className="table-card">
            <div className="card-heading"><div><p className="eyebrow">{data.history.length} records</p><h2>Prediction history</h2></div></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Crop</th><th>State / district</th><th>Season</th><th>Year</th><th>Predicted yield</th><th>Date</th></tr></thead>
                <tbody>{data.history.map((row) => (
                  <tr key={row.prediction_id}>
                    <td>{row.crop}</td>
                    <td>{[row.district, row.state].filter(Boolean).join(", ")}</td>
                    <td>{row.season}</td>
                    <td>{row.year}</td>
                    <td><b className="green-text">{Number(row.predicted_yield).toFixed(2)} t/ha</b></td>
                    <td>{row.created_at ? new Date(row.created_at).toLocaleDateString() : "Unavailable"}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </>
  );
}function RecommendationsMilestone3() { const [ready, setReady] = useState(false); const [error, setError] = useState(""); useEffect(() => { let active = true; getAnalyticsHistory({}).then((data) => { if (!active) return; const latest = data.items?.[0]; if (latest) { setUserStorageItem("yieldsense-predicted-yield", String(latest.predicted_yield)); setUserStorageItem("yieldsense-prediction-id", latest.prediction_id); setUserStorageItem("yieldsense-crop", latest.crop); setUserStorageItem("yieldsense-season", latest.season); setUserStorageItem("yieldsense-location", JSON.stringify({ state: latest.state, district: latest.district || "" })); } setReady(true); }).catch((requestError) => { if (active) { setError(requestError.message || "Unable to load prediction context."); setReady(true); } }); return () => { active = false; }; }, []); if (!ready) return <Card><p className="weather-message" role="status">Loading your prediction context...</p></Card>; return <><RecommendationsLiveWithSoil />{error && <Card className="form-error" role="alert">{error}</Card>}</>; }
function ContextStrip({ context }) { return <div className="context-strip"><div><span>Crop</span><b>{context.crop || "Not available"}</b></div><div><span>Location</span><b>{[context.state, context.district].filter(Boolean).join(", ") || "Not available"}</b></div><div><span>Season</span><b>{context.season || "Not available"}</b></div><div><span>Predicted yield</span><b className={context.predictedYield === "Unavailable" ? "" : "green-text"}>{context.predictedYield}</b></div></div>; }
function RecommendationsLive() {
  const { location, weather, loading: weatherLoading, error: weatherError } = useWeather();
  const { sourceData: fetchedSoil, loading: soilLoading, error: soilError } = useSoilData(location);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const crop = getUserStorageItem("yieldsense-crop") || "";
  const soil = loadSoilTest(location) || fetchedSoil?.parameters || {};
  const soilAnalysis = analyzeSoil(soil, crop);
  const weatherAnalysis = analyzeWeather(weather, crop);
  const storedYield = getUserStorageItem("yieldsense-predicted-yield");
  const context = {
    crop,
    state: location.state,
    district: location.district,
    season: getUserStorageItem("yieldsense-season") || "",
    predictedYield: storedYield || "Unavailable",
    prediction_id: getUserStorageItem("yieldsense-prediction-id") || null,
    weather: weather
      ? {
          temperature: weather.temperature,
          apparentTemperature: weather.apparentTemperature,
          precipitation: weather.precipitation,
          humidity: weather.humidity,
          windSpeed: weather.windSpeed,
          precipitationProbability: weather.precipitationProbability,
          condition: weather.condition,
          weatherCode: weather.weatherCode,
        }
      : "Unavailable",
    weatherAnalysis,
    soil: {
      parameters: Object.fromEntries(
        ["ph", "moisture", "nitrogen", "phosphorus", "potassium"]
          .map((name) => [name, soil[name] ?? null])
      ),
      health: soilAnalysis.health,
      suitability: soilAnalysis.suitability,
      statuses: soilAnalysis.statuses,
      warnings: soilAnalysis.warnings,
    },
    soilAnalysis,
    detectedRisks: [...weatherAnalysis.risks, ...soilAnalysis.warnings],
  };
  const canGenerate = Boolean(context.prediction_id && crop && storedYield);

  const generate = async () => {
    if (!canGenerate) {
      setError("Create a saved prediction before requesting crop-specific recommendations.");
      return;
    }
    setLoading(true);
    setError("");
    setInsights(null);
    try {
      setInsights(await generateAIInsights(context));
    } catch (requestError) {
      setError(requestError.message || "Unable to generate AI insights.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageTitle eyebrow="Decision support" title="AI-powered agricultural insights">
        <button className="button" onClick={generate} disabled={loading || !canGenerate}>
          {loading ? "Generating insights..." : "Generate AI insights"}
        </button>
      </PageTitle>
      <ContextStrip context={context} />
      {!canGenerate && <Card><p className="admin-status">No saved prediction is available for this account yet. Make a prediction to enable recommendations based on your own crop data.</p></Card>}
      {weatherLoading && <Card><p className="weather-message">Loading weather context...</p></Card>}
      {weatherError && <Card className="form-error">Weather context unavailable: {weatherError}</Card>}
      {soilLoading && <Card><p className="weather-message">Loading soil data...</p></Card>}
      {soilError && <Card className="form-error">{soilError}</Card>}
      <Card className="ai-disclosure"><span>◎</span><p><b>Groq decision support</b> The model analyzes your persisted CatBoost result, available live weather, and soil information. It does not calculate yield. Missing values are passed as unavailable.</p></Card>
      {loading && <Card className="ai-loading"><span className="ai-pulse">✦</span><h2>Generating AI recommendations...</h2><p>Reviewing your available field context.</p></Card>}
      {error && <Card className="form-error ai-error" role="alert"><b>AI insights unavailable</b><p>{error}</p><small>Check backend Groq configuration, then try again.</small></Card>}
      {!loading && !error && !insights && canGenerate && <Card className="ai-empty"><span>✦</span><h2>Generate insights from your field context</h2><p>Recommendations are shown only after the backend returns a successful structured response.</p></Card>}
      {insights && (
        <div className="ai-insights">
          <Card className="assessment"><div className="recommendation-title"><span>01</span><h2>Overall assessment</h2><Badge>Generated by Groq</Badge></div><p>{insights.summary}</p></Card>
          <div className="ai-status-grid">
            <Card><p className="eyebrow">Yield outlook</p><h2>{insights.yield_outlook}</h2><small>Based on the supplied prediction; not recalculated by AI.</small></Card>
            <Card><p className="eyebrow">Weather risk</p><h2>{insights.weather_risk}</h2><small>Based on available Open-Meteo conditions.</small></Card>
            <Card><p className="eyebrow">Soil status</p><h2>{insights.soil_status}</h2><small>{soilAnalysis.availableCount ? "Based on available soil values." : "Soil measurements are insufficient."}</small></Card>
          </div>
          <div className="two-column">
            <Card><p className="eyebrow">Key risks</p><h2>Watch these factors</h2>{insights.key_risks.length ? <ul className="clean-list">{insights.key_risks.map((risk) => <li key={risk}>{risk}</li>)}</ul> : <p className="soil-assessment-note">No risks returned.</p>}</Card>
            <Card><p className="eyebrow">Recommendations</p><h2>Practical next steps</h2>{insights.recommendations.length ? <ul className="clean-list">{insights.recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}</ul> : <p className="soil-assessment-note">No recommendations returned.</p>}</Card>
          </div>
        </div>
      )}
      <p className="service-note">Groq requests run through the backend. Keep GROQ_API_KEY in the backend environment only.</p>
    </>
  );
}
function SoilLive() {
  const { location } = useWeather();
  const [sourceData, setSourceData] = useState(null);
  const [parameters, setParameters] = useState({});
  const [manualSources, setManualSources] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const crop = getUserStorageItem("yieldsense-crop") || "";

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    try {
      const savedManualSources = JSON.parse(localStorage.getItem(`yieldsense-soil-manual:${getStoredUser()?.id || "anonymous"}:${location.state}:${location.district}`.toLowerCase()) || "{}");
      setManualSources(savedManualSources);
    } catch {
      setManualSources({});
    }
    getSoilData(location)
      .then((data) => {
        if (!active) return;
        setSourceData(data);
        const savedParameters = loadSoilTest(location) || data.parameters;
        setParameters(savedParameters || {});
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Unable to load soil data.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [location]);

  const analysis = analyzeSoil(parameters, crop);
  const values = [
    ["ph", "Soil pH", "pH"],
    ["moisture", "Soil moisture", "%"],
    ["nitrogen", "Total nitrogen", "mg/kg"],
    ["phosphorus", "Phosphorus", "mg/kg"],
    ["potassium", "Potassium", "mg/kg"],
  ];
  const missingParameters = values.filter(([name]) => {
    const value = parameters[name];
    return value == null || value === "";
  });
  const change = (event) => {
    setParameters((current) => ({
      ...current,
      [event.target.name]: event.target.value === "" ? null : event.target.value,
    }));
  };
  const save = (event) => {
    event.preventDefault();
    try {
      const nextManualSources = { ...manualSources };
      const manualEntries = missingParameters.map(([name, label]) => {
        const rawValue = parameters[name];
        if (rawValue === null || rawValue === undefined || rawValue === "") {
          return null;
        }
        const numberValue = Number(rawValue);
        if (!Number.isFinite(numberValue)) {
          throw new Error(`Enter a valid number for ${label}.`);
        }
        if (name === "ph" && (numberValue < 0 || numberValue > 14)) {
          throw new Error(`${label} must be between 0 and 14.`);
        }
        if (numberValue < 0) {
          throw new Error(`${label} must be a positive value.`);
        }
        nextManualSources[name] = "manual";
        return [name, numberValue];
      }).filter(Boolean);

      if (!manualEntries.length) {
        throw new Error("Enter a valid value for the unavailable soil parameter.");
      }

      const merged = { ...parameters, ...Object.fromEntries(manualEntries) };
      saveSoilTest(location, merged);
      localStorage.setItem(`yieldsense-soil-manual:${getStoredUser()?.id || "anonymous"}:${location.state}:${location.district}`.toLowerCase(), JSON.stringify(nextManualSources));
      setParameters(merged);
      setManualSources(nextManualSources);
      setSourceData((current) => ({
        ...current,
        dataType: "Farmer-entered soil test",
        source: "Farmer-entered soil test",
        parameters: merged,
        isReference: false,
      }));
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Enter a valid number for the unavailable soil parameter.");
    }
  };

  if (loading) {
    return <><PageTitle eyebrow="Field conditions" title="Soil analysis" /><Card><p className="weather-message">Checking SoilGrids coverage for the saved farm location...</p></Card></>;
  }

  return (
    <>
      <PageTitle eyebrow="Field conditions" title="Soil analysis" />
      {error && <Card className="form-error" role="alert">{error}</Card>}
      <Card className="soil-source-card">
        <div>
          <p className="eyebrow">Saved farm location</p>
          <h2>{[location.district, location.state].filter(Boolean).join(", ") || "Not set"}</h2>
          <p>{sourceData?.coordinates ? `SoilGrids coordinates: ${sourceData.coordinates.latitude.toFixed(4)}, ${sourceData.coordinates.longitude.toFixed(4)}` : "Coordinates are unavailable until a location is selected."}</p>
        </div>
        <div>
          <Badge tone={analysis.availableCount ? "green" : "neutral"}>{sourceData?.dataType || "No data source response"}</Badge>
          {sourceData?.sourceUrl && <a className="text-link" href={sourceData.sourceUrl} target="_blank" rel="noreferrer">SoilGrids / ISRIC source details</a>}
        </div>
      </Card>
      <div className="soil-analysis-grid">
        <Card>
          <div className="card-heading"><div><p className="eyebrow">Measured values available</p><h2>{analysis.health}</h2></div><Badge tone={analysis.availableCount ? "green" : "neutral"}>{analysis.availableCount} of {values.length}</Badge></div>
          <p className="soil-assessment-note">
            {crop
              ? `Screening uses ${crop}, the crop selected in your prediction context.`
              : "Choose a crop in Yield Prediction to enable crop-specific screening."}
          </p>
          <p className="soil-assessment-note">SoilGrids provides modeled pH and total nitrogen where gridded coverage exists. It does not provide the displayed moisture, phosphorus, or potassium measurements.</p>
        </Card>
        <Card>
          <p className="eyebrow">Coverage status</p>
          <h2>{sourceData?.dataType || "Soil data unavailable"}</h2>
          <p className="soil-assessment-note">
            The project's training dataset uses broad regional categories and cannot safely be presented as measurements from this farm. Enter laboratory results below if location-level values are unavailable.
          </p>
        </Card>
      </div>
      <Card>
        <div className="card-heading"><div><p className="eyebrow">Soil parameters</p><h2>Current available measurements</h2></div></div>
        <div className="soil-parameter-grid">
          {values.map(([name, label, unit]) => {
            const status = classifyParameter(name, parameters[name], crop);
            const isManual = manualSources[name] === "manual" && parameters[name] != null;
            return (
              <div className="soil-parameter" key={name}>
                <span>{label}</span>
                <strong>{parameters[name] == null ? "Not available" : `${parameters[name]} ${unit}`}</strong>
                {isManual ? <Badge tone="neutral">Manual</Badge> : parameters[name] != null ? <Badge tone={status.tone}>{status.label}</Badge> : null}
              </div>
            );
          })}
        </div>
      </Card>
      {missingParameters.length > 0 && (
        <Card>
          <p className="eyebrow">Optional local soil test</p>
          <h2>Enter values from a laboratory or Soil Health Card</h2>
          <p className="soil-assessment-note">These measurements are saved only in this browser for this authenticated account and location. They are never inferred from another farmer or a broad-region training sample.</p>
          <form onSubmit={save} className="soil-test-form">
            {missingParameters.map(([name, label, unit]) => (
              <Field
                key={name}
                label={`${label} (${unit})`}
                name={name}
                value={parameters[name] ?? ""}
                onChange={change}
                type="number"
                min="0"
                step={name === "ph" ? "0.1" : "0.01"}
              />
            ))}
            <Button type="submit" icon="✓">Save soil data</Button>
          </form>
        </Card>
      )}
      <div className="two-column">
        <Card><p className="eyebrow">Warnings</p><h2>Screening observations</h2>{analysis.warnings.length ? <ul className="clean-list">{analysis.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : <p className="soil-assessment-note">No screening warnings can be calculated without measured values.</p>}</Card>
        <Card><p className="eyebrow">Next steps</p><h2>Data to collect</h2><p className="soil-assessment-note">Use a field soil test for moisture, available phosphorus and potassium. Total nitrogen from SoilGrids is a gridded estimate, not a laboratory result.</p></Card>
      </div>
    </>
  );
}


function ProtectedRoute({ allowedRole = "farmer" }) {
  const token = getAuthToken();
  const redirectTo = allowedRole === "admin" ? "/admin-login" : "/farmer-login";
  const [verified, setVerified] = useState(() => (
    token && verifiedSession?.token === token ? verifiedSession : null
  ));

  useEffect(() => {
    if (!token || verifiedSession?.token === token) return undefined;
    let active = true;
    fetchWithAuth("/api/auth/me")
      .then((user) => {
        if (!active) return;
        setAuthSession(user, token);
        setVerified(verifiedSession);
      })
      .catch(() => {
        if (!active) return;
        clearAuthSession();
        setVerified({ token, user: null });
      });
    return () => { active = false; };
  }, [token]);

  if (!token) return <Navigate to={redirectTo} replace />;
  if (!verified || verified.token !== token) {
    return <p className="admin-status" role="status">Checking account access...</p>;
  }
  if (verified.user?.role !== allowedRole) return <Navigate to={redirectTo} replace />;
  return (
    <AuthUserContext.Provider value={verified.user}>
      {allowedRole === "admin" ? <AdminDashboard /> : <AppLayout />}
    </AuthUserContext.Provider>
  );
}

function App() {
  return <BrowserRouter>
    <Routes>
      <Route path="/" element={<LaunchPage />} />
      <Route path="/roles" element={<RoleSelectionPage />} />
      <Route path="/farmer-login" element={<FarmerLoginPage />} />
      <Route path="/admin-login" element={<AdminLoginPage />} />
      <Route path="/login" element={<Navigate to="/farmer-login" replace />} />
      <Route path="/register" element={<FarmerRegistrationPage />} />
      <Route path="/admin/*" element={<ProtectedRoute allowedRole="admin" />} />
      <Route path="/farmer/*" element={<ProtectedRoute allowedRole="farmer" />} />
      <Route path="/dashboard/*" element={<ProtectedRoute allowedRole="farmer" />} />
      <Route path="/yield-prediction/*" element={<ProtectedRoute allowedRole="farmer" />} />
      <Route path="/recommendations/*" element={<ProtectedRoute allowedRole="farmer" />} />
      <Route path="/weather/*" element={<ProtectedRoute allowedRole="farmer" />} />
      <Route path="/soil/*" element={<ProtectedRoute allowedRole="farmer" />} />
      <Route path="/analytics/*" element={<ProtectedRoute allowedRole="farmer" />} />
      <Route path="/profile/*" element={<ProtectedRoute allowedRole="farmer" />} />
      <Route path="/*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>;
}

export default App;