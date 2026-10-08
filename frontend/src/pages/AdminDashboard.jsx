import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { downloadPdfReport } from "../services/analyticsService";
import { API_BASE_URL } from "../services/apiConfig";
import {
  AnalyticsBarChart,
  AnalyticsFilters,
  AnalyticsTrendChart,
} from "../components/AnalyticsCharts";
import ThemeToggle from "../components/ThemeToggle";

const pendingAdminGets = new Map();
const sections = [
  ["dashboard", "Overview"],
  ["users", "Users"],
  ["history", "User Prediction History"],
  ["predictions", "All Predictions"],
  ["analytics", "Analytics"],
  ["reports", "Reports"],
  ["risk", "Risk Assessment"],
];

async function adminRequest(path, options = {}) {
  const token = localStorage.getItem("yieldsense-auth-token");
  const method = (options.method || "GET").toUpperCase();
  const request = async () => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.detail || "Admin data is unavailable.");
    }
    return response.json();
  };

  if (method !== "GET") return request();
  const key = `${token || ""}:${path}`;
  const pending = pendingAdminGets.get(key);
  if (pending) return pending;

  const promise = request();
  pendingAdminGets.set(key, promise);
  try {
    return await promise;
  } finally {
    if (pendingAdminGets.get(key) === promise) pendingAdminGets.delete(key);
  }
}

function PageTitle({ eyebrow, title, children }) {
  return (
    <div className="page-title">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      {children}
    </div>
  );
}

function DataTable({ headers, children }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function queryString(filters) {
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value !== "" && value != null)
  );
  return query.toString();
}

function adminIdentity() {
  try {
    return JSON.parse(localStorage.getItem("yieldsense-user") || "null");
  } catch {
    return null;
  }
}

