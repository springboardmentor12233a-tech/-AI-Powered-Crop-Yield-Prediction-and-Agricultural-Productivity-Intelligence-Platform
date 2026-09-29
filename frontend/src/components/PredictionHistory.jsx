import { useState, useEffect } from "react";
import { History, Search, Trash2, Eye, X, Download } from "lucide-react";
import MarkdownReport from "./MarkdownReport";
import { t } from "../utils/i18n";

export default function PredictionHistory({ user, token, currentLang = "en" }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCropFilter, setSelectedCropFilter] = useState("ALL");
  const [selectedItem, setSelectedItem] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let isCancelled = false;
    queueMicrotask(() => {
      if (!isCancelled) setLoading(true);
    });
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    fetch("/api/predictions/history", { headers })
      .then(res => res.json())
      .then(data => {
        if (!isCancelled && data.history) {
          setHistory(data.history);
        }
      })
      .catch(() => {
        if (!isCancelled) setErrorMsg("Failed to load history logs.");
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });
    return () => { isCancelled = true; };
  }, [token]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this prediction log?")) return;

    try {
      const res = await fetch(`/api/predictions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setHistory(prev => prev.filter(item => item.id !== id));
        if (selectedItem && selectedItem.id === id) setSelectedItem(null);
      } else {
        alert("Failed to delete record.");
      }
    } catch {
      alert("Error deleting record.");
    }
  };

  const handleExportCSV = () => {
    if (history.length === 0) return;
    const headerRow = "ID,Date,Farmer,Role,State,District,Crop,Year,Area(ha),PredictedYield(Kg/ha),AIProvider\n";
    const rows = history.map(item =>
      `"${item.id}","${new Date(item.created_at * 1000).toLocaleDateString()}","${item.user_name || "Guest"}","${item.user_role}","${item.State_Name}","${item.Dist_Name}","${item.Crop}",${item.Year},${item.Area},${item.predicted_yield},"${item.ai_provider_used || "Google Gemini"}"`
    ).join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + headerRow + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AgriYield_History_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Unique crops for filtering
  const uniqueCrops = ["ALL", ...Array.from(new Set(history.map(item => item.Crop)))];

  // Filtered records
  const filteredHistory = history.filter(item => {
    const matchesSearch =
      item.Crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.State_Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.Dist_Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.user_name && item.user_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCrop = selectedCropFilter === "ALL" || item.Crop === selectedCropFilter;
    return matchesSearch && matchesCrop;
  });

  return (
    <div style={{ maxWidth: "1350px", margin: "0 auto", padding: "1.5rem 1rem" }}>
      {/* Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="badge badge-emerald">
              <History size={12} /> {t("logs", currentLang)}
            </span>
            {user && (
              <span className="badge badge-purple">
                {user.role === "admin" ? "System Audit (All Farmers)" : `My Farm Records (${user.full_name})`}
              </span>
            )}
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginTop: "0.4rem", color: "var(--text-main)" }}>
            {t("historyTitle", currentLang)}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            {t("historySub", currentLang)}
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="btn btn-secondary"
          style={{ fontSize: "0.85rem" }}
          disabled={history.length === 0}
        >
          <Download size={14} /> {t("exportCSV", currentLang)}
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-panel" style={{ padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: "220px", background: "var(--bg-glass)", padding: "0.5rem 0.85rem", borderRadius: "10px", border: "1px solid var(--border-glass)" }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder={t("searchPlaceholder", currentLang)}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: "none", border: "none", outline: "none", color: "var(--text-main)", fontSize: "0.88rem", width: "100%" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>{t("filterByCrop", currentLang)}:</span>
          <select
            value={selectedCropFilter}
            onChange={(e) => setSelectedCropFilter(e.target.value)}
            className="input-field select-field"
            style={{ width: "auto", fontSize: "0.85rem", padding: "0.45rem 2.2rem 0.45rem 0.75rem" }}
          >
            {uniqueCrops.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.3)", color: "#f43f5e", padding: "1rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Table Container */}
      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <span className="spinner" style={{ width: "28px", height: "28px", margin: "0 auto 1rem" }}></span>
            <p style={{ color: "var(--text-muted)" }}>Loading prediction logs...</p>
          </div>
        ) : filteredHistory.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem", color: "var(--text-main)" }}>
              <thead>
                <tr style={{ background: "var(--table-head-bg)", borderBottom: "1px solid var(--border-glass)", color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase" }}>
                  <th style={{ padding: "0.85rem 1rem" }}>{t("cropLabel", currentLang)}</th>
                  <th style={{ padding: "0.85rem 1rem" }}>{t("locationLabel", currentLang)}</th>
                  <th style={{ padding: "0.85rem 1rem" }}>{t("yearLabel", currentLang)}</th>
                  <th style={{ padding: "0.85rem 1rem" }}>{t("predictedYieldLabel", currentLang)}</th>
                  <th style={{ padding: "0.85rem 1rem" }}>{t("aiEngineLabel", currentLang)}</th>
                  <th style={{ padding: "0.85rem 1rem" }}>{t("timestampLabel", currentLang)}</th>
                  <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>{t("actionsLabel", currentLang)}</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map(item => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    style={{ borderBottom: "1px solid var(--border-glass)", cursor: "pointer" }}
                    className="hover-card"
                  >
                    <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#10b981" }}>
                      {item.Crop}
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      {item.Dist_Name}, {item.State_Name}
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      {item.Year}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "var(--text-main)" }}>
                      {item.predicted_yield} kg/ha
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span className="badge badge-purple" style={{ fontSize: "0.68rem" }}>
                        {item.ai_provider_used || "Google Gemini"}
                      </span>
                    </td>
                    <td style={{ padding: "0.85rem 1rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                      {item.created_at_formatted || new Date(item.created_at * 1000).toLocaleString()}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.4rem" }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}
                          className="btn btn-secondary"
                          style={{ padding: "0.35rem 0.65rem", fontSize: "0.78rem" }}
                          title={t("viewReport", currentLang)}
                        >
                          <Eye size={13} /> {t("viewReport", currentLang)}
                        </button>

                        {(user?.role === "admin" || (token && item.user_id === user?.id)) && (
                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            className="btn btn-danger"
                            style={{ padding: "0.35rem 0.55rem", fontSize: "0.78rem" }}
                            title={t("delete", currentLang)}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            {t("noHistoryFound", currentLang)}
          </div>
        )}
      </div>

      {/* Inspection Modal for History Log */}
      {selectedItem && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 110,
          background: "var(--modal-overlay)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem"
        }}>
          <div className="glass-panel" style={{
            width: "100%",
            maxWidth: "750px",
            maxHeight: "85vh",
            overflowY: "auto",
            padding: "2rem",
            position: "relative",
            border: "1px solid var(--border-glass)"
          }}>
            <button
              onClick={() => setSelectedItem(null)}
              style={{ position: "absolute", top: "1.25rem", right: "1.25rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
            >
              <X size={20} />
            </button>

            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="badge badge-emerald">{selectedItem.Crop}</span>
                <span className="badge badge-purple">{selectedItem.ai_provider_used}</span>
              </div>
              <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "0.4rem", color: "var(--text-main)" }}>
                Yield Report: {selectedItem.Dist_Name}, {selectedItem.State_Name} ({selectedItem.Year})
              </h2>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#10b981", marginTop: "0.3rem" }}>
                {selectedItem.predicted_yield} Kg/ha
              </div>
            </div>

            <div style={{ background: "var(--bg-glass)", padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
              <MarkdownReport content={selectedItem.ai_analysis} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
