import { useState, useEffect } from "react";
import { 
  Sprout, User, LogOut, ShieldCheck, UserCheck, Bot, 
  LayoutDashboard, History, BookOpen, Scale, FlaskConical, 
  Globe, Sun, Moon, Clock, Wrench
} from "lucide-react";
import { LANGUAGES, t } from "../utils/i18n";

export default function Header({
  activeTab,
  setActiveTab,
  user,
  onOpenAuth,
  onLogout,
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
    <header className="acrylic-surface" style={{
      position: "sticky",
      top: 0,
      zIndex: 50,
      borderTop: "none",
      borderLeft: "none",
      borderRight: "none",
      borderBottom: "1px solid var(--border-subtle)",
      padding: "0.55rem 1.5rem",
      transition: "background 0.2s ease, border-color 0.2s ease"
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
        {/* Brand Section */}
        <div 
          onClick={() => setActiveTab(user ? "dashboard" : "landing")}
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "0.65rem", 
            cursor: "pointer",
            userSelect: "none"
          }}
        >
          <div style={{
            width: "34px",
            height: "34px",
            borderRadius: "var(--radius-md)",
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)"
          }}>
            <Sprout size={20} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ 
                fontFamily: "var(--font-display)", 
                fontSize: "1.15rem", 
                fontWeight: 700, 
                letterSpacing: "-0.02em",
                color: "var(--fg-primary)" 
              }}>
                {t("brand", currentLang)}
              </span>
              <span className="badge badge-emerald" style={{ fontSize: "0.6rem", padding: "0.1rem 0.4rem" }}>
                v2.0
              </span>
            </div>
            <p style={{ fontSize: "0.7rem", color: "var(--fg-muted)", margin: 0, lineHeight: 1 }}>
              {t("subBrand", currentLang)}
            </p>
          </div>
        </div>

        {/* Fluent Navigation Items */}
        <nav className="nav-pill-group" style={{ maxWidth: "100%" }}>
          {user && (
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`nav-tab-btn ${activeTab === "dashboard" ? "active" : ""}`}
            >
              <LayoutDashboard size={14} /> {t("dashboard", currentLang)}
            </button>
          )}

          <button
            onClick={() => user ? setActiveTab("predictor") : onOpenAuth()}
            className={`nav-tab-btn ${activeTab === "predictor" ? "active" : ""}`}
          >
            <Sprout size={14} /> {t("predictor", currentLang)}
          </button>

          <button
            onClick={() => user ? setActiveTab("compare") : onOpenAuth()}
            className={`nav-tab-btn ${activeTab === "compare" ? "active" : ""}`}
          >
            <Scale size={14} /> {t("compare", currentLang)}
          </button>

          <button
            onClick={() => user ? setActiveTab("fertilizer") : onOpenAuth()}
            className={`nav-tab-btn ${activeTab === "fertilizer" ? "active" : ""}`}
          >
            <FlaskConical size={14} /> {t("fertilizer", currentLang)}
          </button>

          <button
            onClick={() => user ? setActiveTab("assistant") : onOpenAuth()}
            className={`nav-tab-btn ${activeTab === "assistant" ? "active" : ""}`}
          >
            <Bot size={14} /> {t("assistant", currentLang)}
          </button>

          <button
            onClick={() => user ? setActiveTab("history") : onOpenAuth()}
            className={`nav-tab-btn ${activeTab === "history" ? "active" : ""}`}
          >
            <History size={14} /> {t("logs", currentLang)}
          </button>

          {user && (
            <button
              onClick={() => setActiveTab("tools")}
              className={`nav-tab-btn ${activeTab === "tools" ? "active" : ""}`}
            >
              <Wrench size={14} /> Tools
            </button>
          )}

          {user && user.role === "admin" && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`nav-tab-btn ${activeTab === "admin" ? "active" : ""}`}
            >
              <ShieldCheck size={14} /> {t("admin", currentLang)}
            </button>
          )}
        </nav>

        {/* Right Controls & Utilities */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Telemetry Clock */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            background: "var(--surface-inset)",
            padding: "3px 9px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-subtle)",
            fontSize: "0.75rem",
            color: "var(--fg-secondary)",
            fontFamily: "var(--font-mono)"
          }}>
            <span className="live-dot" title="Telemetry Active"></span>
            <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          {/* Multilingual Selector */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            background: "var(--surface-inset)",
            padding: "2px 6px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-subtle)"
          }}>
            <Globe size={13} color="var(--fg-muted)" />
            <select
              value={currentLang}
              onChange={(e) => onLanguageChange && onLanguageChange(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--fg-primary)",
                fontSize: "0.78rem",
                fontWeight: 500,
                cursor: "pointer",
                outline: "none"
              }}
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code} style={{ background: "var(--surface-elevated)", color: "var(--fg-primary)" }}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="btn btn-ghost"
            style={{ width: "32px", height: "32px", padding: 0, borderRadius: "var(--radius-sm)" }}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={15} color="#fbbf24" /> : <Moon size={15} color="#6366f1" />}
          </button>

          {/* Docs Button */}
          <button
            onClick={onOpenDocs}
            className="btn btn-ghost"
            style={{ width: "32px", height: "32px", padding: 0, borderRadius: "var(--radius-sm)" }}
            title="System Specifications & Architecture"
            aria-label="View Specs"
          >
            <BookOpen size={15} />
          </button>

          {/* User Account / Auth Actions */}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <div style={{
                background: "var(--surface-inset)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                padding: "2px 8px 2px 5px",
                display: "flex",
                alignItems: "center",
                gap: "0.45rem"
              }}>
                <div style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "var(--radius-xs)",
                  background: user.role === "admin" ? "var(--secondary-subtle)" : "var(--accent-subtle)",
                  color: user.role === "admin" ? "var(--secondary)" : "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {user.role === "admin" ? <ShieldCheck size={13} /> : <UserCheck size={13} />}
                </div>
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--fg-primary)", lineHeight: 1.1 }}>
                    {user.full_name}
                  </div>
                  <div style={{ fontSize: "0.62rem", color: "var(--fg-muted)", fontWeight: 500, textTransform: "uppercase" }}>
                    {user.role}
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="btn btn-ghost"
                style={{ width: "32px", height: "32px", padding: 0, borderRadius: "var(--radius-sm)" }}
                title={t("logOut", currentLang)}
                aria-label="Log Out"
              >
                <LogOut size={14} color="var(--danger)" />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", position: "relative" }}>
              <button
                onClick={onOpenAuth}
                className="btn btn-primary"
                style={{ height: "32px", padding: "0 0.85rem", fontSize: "0.8rem" }}
              >
                <User size={13} /> {t("signIn", currentLang)}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