function userInitials(name) {
  return (name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [baseLoading, setBaseLoading] = useState(true);
  const [baseError, setBaseError] = useState("");
  const [selectedFarmerId, setSelectedFarmerId] = useState("");
  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [report, setReport] = useState(null);
  const [reportError, setReportError] = useState("");
  const [analyticsFilters, setAnalyticsFilters] = useState({
    crop: "",
    state: "",
    season: "",
    year: "",
  });
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsOptions, setAnalyticsOptions] = useState({});
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [risk, setRisk] = useState(null);
  const [riskError, setRiskError] = useState("");

  const segment = location.pathname.replace(/^\/admin\/?/, "").split("/")[0] || "dashboard";
  const activeSection = segment === "overview" ? "dashboard" : segment;
  const selectedFarmer = users.find((user) => user.id === selectedFarmerId);
  const latestPrediction = predictions[0];
  const reportSummary = report?.summary || {};
  const reportCrops = report?.crops || [];
  const reportSeasons = report?.seasons || [];
  const reportStates = report?.states || [];
  const reportTrend = report?.trend || [];
  const reportYearly = report?.yearly || [];
  const reportHistory = report?.history || [];
  const reportLoading = activeSection === "reports" && !report && !reportError;
  const riskLoading = activeSection === "risk" && !risk && !riskError;
  const identity = adminIdentity();

  useEffect(() => {
    if (activeSection === "recommendations") {
      navigate("/admin/dashboard", { replace: true });
      return undefined;
    }
    if (location.pathname === "/admin" || location.pathname === "/admin/overview") {
      navigate("/admin/dashboard", { replace: true });
    }
    return undefined;
  }, [activeSection, location.pathname, navigate]);

  useEffect(() => {
    let active = true;
    async function loadDashboardData() {
      try {
        const [usersResponse, predictionsResponse, summaryResponse] = await Promise.all([
          adminRequest("/api/admin/users"),
          adminRequest("/api/admin/predictions"),
          adminRequest("/api/admin/analytics/summary"),
        ]);
        if (!active) return;
        setUsers(usersResponse.items || []);
        setPredictions(predictionsResponse.items || []);
        setHistoryRows(predictionsResponse.items || []);
        setSummary(summaryResponse);
      } catch (error) {
        if (active) setBaseError(error.message || "Unable to load admin dashboard.");
      } finally {
        if (active) setBaseLoading(false);
      }
    }
    loadDashboardData();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (activeSection !== "analytics") return undefined;
    let active = true;
    const query = queryString(analyticsFilters);
    const timer = window.setTimeout(() => {
      adminRequest(`/api/admin/analytics/dashboard${query ? `?${query}` : ""}`)
        .then((data) => {
          if (!active) return;
          setAnalyticsData(data);
          setAnalyticsOptions(data.options || {});
        })
        .catch((error) => {
          if (active) setAnalyticsError(error.message || "Unable to load analytics.");
        })
        .finally(() => {
          if (active) setAnalyticsLoading(false);
        });
    }, 150);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [activeSection, analyticsFilters]);

  useEffect(() => {
    if (activeSection !== "reports") return undefined;
    let active = true;
    const query = queryString(analyticsFilters);
    const timer = window.setTimeout(() => {
      adminRequest(`/api/admin/reports/summary${query ? `?${query}` : ""}`)
        .then((data) => {
          if (!active) return;
          setReport(data);
          setAnalyticsOptions(data.options || {});
        })
        .catch((error) => {
          if (active) setReportError(error.message || "Unable to load reports.");
        });
    }, 150);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [activeSection, analyticsFilters]);

  useEffect(() => {
    if (activeSection !== "risk") return undefined;
    let active = true;
    adminRequest("/api/risk", {
      method: "POST",
      body: JSON.stringify({
        weather_analysis: latestPrediction?.context?.weatherAnalysis || null,
        soil_analysis: latestPrediction?.context?.soilAnalysis || null,
        predicted_yield: latestPrediction?.predicted_yield ?? null,
      }),
    })
      .then((data) => { if (active) setRisk(data); })
      .catch((error) => { if (active) setRiskError(error.message || "Unable to load risk assessment."); });
    return () => { active = false; };
  }, [activeSection, latestPrediction]);

  const filterHistory = async (userId) => {
    setSelectedFarmerId(userId);
    setHistoryError("");
    if (!userId) {
      setHistoryRows(predictions);
      return;
    }
    setHistoryLoading(true);
    try {
      const response = await adminRequest(`/api/admin/users/${encodeURIComponent(userId)}/predictions`);
      setHistoryRows(response.items || []);
    } catch (error) {
      setHistoryError(error.message || "Unable to load the selected farmer's history.");
      setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const downloadReport = async () => {
    setPdfLoading(true);
    setReportError("");
    try {
      const blob = await downloadPdfReport(analyticsFilters);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "yieldsense-admin-report.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setReportError(error.message || "Unable to download the PDF report.");
    } finally {
      setPdfLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("yieldsense-auth");
    localStorage.removeItem("yieldsense-auth-token");
    localStorage.removeItem("yieldsense-user");
    navigate("/roles");
  };

  const clearHistoryFilter = () => {
    setSelectedFarmerId("");
    setHistoryRows(predictions);
    setHistoryError("");
  };

  const changeAnalyticsFilter = (event) => {
    setAnalyticsLoading(true);
    setAnalyticsData(null);
    setAnalyticsError("");
    setReport(null);
    setReportError("");
    setAnalyticsFilters((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  let content;
  if (activeSection === "dashboard") {
    content = (
      <>
        <PageTitle eyebrow="Operations" title="Admin overview" />
        {baseError && <div className="form-error" role="alert">{baseError}</div>}
        {baseLoading ? <p className="admin-status" role="status">Loading admin dashboard...</p> : (
          <>
            <div className="metric-grid analytics-metrics">
              <section className="card metric"><div><p>Users</p><strong>{users.length}</strong><small>Registered accounts</small></div></section>
              <section className="card metric"><div><p>Predictions</p><strong>{summary?.count ?? 0}</strong><small>Persisted records</small></div></section>
              <section className="card metric"><div><p>Average yield</p><strong>{summary?.average_yield == null ? "Unavailable" : `${Number(summary.average_yield).toFixed(2)} t/ha`}</strong></div></section>
              <section className="card metric"><div><p>Highest yield</p><strong>{summary?.highest_yield == null ? "Unavailable" : `${Number(summary.highest_yield).toFixed(2)} t/ha`}</strong></div></section>
            </div>
            <div className="two-column">
              <section className="card"><p className="eyebrow">Users</p><h2>Registered accounts</h2><div className="comparison-list">{users.slice(0, 5).map((user) => <div key={user.id}><span>{user.name}</span><b>{user.role}</b></div>)}</div></section>
              <section className="card"><p className="eyebrow">Recent predictions</p><h2>System activity</h2><div className="comparison-list">{predictions.slice(0, 5).map((row) => <div key={row.prediction_id}><span>{row.crop} · {row.state}</span><b>{Number(row.predicted_yield).toFixed(2)} t/ha</b></div>)}</div></section>
            </div>
          </>
        )}
      </>
    );
  } else if (activeSection === "users") {
    content = (
      <>
        <PageTitle eyebrow="Members" title="Users" />
        {baseError && <div className="form-error" role="alert">{baseError}</div>}
        {baseLoading ? <p className="admin-status" role="status">Loading users...</p> : (
          <section className="card table-card"><DataTable headers={["Name", "Email", "Role", "Status", "Created"]}>
            {users.map((user) => <tr key={user.id}><td>{user.name}</td><td>{user.email}</td><td>{user.role}</td><td>{user.is_active ? "Active" : "Inactive"}</td><td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : "Unavailable"}</td></tr>)}
          </DataTable></section>
        )}
      </>
    );
  } else if (activeSection === "history") {
    content = (
      <>
        <PageTitle eyebrow="Insights" title="User prediction history" />
        <section className="card admin-filter">
          <label className="field"><span>Filter by farmer</span><select value={selectedFarmerId} onChange={(event) => filterHistory(event.target.value)}>
            <option value="">All predictions</option>
            {users.filter((user) => user.role === "farmer").map((user) => <option value={user.id} key={user.id}>{user.name} · {user.email}</option>)}
          </select></label>
          <button className="button button-outline" type="button" onClick={clearHistoryFilter} disabled={!selectedFarmerId}>Clear filter</button>
        </section>
        {historyError && <div className="form-error" role="alert">{historyError}</div>}
        {baseError && <div className="form-error" role="alert">{baseError}</div>}
        {(baseLoading || historyLoading) ? <p className="admin-status" role="status">Loading prediction history...</p> : (
          <section className="card table-card"><p className="eyebrow">{selectedFarmer ? `History for ${selectedFarmer.name}` : "All farmers and legacy records"}</p>
            <DataTable headers={["Farmer", "Crop", "State", "District", "Season", "Year", "Yield", "Date"]}>
              {historyRows.map((row) => {
                const owner = users.find((user) => user.id === row.user_id);
                return <tr key={row.prediction_id}><td>{owner?.name || (row.user_id ? "Authenticated farmer" : "Unassigned")}</td><td>{row.crop}</td><td>{row.state}</td><td>{row.district || "—"}</td><td>{row.season}</td><td>{row.year}</td><td>{Number(row.predicted_yield).toFixed(2)} t/ha</td><td>{row.created_at ? new Date(row.created_at).toLocaleDateString() : "Unavailable"}</td></tr>;
              })}
            </DataTable>
            {!historyRows.length && <p className="admin-status">No predictions found for this selection.</p>}
          </section>
        )}
      </>
    );
  } else if (activeSection === "predictions") {
    content = (
      <>
        <PageTitle eyebrow="Records" title="All predictions" />
        {baseError && <div className="form-error" role="alert">{baseError}</div>}
        {baseLoading ? <p className="admin-status" role="status">Loading predictions...</p> : (
          <section className="card table-card"><DataTable headers={["Crop", "State", "District", "Season", "Year", "Yield", "Date"]}>
            {predictions.map((row) => <tr key={row.prediction_id}><td>{row.crop}</td><td>{row.state}</td><td>{row.district || "—"}</td><td>{row.season}</td><td>{row.year}</td><td>{Number(row.predicted_yield).toFixed(2)} t/ha</td><td>{row.created_at ? new Date(row.created_at).toLocaleDateString() : "Unavailable"}</td></tr>)}
          </DataTable></section>
        )}
      </>
    );
  } else if (activeSection === "analytics") {
    content = (
      <>
        <PageTitle eyebrow="System" title="Analytics" />
        <AnalyticsFilters filters={analyticsFilters} options={analyticsOptions} onChange={changeAnalyticsFilter} />
        {analyticsError && <div className="form-error" role="alert">{analyticsError}</div>}
        {analyticsLoading && <p className="admin-status" role="status">Loading filtered system analytics...</p>}
        {!analyticsLoading && analyticsData?.summary.count === 0 && <p className="admin-status">No data available for the selected filters.</p>}
        {!analyticsLoading && analyticsData?.summary.count > 0 && (
          <>
            <div className="metric-grid analytics-metrics">
              <section className="card metric"><div><p>Predictions</p><strong>{analyticsData.summary.count}</strong></div></section>
              <section className="card metric"><div><p>Average yield</p><strong>{Number(analyticsData.summary.average_yield).toFixed(2)} t/ha</strong></div></section>
              <section className="card metric"><div><p>Highest yield</p><strong>{Number(analyticsData.summary.highest_yield).toFixed(2)} t/ha</strong></div></section>
              <section className="card metric"><div><p>Lowest yield</p><strong>{Number(analyticsData.summary.lowest_yield).toFixed(2)} t/ha</strong></div></section>
            </div>
            <div className="analytics-chart-grid">
              <AnalyticsTrendChart title="Yield by prediction date" items={analyticsData.trend} />
              <AnalyticsTrendChart title="Yield by crop year" items={analyticsData.yearly} />
              <AnalyticsBarChart title="Yield by crop" items={analyticsData.crops} />
              <AnalyticsBarChart title="Yield by state" items={analyticsData.states} />
              <AnalyticsBarChart title="Yield by season" items={analyticsData.seasons} />
              <AnalyticsBarChart title="Prediction volume over time" items={analyticsData.trend} valueKey="count" />
            </div>
            <section className="card table-card">
              <p className="eyebrow">{analyticsData.history.length} matching records</p>
              <h2>Filtered prediction history</h2>
              <DataTable headers={["Crop", "State", "District", "Season", "Year", "Yield", "Date"]}>
                {analyticsData.history.map((row) => <tr key={row.prediction_id}><td>{row.crop}</td><td>{row.state}</td><td>{row.district || "—"}</td><td>{row.season}</td><td>{row.year}</td><td>{Number(row.predicted_yield).toFixed(2)} t/ha</td><td>{row.created_at ? new Date(row.created_at).toLocaleDateString() : "Unavailable"}</td></tr>)}
              </DataTable>
            </section>
          </>
        )}
      </>
    );
  } else if (activeSection === "reports") {
    content = (
      <>
        <PageTitle eyebrow="Reporting" title="Reports">
          <button className="button" type="button" onClick={downloadReport} disabled={pdfLoading}>{pdfLoading ? "Preparing PDF..." : "Download PDF report"}</button>
        </PageTitle>
        <AnalyticsFilters filters={analyticsFilters} options={analyticsOptions} onChange={changeAnalyticsFilter} />
        {reportError && <div className="form-error" role="alert">{reportError}</div>}
        {reportLoading ? <p className="admin-status" role="status">Loading report data...</p> : report ? (
          <>
            <p className="admin-status">Report filters are shared with Analytics. System user totals are unfiltered account counts.</p>
            {report.users && (
              <div className="metric-grid analytics-metrics">
                <section className="card metric"><div><p>Registered accounts</p><strong>{report.users.total_users}</strong></div></section>
                <section className="card metric"><div><p>Farmers</p><strong>{report.users.total_farmers}</strong></div></section>
                <section className="card metric"><div><p>Active farmers</p><strong>{report.users.active_farmers}</strong></div></section>
              </div>
            )}
            {reportSummary.count === 0 && <p className="admin-status">No data available for the selected filters.</p>}
            <div className="metric-grid analytics-metrics">
              <section className="card metric"><div><p>Predictions</p><strong>{reportSummary.count ?? 0}</strong></div></section>
              <section className="card metric"><div><p>Average yield</p><strong>{reportSummary.average_yield == null ? "Unavailable" : `${Number(reportSummary.average_yield).toFixed(2)} t/ha`}</strong></div></section>
              <section className="card metric"><div><p>Highest yield</p><strong>{reportSummary.highest_yield == null ? "Unavailable" : `${Number(reportSummary.highest_yield).toFixed(2)} t/ha`}</strong></div></section>
              <section className="card metric"><div><p>Lowest yield</p><strong>{reportSummary.lowest_yield == null ? "Unavailable" : `${Number(reportSummary.lowest_yield).toFixed(2)} t/ha`}</strong></div></section>
            </div>
            {reportSummary.count > 0 && (
              <>
                <div className="analytics-chart-grid">
                  <AnalyticsTrendChart title="Year-wise yield trend" items={reportYearly} />
                  <AnalyticsBarChart title="Prediction volume over time" items={reportTrend} valueKey="count" />
                  <AnalyticsBarChart title="Crop productivity" items={reportCrops} />
                  <AnalyticsBarChart title="State productivity" items={reportStates} />
                  <AnalyticsBarChart title="Seasonal productivity" items={reportSeasons} />
                </div>
                <section className="card table-card"><p className="eyebrow">Generated {report.generated_at || "date unavailable"}</p><h2>Recent prediction history</h2><DataTable headers={["Crop", "State", "District", "Season", "Year", "Yield", "Date"]}>
                  {reportHistory.slice(0, 25).map((row) => <tr key={row.prediction_id}><td>{row.crop}</td><td>{row.state}</td><td>{row.district || "—"}</td><td>{row.season}</td><td>{row.year}</td><td>{Number(row.predicted_yield).toFixed(2)} t/ha</td><td>{row.created_at ? new Date(row.created_at).toLocaleDateString() : "Unavailable"}</td></tr>)}
                </DataTable></section>
              </>
            )}
          </>
        ) : <p className="admin-status">No report data is available.</p>}
      </>
    );
  } else if (activeSection === "risk") {
    content = (
      <>
        <PageTitle eyebrow="Risk" title="Risk assessment" />
        {riskError && <div className="form-error" role="alert">{riskError}</div>}
        {riskLoading ? <p className="admin-status" role="status">Assessing available prediction context...</p> : risk ? (
          <>
            <p className="admin-status">Assessment uses the latest persisted yield and any weather or soil analysis stored with its context. Missing context is reported as unavailable.</p>
            <div className="metric-grid analytics-metrics">
              {[["Overall risk", risk.overall_risk], ["Weather risk", risk.weather_risk], ["Soil risk", risk.soil_risk], ["Yield risk", risk.yield_risk]].map(([label, value]) => <section className="card metric" key={label}><div><p>{label}</p><strong>{value || "Unavailable"}</strong></div></section>)}
            </div>
            <div className="two-column">
              <section className="card"><p className="eyebrow">Weather factors</p><h2>Detected risks</h2>{risk.weather_risks?.length ? <ul>{risk.weather_risks.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="admin-status">No weather analysis is stored with the latest prediction.</p>}</section>
              <section className="card"><p className="eyebrow">Soil factors</p><h2>Detected warnings</h2>{risk.soil_risks?.length ? <ul>{risk.soil_risks.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="admin-status">No soil analysis is stored with the latest prediction.</p>}</section>
            </div>
          </>
        ) : <p className="admin-status">No risk assessment data is available.</p>}
      </>
    );
  } else {
    content = (
      <section className="card">
        <p className="eyebrow">Admin workspace</p>
        <h2>Section unavailable</h2>
        <p className="admin-status">This Admin section does not exist.</p>
      </section>
    );
  }

  return (
    <div className="app-shell admin-shell">
      <div className={`mobile-overlay ${menuOpen ? "show" : ""}`} onClick={() => setMenuOpen(false)} />
      <div className={`sidebar-wrap admin-sidebar-wrap ${menuOpen ? "open" : ""}`}>
        <aside className="sidebar">
          <div className="sidebar-top">
            <NavLink className="brand" to="/admin/dashboard" onClick={() => setMenuOpen(false)}><span className="brand-mark">⌁</span><span><b>YieldSense</b> <em>Admin</em><small>Operations hub</small></span></NavLink>
            <button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close navigation">×</button>
          </div>
          <p className="nav-label">Admin</p>
          <nav>{sections.map(([path, label]) => <NavLink key={path} to={`/admin/${path}`} onClick={() => { setMenuOpen(false); setReportError(""); setRiskError(""); if (path === "analytics") { setAnalyticsLoading(true); setAnalyticsData(null); setAnalyticsError(""); } if (path === "reports") setReport(null); if (path === "risk") setRisk(null); }} className={({ isActive }) => isActive || (activeSection === "overview" && path === "dashboard") ? "active" : ""}>{label}</NavLink>)}</nav>
          <div className="sidebar-foot"><button className="logout" onClick={logout}>Log out</button></div>
        </aside>
      </div>
      <div className="main-area">
        <header className="header admin-header">
          <button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Open navigation">☰</button>
          <div><span className="crumb">Admin /</span> <b>{sections.find(([path]) => path === activeSection)?.[1] || "Overview"}</b></div>
          <div className="header-actions"><ThemeToggle /><div className="avatar">{userInitials(identity?.name)}</div><span className="user-name">{identity?.name || "Account"}</span></div>
        </header>
        <main className="content">{content}</main>
      </div>
    </div>
  );
}
