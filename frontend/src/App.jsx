import { createContext, useContext, useEffect, useState } from "react";
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { fetchWeather } from "./services/weatherService";
import { getSoilData, loadSoilData, loadSoilTest, saveSoilTest } from "./services/soilService";
import { analyzeSoil, classifyParameter } from "./utils/soilAnalysis";
import { generateAIInsights } from "./services/aiInsightService";
import { predictYield } from "./services/predictionService";
import { getAnalyticsSummary, getAnalyticsHistory, getCropAnalytics, getSeasonAnalytics, getReportSummary } from "./services/analyticsService";
import { analyzeWeather } from "./utils/weatherAnalysis";
import { INDIA_LOCATIONS, INDIA_STATES } from "./utils/indiaLocations";

const navItems = [
  ["/dashboard", "Overview", "⌂"], ["/yield-prediction", "Yield prediction", "↗"], ["/recommendations", "AI recommendations", "✦"],
  ["/weather", "Weather", "☁"], ["/soil", "Soil health", "♧"], ["/analytics", "Analytics & reports", "▥"], ["/profile", "Profile & settings", "○"],
];

const defaultLocation = { state: "West Bengal", district: "Nadia" };
const WeatherContext = createContext(null);

function WeatherProvider({ children }) {
  const [location, setLocation] = useState(() => JSON.parse(localStorage.getItem("yieldsense-location") || "null") || defaultLocation);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshWeather = async (nextLocation = location) => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchWeather(nextLocation);
      setLocation(nextLocation);
      setWeather(result);
      localStorage.setItem("yieldsense-location", JSON.stringify(nextLocation));
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
const DashboardStatic = DashboardLive;

function Icon({ children }) { return <span className="icon" aria-hidden="true">{children}</span>; }
function Logo({ compact = false }) { return <Link className="brand" to="/dashboard"><span className="brand-mark">⌁</span>{!compact && <span><b>YieldSense</b> <em>AI</em><small>Smarter farms. Brighter tomorrows.</small></span>}</Link>; }
function Button({ children, variant = "primary", type = "button", onClick, to, icon }) { const body = <>{icon && <Icon>{icon}</Icon>}{children}</>; return to ? <Link className={`button button-${variant}`} to={to}>{body}</Link> : <button className={`button button-${variant}`} type={type} onClick={onClick}>{body}</button>; }
function Card({ children, className = "" }) { return <section className={`card ${className}`}>{children}</section>; }
function Badge({ children, tone = "green" }) { return <span className={`badge badge-${tone}`}>{children}</span>; }
function Field({ label, name, value, onChange, type = "text", placeholder, options }) { const displayLabel = label === "Nitrogen (N)" ? "Total Nitrogen (N)" : label; return <label className="field"><span>{displayLabel}</span>{options ? <select name={name} value={value} onChange={onChange}><option value="">Select {displayLabel.toLowerCase()}</option>{options.map((option) => <option key={option}>{option}</option>)}</select> : <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} />}</label>; }
function PageTitle({ eyebrow, title, children }) { return <div className="page-title"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div>{children}</div>; }
function Metric({ label, value, detail, accent = "green" }) { return <Card className="metric"><div className={`metric-icon ${accent}`}>{accent === "soil" ? "♧" : accent === "blue" ? "☁" : "↗"}</div><div><p>{label}</p><strong>{value}</strong>{detail && <small>{detail}</small>}</div></Card>; }

function ThemeToggle() { const [dark, setDark] = useState(() => localStorage.getItem("yieldsense-theme") === "dark"); useEffect(() => { document.documentElement.classList.toggle("dark", dark); localStorage.setItem("yieldsense-theme", dark ? "dark" : "light"); }, [dark]); return <button className="theme-toggle" onClick={() => setDark(!dark)} aria-label="Toggle theme"><span>{dark ? "☾" : "☀"}</span><i className={dark ? "on" : ""} /></button>; }
function Sidebar({ onClose }) { return <aside className="sidebar"><div className="sidebar-top"><Logo /><button className="mobile-close" onClick={onClose}>×</button></div><p className="nav-label">Workspace</p><nav>{navItems.map(([path, label, icon]) => <NavLink key={path} to={path} onClick={onClose} className={({ isActive }) => isActive ? "active" : ""}><Icon>{icon}</Icon>{label}</NavLink>)}</nav><div className="sidebar-foot"><div className="help-card"><span>✦</span><b>Need a fresh forecast?</b><small>Run a new prediction with your latest farm data.</small><Button to="/yield-prediction" variant="soft">New prediction</Button></div><button className="logout" onClick={() => localStorage.removeItem("yieldsense-auth")}><Icon>↪</Icon> Log out</button></div></aside>; }
function Header({ onMenu }) { const location = useLocation(); const current = navItems.find(([path]) => path === location.pathname)?.[1] || "Overview"; return <header className="header"><button className="menu-button" onClick={onMenu}>☰</button><div><span className="crumb">Workspace /</span> <b>{current}</b></div><div className="header-actions"><ThemeToggle /><button className="header-icon" aria-label="Notifications">♢</button><div className="avatar">AM</div><span className="user-name">Aarav Mehta</span></div></header>; }
function RecommendationsLiveWithSoil() { const { location } = useWeather(); useSoilData(location); return <RecommendationsLive />; }
function AppLayout() { const [menuOpen, setMenuOpen] = useState(false); return <WeatherProvider><div className="app-shell"><div className={`mobile-overlay ${menuOpen ? "show" : ""}`} onClick={() => setMenuOpen(false)} /><div className={menuOpen ? "sidebar-wrap open" : "sidebar-wrap"}><Sidebar onClose={() => setMenuOpen(false)} /></div><div className="main-area"><Header onMenu={() => setMenuOpen(true)} /><main className="content"><Routes><Route path="/dashboard" element={<DashboardMilestone3 />} /><Route path="/yield-prediction" element={<YieldPredictionWithDistrict />} /><Route path="/recommendations" element={<RecommendationsMilestone3 />} /><Route path="/weather" element={<WeatherLive />} /><Route path="/soil" element={<SoilLive />} /><Route path="/analytics" element={<AnalyticsMilestone3 />} /><Route path="/profile" element={<Profile />} /></Routes></main></div></div></WeatherProvider>; }

