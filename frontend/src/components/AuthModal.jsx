import { useState } from "react";
import { X, User, Lock, Mail, MapPin, Sprout } from "lucide-react";
import { t } from "../utils/i18n";

export default function AuthModal({ isOpen, onClose, onLogin, onRegister, currentLang = "en" }) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [role, setRole] = useState("farmer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [farmLocation, setFarmLocation] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (isLoginView) {
        await onLogin(email, password);
      } else {
        await onRegister({
          email,
          password,
          full_name: fullName,
          role,
          farm_location: farmLocation
        });
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (roleType) => {
    if (roleType === "farmer") {
      setEmail("farmer@agriyield.ai");
      setPassword("farmer123");
      setIsLoginView(true);
    } else {
      setEmail("admin@agriyield.ai");
      setPassword("admin123");
      setIsLoginView(true);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 100,
      background: "var(--modal-overlay)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem"
    }}>
      <div className="glass-panel" style={{
        width: "100%",
        maxWidth: "460px",
        padding: "2rem",
        position: "relative",
        border: "1px solid var(--border-glass)",
        boxShadow: "var(--shadow-main)"
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1.25rem",
            right: "1.25rem",
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer"
          }}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{
            width: "50px",
            height: "50px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)",
            margin: "0 auto 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Sprout size={26} color="#ffffff" />
          </div>

          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
            {t("accessAccount", currentLang)}
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginTop: "4px" }}>
            {t("authModalDesc", currentLang)}
          </p>
        </div>

        {/* Tab Selector */}
        <div style={{
          display: "flex",
          background: "var(--bg-glass)",
          borderRadius: "12px",
          padding: "4px",
          marginBottom: "1.25rem",
          border: "1px solid var(--border-glass)"
        }}>
          <button
            type="button"
            onClick={() => { setIsLoginView(true); setErrorMsg(""); }}
            style={{
              flex: 1,
              padding: "0.6rem",
              borderRadius: "10px",
              border: "none",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              background: isLoginView ? "#10b981" : "transparent",
              color: isLoginView ? "#ffffff" : "var(--text-muted)",
              transition: "all 0.2s ease"
            }}
          >
            {t("loginTab", currentLang)}
          </button>
          <button
            type="button"
            onClick={() => { setIsLoginView(false); setErrorMsg(""); }}
            style={{
              flex: 1,
              padding: "0.6rem",
              borderRadius: "10px",
              border: "none",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              background: !isLoginView ? "#10b981" : "transparent",
              color: !isLoginView ? "#ffffff" : "var(--text-muted)",
              transition: "all 0.2s ease"
            }}
          >
            {t("registerTab", currentLang)}
          </button>
        </div>

        {/* Quick Demo Fill Pills */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
          <button
            type="button"
            onClick={() => fillDemo("farmer")}
            className="btn btn-secondary"
            style={{ flex: 1, fontSize: "0.78rem", padding: "0.4rem 0.6rem" }}
          >
            🌾 Demo Farmer
          </button>
          <button
            type="button"
            onClick={() => fillDemo("admin")}
            className="btn btn-secondary"
            style={{ flex: 1, fontSize: "0.78rem", padding: "0.4rem 0.6rem" }}
          >
            👑 Demo Admin
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.3)", color: "#f43f5e", padding: "0.75rem", borderRadius: "10px", fontSize: "0.85rem", marginBottom: "1rem" }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {!isLoginView && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px", fontWeight: 600 }}>
                  {t("fullName", currentLang)}
                </label>
                <div style={{ position: "relative" }}>
                  <User size={16} color="var(--text-muted)" style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: "2.5rem" }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px", fontWeight: 600 }}>
                  Account Role
                </label>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--text-main)", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="role"
                      value="farmer"
                      checked={role === "farmer"}
                      onChange={() => setRole("farmer")}
                      style={{ accentColor: "#10b981" }}
                    />
                    🌾 {t("roleFarmer", currentLang)}
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--text-main)", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={role === "admin"}
                      onChange={() => setRole("admin")}
                      style={{ accentColor: "#8b5cf6" }}
                    />
                    👑 {t("roleAdmin", currentLang)}
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px", fontWeight: 600 }}>
                  {t("farmLocation", currentLang)}
                </label>
                <div style={{ position: "relative" }}>
                  <MapPin size={16} color="var(--text-muted)" style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    placeholder="e.g. Ludhiana, Punjab"
                    value={farmLocation}
                    onChange={(e) => setFarmLocation(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: "2.5rem" }}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px", fontWeight: 600 }}>
              {t("email", currentLang)}
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={16} color="var(--text-muted)" style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="email"
                placeholder="farmer@agriyield.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                style={{ paddingLeft: "2.5rem" }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px", fontWeight: 600 }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={16} color="var(--text-muted)" style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                style={{ paddingLeft: "2.5rem" }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.85rem", marginTop: "0.5rem", fontSize: "0.95rem" }}
          >
            {loading ? <span className="spinner"></span> : (isLoginView ? t("loginTab", currentLang) : t("registerTab", currentLang))}
          </button>
        </form>
      </div>
    </div>
  );
}
