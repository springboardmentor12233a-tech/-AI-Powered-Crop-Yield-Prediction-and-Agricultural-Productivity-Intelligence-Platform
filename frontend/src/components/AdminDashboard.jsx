import { useState, useEffect, useCallback } from "react";
import { Users, Activity, Cpu, Shield, CheckCircle, RefreshCw, BarChart3, Sprout } from "lucide-react";
import { t } from "../utils/i18n";

export default function AdminDashboard({ adminUser, token, currentLang = "en" }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [audits, setAudits] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [datasetVersions, setDatasetVersions] = useState([]);
  const [userQuery, setUserQuery] = useState("");
  const [cropFilter, setCropFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [announcementAudience, setAnnouncementAudience] = useState("all");
  const [datasetName, setDatasetName] = useState("");
  const [datasetSource, setDatasetSource] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");

    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [resStats, resUsers, resPreds, resLogs, resNotifications, resAudits, resFeedback, resDatasets] = await Promise.all([
        fetch("/api/admin/stats", { headers }).then(r => r.json()),
        fetch("/api/admin/users", { headers }).then(r => r.json()),
        fetch("/api/admin/predictions", { headers }).then(r => r.json()),
        fetch("/api/admin/login-history", { headers }).then(r => r.json()),
        fetch("/api/admin/announcements", { headers }).then(r => r.json()),
        fetch("/api/admin/audit-log", { headers }).then(r => r.json()),
        fetch("/api/admin/feedback", { headers }).then(r => r.json()),
        fetch("/api/admin/dataset-versions", { headers }).then(r => r.json())
      ]);

      if (resStats.stats) setStats(resStats.stats);
      if (resUsers.users) setUsers(resUsers.users);
      if (resPreds.predictions) setPredictions(resPreds.predictions);
      if (resLogs.logs) setLoginLogs(resLogs.logs);
      if (resNotifications.notifications) setNotifications(resNotifications.notifications);
      if (resAudits.events) setAudits(resAudits.events);
      if (resFeedback.feedback) setFeedback(resFeedback.feedback);
      if (resDatasets.versions) setDatasetVersions(resDatasets.versions);
    } catch {
      setErrorMsg("Failed to load admin statistics. Please ensure you are logged in as Admin.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchData();
    });
  }, [fetchData]);

  const runAdminAction = async (path, method, body, successMessage) => {
    setActionMsg("");
    const response = await fetch(path, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "The requested change could not be completed.");
    setActionMsg(successMessage);
    await fetchData();
  };

  const exportPredictions = () => {
    const rows = filteredPredictions.map(({ user_name, user_email, Crop, State_Name, Dist_Name, Area, predicted_yield, Year, created_at }) =>
      [user_name, user_email, Crop, State_Name, Dist_Name, Area, predicted_yield, Year, new Date(created_at * 1000).toLocaleDateString()]
    );
    const csv = [["Farmer", "Email", "Crop", "State", "District", "Area (ha)", "Yield (Kg/ha)", "Year", "Created"], ...rows]
      .map(row => row.map(value => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = "agriyield-prediction-report.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const filteredUsers = users.filter(user => `${user.full_name} ${user.email}`.toLowerCase().includes(userQuery.toLowerCase()));
  const filteredPredictions = predictions.filter(prediction =>
    (!cropFilter || prediction.Crop === cropFilter) && (!stateFilter || prediction.State_Name === stateFilter)
  );
  const cropOptions = [...new Set(predictions.map(prediction => prediction.Crop))].sort();
  const stateOptions = [...new Set(predictions.map(prediction => prediction.State_Name))].sort();

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <span className="spinner" style={{ width: "26px", height: "26px", margin: "0 auto 1rem" }}></span>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading Admin Command Center metrics...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="badge badge-purple">
              <Shield size={11} /> Admin Command Center
            </span>
            <span className="badge badge-emerald">
              {adminUser ? adminUser.full_name : "System Administrator"}
            </span>
          </div>
          <h1 className="page-title">
            {t("adminTitle", currentLang)}
          </h1>
          <p className="page-subtitle">
            {t("adminSub", currentLang)}
          </p>
        </div>

        <button onClick={fetchData} className="btn btn-secondary" style={{ fontSize: "0.82rem" }}>
          <RefreshCw size={13} /> {t("refreshMetrics", currentLang)}
        </button>
      </div>

      {errorMsg && (
        <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.25)", color: "var(--color-danger)", padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)", marginBottom: "1.25rem", fontSize: "0.82rem" }}>
          {errorMsg}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {/* Total Farmers */}
        <div className="metric-tile">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="metric-label">{t("totalFarmersUsers", currentLang)}</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "var(--radius-sm)", background: "rgba(16,185,129,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={16} color="var(--accent-primary)" />
            </div>
          </div>
          <div className="metric-value">
            {stats ? stats.total_registered_users : users.length}
          </div>
          <div className="metric-subtext" style={{ color: "var(--accent-primary)" }}>
            {stats ? `${stats.farmers_count} Farmers • ${stats.admins_count} Admins` : "Active Accounts"}
          </div>
        </div>

        {/* Total Predictions Run */}
        <div className="metric-tile">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="metric-label">{t("predictionsGenerated", currentLang)}</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "var(--radius-sm)", background: "rgba(59,130,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Activity size={16} color="#3b82f6" />
            </div>
          </div>
          <div className="metric-value">
            {stats ? stats.total_predictions : predictions.length}
          </div>
          <div className="metric-subtext" style={{ color: "#3b82f6" }}>
            Across {stats && stats.top_states ? Object.keys(stats.top_states).length : 1} Indian States
          </div>
        </div>

        {/* Avg National Yield */}
        <div className="metric-tile">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="metric-label">{t("avgForecastedYield", currentLang)}</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "var(--radius-sm)", background: "rgba(139,92,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BarChart3 size={16} color="#8b5cf6" />
            </div>
          </div>
          <div className="metric-value">
            {stats ? stats.average_predicted_yield : 0} <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 500 }}>Kg/ha</span>
          </div>
          <div className="metric-subtext">
            Weighted Regression Average
          </div>
        </div>

        {/* Active AI Models */}
        <div className="metric-tile">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="metric-label">{t("aiEnginesOperational", currentLang)}</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "var(--radius-sm)", background: "rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Cpu size={16} color="#d97706" />
            </div>
          </div>
          <div className="metric-value" style={{ fontSize: "1.2rem", color: "var(--accent-primary)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <CheckCircle size={18} /> Operational
          </div>
          <div className="metric-subtext">
            XGBoost ML + Gemini + Groq
          </div>
        </div>
      </div>

      {/* Top Crops Demand */}
      <div style={{ marginBottom: "1.5rem" }}>
        {/* Top Crops Demand */}
        <div className="fluent-panel">
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-main)" }}>
            <Sprout size={16} color="var(--accent-primary)" /> {t("mostRequestedCrops", currentLang)}
          </h3>

          {stats && stats.top_crops && Object.keys(stats.top_crops).length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {Object.entries(stats.top_crops).map(([cropName, count], idx) => (
                <div key={cropName}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{cropName}</span>
                    <span style={{ color: "var(--text-muted)" }}>{count} runs</span>
                  </div>
                  <div style={{ background: "var(--bg-inset)", height: "6px", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{
                      width: `${(count / (stats.total_predictions || 1)) * 100}%`,
                      height: "100%",
                      background: idx === 0 ? "var(--accent-primary)" : idx === 1 ? "#3b82f6" : idx === 2 ? "#8b5cf6" : "#f59e0b",
                      borderRadius: "3px"
                    }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>No crop data recorded yet.</p>
          )}
        </div>
      </div>

      {actionMsg && <div className="badge badge-emerald" style={{ marginBottom: "1rem", padding: "0.6rem 0.8rem" }}>{actionMsg}</div>}

      {/* Operations: announcements, reports, dataset governance, and feedback */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="fluent-panel">
          <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Notifications center</h3>
          <textarea value={announcement} onChange={(event) => setAnnouncement(event.target.value)} placeholder="Write an announcement for your users" className="input-field" style={{ minHeight: "76px", width: "100%", resize: "vertical" }} />
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem" }}>
            <select value={announcementAudience} onChange={(event) => setAnnouncementAudience(event.target.value)} className="input-field" style={{ flex: 1 }}><option value="all">All accounts</option><option value="farmers">Farmers</option><option value="admins">Admins</option></select>
            <button className="btn btn-primary" disabled={announcement.trim().length < 3} onClick={() => runAdminAction("/api/admin/announcements", "POST", { message: announcement, audience: announcementAudience }, "Announcement published.").then(() => setAnnouncement("")).catch(error => setErrorMsg(error.message))}>Publish</button>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.7rem" }}>{notifications.length} announcement(s) published</p>
        </div>

        <div className="fluent-panel">
          <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Dataset management</h3>
          <input value={datasetName} onChange={(event) => setDatasetName(event.target.value)} placeholder="Dataset version name" className="input-field" style={{ width: "100%", marginBottom: "0.5rem" }} />
          <input value={datasetSource} onChange={(event) => setDatasetSource(event.target.value)} placeholder="Source or validation reference" className="input-field" style={{ width: "100%", marginBottom: "0.6rem" }} />
          <button className="btn btn-secondary" disabled={!datasetName.trim() || !datasetSource.trim()} onClick={() => runAdminAction("/api/admin/dataset-versions", "POST", { name: datasetName, source: datasetSource, notes: "Registered from Admin Dashboard" }, "Dataset version recorded.").then(() => { setDatasetName(""); setDatasetSource(""); }).catch(error => setErrorMsg(error.message))}>Record version</button>
          <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.7rem" }}>{datasetVersions.length} version record(s)</p>
        </div>

        <div className="fluent-panel">
          <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Reports & feedback</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "0.8rem" }}>Export the filtered prediction register and review product feedback.</p>
          <button className="btn btn-secondary" onClick={exportPredictions}>Download CSV report</button>
          <div style={{ marginTop: "0.8rem", fontSize: "0.78rem", color: "var(--fg-secondary)" }}>{feedback.length} feedback item(s) • Average rating: {feedback.length ? (feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length).toFixed(1) : "—"}/5</div>
        </div>
      </div>

      {/* Farmer Crop Holdings Table */}
      <div className="fluent-panel" style={{ padding: 0, marginBottom: "1.5rem", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-main)" }}>
            <Sprout size={16} color="var(--accent-primary)" /> Prediction monitoring ({filteredPredictions.length})
          </h3>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <select className="input-field" value={cropFilter} onChange={(event) => setCropFilter(event.target.value)}><option value="">All crops</option>{cropOptions.map(crop => <option key={crop}>{crop}</option>)}</select>
            <select className="input-field" value={stateFilter} onChange={(event) => setStateFilter(event.target.value)}><option value="">All states</option>{stateOptions.map(state => <option key={state}>{state}</option>)}</select>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="fluent-table">
            <thead>
              <tr>
                <th>Farmer</th>
                <th>Email</th>
                <th>Crop</th>
                <th>Area (ha)</th>
                <th>Location</th>
                <th>Year</th>
              </tr>
            </thead>
            <tbody>
              {filteredPredictions.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 700, color: "var(--text-main)" }}>
                    {p.user_name || p.user_email || "Unknown"}
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {p.user_email || "-"}
                  </td>
                  <td>
                    <span className="badge badge-emerald" style={{ fontSize: "0.72rem" }}>{p.Crop}</span>
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {p.Area || "-"}
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {p.Dist_Name}, {p.State_Name}
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {p.Year}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Directory Table */}
      <div className="fluent-panel" style={{ padding: 0, marginBottom: "1.5rem", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-main)" }}>
            <Users size={16} color="#3b82f6" /> User management ({filteredUsers.length})
          </h3>
          <input className="input-field" value={userQuery} onChange={(event) => setUserQuery(event.target.value)} placeholder="Search name or email" style={{ maxWidth: "250px" }} />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="fluent-table">
            <thead>
              <tr>
                <th>{t("fullName", currentLang)}</th>
                <th>{t("email", currentLang)}</th>
                <th>{t("role", currentLang)}</th>
                <th>{t("locationDept", currentLang)}</th>
                <th>{t("registeredDate", currentLang)}</th>
                <th>Account controls</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 700, color: "var(--text-main)" }}>
                    {u.full_name}
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {u.email}
                  </td>
                  <td>
                    <span className={u.role === "admin" ? "badge badge-purple" : "badge badge-emerald"}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {u.farm_location || u.department || "India"}
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                    {new Date(u.created_at * 1000).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                      <select className="input-field" value={u.account_status || "active"} onChange={(event) => runAdminAction(`/api/admin/users/${u.id}`, "PATCH", { account_status: event.target.value }, "Account status updated.").catch(error => setErrorMsg(error.message))} style={{ width: "98px", fontSize: "0.72rem" }}>
                        <option value="active">Active</option><option value="pending">Pending</option><option value="disabled">Disabled</option>
                      </select>
                      <select className="input-field" value={u.role} onChange={(event) => runAdminAction(`/api/admin/users/${u.id}`, "PATCH", { role: event.target.value }, "User role updated.").catch(error => setErrorMsg(error.message))} style={{ width: "88px", fontSize: "0.72rem" }}>
                        <option value="farmer">Farmer</option><option value="admin">Admin</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="fluent-panel">
          <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Farmer feedback</h3>
          {feedback.length ? feedback.slice(0, 4).map(item => (
            <div key={item.id} style={{ borderTop: "1px solid var(--border-subtle)", padding: "0.55rem 0", fontSize: "0.8rem" }}>
              <strong>{item.rating}/5</strong> · {item.user_name}<br /><span style={{ color: "var(--text-muted)" }}>{item.comment}</span>
            </div>
          )) : <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>No feedback has been submitted yet.</p>}
        </div>
        <div className="fluent-panel">
          <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Administrative audit trail</h3>
          {audits.length ? audits.slice(0, 4).map(event => (
            <div key={event.id} style={{ borderTop: "1px solid var(--border-subtle)", padding: "0.55rem 0", fontSize: "0.8rem" }}>
              <strong>{event.action}</strong> · {event.subject}<br /><span style={{ color: "var(--text-muted)" }}>{event.admin_email} · {new Date(event.created_at * 1000).toLocaleString()}</span>
            </div>
          )) : <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Changes made here will be recorded in this audit trail.</p>}
        </div>
      </div>

      {/* Login Audit Log Table */}
      <div className="fluent-panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-subtle)" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-main)" }}>
            <Activity size={16} color="var(--accent-primary)" /> {t("authLogs", currentLang)} ({loginLogs.length})
          </h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="fluent-table">
            <thead>
              <tr>
                <th>{t("timestampLabel", currentLang)}</th>
                <th>{t("email", currentLang)}</th>
                <th>{t("fullName", currentLang)}</th>
                <th>{t("role", currentLang)}</th>
                <th>{t("status", currentLang)}</th>
                <th>{t("ipAddress", currentLang)}</th>
              </tr>
            </thead>
            <tbody>
              {loginLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                    {log.formatted_time}
                  </td>
                  <td style={{ fontWeight: 700, color: "var(--text-main)" }}>
                    {log.email}
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {log.full_name}
                  </td>
                  <td>
                    <span className={log.role === "admin" ? "badge badge-purple" : "badge badge-emerald"}>
                      {log.role.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={log.status === "SUCCESS" ? "badge badge-emerald" : "badge badge-amber"}>
                      {log.status}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                    {log.ip_address}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
