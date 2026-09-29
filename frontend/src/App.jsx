import { useState, useEffect } from "react";
import Header from "./components/Header";
import AuthModal from "./components/AuthModal";
import DocsModal from "./components/DocsModal";
import LandingPage from "./components/LandingPage";
import FarmerDashboard from "./components/FarmerDashboard";
import YieldPredictor from "./components/YieldPredictor";
import MultiCropComparator from "./components/MultiCropComparator";
import FertilizerCalculator from "./components/FertilizerCalculator";
import AIChatAssistant from "./components/AIChatAssistant";
import PredictionHistory from "./components/PredictionHistory";
import AdminDashboard from "./components/AdminDashboard";
import FarmerTools from "./components/FarmerTools";
import Footer from "./components/Footer";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("agriyield_jwt") || "");
  const [user, setUser] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [currentLang, setCurrentLang] = useState(localStorage.getItem("agriyield_lang") || "en");
  const [theme, setTheme] = useState(localStorage.getItem("agriyield_theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("agriyield_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  const handleLanguageChange = (langCode) => {
    setCurrentLang(langCode);
    localStorage.setItem("agriyield_lang", langCode);
  };

  // Verify JWT Token on mount or when token changes
  useEffect(() => {
    if (!token) {
      queueMicrotask(() => setUser(null));
      return;
    }

    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Invalid token");
      })
      .then(data => {
        setUser(data);
        if (data.role === "admin") {
          setActiveTab(prev => prev === "dashboard" ? "admin" : prev);
        }
      })
      .catch(() => {
        localStorage.removeItem("agriyield_jwt");
        setToken("");
        setUser(null);
      });
  }, [token]);

  // Fetch backend health
  useEffect(() => {
    fetch("/api/health")
      .then(res => res.json())
      .then(data => setSystemHealth(data))
      .catch(err => console.error("Health check error:", err));
  }, []);

  const handleLogin = async (email, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Login failed");

    localStorage.setItem("agriyield_jwt", data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    if (data.user.role === "admin") {
      setActiveTab("admin");
    } else {
      setActiveTab("dashboard");
    }
  };

  const handleRegister = async (userData) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Registration failed");

    localStorage.setItem("agriyield_jwt", data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("agriyield_jwt");
    setToken("");
    setUser(null);
    setActiveTab("dashboard");
  };

  const handleQuickDemoLogin = async (roleType) => {
    const email = roleType === "admin" ? "admin@agriyield.ai" : "farmer@agriyield.ai";
    const password = roleType === "admin" ? "admin123" : "farmer123";
    try {
      await handleLogin(email, password);
    } catch (err) {
      alert("Quick demo login failed: " + err.message);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onQuickDemoLogin={handleQuickDemoLogin}
        onOpenDocs={() => setIsDocsOpen(true)}
        systemHealth={systemHealth}
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main style={{ flex: 1 }}>
        {!user ? (
          <LandingPage
            onOpenAuth={() => setIsAuthOpen(true)}
            onQuickDemoLogin={handleQuickDemoLogin}
            currentLang={currentLang}
          />
        ) : (
          <>
            {(activeTab === "dashboard" || activeTab === "landing") && (
              <FarmerDashboard
                user={user}
                token={token}
                setActiveTab={setActiveTab}
                currentLang={currentLang}
              />
            )}

            {activeTab === "predictor" && (
              <YieldPredictor
                user={user}
                token={token}
                currentLang={currentLang}
                onSwitchToChat={() => setActiveTab("assistant")}
              />
            )}

            {activeTab === "compare" && (
              <MultiCropComparator currentLang={currentLang} />
            )}

            {activeTab === "fertilizer" && (
              <FertilizerCalculator token={token} currentLang={currentLang} />
            )}

            {activeTab === "assistant" && (
              <AIChatAssistant user={user} token={token} currentLang={currentLang} />
            )}

            {activeTab === "history" && (
              <PredictionHistory user={user} token={token} currentLang={currentLang} />
            )}

            {activeTab === "admin" && (
              <AdminDashboard adminUser={user} token={token} currentLang={currentLang} />
            )}

            {activeTab === "tools" && (
              <FarmerTools
                user={user}
                token={token}
                currentLang={currentLang}
                onSwitchToAssistant={(prompt) => {
                  setActiveTab("assistant");
                  setTimeout(() => {
                    const event = new CustomEvent("agriyield:prompt", { detail: prompt });
                    window.dispatchEvent(event);
                  }, 100);
                }}
              />
            )}
          </>
        )}
      </main>

      <Footer currentLang={currentLang} />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        currentLang={currentLang}
      />

      <DocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
        currentLang={currentLang}
      />
    </div>
  );
}

export default App;