function YieldPredictionStatic() { const [form, setForm] = useState({ state: "West Bengal", district: "Nadia", crop: "Rice", season: "Kharif", year: "2026", area: "2.5", rainfall: "12", temperature: "28", nitrogen: "62", phosphorus: "31", potassium: "48", ph: "6.8" }); const [result, setResult] = useState(false); const [loading, setLoading] = useState(false); const change = (event) => setForm({ ...form, [event.target.name]: event.target.value }); const submit = (event) => { event.preventDefault(); setLoading(true); setTimeout(() => { setLoading(false); setResult(true); }, 650); }; return <><PageTitle eyebrow="Model workspace" title="Predict crop yield"><p className="title-note">Use your latest field, weather and soil readings for a new forecast.</p></PageTitle><form onSubmit={submit} className="prediction-layout"><div><Card><FormSection number="01" title="Crop information" description="Tell us where and what you are growing."><div className="form-grid"><Field label="State" name="state" value={form.state} onChange={change} options={["West Bengal", "Punjab", "Maharashtra", "Karnataka"]} /><Field label="District" name="district" value={form.district} onChange={change} /><Field label="Crop" name="crop" value={form.crop} onChange={change} options={["Rice", "Wheat", "Maize", "Cotton"]} /><Field label="Season" name="season" value={form.season} onChange={change} options={["Kharif", "Rabi", "Summer"]} /><Field label="Year" name="year" value={form.year} onChange={change} type="number" /></div></FormSection></Card><Card><FormSection number="02" title="Farm information" description="Add the size of the field being assessed."><div className="form-grid"><Field label="Cultivated area (hectares)" name="area" value={form.area} onChange={change} type="number" /></div></FormSection></Card><Card><FormSection number="03" title="Weather information" description="Recent conditions from your field location."><div className="form-grid"><Field label="Rainfall (mm)" name="rainfall" value={form.rainfall} onChange={change} type="number" /><Field label="Temperature (°C)" name="temperature" value={form.temperature} onChange={change} type="number" /></div></FormSection></Card><Card><FormSection number="04" title="Soil information" description="Use the results of your latest soil test."><div className="form-grid"><Field label="Nitrogen (mg/kg)" name="nitrogen" value={form.nitrogen} onChange={change} type="number" /><Field label="Phosphorus (mg/kg)" name="phosphorus" value={form.phosphorus} onChange={change} type="number" /><Field label="Potassium (mg/kg)" name="potassium" value={form.potassium} onChange={change} type="number" /><Field label="pH level" name="ph" value={form.ph} onChange={change} type="number" step="0.1" /></div></FormSection></Card><Button type="submit" icon="↗">{loading ? "Processing forecast..." : "Predict yield"}</Button></div><div className="sticky-result"><Card className={result ? "result-card ready" : "result-card"}><p className="eyebrow">Forecast result</p>{result ? <><div className="result-number">4.27 <span>t/ha</span></div><p>Expected productivity for {form.crop} in {form.district}.</p><Badge>Forecast ready</Badge><Button to="/recommendations" variant="soft" icon="✦">Get AI recommendations</Button></> : <div className="empty-result"><span>↗</span><h3>Your forecast will appear here</h3><p>Complete the field inputs and run a prediction to see your expected yield.</p></div>}</Card><p className="privacy-note">Forecasts are generated from your submitted field data. Connect the FastAPI service to replace this preview with the production model.</p></div></form></>; }
function weatherText(value, suffix = "") { return value === null || value === undefined ? "Unavailable" : `${value}${suffix}`; }
function weatherTime(value) { return value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Not updated"; }
function WeatherState({ weather, loading, error }) { if (loading && !weather) return <p className="weather-message">Loading weather...</p>; if (error) return <p className="weather-message error-text">{error}</p>; return null; }
function useSoilData(location) { const [sourceData, setSourceData] = useState(() => loadSoilData(location)); const [loading, setLoading] = useState(!sourceData); const [error, setError] = useState(""); useEffect(() => { let active = true; setLoading(true); setError(""); getSoilData(location).then((data) => { if (active) setSourceData(data); }).catch(() => { if (active) setError("Soil data temporarily unavailable"); }).finally(() => active && setLoading(false)); return () => { active = false; }; }, [location.state, location.district]); return { sourceData, loading, error }; }
function SoilDashboardSummary() { const { location } = useWeather(); const values = loadSoilTest(location) || {}; const analysis = analyzeSoil(values, localStorage.getItem("yieldsense-crop") || "Rice"); return <Card><div className="card-heading"><div><p className="eyebrow">Field snapshot</p><h2>Soil health</h2></div><Badge tone={analysis.availableCount ? "green" : "neutral"}>{analysis.health}</Badge></div><div className="soil-readings"><div><b>{values.nitrogen ?? "Unavailable"}</b><span>Total Nitrogen</span><i>{values.nitrogen === undefined ? "Unavailable" : "mg/kg"}</i></div><div><b>{values.phosphorus ?? "Unavailable"}</b><span>Phosphorus</span><i>{values.phosphorus === undefined ? "Unavailable" : "mg/kg"}</i></div><div><b>{values.potassium ?? "Unavailable"}</b><span>Potassium</span><i>{values.potassium === undefined ? "Unavailable" : "mg/kg"}</i></div><div><b>{values.ph ?? "Unavailable"}</b><span>pH level</span><i>{values.ph === undefined ? "Unavailable" : classifyParameter("ph", values.ph).label}</i></div></div><Link className="text-link" to="/soil">View soil analysis →</Link></Card>; }
function DashboardLive() { const { location, weather, loading, error } = useWeather(); return <><PageTitle eyebrow="Saturday, 12 September 2026" title="Good morning, Aarav"><Button to="/yield-prediction" icon="+">New prediction</Button></PageTitle><div className="metric-grid"><Metric label="Predicted yield" value="4.27 t/ha" detail="↑ 8.4% from last season" /><Metric label="Current crop" value="Rice" detail={`${location.state} · Kharif`} accent="soil" /><Metric label="Season progress" value="68%" detail="Harvest expected in 42 days" accent="blue" /><Metric label="Risk level" value="Moderate" detail="Monitor rainfall this week" accent="earth" /></div><div className="dashboard-grid"><Card className="weather-card"><div className="card-heading"><div><p className="eyebrow">{location.district}, {location.state}</p><h2>Weather overview</h2></div><span className="weather-symbol">☼</span></div><WeatherState weather={weather} loading={loading} error={error} />{weather && !error && <><div className="weather-main"><strong>{weatherText(weather.temperature, "°C")}</strong><span>{weather.condition}<br /><small>Feels like {weatherText(weather.apparentTemperature, "°C")}</small></span></div><div className="stat-row"><div><small>Rainfall</small><b>{weatherText(weather.precipitation, " mm")}</b></div><div><small>Humidity</small><b>{weatherText(weather.humidity, "%")}</b></div><div><small>Wind</small><b>{weatherText(weather.windSpeed, " km/h")}</b></div></div></>}</Card><SoilDashboardSummary /><Card className="recent-card"><div className="card-heading"><div><p className="eyebrow">Your latest activity</p><h2>Recent prediction</h2></div><Link className="text-link" to="/analytics">View history</Link></div><div className="recent-item"><span className="crop-avatar">R</span><div><b>Rice · {location.district}, {location.state}</b><small>Kharif 2026 · Just now</small></div><strong>4.27 <small>t/ha</small></strong></div></Card><Card className="recommend-card"><div className="recommend-mark">✦</div><div><p className="eyebrow">AI recommendation</p><h2>Your crop conditions are favorable.</h2><p>Consider improving soil potassium levels before the next growth stage to support stronger grain development.</p><Link className="text-link" to="/recommendations">View recommendations →</Link></div></Card></div><div className="quick-actions"><span>Quick actions</span><Button to="/yield-prediction" variant="outline" icon="↗">Predict yield</Button><Button to="/recommendations" variant="outline" icon="✦">Get recommendations</Button><Button to="/weather" variant="outline" icon="☁">Weather analysis</Button><Button to="/soil" variant="outline" icon="♧">Soil analysis</Button></div></>; }
function WeatherRuleAnalysis({ weather, crop }) { const analysis = analyzeWeather(weather, crop); const labels = { temperature: "Temperature", rainfall: "Rainfall", humidity: "Humidity", windSpeed: "Wind speed", precipitationProbability: "Precipitation probability" }; return <Card><div className="card-heading"><div><p className="eyebrow">Numeric crop rules</p><h2>{crop} weather analysis</h2></div><Badge tone={analysis.risks.some((risk) => risk.includes("critical")) ? "amber" : "green"}>{analysis.availableCount} values analyzed</Badge></div><div className="risk-list">{Object.entries(analysis.parameters).map(([name, result]) => <div key={name}><Badge tone={result.tone}>{result.label}</Badge><span>{labels[name]}</span><small>{result.value === null ? "Data unavailable" : `${result.value} ${result.unit}`}</small></div>)}</div></Card>; }
function WeatherLive() { const { location, weather, loading, error, refreshWeather } = useWeather(); const crop = localStorage.getItem("yieldsense-crop") || "Rice"; return <><PageTitle eyebrow="Field conditions" title="Weather analysis"><Button variant="outline" icon="↻" onClick={() => refreshWeather()}>Refresh data</Button></PageTitle><Card className="location-card"><div><p className="eyebrow">Selected location</p><h2>{location.district}, {location.state}</h2><p>Last updated: {weatherTime(weather?.lastUpdated)}</p></div><Badge tone={error ? "amber" : "green"}>{error ? "Unavailable" : "Live data"}</Badge></Card><div className="weather-details"><Card className="current-weather"><p className="eyebrow">Current weather</p><WeatherState weather={weather} loading={loading} error={error} />{weather && !error && <><div className="big-weather"><span>☼</span><strong>{weatherText(weather.temperature, "°C")}</strong><div>{weather.condition}<br /><small>Feels like {weatherText(weather.apparentTemperature, "°C")}</small></div></div><div className="stat-row"><div><small>Rainfall</small><b>{weatherText(weather.precipitation, " mm")}</b></div><div><small>Humidity</small><b>{weatherText(weather.humidity, "%")}</b></div><div><small>Wind</small><b>{weatherText(weather.windSpeed, " km/h")}</b></div></div></>}</Card><WeatherRuleAnalysis weather={weather} crop={crop} /></div><Card><div className="card-heading"><div><p className="eyebrow">Seasonal outlook</p><h2>Plan around the growing calendar</h2></div></div><div className="season-grid">{[["Kharif", "Jun – Oct", "Warm, wet conditions", "Best suited"], ["Rabi", "Nov – Mar", "Cooler, drier conditions", "Upcoming"], ["Summer", "Apr – May", "Hot and dry conditions", "Plan carefully"]].map(([name, period, condition, state]) => <div className="season-item" key={name}><b>{name}</b><small>{period}</small><p>{condition}</p><Badge tone={state === "Best suited" ? "green" : "neutral"}>{state}</Badge></div>)}</div></Card><Card><div className="card-heading"><div><p className="eyebrow">Action plan</p><h2>Weather recommendations</h2></div></div><ul className="clean-list"><li>Check field moisture before the next irrigation cycle.</li><li>Keep drainage channels clear before the next rainfall event.</li><li>Schedule nutrient applications only during a stable weather window.</li></ul></Card></>; }
function YieldPredictionWithDistrict() { const { location, refreshWeather, weather, loading, error } = useWeather(); const states = INDIA_STATES; const crops = ["Rice", "Wheat", "Corn", "Barley", "Soybean"]; const seasons = ["Kharif (June – October)", "Rabi (October – April)", "Summer (March – June)", "Autumn (August – December)", "Winter (November – March)", "Whole Year (January – December)"]; const initialState = location.state in INDIA_LOCATIONS ? location.state : states[0]; const [form, setForm] = useState({ year: "2026", state: initialState, district: INDIA_LOCATIONS[initialState][0], crop: "Rice", season: "Kharif (June – October)", area: "2.5", annualRainfall: "", fertilizer: "", pesticide: "" }); const [result, setResult] = useState(null); const [processing, setProcessing] = useState(false); const [formError, setFormError] = useState(""); const districts = INDIA_LOCATIONS[form.state] || []; const change = (event) => { const name = event.target.name; const value = event.target.value; if (name === "state") { const district = INDIA_LOCATIONS[value][0]; const next = { ...form, state: value, district }; setForm(next); localStorage.setItem("yieldsense-location", JSON.stringify({ state: value, district })); refreshWeather({ state: value, district }); return; } const next = { ...form, [name]: value }; setForm(next); if (name === "district") { localStorage.setItem("yieldsense-location", JSON.stringify({ state: form.state, district: value })); refreshWeather({ state: form.state, district: value }); } if (name === "crop") localStorage.setItem("yieldsense-crop", value); if (name === "season") localStorage.setItem("yieldsense-season", value); }; useEffect(() => { if (weather) setForm((current) => ({ ...current, annualRainfall: current.annualRainfall || String(weather.precipitation ?? "") })); }, [weather]); const submit = async (event) => { event.preventDefault(); setProcessing(true); setFormError(""); try { const response = await predictYield({ Year: Number(form.year), State: form.state, Crop: form.crop, Season: form.season.split(" (")[0], Area: Number(form.area), Annual_Rainfall: Number(form.annualRainfall), Fertilizer: Number(form.fertilizer), Pesticide: Number(form.pesticide) }); const predictedYield = Number(response.predicted_yield ?? response.prediction ?? response.yield); if (!Number.isFinite(predictedYield)) throw new Error("Prediction service returned no yield value."); setResult(Math.max(0, predictedYield)); localStorage.setItem("yieldsense-predicted-yield", String(Math.max(0, predictedYield))); localStorage.setItem("yieldsense-crop", form.crop); localStorage.setItem("yieldsense-season", form.season.split(" (")[0]); } catch (requestError) { setFormError(requestError.message || "Unable to generate a yield prediction."); } finally { setProcessing(false); } }; return <><PageTitle eyebrow="Model workspace" title="Predict crop yield"><p className="title-note">Enter the eight inputs used by the saved CatBoost Model 2.</p></PageTitle><form onSubmit={submit} className="prediction-layout"><div><Card><FormSection number="01" title="Model inputs" description="District selects the live weather location and is not sent to CatBoost."><div className="form-grid"><Field label="Year" name="year" value={form.year} onChange={change} type="number" /><Field label="State" name="state" value={form.state} onChange={change} options={states} /><Field label="District" name="district" value={form.district} onChange={change} options={districts} /><Field label="Crop" name="crop" value={form.crop} onChange={change} options={crops} /><Field label="Season" name="season" value={form.season} onChange={change} options={seasons} /><Field label="Area (hectares)" name="area" value={form.area} onChange={change} type="number" step="0.01" /><Field label="Annual Rainfall (mm)" name="annualRainfall" value={form.annualRainfall} onChange={change} type="number" step="0.01" /><Field label="Fertilizer (kg/ha)" name="fertilizer" value={form.fertilizer} onChange={change} type="number" step="0.01" /><Field label="Pesticide (kg/ha)" name="pesticide" value={form.pesticide} onChange={change} type="number" step="0.01" /></div></FormSection></Card>{formError && <Card className="form-error">{formError}</Card>}<Button type="submit" icon="↗">{processing ? "Processing forecast..." : "Predict yield"}</Button></div><div className="sticky-result"><Card className={result !== null ? "result-card ready" : "result-card"}><p className="eyebrow">Forecast result</p>{result !== null ? <><div className="result-number">{result.toFixed(2)} <span>t/ha</span></div><p>Expected productivity for {form.crop} in {form.district}, {form.state}.</p><Badge>Forecast ready</Badge><Button to="/recommendations" variant="soft" icon="✦">Get AI recommendations</Button></> : <div className="empty-result"><span>↗</span><h3>Your forecast will appear here</h3><p>Complete the model inputs and run a prediction to see the result.</p></div>}</Card><p className="privacy-note">Weather context remains live for the selected State and District; it is not added to Model 2.</p></div></form></>; }
function FormSection({ number, title, description, children }) { return <div className="form-section"><div className="section-number">{number}</div><div className="section-content"><h2>{title}</h2><p>{description}</p>{children}</div></div>; }
function DashboardMilestone3() { const { location, weather, loading, error } = useWeather(); const [latest, setLatest] = useState(null); const [status, setStatus] = useState("Loading dashboard data..."); useEffect(() => { getAnalyticsHistory({}).then((data) => { setLatest(data.items?.[0] || null); setStatus(data.items?.length ? "" : "No predictions recorded yet."); }).catch(() => setStatus("Analytics data unavailable.")); }, []); const crop = latest?.crop || "Unavailable"; const season = latest?.season || "Unavailable"; const yieldValue = latest ? `${Number(latest.predicted_yield).toFixed(2)} t/ha` : "Unavailable"; const risk = latest ? (Number(latest.predicted_yield) < 2 ? "High" : Number(latest.predicted_yield) < 4 ? "Moderate" : "Low") : "Unavailable"; return <><PageTitle eyebrow="Agricultural overview" title="Good morning, Aarav"><Button to="/yield-prediction" icon="+">New prediction</Button></PageTitle>{status && <p className="weather-message">{status}</p>}<div className="metric-grid"><Metric label="Predicted yield" value={yieldValue} detail={latest ? `Prediction ${String(latest.prediction_id).slice(0, 8)}` : "No prediction available"} /><Metric label="Current crop" value={crop} detail={latest ? `${latest.state} · ${season}` : "Select a crop and predict"} accent="soil" /><Metric label="Season progress" value="Unavailable" detail="No harvest calendar is connected" accent="blue" /><Metric label="Risk level" value={risk} detail="Calculated from available yield data" accent="earth" /></div><div className="dashboard-grid"><Card className="weather-card"><div className="card-heading"><div><p className="eyebrow">{location.district}, {location.state}</p><h2>Weather overview</h2></div><span className="weather-symbol">☼</span></div><WeatherState weather={weather} loading={loading} error={error} />{weather && !error && <><div className="weather-main"><strong>{weatherText(weather.temperature, "°C")}</strong><span>{weather.condition}<br /><small>Feels like {weatherText(weather.apparentTemperature, "°C")}</small></span></div><div className="stat-row"><div><small>Rainfall</small><b>{weatherText(weather.precipitation, " mm")}</b></div><div><small>Humidity</small><b>{weatherText(weather.humidity, "%")}</b></div><div><small>Wind</small><b>{weatherText(weather.windSpeed, " km/h")}</b></div></div></>}</Card><SoilDashboardSummary /><Card className="recent-card"><div className="card-heading"><div><p className="eyebrow">Latest persisted record</p><h2>Recent prediction</h2></div><Link className="text-link" to="/analytics">View history</Link></div>{latest ? <div className="recent-item"><span className="crop-avatar">{latest.crop.slice(0, 1)}</span><div><b>{latest.crop} · {latest.district || latest.state}</b><small>{latest.season} {latest.year} · {new Date(latest.created_at).toLocaleDateString()}</small></div><strong>{Number(latest.predicted_yield).toFixed(2)} <small>t/ha</small></strong></div> : <p className="soil-assessment-note">No prediction history yet.</p>}</Card><Card className="recommend-card"><div className="recommend-mark">✦</div><div><p className="eyebrow">AI recommendation</p><h2>{localStorage.getItem("yieldsense-ai-summary") || "Generate insights from your latest prediction."}</h2><Link className="text-link" to="/recommendations">Open AI insights →</Link></div></Card></div><div className="quick-actions"><span>Quick actions</span><Button to="/yield-prediction" variant="outline" icon="↗">Predict yield</Button><Button to="/recommendations" variant="outline" icon="✦">Get recommendations</Button><Button to="/weather" variant="outline" icon="☁">Weather analysis</Button><Button to="/soil" variant="outline" icon="♧">Soil analysis</Button></div></>; }
function AnalyticsMilestone3() {
  const stateOptions = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Dadra and Nagar Haveli and Daman and Diu"
];
  const [filters, setFilters] = useState({
    crop: "",
    state: "",
    season: "",
    year: "",
  });

  const [data, setData] = useState({
    summary: {},
    history: [],
    crops: [],
    seasons: [],
  });

  const [error, setError] = useState("");

  const change = (event) =>
    setFilters({
      ...filters,
      [event.target.name]: event.target.value,
    });

  useEffect(() => {
    Promise.all([
      getAnalyticsSummary(filters),
      getAnalyticsHistory(filters),
      getCropAnalytics(filters),
      getSeasonAnalytics(filters),
    ])
      .then(([summary, history, crops, seasons]) =>
        setData({
          summary,
          history: history.items || [],
          crops: crops.items || [],
          seasons: seasons.items || [],
        })
      )
      .catch(() =>
        setError(
          "Analytics data is unavailable. Create a prediction and ensure the backend database is connected."
        )
      );
  }, [filters]);

  const max = Math.max(
    ...data.crops.map((item) => item.average_yield),
    ...data.seasons.map((item) => item.average_yield),
    1
  );

  // Download PDF report
  const download = async () => {
    try {
      const query = new URLSearchParams(
        Object.entries(filters).filter(([, value]) => value)
      ).toString();

      const response = await fetch(
        `http://127.0.0.1:8000/api/reports/pdf?${query}`
      );

      if (!response.ok) {
        throw new Error("Failed to generate PDF report");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "yieldsense-report.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      setError("Unable to generate PDF report.");
    }
  };

  return (
    <>
      <PageTitle
        eyebrow="Performance history"
        title="Analytics & reports"
      >
        <div className="button-group">
          <Button variant="outline" icon="＋" onClick={download}>
            Generate report
          </Button>

          <Button icon="↓" onClick={download}>
            Download report
          </Button>
        </div>
      </PageTitle>

      {error && <Card className="form-error">{error}</Card>}

      <Card className="filters">
        <Field
          label="Crop"
          name="crop"
          value={filters.crop}
          onChange={change}
          options={["Rice", "Wheat", "Corn", "Barley", "Soybean"]}
        />

        <Field
  label="State"
  name="state"
  value={filters.state}
  onChange={change}
  options={stateOptions}
/>

        <Field
  label="Season"
  name="season"
  value={filters.season}
  onChange={change}
  options={[
    "Kharif",
    "Rabi",
    "Summer",
    "Autumn",
    "Winter",
    "Whole Year"
  ]}
/>

        <Field
          label="Year"
          name="year"
          value={filters.year}
          onChange={change}
          options={["2026", "2025", "2024", "2023", "2022", "2021", "2020"]}
        />
      </Card>

      <div className="metric-grid analytics-metrics">
        <Metric
          label="Average yield"
          value={
            data.summary.average_yield == null
              ? "Unavailable"
              : `${Number(data.summary.average_yield).toFixed(2)} t/ha`
          }
          detail={`${data.summary.count || 0} persisted predictions`}
        />

        <Metric
          label="Highest yield"
          value={
            data.summary.highest_yield == null
              ? "Unavailable"
              : `${Number(data.summary.highest_yield).toFixed(2)} t/ha`
          }
          detail="From selected records"
          accent="blue"
        />

        <Metric
          label="Lowest yield"
          value={
            data.summary.lowest_yield == null
              ? "Unavailable"
              : `${Number(data.summary.lowest_yield).toFixed(2)} t/ha`
          }
          detail="From selected records"
          accent="earth"
        />

        <Metric
          label="Best season"
          value={
            data.seasons.length
              ? data.seasons.reduce((best, item) =>
                  item.average_yield > best.average_yield ? item : best
                ).name
              : "Unavailable"
          }
          detail="Calculated from persisted records"
          accent="soil"
        />
      </div>

      <Card className="table-card">
        <div className="card-heading">
          <div>
            <p className="eyebrow">{data.history.length} records</p>
            <h2>Prediction history</h2>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Crop</th>
                <th>Location</th>
                <th>Season</th>
                <th>Year</th>
                <th>Predicted yield</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {data.history.map((row) => (
                <tr key={row.prediction_id}>
                  <td>{row.crop}</td>

                  <td>{row.district || row.state}</td>

                  <td>{row.season}</td>

                  <td>{row.year}</td>

                  <td>
                    <b className="green-text">
                      {Number(row.predicted_yield).toFixed(2)} t/ha
                    </b>
                  </td>

                  <td>
                    {row.created_at
                      ? new Date(row.created_at).toLocaleDateString()
                      : "Unavailable"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="two-column">
        <Card>
          <p className="eyebrow">Crop comparison</p>
          <h2>Performance by crop</h2>

          <div className="comparison-list">
            {data.crops.map((item) => (
              <div key={item.name}>
                <span>{item.name}</span>

                <b>
                  {Number(item.average_yield).toFixed(2)} t/ha
                </b>

                <i
                  style={{
                    width: `${(item.average_yield / max) * 100}%`,
                  }}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="eyebrow">Seasonal comparison</p>
          <h2>Average by season</h2>

          <div className="comparison-list">
            {data.seasons.map((item) => (
              <div key={item.name}>
                <span>{item.name}</span>

                <b>
                  {Number(item.average_yield).toFixed(2)} t/ha
                </b>

                <i
                  style={{
                    width: `${(item.average_yield / max) * 100}%`,
                  }}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}function RecommendationsMilestone3() { const [ready, setReady] = useState(false); useEffect(() => { getAnalyticsHistory({}).then((data) => { const latest = data.items?.[0]; if (latest) { localStorage.setItem("yieldsense-predicted-yield", String(latest.predicted_yield)); localStorage.setItem("yieldsense-prediction-id", latest.prediction_id); localStorage.setItem("yieldsense-crop", latest.crop); localStorage.setItem("yieldsense-season", latest.season); } setReady(true); }).catch(() => setReady(true)); }, []); return ready ? <RecommendationsLiveWithSoil /> : <Card><p className="weather-message">Loading persisted prediction context...</p></Card>; }
function ContextStrip({ context }) { return <div className="context-strip"><div><span>Crop</span><b>{context.crop}</b></div><div><span>Location</span><b>{context.state}, {context.district}</b></div><div><span>Season</span><b>{context.season}</b></div><div><span>Predicted yield</span><b className={context.predictedYield === "Unavailable" ? "" : "green-text"}>{context.predictedYield}</b></div></div>; }
function RecommendationsLive() { const { location, weather, loading: weatherLoading, error: weatherError } = useWeather(); const { sourceData: fetchedSoil, loading: soilLoading, error: soilError } = useSoilData(location); const [insights, setInsights] = useState(null); const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const crop = localStorage.getItem("yieldsense-crop") || "Rice"; const soil = loadSoilTest(location) || fetchedSoil?.parameters || {}; const soilAnalysis = analyzeSoil(soil, crop); const weatherAnalysis = analyzeWeather(weather, crop); const context = { crop, state: location.state, district: location.district, season: localStorage.getItem("yieldsense-season") || "Kharif", predictedYield: localStorage.getItem("yieldsense-predicted-yield") || "Unavailable", weather: weather ? { temperature: weather.temperature, apparentTemperature: weather.apparentTemperature, precipitation: weather.precipitation, humidity: weather.humidity, windSpeed: weather.windSpeed, precipitationProbability: weather.precipitationProbability, condition: weather.condition, weatherCode: weather.weatherCode } : "Unavailable", weatherAnalysis, soil: { parameters: Object.fromEntries(["ph", "moisture", "nitrogen", "phosphorus", "potassium"].map((name) => [name, soil[name] ?? null])), health: soilAnalysis.health, suitability: soilAnalysis.suitability, statuses: soilAnalysis.statuses, warnings: soilAnalysis.warnings }, soilAnalysis, detectedRisks: [...weatherAnalysis.risks, ...soilAnalysis.warnings] }; const generate = async () => { setLoading(true); setError(""); setInsights(null); try { setInsights(await generateAIInsights(context)); } catch (requestError) { setError(requestError.message || "Unable to generate AI insights."); } finally { setLoading(false); } }; return <><PageTitle eyebrow="Decision support" title="AI-powered agricultural insights"><Button onClick={generate} icon="✦">{loading ? "Generating insights..." : "Generate AI insights"}</Button></PageTitle><ContextStrip context={context} />{weatherLoading && <Card><p className="weather-message">Loading weather context...</p></Card>}{weatherError && <Card className="form-error">Weather context unavailable: {weatherError}</Card>}{soilLoading && <Card><p className="weather-message">Loading soil data...</p></Card>}{soilError && <Card className="form-error">{soilError}</Card>}<Card className="ai-disclosure"><span>◎</span><p><b>Groq decision support</b> The model analyzes the supplied CatBoost result, live weather, and soil information. It does not calculate yield. Missing values are passed as unavailable.</p></Card>{loading && <Card className="ai-loading"><span className="ai-pulse">✦</span><h2>Generating AI recommendations...</h2><p>Reviewing the available field context.</p></Card>}{error && <Card className="form-error ai-error"><b>AI insights unavailable</b><p>{error}</p><small>Check VITE_GROQ_API_KEY and the Groq model configuration, then try again.</small></Card>}{!loading && !error && !insights && <Card className="ai-empty"><span>✦</span><h2>Generate insights from your field context</h2><p>No recommendations are shown until Groq returns a successful structured response.</p></Card>}{insights && <div className="ai-insights"><Card className="assessment"><div className="recommendation-title"><span>01</span><h2>Overall assessment</h2><Badge>Generated by Groq</Badge></div><p>{insights.summary}</p></Card><div className="ai-status-grid"><Card><p className="eyebrow">Yield outlook</p><h2>{insights.yield_outlook}</h2><small>Based on the supplied prediction; not recalculated by AI.</small></Card><Card><p className="eyebrow">Weather risk</p><h2>{insights.weather_risk}</h2><small>Based on available Open-Meteo conditions.</small></Card><Card><p className="eyebrow">Soil status</p><h2>{insights.soil_status}</h2><small>{soilAnalysis.availableCount ? "Based on available soil values." : "Insufficient Data supplied."}</small></Card></div><div className="two-column"><Card><p className="eyebrow">Key risks</p><h2>Watch these factors</h2>{insights.key_risks.length ? <ul className="clean-list">{insights.key_risks.map((risk) => <li key={risk}>{risk}</li>)}</ul> : <p className="soil-assessment-note">No risks returned.</p>}</Card><Card><p className="eyebrow">Recommendations</p><h2>Practical next steps</h2>{insights.recommendations.length ? <ul className="clean-list">{insights.recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}</ul> : <p className="soil-assessment-note">No recommendations returned.</p>}</Card></div></div>}<p className="service-note">Demo architecture: the VITE_GROQ_API_KEY is exposed in the browser. Move this call behind the backend before production.</p></>; }
function RecommendationsStatic() { const sections = [["Overall assessment", "Your rice crop is progressing well under favorable growing conditions. Current soil and weather readings support healthy development, with potassium balance and rainfall consistency worth monitoring through the next growth stage."], ["Crop management", "Maintain regular field scouting during grain formation. Keep the field free of competing weeds and plan harvest timing around a dry weather window to protect grain quality."], ["Irrigation", "Recent rainfall has reduced immediate irrigation demand. Check field moisture at root depth before the next irrigation cycle and avoid standing water where drainage is limited."], ["Soil & fertilizer", "Potassium is the clearest opportunity in the current soil profile. Use a soil-test-led application plan and avoid applying nutrients immediately before heavy rainfall."], ["Risk factors", "The main near-term risk is rainfall variability during grain development. Watch for waterlogging after intense rainfall and signs of nutrient stress in lower leaves."], ["Resource optimization", "Prioritize water checks in low-lying plots and record each fertilizer application. A simple field log will make the next forecast more reliable."], ["General precautions", "Follow local agronomist guidance for product choice and application rates. Wear protective equipment when handling inputs and keep an updated soil test on file."]]; return <><PageTitle eyebrow="Decision support" title="AI-powered recommendations"><p className="title-note">Personalized guidance based on your crop, soil, weather and yield context.</p></PageTitle><ContextStrip /><div className="recommendations-grid">{sections.map(([title, text], index) => <Card key={title} className={index === 0 ? "assessment" : "recommendation-section"}><div className="recommendation-title"><span>{String(index + 1).padStart(2, "0")}</span><h2>{title}</h2></div><p>{text}</p>{index === 0 && <Badge>Analysis complete</Badge>}</Card>)}</div><p className="service-note">Recommendations are ready for the backend LLM service. The current content is a clearly marked UI preview.</p></>; }
function WeatherStatic() { return <><PageTitle eyebrow="Field conditions" title="Weather analysis"><Button variant="outline" icon="↻">Refresh data</Button></PageTitle><Card className="location-card"><div><p className="eyebrow">Selected location</p><h2>Nadia, West Bengal</h2><p>Last updated today at 08:45</p></div><Badge>Live preview</Badge></Card><div className="weather-details"><Card className="current-weather"><p className="eyebrow">Current weather</p><div className="big-weather"><span>☼</span><strong>28°</strong><div>Partly cloudy<br /><small>Feels like 31°C</small></div></div><div className="stat-row"><div><small>Rainfall</small><b>12 mm</b></div><div><small>Humidity</small><b>74%</b></div><div><small>Wind</small><b>8 km/h</b></div></div></Card><Card><p className="eyebrow">Weather risks</p><div className="risk-list"><div><Badge tone="amber">Watch</Badge><span>Rainfall variability</span><small>Moderate</small></div><div><Badge tone="green">Low</Badge><span>Temperature fluctuation</span><small>Low</small></div><div><Badge tone="amber">Watch</Badge><span>Excess rainfall</span><small>Moderate</small></div><div><Badge tone="green">Low</Badge><span>Low rainfall</span><small>Low</small></div></div></Card></div><Card><div className="card-heading"><div><p className="eyebrow">Seasonal outlook</p><h2>Plan around the growing calendar</h2></div></div><div className="season-grid">{[["Kharif", "Jun – Oct", "Warm, wet conditions", "Best suited"], ["Rabi", "Nov – Mar", "Cooler, drier conditions", "Upcoming"], ["Summer", "Apr – May", "Hot and dry conditions", "Plan carefully"]].map(([name, period, condition, state]) => <div className="season-item" key={name}><b>{name}</b><small>{period}</small><p>{condition}</p><Badge tone={state === "Best suited" ? "green" : "neutral"}>{state}</Badge></div>)}</div></Card><Card><div className="card-heading"><div><p className="eyebrow">Action plan</p><h2>Weather recommendations</h2></div></div><ul className="clean-list"><li>Check field moisture before the next irrigation cycle.</li><li>Keep drainage channels clear before the next rainfall event.</li><li>Schedule nutrient applications only during a stable weather window.</li></ul></Card></>; }
function SoilLive() { const { location, weather } = useWeather(); const [sourceData, setSourceData] = useState(null); const [parameters, setParameters] = useState({}); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [crop, setCrop] = useState(() => localStorage.getItem("yieldsense-crop") || "Rice"); useEffect(() => { let active = true; setLoading(true); setError(""); getSoilData(location).then((data) => { if (!active) return; setSourceData(data); setParameters(loadSoilTest(location) || data.parameters); }).catch(() => { if (active) setError("Unable to load soil data for this location."); }).finally(() => active && setLoading(false)); return () => { active = false; }; }, [location]); const analysis = analyzeSoil(parameters, crop); const change = (event) => setParameters({ ...parameters, [event.target.name]: event.target.value === "" ? null : event.target.value }); const save = (event) => { event.preventDefault(); saveSoilTest(location, parameters); setSourceData({ ...sourceData, dataType: "User-provided soil test", isReference: false }); }; const values = [["ph", "Soil pH", "pH"], ["moisture", "Soil moisture", "%"], ["nitrogen", "Nitrogen (N)", "mg/kg"], ["phosphorus", "Phosphorus (P)", "mg/kg"], ["potassium", "Potassium (K)", "mg/kg"]]; if (loading) return <><PageTitle eyebrow="Field conditions" title="Soil analysis" /><Card><p className="weather-message">Loading soil data...</p></Card></>; return <><PageTitle eyebrow="Field conditions" title="Soil analysis"><Button variant="outline" icon="↻" onClick={() => setParameters(loadSoilTest(location) || sourceData.parameters)}>Refresh data</Button></PageTitle>{error && <Card className="form-error">{error}</Card>}<Card className="soil-source-card"><div><p className="eyebrow">Selected location</p><h2>{location.district}, {location.state}</h2><p>{weather ? `Coordinates: ${weather.latitude.toFixed(4)}, ${weather.longitude.toFixed(4)}` : "Coordinates unavailable"}</p></div><div><Badge tone={parameters && analysis.availableCount ? "green" : "neutral"}>{sourceData?.dataType || "No soil data available for this location."}</Badge><a className="text-link" href={sourceData?.sourceUrl} target="_blank" rel="noreferrer">Open official Soil Health Card →</a></div></Card><div className="soil-analysis-grid"><Card><div className="card-heading"><div><p className="eyebrow">Soil health</p><h2>{analysis.health}</h2></div><Badge tone={analysis.health === "Good" ? "green" : "amber"}>{analysis.availableCount} parameters available</Badge></div><p className="soil-assessment-note">{analysis.availableCount < 5 ? "Soil assessment limited by available data." : "Screening assessment based on crop-specific threshold rules."}</p><p className="eyebrow soil-subhead">Crop suitability</p><h2>{crop}: {analysis.suitability}</h2><p className="soil-assessment-note">{analysis.cropNote}</p></Card><Card><p className="eyebrow">Data source</p><h2>Soil Health Card / Reference Dataset</h2><p className="soil-assessment-note">Only verified values from the soil integration or a saved soil test are analyzed. Missing values remain unavailable.</p><div className="soil-meta"><span>Data type</span><b>{sourceData?.dataType}</b></div><div className="soil-meta"><span>Location</span><b>{location.state} · {location.district}</b></div></Card></div><Card><div className="card-heading"><div><p className="eyebrow">Soil parameters</p><h2>Crop-specific numeric analysis</h2></div><Badge tone="neutral">Missing values stay unavailable</Badge></div><div className="soil-parameter-grid">{values.map(([name, label, unit]) => <div className="soil-parameter" key={name}><span>{label}</span><strong>{parameters[name] === null || parameters[name] === undefined ? "Data unavailable" : `${parameters[name]} ${unit}`}</strong><Badge tone={classifyParameter(name, parameters[name], crop).tone}>{classifyParameter(name, parameters[name], crop).label}</Badge></div>)}</div></Card><Card><div className="card-heading"><div><p className="eyebrow">Optional soil test</p><h2>Enter a verified field report</h2></div><select className="crop-select" value={crop} onChange={(event) => { setCrop(event.target.value); localStorage.setItem("yieldsense-crop", event.target.value); }}><option>Rice</option><option>Wheat</option><option>Corn</option><option>Barley</option><option>Soybean</option></select></div><p className="soil-assessment-note">Use values from a Soil Health Card or laboratory report. These values are analyzed separately from the locked CatBoost model.</p><form onSubmit={save} className="soil-test-form">{values.map(([name, label, unit]) => <Field key={name} label={`${label} (${unit})`} name={name} value={parameters[name] ?? ""} onChange={change} type="number" step={name === "ph" ? "0.1" : "0.01"} />)}<Button type="submit" icon="✓">Save soil test</Button></form></Card><div className="two-column"><Card><p className="eyebrow">Warnings</p><h2>What needs attention</h2>{analysis.warnings.length ? <ul className="clean-list">{analysis.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : <p className="soil-assessment-note">No warnings can be generated without verified measurements.</p>}</Card><Card><p className="eyebrow">Structured recommendations</p><h2>Next steps</h2>{analysis.recommendations.length ? <ul className="clean-list">{analysis.recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}</ul> : <p className="soil-assessment-note">Enter a verified soil test to generate soil observations for Agricultural Recommendations.</p>}</Card></div></>; }
function Analytics() { return <><PageTitle eyebrow="Performance history" title="Analytics & reports"><div className="button-group"><Button variant="outline" icon="＋">Generate report</Button><Button icon="↓">Download PDF</Button></div></PageTitle><Card className="filters"><Field label="Crop" name="crop" value="Rice" onChange={() => {}} options={["Rice", "Wheat", "Maize"]} /><Field label="State" name="state" value="West Bengal" onChange={() => {}} options={["West Bengal", "Punjab", "Maharashtra"]} /><Field label="Season" name="season" value="All seasons" onChange={() => {}} options={["All seasons", "Kharif", "Rabi"]} /><Field label="Year" name="year" value="2026" onChange={() => {}} options={["2026", "2025", "2024"]} /></Card><div className="metric-grid analytics-metrics"><Metric label="Average yield" value="3.86 t/ha" detail="Across 12 predictions" /><Metric label="Highest yield" value="4.42 t/ha" detail="Kharif 2025" accent="blue" /><Metric label="Lowest yield" value="2.98 t/ha" detail="Rabi 2024" accent="earth" /><Metric label="Best season" value="Kharif" detail="18% above average" accent="soil" /></div><Card className="table-card"><div className="card-heading"><div><p className="eyebrow">12 records</p><h2>Prediction history</h2></div><Link className="text-link" to="/yield-prediction">New prediction →</Link></div><div className="table-wrap"><table><thead><tr><th>Crop</th><th>Location</th><th>Season</th><th>Year</th><th>Predicted yield</th><th>Date</th></tr></thead><tbody>{[["Rice", "Nadia, WB", "Kharif", "2026", "4.27 t/ha", "12 Sep 2026"], ["Rice", "Nadia, WB", "Kharif", "2025", "4.42 t/ha", "18 Sep 2025"], ["Wheat", "Ludhiana, PB", "Rabi", "2025", "3.61 t/ha", "24 Mar 2025"], ["Maize", "Pune, MH", "Summer", "2024", "2.98 t/ha", "08 May 2024"]].map((row) => <tr key={row.join()}>{row.map((cell, index) => <td key={cell}>{index === 4 ? <b className="green-text">{cell}</b> : cell}</td>)}</tr>)}</tbody></table></div></Card><div className="two-column"><Card><p className="eyebrow">Crop comparison</p><h2>Performance by crop</h2><div className="comparison-list"><div><span>Rice</span><b>4.12 t/ha</b><i style={{ width: "86%" }} /></div><div><span>Wheat</span><b>3.61 t/ha</b><i style={{ width: "69%" }} /></div><div><span>Maize</span><b>3.24 t/ha</b><i style={{ width: "61%" }} /></div></div></Card><Card><p className="eyebrow">Seasonal comparison</p><h2>Average by season</h2><div className="comparison-list"><div><span>Kharif</span><b>4.18 t/ha</b><i style={{ width: "88%" }} /></div><div><span>Rabi</span><b>3.61 t/ha</b><i style={{ width: "70%" }} /></div><div><span>Summer</span><b>3.24 t/ha</b><i style={{ width: "63%" }} /></div></div></Card></div></>; }
function Profile() { const [saved, setSaved] = useState(false); return <><PageTitle eyebrow="Account" title="Profile & settings"><Button onClick={() => setSaved(true)} icon="✓">{saved ? "Changes saved" : "Save changes"}</Button></PageTitle><div className="profile-layout"><div><Card><div className="profile-header"><div className="profile-avatar">AM</div><div><h2>Aarav Mehta</h2><p>Farmer · Member since 2024</p></div></div><div className="form-grid"><Field label="Full name" name="name" value="Aarav Mehta" onChange={() => {}} /><Field label="Email address" name="email" value="aarav.mehta@example.com" onChange={() => {}} type="email" /><Field label="Role" name="role" value="Farmer" onChange={() => {}} options={["Farmer", "Agricultural Analyst", "Admin"]} /></div></Card><Card><p className="eyebrow">Your defaults</p><h2>Preferences</h2><div className="form-grid"><Field label="Preferred crop" name="crop" value="Rice" onChange={() => {}} options={["Rice", "Wheat", "Maize", "Cotton"]} /><Field label="Preferred location" name="location" value="Nadia, West Bengal" onChange={() => {}} /><Field label="Preferred season" name="season" value="Kharif" onChange={() => {}} options={["Kharif", "Rabi", "Summer"]} /></div></Card></div><div><Card className="settings-card"><p className="eyebrow">Security</p><h2>Account settings</h2><button className="setting-row"><span><b>Change password</b><small>Update your account password</small></span><span>→</span></button><button className="setting-row danger" onClick={() => localStorage.removeItem("yieldsense-auth")}><span><b>Log out of YieldSense</b><small>End this session on this device</small></span><span>↪</span></button></Card><Card className="profile-note"><span>✦</span><b>Your data stays yours</b><p>Use this workspace to keep your field notes, forecasts and recommendations in one place.</p></Card></div></div></>; }

function Auth({ register = false }) { const navigate = useNavigate(); const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", role: "Farmer" }); const [error, setError] = useState(""); const [showPassword, setShowPassword] = useState(false); const change = (e) => setForm({ ...form, [e.target.name]: e.target.value }); const submit = (e) => { e.preventDefault(); if (!form.email || !form.password || (register && (!form.name || form.password !== form.confirm))) { setError(register && form.password !== form.confirm ? "Passwords do not match." : "Please complete the required fields."); return; } localStorage.setItem("yieldsense-auth", "true"); navigate("/dashboard"); }; return <div className="auth-page"><div className="auth-visual"><Logo /><div className="auth-quote"><span>“</span><h2>Better decisions<br />begin with better<br /><em>field intelligence.</em></h2><p>One calm workspace for every crop, condition and forecast.</p></div><div className="auth-footer">YieldSense AI · Agricultural intelligence for growing teams</div></div><div className="auth-form"><div className="auth-form-inner"><div className="mobile-auth-logo"><Logo /></div><p className="eyebrow">{register ? "Create your workspace" : "Welcome back"}</p><h1>{register ? "Start growing smarter." : "Good to see you again."}</h1><p className="auth-subtitle">{register ? "Set up your profile to begin making better field decisions." : "Sign in to your agricultural intelligence workspace."}</p>{error && <div className="form-error">{error}</div>}<form onSubmit={submit}>{register && <Field label="Full name" name="name" value={form.name} onChange={change} placeholder="Aarav Mehta" />}<Field label="Email address" name="email" value={form.email} onChange={change} type="email" placeholder="you@example.com" /><Field label="Password" name="password" value={form.password} onChange={change} type={showPassword ? "text" : "password"} placeholder="Enter your password" /><button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide password" : "Show password"}</button>{register && <><Field label="Confirm password" name="confirm" value={form.confirm} onChange={change} type={showPassword ? "text" : "password"} placeholder="Repeat your password" /><Field label="Role" name="role" value={form.role} onChange={change} options={["Farmer", "Agricultural Analyst", "Admin"]} /></>}{!register && <div className="form-options"><label><input type="checkbox" /> Remember me</label><a href="#forgot">Forgot password?</a></div>}<Button type="submit">{register ? "Create account" : "Sign in"} <span>→</span></Button></form><p className="auth-switch">{register ? "Already have an account?" : "New to YieldSense?"} <Link to={register ? "/login" : "/register"}>{register ? "Sign in" : "Create an account"}</Link></p></div></div></div>; }

function ProtectedRoute() { return localStorage.getItem("yieldsense-auth") ? <AppLayout /> : <Navigate to="/login" replace />; }
function App() { return <BrowserRouter><Routes><Route path="/login" element={<Auth />} /><Route path="/register" element={<Auth register />} /><Route path="/*" element={<ProtectedRoute />} /></Routes></BrowserRouter>; }

export default App;