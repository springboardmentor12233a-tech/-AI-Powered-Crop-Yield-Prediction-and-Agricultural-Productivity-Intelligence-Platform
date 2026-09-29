import { useState, useEffect } from "react";
import { Sprout, User, LogOut, ShieldCheck, UserCheck, Bot, LayoutDashboard, History, BookOpen, Scale, FlaskConical, Globe, Sun, Moon, Clock } from "lucide-react";
import { LANGUAGES, t } from "../utils/i18n";

export default function Header({
  activeTab,
  setActiveTab,
  user,
  onOpenAuth,
  onLogout,
  onQuickDemoLogin,
  onOpenDocs,
  systemHealth,
  currentLang = "en",
  onLanguageChange,
  theme = "dark",
  onToggleTheme
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 50,
      background: "var(--header-bg)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: "1px solid var(--border-glass)",
      padding: "0.85rem 1.5rem",
      transition: "background 0.3s ease"
    }}>
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        flexWrap: "wrap"
      }}>
        {/* Brand / Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 15px rgba(16, 185, 129, 0.4)"
          }}>
            <Sprout size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h1 style={{ fontSize: "1.35rem", fontWeight: 800, margin: 0 }} className="gradient-text">
                {t("brand", currentLang)}
              </h1>
              <span className="badge badge-emerald" style={{ fontSize: "0.65rem", padding: "0.15rem 0.45rem" }}>
                v2.0 Dual-AI
              </span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
              {t("subBrand", currentLang)}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          background: "var(--bg-glass)",
          padding: "0.3rem",
          borderRadius: "9999px",
          border: "1px solid var(--border-glass)",
          flexWrap: "wrap"
        }}>
          {user && (
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`btn ${activeTab === "dashboard" ? "btn-primary" : "btn-secondary"}`}
              style={{ borderRadius: "9999px", padding: "0.5rem 0.95rem", fontSize: "0.82rem" }}
            >
              <LayoutDashboard size={15} /> {t("dashboard", currentLang)}
            </button>
          )}

          <button
            onClick={() => user ? setActiveTab("predictor") : onOpenAuth()}
            className={`btn ${activeTab === "predictor" ? "btn-primary" : "btn-secondary"}`}
            style={{ borderRadius: "9999px", padding: "0.5rem 0.95rem", fontSize: "0.82rem" }}
          >
            <Sprout size={15} /> {t("predictor", currentLang)}
          </button>

          <button
            onClick={() => user ? setActiveTab("compare") : onOpenAuth()}
            className={`btn ${activeTab === "compare" ? "btn-primary" : "btn-secondary"}`}
            style={{ borderRadius: "9999px", padding: "0.5rem 0.95rem", fontSize: "0.82rem" }}
          >
            <Scale size={15} /> {t("compare", currentLang)}
          </button>

          <button
            onClick={() => user ? setActiveTab("fertilizer") : onOpenAuth()}
            className={`btn ${activeTab === "fertilizer" ? "btn-primary" : "btn-secondary"}`}
            style={{ borderRadius: "9999px", padding: "0.5rem 0.95rem", fontSize: "0.82rem" }}
          >
            <FlaskConical size={15} /> {t("fertilizer", currentLang)}
          </button>

          <button
            onClick={() => user ? setActiveTab("assistant") : onOpenAuth()}
            className={`btn ${activeTab === "assistant" ? "btn-primary" : "btn-secondary"}`}
            style={{ borderRadius: "9999px", padding: "0.5rem 0.95rem", fontSize: "0.82rem" }}
          >
            <Bot size={15} /> {t("assistant", currentLang)}
          </button>

          <button
            onClick={() => user ? setActiveTab("history") : onOpenAuth()}
            className={`btn ${activeTab === "history" ? "btn-primary" : "btn-secondary"}`}
            style={{ borderRadius: "9999px", padding: "0.5rem 0.95rem", fontSize: "0.82rem" }}
          >
            <History size={15} /> {t("logs", currentLang)}
          </button>

          {user && (
            <button
              onClick={() => setActiveTab("tools")}
              className={`btn ${activeTab === "tools" ? "btn-primary" : "btn-secondary"}`}
              style={{ borderRadius: "9999px", padding: "0.5rem 0.95rem", fontSize: "0.82rem" }}
            >
              <Sprout size={15} /> Tools
            </button>
          )}

          {user && user.role === "admin" && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`btn ${activeTab === "admin" ? "btn-primary" : "btn-secondary"}`}
              style={{ borderRadius: "9999px", padding: "0.5rem 0.95rem", fontSize: "0.82rem" }}
            >
              <LayoutDashboard size={15} /> {t("admin", currentLang)}
            </button>
          )}
        </nav>

        {/* Right Controls & Auth Section */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {/* Live Digital Time Counter Clock */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "var(--bg-glass)",
            padding: "5px 12px",
            borderRadius: "10px",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            fontSize: "0.82rem",
            fontWeight: 700,
            color: "#10b981",
            boxShadow: "0 2px 10px rgba(16, 185, 129, 0.1)"
          }}>
            <Clock size={14} color="#10b981" />
            <span style={{ fontFamily: "monospace", letterSpacing: "0.05em" }}>
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </span>
            {systemHealth && (
              <span className="badge badge-emerald" style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem", marginLeft: "4px" }}>
                ● {systemHealth.status || "Online"}
              </span>
            )}
          </div>

          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="btn btn-secondary"
            style={{ padding: "0.45rem 0.75rem", fontSize: "0.78rem", borderRadius: "10px" }}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <><Sun size={15} color="#fbbf24" /> {t("themeLight", currentLang)}</>
            ) : (
              <><Moon size={15} color="#8b5cf6" /> {t("themeDark", currentLang)}</>
            )}
          </button>

          {/* Multilingual Selector */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "var(--bg-glass)",
            padding: "4px 10px",
            borderRadius: "10px",
            border: "1px solid var(--border-glass)"
          }}>
            <Globe size={15} color="#10b981" />
            <select
              value={currentLang}
              onChange={(e) => onLanguageChange && onLanguageChange(e.target.value)}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-main)",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                outline: "none"
              }}
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code} style={{ background: "var(--bg-secondary)", color: "var(--text-main)" }}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* System Specs Modal Trigger */}
          <button
            onClick={onOpenDocs}
            className="btn btn-secondary"
            style={{ padding: "0.45rem 0.75rem", fontSize: "0.78rem" }}
            title="View Technical Specifications"
          >
            <BookOpen size={14} /> {t("systemSpecs", currentLang)}
          </button>

          {/* User Profile / Auth Control */}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{
                background: "var(--bg-glass)",
                border: "1px solid var(--border-glass)",
                borderRadius: "12px",
                padding: "0.4rem 0.8rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                {user.role === "admin" ? (
                  <ShieldCheck size={18} color="#8b5cf6" />
                ) : (
                  <UserCheck size={18} color="#10b981" />
                )}
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", lineHeight: 1.2 }}>
                    {user.full_name}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: user.role === "admin" ? "#8b5cf6" : "#10b981", fontWeight: 600 }}>
                    {user.role.toUpperCase()}
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="btn btn-secondary"
                style={{ padding: "0.5rem", borderRadius: "10px" }}
                title={t("logOut", currentLang)}
              >
                <LogOut size={16} color="#f43f5e" />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button
                onClick={() => onQuickDemoLogin("farmer")}
                className="btn btn-secondary"
                style={{ padding: "0.45rem 0.75rem", fontSize: "0.78rem" }}
              >
                🌾 {t("demoFarmer", currentLang)}
              </button>
              <button
                onClick={() => onQuickDemoLogin("admin")}
                className="btn btn-secondary"
                style={{ padding: "0.45rem 0.75rem", fontSize: "0.78rem" }}
              >
                👑 {t("demoAdmin", currentLang)}
              </button>
              <button
                onClick={onOpenAuth}
                className="btn btn-primary"
                style={{ padding: "0.45rem 0.85rem", fontSize: "0.82rem" }}
              >
                <User size={14} /> {t("signIn", currentLang)}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
