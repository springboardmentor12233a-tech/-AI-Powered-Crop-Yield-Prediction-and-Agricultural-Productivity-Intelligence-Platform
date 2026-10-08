"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { getToken, getUser } from "@/lib/auth";
import { useLang } from "@/lib/i18n";

const SUGGESTIONS = [
  "Why is my risk level what it is?",
  "What should I fix first in my soil?",
  "Is my predicted yield good for this crop?",
  "What does irrigation frequency mean?",
];

const GREETING = {
  role: "assistant",
  content:
    "Hi! Ask me about your latest prediction, your soil results, or how to use AgriVantage.",
};

export default function AssistantPage() {
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastPrediction, setLastPrediction] = useState(null);
  const bottomRef = useRef(null);
  const router = useRouter();
  const { t, lang } = useLang();

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    if (getUser()?.role === "admin") {
      router.push("/admin");
      return;
    }

    try {
      const raw = localStorage.getItem("last_prediction");
      if (raw) setLastPrediction(JSON.parse(raw));
    } catch {}

    // Keep the conversation when the farmer navigates to another page and back.
    try {
      const saved = sessionStorage.getItem("chat_messages");
      if (saved) setMessages(JSON.parse(saved));
    } catch {}
  }, [router]);

  useEffect(() => {
    if (messages.length > 1) {
      try {
        sessionStorage.setItem("chat_messages", JSON.stringify(messages));
      } catch {}
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text) {
    const message = text.trim();
    if (!message || loading) return;

    // The greeting is UI-only, so it's not sent as part of the conversation.
    const history = messages
      .slice(1)
      .filter((m) => !m.isError)
      .map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ message, history, lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: t("Sorry - {msg}", { msg: t(err.message) }),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([GREETING]);
    try {
      sessionStorage.removeItem("chat_messages");
    } catch {}
  }

  const inputs = lastPrediction?.inputs;
  const result = lastPrediction?.result;

  return (
    <div className="min-h-screen bg-cream-50 flex">
      <Sidebar />
      <div className="flex-1 py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-heading text-4xl font-bold text-charcoal-900 mb-2">
            {t("Assistant")}
          </h1>
          <p className="text-charcoal-900/60 text-lg mb-6">
            {t("Ask questions about your predictions, soil, and fields.")}
          </p>

          <div className="mb-4 rounded-2xl border border-cream-200 bg-white px-4 py-3 text-sm shadow-sm">
            {result ? (
              <p className="text-charcoal-900/70">
                {t("Talking about your latest prediction:")}{" "}
                <span className="font-medium text-charcoal-900">
                  {t(inputs?.crop_type)}, {t(inputs?.region)}, {result.predicted_yield} t/ha
                </span>
                {result.risk_level && (
                  <span className="text-charcoal-900/70">
                    {" "}
                    - {t("{risk} risk", { risk: t(result.risk_level) })}
                  </span>
                )}
              </p>
            ) : (
              <p className="text-charcoal-900/60">
                {t("No recent prediction yet. Run one on Predict Yield and I can explain it.")}
              </p>
            )}
          </div>

          <div className="flex flex-col h-[62vh] min-h-[26rem] bg-white rounded-3xl border border-cream-200 shadow-lg shadow-charcoal-900/5 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 bg-cream-50">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-base leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-lime-400 text-charcoal-900 rounded-br-md"
                        : m.isError
                        ? "bg-red-50 text-red-800 border border-red-200 rounded-bl-md"
                        : "bg-white text-charcoal-900 border border-cream-200 rounded-bl-md"
                    }`}
                  >
                    {m.content === GREETING.content ? t(m.content) : m.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-white border border-cream-200 px-4 py-3 text-base text-charcoal-900/50">
                    {t("Thinking...")}
                  </div>
                </div>
              )}

              {messages.length === 1 && !loading && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(t(s))}
                      className="rounded-full border border-lime-500 bg-lime-300/30 px-4 py-2 text-sm font-medium text-olive-800 hover:bg-lime-300/60 transition-colors"
                    >
                      {t(s)}
                    </button>
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-cream-200 bg-white px-4 py-4">
              <div className="flex items-center gap-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  maxLength={1000}
                  placeholder={t("Ask about your farm...")}
                  className="flex-1 rounded-full border border-cream-200 bg-white px-5 py-3 text-base text-charcoal-900 placeholder:text-charcoal-900/30 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-lime-500"
                />
                <button
                  onClick={() => send(input)}
                  disabled={loading || !input.trim()}
                  className="rounded-full bg-lime-400 px-6 py-3 text-base font-semibold text-charcoal-900 shadow-md hover:bg-lime-500 transition-colors disabled:opacity-50"
                >
                  {t("Send")}
                </button>
              </div>
              {messages.length > 1 && (
                <button
                  onClick={clearChat}
                  className="mt-3 text-xs font-medium text-charcoal-900/50 hover:text-charcoal-900/80"
                >
                  {t("Clear conversation")}
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-charcoal-900/40 mt-3">
            {t("Answers are based on your saved data and this app's dataset, not professional agronomy advice.")}
          </p>
        </div>
      </div>
    </div>
  );
}
