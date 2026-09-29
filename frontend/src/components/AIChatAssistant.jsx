import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, User, Send, Sparkles, RefreshCw, Copy, Check, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import MarkdownReport from "./MarkdownReport";
import { t, LANG_NAME_MAP } from "../utils/i18n";

export default function AIChatAssistant({ user, token, currentLang = "en", externalPrompt, onExternalPromptHandled }) {
  const getInitialGreeting = (lang) => ({
    sender: "assistant",
    text: t("initialGreeting", lang),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  const [messages, setMessages] = useState([getInitialGreeting(currentLang)]);
  const [inputText, setInputText] = useState("");
  const [provider, setProvider] = useState("auto");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const chatEndRef = useRef(null);

  // Update initial greeting when language changes if chat is empty or has default greeting
  useEffect(() => {
    setMessages(prev => {
      if (prev.length <= 1) {
        return [getInitialGreeting(currentLang)];
      }
      return prev;
    });
  }, [currentLang]);

  const handleSendMessage = useCallback(async (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim() || loading) return;

    const userMsg = {
      sender: "user",
      text: query.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText("");
    setLoading(true);

    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      // Build history context from previous messages for better responses
      const historyContext = newMessages.slice(-10).map(m => `${m.sender}: ${m.text}`).join("\n");
      const systemPrompt = `You are AgriYield AI farming assistant. Previous conversation history for context:\n${historyContext}\n\nPlease answer the farmer's question considering this history. Keep answers simple, practical, and in ${LANG_NAME_MAP[currentLang] || "English"}.`;

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: [{ sender: "system", text: systemPrompt }, ...newMessages.map(m => ({ sender: m.sender, text: m.text }))],
          provider: provider,
          language: LANG_NAME_MAP[currentLang] || "English"
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to reach AI Assistant.");
      }

      const botMsg = {
        sender: "assistant",
        text: data.reply,
        providerUsed: data.provider_used,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: "assistant",
          text: `⚠️ Sorry, an error occurred: ${err.message}`,
          isError: true,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [inputText, loading, messages, token, currentLang, provider]);

  // Handle external prompt from other components
  useEffect(() => {
    if (externalPrompt) {
      handleSendMessage(externalPrompt);
      onExternalPromptHandled?.();
    }
  }, [externalPrompt, handleSendMessage, onExternalPromptHandled]);

  // Listen for custom event from App (when sharing from Tools)
  useEffect(() => {
    const handler = (e) => {
      if (e.detail) {
        handleSendMessage(e.detail);
      }
    };
    window.addEventListener("agriyield:prompt", handler);
    return () => window.removeEventListener("agriyield:prompt", handler);
  }, [handleSendMessage]);

  const handleCopyText = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser. Try Google Chrome or Edge.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = currentLang === "te" ? "te-IN" : currentLang === "hi" ? "hi-IN" : currentLang === "ta" ? "ta-IN" : currentLang === "kn" ? "kn-IN" : currentLang === "ml" ? "ml-IN" : currentLang === "mr" ? "mr-IN" : "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(prev => prev ? `${prev} ${transcript}` : transcript);
    };

    recognition.start();
  };

  const handleSpeakText = (text, index) => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }
    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = currentLang === "te" ? "te-IN" : currentLang === "hi" ? "hi-IN" : currentLang === "ta" ? "ta-IN" : currentLang === "kn" ? "kn-IN" : currentLang === "ml" ? "ml-IN" : currentLang === "mr" ? "mr-IN" : "en-US";
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  const handleClearChat = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeakingIndex(null);
    setMessages([getInitialGreeting(currentLang)]);
  };
  const quickPrompts = [
    t("prompt1", currentLang),
    t("prompt2", currentLang),
    t("prompt3", currentLang),
    t("prompt4", currentLang),
    t("prompt5", currentLang)
  ];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  return (
    <div style={{ maxWidth: "1150px", margin: "0 auto", padding: "1.5rem 1rem" }}>
      {/* Title & Subtitle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="badge badge-purple">
              <Sparkles size={12} /> Google Gemini + Groq AI
            </span>
            {user && (
              <span className="badge badge-emerald">
                {user.role === "admin" ? `👑 ${t("roleAdmin", currentLang)}` : `🌾 ${t("roleFarmer", currentLang)}`}
              </span>
            )}
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginTop: "0.4rem", color: "var(--text-main)" }}>
            {t("aiAssistantTitle", currentLang)}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            {t("aiAssistantSub", currentLang)}
          </p>
        </div>

        {/* Model Selector & Clear Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="input-field select-field"
            style={{ width: "auto", fontSize: "0.85rem", padding: "0.5rem 2.2rem 0.5rem 0.8rem" }}
          >
            <option value="auto">⚡ Auto (Gemini + Groq)</option>
            <option value="gemini">✨ Google Gemini 3.8</option>
            <option value="groq">🔥 Groq LLaMA 70B</option>
          </select>

          <button
            onClick={handleClearChat}
            className="btn btn-secondary"
            style={{ padding: "0.5rem 0.8rem", fontSize: "0.82rem" }}
            title={t("clearChat", currentLang)}
          >
            <RefreshCw size={14} /> {t("clearChat", currentLang)}
          </button>
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="glass-panel" style={{
        display: "flex",
        flexDirection: "column",
        height: "650px",
        overflow: "hidden",
        border: "1px solid var(--border-glass)"
      }}>
        {/* Quick Prompts Banner */}
        <div style={{
          padding: "0.75rem 1.25rem",
          background: "var(--bg-glass)",
          borderBottom: "1px solid var(--border-glass)",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          overflowX: "auto"
        }}>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap", fontWeight: 600 }}>
            {t("quickPromptsLabel", currentLang)}
          </span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              className="btn btn-secondary"
              style={{
                fontSize: "0.76rem",
                padding: "0.3rem 0.7rem",
                borderRadius: "9999px",
                whiteSpace: "nowrap"
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div style={{
          flex: 1,
          padding: "1.5rem",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem"
        }}>
          {messages.map((msg, idx) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  gap: "0.85rem",
                  flexDirection: isUser ? "row-reverse" : "row",
                  alignItems: "flex-start"
                }}
              >
                {/* Avatar Icon */}
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: isUser
                    ? "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
                    : "linear-gradient(135deg, #10b981 0%, #8b5cf6 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
                }}>
                  {isUser ? <User size={18} color="#fff" /> : <Bot size={18} color="#fff" />}
                </div>

                {/* Message Bubble */}
                <div style={{
                  maxWidth: "82%",
                  background: isUser
                    ? "rgba(59, 130, 246, 0.18)"
                    : "var(--bg-card)",
                  border: isUser
                    ? "1px solid rgba(59, 130, 246, 0.35)"
                    : "1px solid var(--border-glass)",
                  borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                  padding: "1rem 1.25rem",
                  color: "var(--text-main)",
                  fontSize: "0.93rem",
                  lineHeight: 1.6,
                  position: "relative"
                }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.4rem",
                    gap: "1rem"
                  }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: isUser ? "#3b82f6" : "#10b981" }}>
                      {isUser ? (user ? user.full_name : "Farmer") : t("brand", currentLang) + " Assistant"}
                    </span>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {msg.providerUsed && (
                        <span className="badge badge-purple" style={{ fontSize: "0.65rem" }}>
                          {msg.providerUsed}
                        </span>
                      )}
                      <span style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>
                        {msg.time}
                      </span>
                    </div>
                  </div>

                  <div>
                    {isUser ? (
                      <div style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
                    ) : (
                      <MarkdownReport content={msg.text} />
                    )}
                  </div>

                  {!isUser && (
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "0.6rem" }}>
                      <button
                        onClick={() => handleSpeakText(msg.text, idx)}
                        style={{
                          background: "none",
                          border: "none",
                          color: speakingIndex === idx ? "#10b981" : "var(--text-muted)",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem"
                        }}
                      >
                        {speakingIndex === idx ? (
                          <><VolumeX size={13} color="#10b981" /> {t("stopAudio", currentLang)}</>
                        ) : (
                          <><Volume2 size={13} /> {t("listenReport", currentLang)}</>
                        )}
                      </button>

                      <button
                        onClick={() => handleCopyText(msg.text, idx)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem"
                        }}
                      >
                        {copiedIndex === idx ? (
                          <><Check size={12} color="#10b981" /> {t("copied", currentLang)}</>
                        ) : (
                          <><Copy size={12} /> {t("copy", currentLang)}</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #10b981 0%, #8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Bot size={18} color="#fff" />
              </div>

              <div style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-glass)",
                borderRadius: "4px 16px 16px 16px",
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem"
              }}>
                <span className="spinner"></span>
                <span style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
                  Generating response in {LANG_NAME_MAP[currentLang] || "English"}...
                </span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div style={{
          padding: "1rem 1.25rem",
          background: "var(--bg-secondary)",
          borderTop: "1px solid var(--border-glass)"
        }}>
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            style={{ display: "flex", gap: "0.75rem" }}
          >
            <input
              type="text"
              placeholder={isListening ? t("listeningVoice", currentLang) : t("typePlaceholder", currentLang)}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="input-field"
              style={{
                flex: 1,
                padding: "0.85rem 1.2rem",
                border: isListening ? "1px solid #ef4444" : undefined
              }}
            />

            <button
              type="button"
              onClick={handleVoiceInput}
              title="Voice Input"
              style={{
                padding: "0.85rem",
                borderRadius: "12px",
                background: isListening ? "rgba(239, 68, 68, 0.2)" : "var(--bg-glass)",
                border: isListening ? "1px solid #ef4444" : "1px solid var(--border-glass)",
                color: isListening ? "#ef4444" : "var(--text-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="btn btn-primary"
              style={{ padding: "0.85rem 1.4rem" }}
            >
              <Send size={16} /> {t("send", currentLang)}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
