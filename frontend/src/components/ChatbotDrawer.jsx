import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  Maximize2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api';

const QUICK_PROMPTS = [
  '🌾 Best fertilizer for Soybean?',
  '🧪 What is the ideal soil pH for Wheat?',
  '🌧️ How does rainfall affect crop yield?',
  '🧠 Explain the ML prediction model',
  '🌱 How to protect cotton from heat stress?',
];

export default function ChatbotDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      message: 'Hello! I am **AgriSense AI**, your agricultural intelligence assistant. Ask me anything about crop cultivation, soil pH, N-P-K fertilizers, weather insights, or ML predictions!',
      suggestions: [
        'What fertilizer is best for Soybean?',
        'What is the optimal soil pH for crops?',
        'Explain the ML prediction model accuracy',
      ],
      created_at: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage = {
      role: 'user',
      message: textToSend,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.role,
        message: m.message,
      }));

      const res = await api.post('/chat', {
        message: textToSend,
        history: historyPayload,
      });

      const botMessage = {
        role: 'assistant',
        message: res.data.reply,
        category: res.data.category,
        suggestions: res.data.suggestions || [],
        created_at: res.data.timestamp || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          message: '⚠️ Sorry, I encountered a temporary issue connecting to the knowledge base. Please check if the server is running and try again.',
          suggestions: ['Explain the ML prediction model', 'What fertilizer is best for Soybean?'],
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        role: 'assistant',
        message: 'Chat history cleared. How can I assist your farming operations today?',
        suggestions: QUICK_PROMPTS.slice(0, 3),
        created_at: new Date().toISOString(),
      },
    ]);
  };

  return (
    <>
      {/* Floating Action Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-700 hover:to-emerald-700 text-white rounded-full shadow-xl shadow-brand-600/25 hover:shadow-brand-600/35 transition-all duration-300 transform hover:-translate-y-0.5 group"
        >
          <div className="relative">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <span className="font-semibold text-sm">Ask AgriSense AI</span>
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-white rounded-3xl border border-[#e3ecd9] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-brand-600 via-brand-700 to-emerald-700 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/15 rounded-2xl backdrop-blur-sm">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  <span>AgriSense AI Assistant</span>
                  <span className="px-1.5 py-0.5 bg-white/20 text-[10px] rounded-full font-medium">v3.0</span>
                </h3>
                <p className="text-[11px] text-emerald-100">Agricultural & Yield Intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Link
                to="/chatbot"
                onClick={() => setIsOpen(false)}
                title="Full Page Assistant"
                className="p-2 text-emerald-100 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <Maximize2 size={16} />
              </Link>
              <button
                onClick={handleClear}
                title="Clear Chat"
                className="p-2 text-emerald-100 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Drawer"
                className="p-2 text-emerald-100 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <ChevronDown size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div key={idx} className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot size={15} />
                    </div>
                  )}

                  <div className={`max-w-[82%] space-y-2`}>
                    <div
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-brand-600 text-white rounded-tr-none shadow-sm'
                          : 'bg-white text-slate-800 rounded-tl-none border border-[#e3ecd9] shadow-sm'
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans">
                        {msg.message}
                      </div>

                      {!isUser && (
                        <div className="flex items-center justify-end gap-2 mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-400">
                          <button
                            onClick={() => handleCopy(msg.message, idx)}
                            className="flex items-center gap-1 hover:text-slate-600 transition-all"
                          >
                            {copiedIdx === idx ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            <span>{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Follow-up suggestions */}
                    {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.suggestions.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSend(sug)}
                            className="px-2.5 py-1 bg-white hover:bg-brand-50 border border-[#e3ecd9] hover:border-brand-300 text-brand-800 text-[11px] rounded-full transition-all text-left shadow-2xs"
                          >
                            💡 {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User size={15} />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                <RefreshCw size={14} className="animate-spin text-brand-600" />
                <span>AgriSense is consulting agronomic models...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto flex gap-1.5 no-scrollbar">
            {QUICK_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSend(p)}
                className="whitespace-nowrap px-2.5 py-1 bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-300 text-slate-600 hover:text-brand-700 text-[11px] font-medium rounded-full transition-all"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-[#e3ecd9] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about crops, soil pH, N-P-K, weather..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl shadow-sm transition-all"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
