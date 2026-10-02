import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, User, Bot, Maximize2, Minimize2, Thermometer, CloudRain, Droplets, Sun, Sprout, Activity } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatMessage } from '../services/api';
import { useAppContext } from '../context/AppContext';

const getBaseComponents = (isMaximized) => ({
  h3: ({node, ...props}) => <h3 className={`font-bold text-slate-900 mb-3 tracking-tight border-b border-slate-100 pb-2 flex items-center ${isMaximized ? 'text-[17px] mt-5' : 'text-[16px] mt-4'}`} {...props} />,
  h4: ({node, ...props}) => <h4 className={`font-bold text-slate-800 mb-2 ${isMaximized ? 'text-[15px] mt-4' : 'text-[14px] mt-3'}`} {...props} />,
  p: ({node, ...props}) => <p className={`mb-3 leading-relaxed text-slate-700 last:mb-0 ${isMaximized ? 'text-[15px]' : 'text-[14.5px]'}`} {...props} />,
  ul: ({node, ...props}) => <ul className={`ml-5 list-disc mb-4 space-y-1.5 text-slate-700 ${isMaximized ? 'text-[15px]' : 'text-[14.5px]'}`} {...props} />,
  ol: ({node, ...props}) => <ol className={`ml-5 list-decimal mb-4 space-y-1.5 text-slate-700 ${isMaximized ? 'text-[15px]' : 'text-[14.5px]'}`} {...props} />,
  li: ({node, ...props}) => <li className="pl-1 marker:text-slate-400" {...props} />,
  strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />,
  em: ({node, ...props}) => <em className="italic text-slate-600" {...props} />,
  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary-300 pl-4 py-1.5 italic text-slate-600 bg-primary-50/50 rounded-r-lg mb-4" {...props} />,
  code: ({node, inline, className, children, ...props}) => {
    const match = /language-(\w+)/.exec(className || '');
    return !inline ? (
      <div className={`overflow-x-auto bg-slate-800 text-slate-50 rounded-xl mb-4 shadow-sm w-full box-border ${isMaximized ? 'p-4' : 'p-3'}`}>
        <code className="text-[13px] font-mono whitespace-pre" {...props}>{children}</code>
      </div>
    ) : (
      <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded-md text-[13px] font-mono border border-slate-200 break-words" {...props}>{children}</code>
    )
  },
  table: ({node, ...props}) => (
    <div className="overflow-x-auto mb-4 border rounded-xl border-slate-200 shadow-sm w-full box-border">
      <table className={`w-full text-left text-slate-700 whitespace-nowrap ${isMaximized ? 'text-[14.5px]' : 'text-[13.5px]'}`} {...props} />
    </div>
  ),
  thead: ({node, ...props}) => <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200" {...props} />,
  th: ({node, ...props}) => <th className="px-4 py-3" {...props} />,
  td: ({node, ...props}) => <td className="px-4 py-3 border-t border-slate-100" {...props} />,
});

const PredictionSummaryCard = ({ body, isMaximized }) => {
  const lines = body.split('\n').map(l => l.replace(/^- /, '').replace(/\*\*/g, '').trim()).filter(Boolean);
  let crop = '', region = '', yieldVal = '';
  lines.forEach(l => {
    if (l.toLowerCase().includes('crop:')) crop = l.split(':')[1]?.trim();
    else if (l.toLowerCase().includes('region:')) region = l.split(':')[1]?.trim();
    else if (l.toLowerCase().includes('yield:')) yieldVal = l.split(':')[1]?.trim();
  });
  
  if (yieldVal) {
    yieldVal = yieldVal.replace(/kg ha⁻¹/g, 'kg/ha').replace(/kg\/ha/g, '').trim();
  }

  return (
    <div className={`bg-primary-50/70 rounded-2xl border border-primary-100/60 mb-2 mt-2 w-full box-border ${isMaximized ? 'p-5' : 'p-4'}`}>
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary-600 mb-4 opacity-80">Prediction Summary</h4>
      <div className={`flex ${isMaximized ? 'flex-row justify-between items-center' : 'flex-col'} gap-4 w-full`}>
        <div className="min-w-0 w-full flex-1">
          <div className="flex items-center space-x-2.5 mb-1.5">
            <span className="text-2xl flex-shrink-0">🌾</span>
            <span className="text-xl font-bold text-slate-800 truncate">{crop || 'Unknown'}</span>
          </div>
          <p className="text-[14px] text-slate-600 flex items-center ml-1 truncate">
            <span className="font-medium mr-1.5 text-slate-500">Region:</span> {region || 'Unknown'}
          </p>
        </div>
        <div className={`bg-white px-5 py-3.5 rounded-xl shadow-sm border border-primary-100/50 text-center box-border ${isMaximized ? 'min-w-[150px]' : 'w-full'}`}>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Predicted Yield</p>
          <p className="text-2xl font-bold text-primary-700 truncate">{yieldVal || 'N/A'} <span className="text-[13px] font-medium text-slate-400">kg/ha</span></p>
        </div>
      </div>
    </div>
  );
};

