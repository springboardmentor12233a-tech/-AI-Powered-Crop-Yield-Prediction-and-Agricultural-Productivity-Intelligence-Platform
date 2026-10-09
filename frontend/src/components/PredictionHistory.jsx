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

  const uniqueCrops = ["ALL", ...Array.from(new Set(history.map(item => item.Crop)))];

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
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="badge badge-emerald">
              <History size={11} /> Historical Records
            </span>
            {user && (
              <span className="badge badge-purple">
                {user.role === "admin" ? "All Farmer Logs" : `Personal Farm Records (${user.full_name})`}
              </span>
            )}
          </div>
          <h1 className="page-title">
            {t("historyTitle", currentLang)}
          </h1>
          <p className="page-subtitle">
            {t("historySub", currentLang)}
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="btn btn-secondary"
          style={{ fontSize: "0.82rem" }}
          disabled={history.length === 0}
        >
          <Download size={13} /> {t("exportCSV", currentLang)}
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="fluent-panel" style={{ padding: "0.85rem 1.15rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: "220px", background: "var(--bg-inset)", padding: "0.45rem 0.8rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            placeholder={t("searchPlaceholder", currentLang)}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: "none", border: "none", outline: "none", color: "var(--text-main)", fontSize: "0.85rem", width: "100%" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>{t("filterByCrop", currentLang)}:</span>
          <select
            value={selectedCropFilter}
            onChange={(e) => setSelectedCropFilter(e.target.value)}
            className="select-field"
            style={{ width: "auto", fontSize: "0.82rem", padding: "0.35rem 1.8rem 0.35rem 0.65rem" }}
          >
            {uniqueCrops.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "var(--color-danger)", padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)", marginBottom: "1.25rem", fontSize: "0.82rem" }}>
          {errorMsg}
        </div>
      )}

      {/* Table Container */}
      <div className="fluent-panel" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <span className="spinner" style={{ width: "24px", height: "24px", margin: "0 auto 0.75rem" }}></span>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading prediction history...</p>
          </div>
        ) : filteredHistory.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table className="fluent-table">
              <thead>
                <tr>
                  <th>{t("cropLabel", currentLang)}</th>
                  <th>{t("locationLabel", currentLang)}</th>
                  <th>{t("yearLabel", currentLang)}</th>
                  <th>{t("predictedYieldLabel", currentLang)}</th>
                  <th>{t("aiEngineLabel", currentLang)}</th>
                  <th>{t("timestampLabel", currentLang)}</th>
                  <th style={{ textAlign: "right" }}>{t("actionsLabel", currentLang)}</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map(item => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    style={{ cursor: "pointer" }}
                  >
                    <td style={{ fontWeight: 700, color: "var(--accent-primary)" }}>
                      {item.Crop}
                    </td>
                    <td>
                      {item.Dist_Name}, {item.State_Name}
                    </td>
                    <td>
                      {item.Year}
                    </td>
                    <td style={{ fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                      {item.predicted_yield} kg/ha
                    </td>
                    <td>
                      <span className="badge badge-purple" style={{ fontSize: "0.65rem" }}>
                        {item.ai_provider_used || "Google Gemini"}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                      {item.created_at_formatted || new Date(item.created_at * 1000).toLocaleString()}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.35rem" }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}
                          className="btn btn-secondary"
                          style={{ padding: "0.25rem 0.55rem", fontSize: "0.74rem" }}
                          title={t("viewReport", currentLang)}
                        >
                          <Eye size={12} /> {t("viewReport", currentLang)}
                        </button>

                        {(user?.role === "admin" || (token && item.user_id === user?.id)) && (
                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            className="btn btn-ghost"
                            style={{ padding: "0.25rem 0.45rem", color: "var(--color-danger)" }}
                            title={t("delete", currentLang)}
                          >
                            <Trash2 size={12} />
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
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
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
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem"
        }}>
          <div className="fluent-panel" style={{
            width: "100%",
            maxWidth: "720px",
            maxHeight: "85vh",
            overflowY: "auto",
            padding: "1.75rem",
            position: "relative"
          }}>
            <button
              onClick={() => setSelectedItem(null)}
              className="btn btn-ghost"
              style={{ position: "absolute", top: "1rem", right: "1rem", padding: "0.35rem" }}
            >
              <X size={18} />
            </button>

            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="badge badge-emerald">{selectedItem.Crop}</span>
                <span className="badge badge-purple">{selectedItem.ai_provider_used}</span>
              </div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800, marginTop: "0.35rem", color: "var(--text-main)" }}>
                Yield Report: {selectedItem.Dist_Name}, {selectedItem.State_Name} ({selectedItem.Year})
              </h2>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--accent-primary)", marginTop: "0.25rem", fontFamily: "var(--font-mono)" }}>
                {selectedItem.predicted_yield} Kg/ha
              </div>
            </div>

            <div style={{ background: "var(--bg-inset)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
              <MarkdownReport content={selectedItem.ai_analysis} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
