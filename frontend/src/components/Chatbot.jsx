import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, User, Bot, Maximize2, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatMessage } from '../services/api';
import { useAppContext } from '../context/AppContext';

const formatMessage = (content) => {
  if (!content) return null;
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h3: ({node, ...props}) => <h3 className="font-bold text-slate-900 mt-4 mb-2 text-lg" {...props} />,
        h4: ({node, ...props}) => <h4 className="font-bold text-slate-900 mt-3 mb-1 text-[15px]" {...props} />,
        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
        ul: ({node, ...props}) => <ul className="ml-4 list-disc mb-2 space-y-1" {...props} />,
        ol: ({node, ...props}) => <ol className="ml-4 list-decimal mb-2 space-y-1" {...props} />,
        li: ({node, ...props}) => <li className="my-0.5" {...props} />,
        strong: ({node, ...props}) => <strong className="font-semibold text-slate-900" {...props} />,
        em: ({node, ...props}) => <em className="italic" {...props} />,
        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-slate-300 pl-3 italic text-slate-600 mb-2" {...props} />,
        code: ({node, inline, className, children, ...props}) => {
          const match = /language-(\w+)/.exec(className || '');
          return !inline ? (
            <div className="overflow-x-auto bg-slate-800 text-slate-50 p-3 rounded-md mb-2">
              <code className="text-sm font-mono whitespace-pre" {...props}>{children}</code>
            </div>
          ) : (
            <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
          )
        },
        table: ({node, ...props}) => (
          <div className="overflow-x-auto mb-4 border rounded-lg border-slate-200">
            <table className="w-full text-left text-sm text-slate-700 whitespace-nowrap" {...props} />
          </div>
        ),
        thead: ({node, ...props}) => <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200" {...props} />,
        th: ({node, ...props}) => <th className="px-4 py-2" {...props} />,
        td: ({node, ...props}) => <td className="px-4 py-2 border-t border-slate-100" {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const { recentPrediction, analysisState, reportState } = useAppContext();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Auto-focus input when opened
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, isOpen, isTyping]);

  const sendMessage = async (userMessageText) => {
    if (!userMessageText.trim()) return;

    const userMessage = userMessageText;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      // Build context from recent prediction and analysis
      const context = {};
      if (recentPrediction) {
        context.prediction_input = recentPrediction.input;
        context.predicted_yield = recentPrediction.result?.predicted_yield_kg_per_hectare;
      }
      if (analysisState?.weatherData) {
        context.weather = analysisState.weatherData;
      }
      if (analysisState?.soilData) {
        context.soil = analysisState.soilData;
      }
      if (analysisState?.insightsData) {
        context.summary = analysisState.insightsData.summary;
      }
      if (reportState?.data) {
        context.overall_agricultural_forecasting_summary = reportState.data.overall_agricultural_forecasting_summary;
      }

      // We explicitly make it an object even if empty to avoid `null` serialization bugs with some backend versions
      const contextPayload = Object.keys(context).length > 0 ? context : {};

      const response = await chatMessage({
        message: userMessage,
        context: contextPayload
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
    } catch (error) {
      console.error("Chat error:", error);
      // Give a friendly error message as requested in UX guidelines
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ I couldn\'t connect to the AI service right now. Please check your connection and try again.' }]);
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleChipClick = (text) => {
    sendMessage(text);
  };

  const actionChips = [
    "Explain my yield",
    "Analyze weather",
    "Check soil",
    "Give recommendations"
  ];

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-transform ${isOpen ? 'scale-0' : 'scale-100'}`}
        aria-label="Open Chatbot"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div className={`fixed bg-white shadow-2xl flex flex-col transition-all origin-bottom-right z-[100] ${
        isMaximized 
          ? 'top-0 left-0 w-screen h-screen rounded-none' 
          : 'bottom-6 right-6 w-[24rem] max-h-[650px] h-[85vh] rounded-2xl'
      } ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-4 bg-primary-600 text-white flex-shrink-0 ${isMaximized ? '' : 'rounded-t-2xl'}`}>
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <div>
              <h3 className="font-semibold leading-none mb-1">YieldSense AI</h3>
              <p className="text-xs text-primary-100 leading-none">Agricultural Assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={() => setIsMaximized(!isMaximized)} className="text-white hover:text-primary-100 transition-colors" aria-label={isMaximized ? "Minimize" : "Maximize"}>
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-primary-100 transition-colors" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 relative flex flex-col">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 my-8">
              <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-2">
                <Bot className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Hello! I'm YieldSense AI</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                  I can analyze your crop yields, weather conditions, soil data, and provide personalized agricultural recommendations.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 max-w-xs mt-4">
                {actionChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChipClick(chip)}
                    disabled={isTyping}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 hover:border-primary-500 hover:text-primary-600 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex w-full max-w-[85%] md:max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-primary-100 text-primary-600 ml-2' : 'bg-slate-200 text-slate-600 mr-2'}`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`p-3 rounded-2xl text-[14px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
                      {msg.role === 'user' ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        formatMessage(msg.content)
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex w-full max-w-[85%] flex-row">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 mr-2">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm rounded-tl-none flex items-center space-x-1.5">
                      <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* Input Area */}
        <div className={`p-3 bg-white border-t border-slate-100 flex-shrink-0 ${isMaximized ? '' : 'rounded-b-2xl'}`}>
          <form onSubmit={handleSend} className="relative flex items-end">
            <textarea
              ref={inputRef}
              value={input}
              disabled={isTyping}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isTyping ? "AI is typing..." : "Message YieldSense AI..."}
              className="flex-1 max-h-32 min-h-[44px] w-full resize-none py-2.5 pl-4 pr-12 border border-slate-200 rounded-2xl focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-[14px] bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 transition-all custom-scrollbar"
              rows={1}
              style={{ height: 'auto', minHeight: '44px' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 bottom-2 p-1.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-center mt-2">
            <p className="text-[10px] text-slate-400">YieldSense AI can make mistakes. Verify agricultural advice.</p>
          </div>
        </div>

      </div>
    </>
  );
}