const getIcon = (key) => {
  const k = key.toLowerCase();
  if (k.includes('temp')) return <Thermometer className="w-5 h-5 text-orange-500" />;
  if (k.includes('rain') || k.includes('precip')) return <CloudRain className="w-5 h-5 text-blue-500" />;
  if (k.includes('humid')) return <Droplets className="w-5 h-5 text-cyan-500" />;
  if (k.includes('sun') || k.includes('light')) return <Sun className="w-5 h-5 text-amber-500" />;
  if (k.includes('moisture')) return <Droplets className="w-5 h-5 text-blue-600" />;
  if (k.includes('ph')) return <Activity className="w-5 h-5 text-purple-500" />;
  if (k.includes('ndvi')) return <Sprout className="w-5 h-5 text-emerald-500" />;
  return <Activity className="w-5 h-5 text-slate-400" />;
};

const MetricsGrid = ({ title, body, type, isMaximized }) => {
  const lines = body.split('\n');
  const items = [];
  const restLines = [];
  
  lines.forEach(l => {
    if (l.trim().startsWith('-')) {
      const text = l.replace(/^- /, '').replace(/\*\*/g, '').trim();
      const splitIdx = text.indexOf(':');
      if (splitIdx > -1) {
        items.push({ key: text.substring(0, splitIdx).trim(), val: text.substring(splitIdx + 1).trim() });
      } else {
        items.push({ key: text, val: '' });
      }
    } else if (l.trim()) {
      restLines.push(l);
    }
  });

  return (
    <div className="mb-2 w-full mt-2 min-w-0 box-border">
      <h4 className="text-[15px] font-bold text-slate-800 mb-4 flex items-center border-b border-slate-100 pb-2">
        <span className="mr-2 text-lg">{type === 'weather' ? '🌦️' : '🌱'}</span> {title}
      </h4>
      {items.length > 0 && (
        <div className={`grid gap-3 mb-4 w-full box-border ${isMaximized ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1'}`}>
          {items.map((item, i) => (
            <div key={i} className={`bg-white border border-slate-200/70 rounded-xl flex items-center space-x-3.5 shadow-sm hover:shadow-md transition-shadow min-w-0 box-border w-full ${isMaximized ? 'p-3.5' : 'p-3'}`}>
              <div className={`p-2 rounded-lg flex-shrink-0 ${type === 'weather' ? 'bg-blue-50' : 'bg-emerald-50'}`}>
                {getIcon(item.key)}
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">{item.key}</p>
                <p className={`font-bold text-slate-800 truncate ${isMaximized ? 'text-[15px]' : 'text-[16px]'}`}>{item.val}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {restLines.length > 0 && (
        <div className="text-[14.5px] text-slate-600 w-full min-w-0 box-border">
          <ReactMarkdown components={getBaseComponents(isMaximized)} remarkPlugins={[remarkGfm]}>{restLines.join('\n')}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

const InterpretationSection = ({ title, body, isMaximized }) => (
  <div className={`bg-amber-50/40 border border-amber-200/60 rounded-2xl mb-2 shadow-sm mt-2 w-full box-border min-w-0 ${isMaximized ? 'p-5' : 'p-4'}`}>
    <h4 className="text-[15px] font-bold text-amber-900 mb-3 flex items-center">
      <span className="mr-2.5 text-lg">💡</span> {title === 'Interpretation' ? 'What this means' : title}
    </h4>
    <div className={`text-amber-900/80 leading-relaxed space-y-3 min-w-0 w-full ${isMaximized ? 'text-[14.5px]' : 'text-[14px]'}`}>
      <ReactMarkdown components={{
        ...getBaseComponents(isMaximized),
        p: ({node, ...props}) => <p className="mb-3 last:mb-0 break-words" {...props} />,
        li: ({node, ...props}) => <li className="pl-1 marker:text-amber-500 break-words" {...props} />
      }} remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
    </div>
  </div>
);

const KeyFactorsSection = ({ title, body, isMaximized }) => (
  <div className="mb-2 mt-2 w-full min-w-0 box-border">
    <h4 className="text-[15px] font-bold text-slate-800 mb-3 flex items-center border-b border-slate-100 pb-2">
      <span className="mr-2 text-lg">🔎</span> Key Factors
    </h4>
    <div className={`bg-slate-50 border border-slate-200/70 rounded-2xl shadow-sm w-full box-border min-w-0 ${isMaximized ? 'p-5' : 'p-4'}`}>
      <div className={`text-slate-700 min-w-0 w-full ${isMaximized ? 'text-[14.5px]' : 'text-[14px]'}`}>
        <ReactMarkdown components={{
          ...getBaseComponents(isMaximized),
          ul: ({node, ...props}) => <ul className="space-y-3 w-full" {...props} />,
          li: ({node, ...props}) => (
            <li className="flex items-start w-full min-w-0">
              <span className="text-primary-500 mr-3 mt-1 text-lg leading-none flex-shrink-0">•</span>
              <div className="flex-1 min-w-0 break-words">{props.children}</div>
            </li>
          )
        }} remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
      </div>
    </div>
  </div>
);

const RecommendationsSection = ({ title, body, isMaximized }) => (
  <div className={`bg-emerald-50/50 border border-emerald-200/60 rounded-2xl mb-2 shadow-sm mt-2 w-full box-border min-w-0 ${isMaximized ? 'p-5' : 'p-4'}`}>
    <h4 className="text-[15px] font-bold text-emerald-900 mb-4 flex items-center">
      <span className="mr-2.5 text-lg">✅</span> Recommended Actions
    </h4>
    <div className={`text-emerald-900/80 min-w-0 w-full ${isMaximized ? 'text-[14.5px]' : 'text-[14px]'}`}>
      <ReactMarkdown components={{
        ...getBaseComponents(isMaximized),
        ol: ({node, ...props}) => <ol className={`space-y-3 list-decimal marker:text-emerald-600 marker:font-bold ${isMaximized ? 'pl-6' : 'pl-5'}`} {...props} />,
        li: ({node, ...props}) => (
          <li className={`bg-white rounded-xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow min-w-0 box-border w-full ${isMaximized ? 'p-3.5 pl-2' : 'p-3 pl-1.5'}`}>
            <span className="block -ml-1 break-words">{props.children}</span>
          </li>
        ),
        ul: ({node, ...props}) => <ul className="space-y-3 w-full" {...props} />,
      }} remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
    </div>
  </div>
);

const ParsedMessage = ({ content, isMaximized }) => {
  if (!content) return null;
  
  if (!content.includes('### ')) {
    return <ReactMarkdown components={getBaseComponents(isMaximized)} remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>;
  }

  const parts = content.split(/(?=### )/);
  
  return (
    <div className={`w-full min-w-0 box-border ${isMaximized ? 'space-y-5' : 'space-y-4'}`}>
      {parts.map((part, idx) => {
        if (!part.trim().startsWith('### ')) {
          return part.trim() ? <ReactMarkdown key={idx} components={getBaseComponents(isMaximized)} remarkPlugins={[remarkGfm]}>{part}</ReactMarkdown> : null;
        }
        
        const lines = part.split('\n');
        const titleLine = lines[0];
        const title = titleLine.replace(/^###\s+/, '').trim();
        const body = lines.slice(1).join('\n').trim();
        const titleLower = title.toLowerCase();

        if (titleLower.includes('prediction summary')) {
          return <PredictionSummaryCard key={idx} body={body} isMaximized={isMaximized} />;
        } else if (titleLower.includes('weather')) {
          return <MetricsGrid key={idx} title={title} body={body} type="weather" isMaximized={isMaximized} />;
        } else if (titleLower.includes('soil')) {
          return <MetricsGrid key={idx} title={title} body={body} type="soil" isMaximized={isMaximized} />;
        } else if (titleLower.includes('interpretation') || titleLower.includes('what this means')) {
          return <InterpretationSection key={idx} title={title} body={body} isMaximized={isMaximized} />;
        } else if (titleLower.includes('key factor')) {
          return <KeyFactorsSection key={idx} title={title} body={body} isMaximized={isMaximized} />;
        } else if (titleLower.includes('recommendation')) {
          return <RecommendationsSection key={idx} title={title} body={body} isMaximized={isMaximized} />;
        } else {
          return (
             <div key={idx} className="w-full mt-2 min-w-0 box-border">
               <h3 className={`font-bold text-slate-900 mb-3 tracking-tight border-b border-slate-100 pb-2 flex items-center ${isMaximized ? 'text-[17px]' : 'text-[16px]'}`}>{title}</h3>
               <ReactMarkdown components={getBaseComponents(isMaximized)} remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
             </div>
          );
        }
      })}
    </div>
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
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

      const contextPayload = Object.keys(context).length > 0 ? context : {};

      const response = await chatMessage({
        message: userMessage,
        context: contextPayload,
        history: messages
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ I couldn\'t connect to the AI service right now. Please try again in a moment.' }]);
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
    "🌾 Explain my prediction",
    "🌦️ Analyze my weather",
    "🌱 Analyze my soil",
    "💡 What should I do next?"
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 p-4 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-transform z-50 ${isOpen ? 'scale-0' : 'scale-100'}`}
        aria-label="Open Chatbot"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      <div className={`fixed bg-[#f8fafc] shadow-2xl flex flex-col transition-all origin-bottom-right z-[100] overflow-hidden ${
        isMaximized 
          ? 'top-0 left-0 w-screen h-screen rounded-none' 
          : 'bottom-2 right-2 sm:bottom-6 sm:right-6 w-[calc(100vw-16px)] sm:w-[470px] max-w-[calc(100vw-16px)] max-h-[85vh] h-[700px] rounded-3xl ring-1 ring-slate-900/5'
      } ${isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-0 opacity-0 pointer-events-none'}`}>
        
        <div className={`flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 bg-primary-600 text-white flex-shrink-0 shadow-sm z-10 w-full box-border`}>
          <div className="flex items-center space-x-3 min-w-0">
            <div className="bg-white/20 p-1.5 rounded-lg flex-shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold leading-none mb-1 text-[15px] tracking-wide truncate">YieldSense AI</h3>
              <p className="text-[11px] text-primary-100 font-medium tracking-wider uppercase leading-none truncate">Agricultural Assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
            <button onClick={() => setIsMaximized(!isMaximized)} className="text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-md" aria-label={isMaximized ? "Minimize" : "Maximize"}>
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-md" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col custom-scrollbar w-full box-border ${isMaximized ? 'p-6' : 'p-4'}`}>
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 my-8 w-full min-w-0">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 rounded-2xl shadow-sm flex items-center justify-center mb-2 transform -rotate-3 flex-shrink-0">
                <Bot className="w-8 h-8 rotate-3" />
              </div>
              <div className="px-4 w-full">
                <h3 className="text-xl font-bold text-slate-800 mb-2 truncate">Hello! I'm YieldSense AI</h3>
                <p className="text-[14.5px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                  I can analyze your crop yields, weather conditions, soil data, and provide personalized agricultural recommendations.
                </p>
              </div>
              <div className={`flex flex-col w-full px-4 ${isMaximized ? 'max-w-xs mt-6 gap-2.5' : 'mt-4 gap-2'}`}>
                {actionChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChipClick(chip.replace(/^[^\s]+\s/, ''))}
                    disabled={isTyping}
                    className="px-4 py-3 bg-white border border-slate-200/80 rounded-xl text-[13.5px] font-semibold text-slate-700 hover:border-primary-300 hover:shadow-sm hover:text-primary-700 transition-all disabled:opacity-50 text-left flex items-center space-x-2 w-full box-border"
                  >
                    <span className="flex-shrink-0">{chip.split(' ')[0]}</span>
                    <span className="truncate">{chip.substring(chip.indexOf(' ') + 1)}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto w-full pb-4 box-border">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex w-full box-border min-w-0 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'user' ? (
                    <div className={`flex flex-col items-end min-w-0 w-full ${isMaximized ? 'max-w-[70%]' : 'max-w-[85%]'}`}>
                      <div className={`bg-primary-600 text-white rounded-2xl rounded-tr-sm text-[15px] leading-relaxed shadow-sm break-words min-w-0 w-full ${isMaximized ? 'px-5 py-3.5' : 'px-4 py-3'}`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ) : (
                    <div className={`flex w-full flex-row items-start min-w-0 box-border ${isMaximized ? 'space-x-4 max-w-[850px]' : 'space-x-3 max-w-full'}`}>
                      <div className={`flex-shrink-0 rounded-full flex items-center justify-center bg-primary-100 text-primary-600 mt-1 shadow-sm border border-primary-200/50 ${isMaximized ? 'w-10 h-10' : 'w-8 h-8'}`}>
                        <Bot className={isMaximized ? 'w-5 h-5' : 'w-4 h-4'} />
                      </div>
                      <div className={`flex-1 bg-white border border-slate-200/80 text-slate-800 rounded-3xl rounded-tl-sm shadow-sm min-w-0 w-full box-border ${isMaximized ? 'p-7' : 'p-4'}`}>
                        <ParsedMessage content={msg.content} isMaximized={isMaximized} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="flex w-full justify-start box-border min-w-0">
                  <div className={`flex w-full flex-row items-start min-w-0 box-border ${isMaximized ? 'space-x-4 max-w-[850px]' : 'space-x-3 max-w-full'}`}>
                    <div className={`flex-shrink-0 rounded-full flex items-center justify-center bg-primary-100 text-primary-600 mt-1 shadow-sm border border-primary-200/50 ${isMaximized ? 'w-10 h-10' : 'w-8 h-8'}`}>
                      <Bot className={isMaximized ? 'w-5 h-5' : 'w-4 h-4'} />
                    </div>
                    <div className={`bg-white border border-slate-200/80 text-slate-800 rounded-3xl rounded-tl-sm shadow-sm flex items-center space-x-3 mt-1 min-w-0 box-border ${isMaximized ? 'px-5 py-4' : 'px-4 py-3'}`}>
                      <span className="text-[14px] font-medium text-slate-500 truncate">Analyzing your farm data</span>
                      <div className="flex space-x-1.5 ml-1 flex-shrink-0">
                        <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} className="h-1 flex-shrink-0 mt-2" />
        </div>

        <div className={`bg-white border-t border-slate-200/80 flex-shrink-0 z-10 w-full box-border ${isMaximized ? 'p-4' : 'p-3 rounded-b-3xl'}`}>
          <div className="max-w-4xl mx-auto w-full">
            <form onSubmit={handleSend} className="relative flex items-end w-full">
              <textarea
                ref={inputRef}
                value={input}
                disabled={isTyping}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isTyping ? "AI is typing..." : "Ask about your crop, soil, weather, or yield..."}
                className={`flex-1 max-h-32 w-full resize-none border border-slate-200 rounded-3xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 bg-[#f8fafc] disabled:bg-slate-50 disabled:text-slate-400 transition-all custom-scrollbar shadow-sm box-border ${isMaximized ? 'py-[15px] pl-5 pr-14 text-[14.5px] min-h-[52px]' : 'py-3 pl-4 pr-12 text-[14px] min-h-[48px]'}`}
                rows={1}
                style={{ height: 'auto', minHeight: isMaximized ? '52px' : '48px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="absolute right-2 bottom-2 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex-shrink-0"
              >
                <Send className="w-5 h-5 ml-0.5" />
              </button>
            </form>
            <div className={`text-center mb-1 w-full truncate ${isMaximized ? 'mt-3' : 'mt-2'}`}>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide truncate">YieldSense AI can make mistakes. Verify agricultural advice.</p>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
