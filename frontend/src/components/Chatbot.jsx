import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, User, Bot, Loader2, Maximize2, Minimize2 } from 'lucide-react';
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
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your YieldSense AI assistant. How can I help you with your farming decisions today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const { recentPrediction, analysisState, reportState } = useAppContext();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      // Build context from recent prediction and analysis
      const context = {};
      if (recentPrediction) {
        context.prediction_input = recentPrediction.input;
        context.predicted_yield = recentPrediction.result.predicted_yield_kg_per_hectare;
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

      const response = await chatMessage({
        message: userMessage,
        context: Object.keys(context).length > 0 ? context : null
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

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
          : 'bottom-6 right-6 w-96 max-h-[600px] h-[80vh] rounded-2xl'
      } ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-4 bg-primary-600 text-white flex-shrink-0 ${isMaximized ? '' : 'rounded-t-2xl'}`}>
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <h3 className="font-semibold">AI Assistant</h3>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={() => setIsMaximized(!isMaximized)} className="text-white hover:text-primary-100 transition-colors" aria-label={isMaximized ? "Minimize" : "Maximize"}>
              {isMaximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-primary-100 transition-colors" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex w-full max-w-[85%] md:max-w-3xl ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-primary-100 text-primary-600 ml-2' : 'bg-slate-200 text-slate-600 mr-2'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'}`}>
                  {msg.role === 'user' ? msg.content : formatMessage(msg.content)}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex w-full max-w-[85%] md:max-w-3xl flex-row">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 mr-2">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm rounded-tl-none">
                  <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={`p-4 bg-white border-t border-slate-100 flex-shrink-0 ${isMaximized ? '' : 'rounded-b-2xl'}`}>
          <form onSubmit={handleSend} className="flex items-center space-x-2">
            <input
              type="text"
              value={input}
              disabled={isTyping}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isTyping ? "AI is generating a response..." : "Ask about your farm..."}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-full focus:outline-none focus:border-primary-500 text-sm disabled:bg-slate-50 disabled:text-slate-400 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </>
  );
}
