import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, FarmerProfile, FarmDetails } from '../types';
import { sendChatMessage, fetchChatHistory, clearChatHistory } from '../services/api';

interface AIAssistantTabProps {
  user: FarmerProfile | null;
  farm: FarmDetails | null;
}

export const AIAssistantTab: React.FC<AIAssistantTabProps> = ({ user, farm }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const history = await fetchChatHistory();
        if (history.length > 0) {
          setMessages(history);
        } else {
          // Add default welcome message
          setMessages([
            {
              role: 'assistant',
              content: `Hello ${user?.full_name || 'Farmer'}! 👋 I am your **YieldSense AI Agricultural Advisor**.\n\nI can help you understand your **yield predictions**, explain **crop suitability recommendations**, optimize **fertilizer and soil pH**, or evaluate **farming risk factors** for your ${farm?.land_size || 4.5} ${farm?.land_unit || 'Acres'}.\n\n*What would you like to explore today?*`
            }
          ]);
        }
      } catch {
        // Fallback default message
        setMessages([
          {
            role: 'assistant',
            content: `Hello ${user?.full_name || 'Farmer'}! 👋 I am your **YieldSense AI Agricultural Advisor**.\n\nAsk me any questions about your crops, soil management, or yield improvement strategies.`
          }
        ]);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [user, farm]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    
    // Optimistic UI update
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setLoading(true);

    try {
      const response = await sendChatMessage(userText);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.reply
        }
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ I encountered an issue reaching the agronomic engine. Please check your internet or try again shortly.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (window.confirm('Clear conversation history?')) {
      try {
        await clearChatHistory();
        setMessages([
          {
            role: 'assistant',
            content: `Conversation cleared. How can I assist your farming operations today, ${user?.full_name || 'Farmer'}?`
          }
        ]);
      } catch (err) {
        alert('Failed to clear history.');
      }
    }
  };

  const sampleQuestions = [
    'Why was this specific crop recommended for my farm?',
    'How can I improve my expected yield this season?',
    'What are the best practices for managing my soil pH?',
    'What risks should I watch out for with crop rotation?'
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-5 shadow-md flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xl">🧑‍🌾</span>
            <h1 className="text-xl font-bold">AI Agricultural Assistant</h1>
          </div>
          <p className="text-xs text-emerald-100 mt-1">
            Contextual decision-support grounded on your farm details and ML predictions.
          </p>
        </div>
        <button
          onClick={handleClear}
          className="text-xs font-semibold px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-600 rounded-lg text-emerald-200 transition"
        >
          🗑️ Clear Chat
        </button>
      </div>

      {/* Chat Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col h-[520px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {historyLoading && (
            <div className="text-center text-xs text-slate-400 py-4">Loading conversation history...</div>
          )}

          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-sm'
                }`}
              >
                {/* Format markdown bullet points and bold lines */}
                {m.content.split('\n').map((line, lIdx) => {
                  const trimmed = line.trim();
                  if (!trimmed) return <div key={lIdx} className="h-2"></div>;
                  
                  // Render headers
                  if (trimmed.startsWith('###') || trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 50) {
                    return (
                      <div key={lIdx} className="font-bold text-emerald-700 dark:text-emerald-400 mt-1 mb-0.5">
                        {trimmed.replace(/^###|\*\*/g, '')}
                      </div>
                    );
                  }
                  
                  // Render bullet items
                  if (trimmed.startsWith('-') || trimmed.startsWith('•') || /^\d+\./.test(trimmed)) {
                    return (
                      <div key={lIdx} className="pl-2 flex items-start space-x-1.5 my-0.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{trimmed.replace(/^[-•\d.]\s*/, '')}</span>
                      </div>
                    );
                  }
                  
                  return <p key={lIdx} className="my-0.5">{trimmed}</p>;
                })}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-sm p-4 text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Analyzing agronomic telemetry...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex overflow-x-auto gap-2 no-scrollbar">
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setInputMessage(q)}
              className="text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-600 whitespace-nowrap transition"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Input Form */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask a question about your farm, yield forecast, or soil health..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-sm transition flex items-center space-x-1"
          >
            <span>Send</span>
            <span>➤</span>
          </button>
        </form>
      </div>

      {/* Decision Support Disclaimer */}
      <div className="text-[11px] text-center text-slate-400 dark:text-slate-500 px-4">
        🛡️ <b>Agronomic Decision Support Disclaimer:</b> Recommendations provided by the AI Assistant are intended for informational guidance. Field decisions should account for on-ground local weather and extension officer advice.
      </div>
    </div>
  );
};
