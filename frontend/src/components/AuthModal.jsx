import { useState } from "react";
import { 
  X, User, Lock, Mail, MapPin, Sprout, AlertCircle, 
  ArrowRight, Eye, EyeOff, Check, ArrowLeft
} from "lucide-react";
import { t } from "../utils/i18n";

export default function AuthModal({ isOpen, onClose, onLogin, onRegister, currentLang = "en" }) {
  const [view, setView] = useState("login"); // "login" | "register" | "forgot" | "forgot_sent"
  const [role, setRole] = useState("farmer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [fullName, setFullName] = useState("");
  const [farmLocation, setFarmLocation] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [forgotEmail, setForgotEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Password strength calculator
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: "Empty", color: "var(--fg-muted)" };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 8) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[A-Z]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 1, label: "Weak", color: "var(--danger)" };
    if (score <= 3) return { score: 2, label: "Moderate", color: "var(--warning)" };
    return { score: 3, label: "Strong", color: "var(--accent)" };
  };

  const strength = getPasswordStrength(password);
  const passwordLengthError = view === "register" && password.length > 0 && password.length < 8;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (view === "login") {
        await onLogin(email, password);
        onClose();
      } else if (view === "register") {
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters long.");
        }
        if (!agreeTerms) {
          throw new Error("Please agree to the Terms of Service to continue.");
        }
        await onRegister({
          email,
          password,
          full_name: fullName,
          role,
          farm_location: farmLocation
        });
        onClose();
      } else if (view === "forgot") {
        if (!forgotEmail) throw new Error("Please enter your registered email address.");
        // Simulated recovery flow
        await new Promise(r => setTimeout(r, 600));
        setView("forgot_sent");
      }
    } catch (err) {
      setErrorMsg(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 100,
      background: "var(--modal-overlay)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem"
    }}>
      <div 
        className="fluent-panel acrylic-surface"
        style={{
          width: "100%",
          maxWidth: "440px",
          padding: "2rem",
          position: "relative",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-modal)"
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="btn btn-ghost"
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            width: "32px",
            height: "32px",
            padding: 0,
            borderRadius: "var(--radius-sm)"
          }}
          aria-label="Close modal"
        >
          <X size={16} />
        </button>

        {/* Brand & Header */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{
            width: "42px",
            height: "42px",
            borderRadius: "var(--radius-md)",
            background: "var(--accent)",
            margin: "0 auto 0.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)"
          }}>
            <Sprout size={22} strokeWidth={2.2} />
          </div>

          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--fg-primary)", margin: 0 }}>
            {view === "login" && t("accessAccount", currentLang)}
            {view === "register" && "Create an Account"}
            {(view === "forgot" || view === "forgot_sent") && "Password Recovery"}
          </h2>
          <p style={{ color: "var(--fg-secondary)", fontSize: "0.82rem", marginTop: "3px" }}>
            {view === "login" && "Enter your credentials to access farm analytics and advisory"}
            {view === "register" && "Register your farm profile to run crop yield models"}
            {view === "forgot" && "Enter your registered email to receive reset instructions"}
            {view === "forgot_sent" && `Instructions sent to ${forgotEmail}`}
          </p>
        </div>

        {/* Tab Selector (for Login / Register) */}
        {(view === "login" || view === "register") && (
          <div style={{
            display: "flex",
            background: "var(--surface-inset)",
            borderRadius: "var(--radius-md)",
            padding: "3px",
            marginBottom: "1.25rem",
            border: "1px solid var(--border-subtle)"
          }}>
            <button
              type="button"
              onClick={() => { setView("login"); setErrorMsg(""); }}
              style={{
                flex: 1,
                padding: "0.45rem",
                borderRadius: "var(--radius-sm)",
                border: "none",
                fontWeight: 600,
                fontSize: "0.82rem",
                cursor: "pointer",
                background: view === "login" ? "var(--surface-base)" : "transparent",
                color: view === "login" ? "var(--fg-primary)" : "var(--fg-muted)",
                boxShadow: view === "login" ? "var(--shadow-sm)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              {t("loginTab", currentLang)}
            </button>
            <button
              type="button"
              onClick={() => { setView("register"); setErrorMsg(""); }}
              style={{
                flex: 1,
                padding: "0.45rem",
                borderRadius: "var(--radius-sm)",
                border: "none",
                fontWeight: 600,
                fontSize: "0.82rem",
                cursor: "pointer",
                background: view === "register" ? "var(--surface-base)" : "transparent",
                color: view === "register" ? "var(--fg-primary)" : "var(--fg-muted)",
                boxShadow: view === "register" ? "var(--shadow-sm)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              {t("registerTab", currentLang)}
            </button>
          </div>
        )}

        {/* Error Alert State */}
        {errorMsg && (
          <div style={{
            background: "var(--danger-subtle)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            color: "var(--danger)",
            padding: "0.6rem 0.85rem",
            borderRadius: "var(--radius-md)",
            fontSize: "0.8rem",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.45rem"
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Forgot Password Confirmation Screen */}
        {view === "forgot_sent" && (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "var(--accent-subtle)",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem"
            }}>
              <Check size={24} />
            </div>
            <p style={{ fontSize: "0.88rem", color: "var(--fg-primary)", marginBottom: "1.5rem" }}>
              We have dispatched recovery instructions to your email address. Please follow the link in the message to set a new password.
            </p>
            <button
              type="button"
              onClick={() => { setView("login"); setErrorMsg(""); }}
              className="btn btn-primary"
              style={{ width: "100%" }}
            >
              <ArrowLeft size={14} /> Return to Sign In
            </button>
          </div>
        )}

        {/* Forgot Password Request Form */}
        {view === "forgot" && (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Registered Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={15} color="var(--fg-muted)" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: "2.25rem" }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "0.25rem" }}
            >
              {loading ? <span className="spinner"></span> : "Send Recovery Link"}
            </button>

            <button
              type="button"
              onClick={() => { setView("login"); setErrorMsg(""); }}
              className="btn btn-ghost"
              style={{ fontSize: "0.8rem", width: "100%" }}
            >
              <ArrowLeft size={13} /> Back to Sign In
            </button>
          </form>
        )}

        {/* Login / Register Form */}
        {(view === "login" || view === "register") && (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            {view === "register" && (
              <>
                <div className="form-group">
                  <label className="form-label">{t("fullName", currentLang)}</label>
                  <div style={{ position: "relative" }}>
                    <User size={15} color="var(--fg-muted)" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)" }} />
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft: "2.25rem" }}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Account type</label>
                  <div style={{ display: "flex", gap: "0.75rem", padding: "0.15rem 0" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", color: "var(--fg-primary)", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="role"
                        value="farmer"
                        checked={role === "farmer"}
                        onChange={() => setRole("farmer")}
                        style={{ accentColor: "var(--accent)" }}
                      />
                      🌾 {t("roleFarmer", currentLang)}
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", color: "var(--fg-primary)", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="role"
                        value="admin"
                        checked={role === "admin"}
                        onChange={() => setRole("admin")}
                        style={{ accentColor: "var(--secondary)" }}
                      />
                      👑 {t("roleAdmin", currentLang)}
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{t("farmLocation", currentLang)}</label>
                  <div style={{ position: "relative" }}>
                    <MapPin size={15} color="var(--fg-muted)" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)" }} />
                    <input
                      type="text"
                      placeholder="e.g. Ludhiana, Punjab"
                      value={farmLocation}
                      onChange={(e) => setFarmLocation(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft: "2.25rem" }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email Field */}
            <div className="form-group">
              <label className="form-label">{t("email", currentLang)}</label>
              <div style={{ position: "relative" }}>
                <Mail size={15} color="var(--fg-muted)" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: "2.25rem" }}
                  required
                />
              </div>
            </div>

            {/* Password Field with Show/Hide toggle */}
            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className="form-label">Password</label>
                {view === "login" && (
                  <button
                    type="button"
                    onClick={() => { setView("forgot"); setForgotEmail(email); setErrorMsg(""); }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--accent)",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      padding: 0
                    }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <Lock size={15} color="var(--fg-muted)" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: "2.25rem", paddingRight: "2.25rem" }}
                  minLength={8}
                  aria-invalid={passwordLengthError}
                  aria-describedby={view === "register" ? "password-requirements" : undefined}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  style={{
                    position: "absolute",
                    right: "0.65rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--fg-muted)",
                    cursor: "pointer",
                    padding: 0
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Strength Indicator on Register */}
              {view === "register" && password && (
                <div style={{ marginTop: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--fg-muted)", marginBottom: "3px" }}>
                    <span>Security strength:</span>
                    <span style={{ color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                  </div>
                  <div style={{ display: "flex", gap: "3px", height: "3px" }}>
                    <div style={{ flex: 1, borderRadius: "2px", background: strength.score >= 1 ? strength.color : "var(--border-subtle)" }}></div>
                    <div style={{ flex: 1, borderRadius: "2px", background: strength.score >= 2 ? strength.color : "var(--border-subtle)" }}></div>
                    <div style={{ flex: 1, borderRadius: "2px", background: strength.score >= 3 ? strength.color : "var(--border-subtle)" }}></div>
                  </div>
                  <div
                    id="password-requirements"
                    role={passwordLengthError ? "alert" : undefined}
                    style={{
                      marginTop: "5px",
                      fontSize: "0.72rem",
                      color: passwordLengthError ? "var(--danger)" : "var(--fg-muted)"
                    }}
                  >
                    {passwordLengthError
                      ? `Add ${8 - password.length} more character${8 - password.length === 1 ? "" : "s"}. Passwords must be at least 8 characters.`
                      : "Password length meets the 8-character minimum."}
                  </div>
                </div>
              )}
            </div>

            {/* Remember Me / Terms Checkboxes */}
            {view === "login" ? (
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "var(--fg-secondary)", cursor: "pointer", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: "var(--accent)" }}
                />
                Remember me on this browser
              </label>
            ) : (
              <label style={{ display: "flex", alignItems: "flex-start", gap: "6px", fontSize: "0.76rem", color: "var(--fg-secondary)", cursor: "pointer", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  style={{ accentColor: "var(--accent)", marginTop: "2px" }}
                />
                <span>I agree to the Agricultural Telemetry Terms of Service and Privacy Policy</span>
              </label>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "0.4rem" }}
            >
              {loading ? (
                <span className="spinner"></span>
              ) : (
                view === "login" ? (
                  <>{t("loginTab", currentLang)} <ArrowRight size={14} /></>
                ) : (
                  <>Create Account <ArrowRight size={14} /></>
                )
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
