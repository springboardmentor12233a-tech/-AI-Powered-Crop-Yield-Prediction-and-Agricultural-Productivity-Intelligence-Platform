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

  useEffect(() => {
    if (externalPrompt) {
      handleSendMessage(externalPrompt);
      onExternalPromptHandled?.();
    }
  }, [externalPrompt, handleSendMessage, onExternalPromptHandled]);

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
      alert("Speech recognition is not supported in your browser. Try Google Chrome or Microsoft Edge.");
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
    <div className="page-container" style={{ maxWidth: "1050px" }}>
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="badge badge-purple">
              <Sparkles size={11} /> Dual AI Engine (Gemini + Groq)
            </span>
            {user && (
              <span className="badge badge-emerald">
                {user.role === "admin" ? `👑 ${t("roleAdmin", currentLang)}` : `🌾 ${t("roleFarmer", currentLang)}`}
              </span>
            )}
          </div>
          <h1 className="page-title">
            {t("aiAssistantTitle", currentLang)}
          </h1>
          <p className="page-subtitle">
            {t("aiAssistantSub", currentLang)}
          </p>
        </div>

        {/* Engine Selector & Clear Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="select-field"
            style={{ width: "auto", fontSize: "0.82rem", padding: "0.45rem 2rem 0.45rem 0.75rem" }}
          >
            <option value="auto">Auto Engine (Gemini + Groq)</option>
            <option value="gemini">Google Gemini 3.8 Flash</option>
            <option value="groq">Groq LLaMA 3.3 70B</option>
          </select>

          <button
            onClick={handleClearChat}
            className="btn btn-secondary"
            style={{ padding: "0.45rem 0.75rem", fontSize: "0.8rem" }}
            title={t("clearChat", currentLang)}
          >
            <RefreshCw size={13} /> {t("clearChat", currentLang)}
          </button>
        </div>
      </div>

      {/* Main Acrylic Chat Container */}
      <div className="fluent-panel" style={{
        display: "flex",
        flexDirection: "column",
        height: "640px",
        overflow: "hidden",
        padding: 0
      }}>
        {/* Quick Prompts Strip */}
        <div style={{
          padding: "0.65rem 1rem",
          background: "var(--bg-inset)",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          overflowX: "auto"
        }}>
          <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", whiteSpace: "nowrap", fontWeight: 600 }}>
            {t("quickPromptsLabel", currentLang)}
          </span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              className="btn btn-ghost"
              style={{
                fontSize: "0.74rem",
                padding: "0.25rem 0.65rem",
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
          padding: "1.25rem",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "1rem"
        }}>
          {messages.map((msg, idx) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  flexDirection: isUser ? "row-reverse" : "row",
                  alignItems: "flex-start"
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "var(--radius-sm)",
                  background: isUser
                    ? "var(--accent-primary)"
                    : "var(--bg-inset)",
                  border: isUser ? "none" : "1px solid var(--border-subtle)",
                  color: isUser ? "#fff" : "var(--accent-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  {isUser ? <User size={16} /> : <Bot size={16} />}
                </div>

                {/* Bubble */}
                <div style={{
                  maxWidth: "80%",
                  background: isUser
                    ? "var(--accent-subtle)"
                    : "var(--bg-surface)",
                  border: isUser
                    ? "1px solid rgba(16, 185, 129, 0.25)"
                    : "1px solid var(--border-subtle)",
                  borderRadius: isUser ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
                  padding: "0.85rem 1.1rem",
                  color: "var(--text-main)",
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
                  position: "relative"
                }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.35rem",
                    gap: "0.85rem"
                  }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: isUser ? "var(--accent-primary)" : "var(--text-muted)" }}>
                      {isUser ? (user ? user.full_name : "Farmer") : t("brand", currentLang) + " Copilot"}
                    </span>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      {msg.providerUsed && (
                        <span className="badge badge-purple" style={{ fontSize: "0.64rem" }}>
                          {msg.providerUsed}
                        </span>
                      )}
                      <span style={{ fontSize: "0.68rem", color: "var(--text-dim)" }}>
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
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "0.5rem" }}>
                      <button
                        onClick={() => handleSpeakText(msg.text, idx)}
                        className="btn btn-ghost"
                        style={{
                          padding: "0.2rem 0.5rem",
                          fontSize: "0.72rem"
                        }}
                      >
                        {speakingIndex === idx ? (
                          <><VolumeX size={12} color="var(--accent-primary)" /> Stop</>
                        ) : (
                          <><Volume2 size={12} /> Audio</>
                        )}
                      </button>

                      <button
                        onClick={() => handleCopyText(msg.text, idx)}
                        className="btn btn-ghost"
                        style={{
                          padding: "0.2rem 0.5rem",
                          fontSize: "0.72rem"
                        }}
                      >
                        {copiedIndex === idx ? (
                          <><Check size={11} color="var(--accent-primary)" /> Copied</>
                        ) : (
                          <><Copy size={11} /> Copy</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-inset)",
                border: "1px solid var(--border-subtle)",
                color: "var(--accent-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Bot size={16} />
              </div>

              <div style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "2px 12px 12px 12px",
                padding: "0.85rem 1.1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.65rem"
              }}>
                <span className="spinner" style={{ width: "12px", height: "12px" }}></span>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Analyzing agronomic context in {LANG_NAME_MAP[currentLang] || "English"}...
                </span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div style={{
          padding: "0.85rem 1.1rem",
          background: "var(--bg-inset)",
          borderTop: "1px solid var(--border-subtle)"
        }}>
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
          >
            <input
              type="text"
              placeholder={isListening ? t("listeningVoice", currentLang) : t("typePlaceholder", currentLang)}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="input-field"
              style={{
                flex: 1,
                padding: "0.65rem 0.95rem",
                borderColor: isListening ? "var(--color-danger)" : undefined
              }}
            />

            <button
              type="button"
              onClick={handleVoiceInput}
              title="Voice Input"
              className="btn btn-secondary"
              style={{
                padding: "0.65rem 0.85rem",
                color: isListening ? "var(--color-danger)" : undefined
              }}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="btn btn-primary"
              style={{ padding: "0.65rem 1.1rem" }}
            >
              <Send size={15} /> {t("send", currentLang)}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
