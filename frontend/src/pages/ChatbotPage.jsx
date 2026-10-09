import { useState, useRef, useEffect } from 'react'
import { chatbotAPI } from '../services/api'
import PageBanner from '../components/PageBanner'

const STARTERS = [
  'How can I improve rice yield on loamy soil?',
  'What NPK ratio is best for wheat cultivation?',
  'How does rainfall affect sugarcane yield?',
  'What is the ideal soil pH for maize?',
  'Is drip irrigation better than flood irrigation for cotton?',
  'How does temperature affect crop productivity?',
]

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '14px',
    }}>
      {!isUser && (
        <div style={{
          width: '30px', height: '30px', borderRadius: '50%',
          background: 'var(--primary)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', flexShrink: 0, marginRight: '10px', marginTop: '2px',
        }}>🌿</div>
      )}
      <div style={{
        maxWidth: '80%',
        padding: '11px 16px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser ? 'var(--primary)' : '#fff',
        color: isUser ? '#fff' : 'var(--text-primary)',
        fontSize: '0.875rem',
        lineHeight: 1.6,
        border: isUser ? 'none' : '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        whiteSpace: 'pre-wrap',
      }}>
        {msg.content}
      </div>
      {isUser && (
        <div style={{
          width: '30px', height: '30px', borderRadius: '50%',
          background: '#e5e7eb', color: 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: 700, flexShrink: 0, marginLeft: '10px', marginTop: '2px',
        }}>You</div>
      )}
    </div>
  )
}

export default function ChatbotPage() {
  const [messages, setMessages]   = useState([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const bottomRef                 = useRef(null)
  const inputRef                  = useRef(null)

  // Scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text) {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')

    const userMsg = { role: 'user', content: msg }
    const newHistory = [...messages, userMsg]
    setMessages(newHistory)
    setLoading(true)

    try {
      const res = await chatbotAPI.ask({
        message: msg,
        history: newHistory.slice(-10).map(m => ({ role: m.role, content: m.content })),
      })
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch (e) {
      const errMsg = e.response?.data?.detail || 'Something went wrong. Please try again.'
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ ${errMsg}`,
      }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function clearChat() {
    if (messages.length === 0) return
    if (window.confirm('Clear the conversation? This cannot be undone.')) {
      setMessages([])
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      {/* Header banner */}
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <PageBanner
          icon="🤖"
          title="Agriculture AI Assistant"
          subtitle="Ask general agricultural questions — crop cultivation, soil, nutrients, weather, and more"
          image="/floating-leaves.jpeg"
          objectPosition="center 30%"
          minHeight="95px"
        />
        {!isEmpty && (
          <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>
            <button id="clear-chat-btn" onClick={clearChat}
              style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500 }}>
              Clear Chat
            </button>
          </div>
        )}
      </div>

      {/* Chat area */}
      <div style={{
        flex: 1, overflowY: 'auto',
        background: '#f9fafb', borderRadius: '12px',
        border: '1px solid #e5e7eb', padding: '20px',
        marginBottom: '14px',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Welcome state */}
        {isEmpty && (
          <div style={{ margin: 'auto', textAlign: 'center', maxWidth: '480px', padding: '32px 24px' }}>
            {/* Floating leaves on white — clean minimal accent */}
            <div style={{
              position: 'relative', borderRadius: '16px', overflow: 'hidden',
              height: '130px', marginBottom: '20px',
              background: '#f8fff9',
              border: '1px solid #d1fae5',
              boxShadow: '0 4px 20px rgba(46,125,50,0.08)',
            }}>
              <img
                src="/floating-leaves.jpeg"
                alt=""
                aria-hidden="true"
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%', opacity: 0.88 }}
                onError={e => { e.target.style.display = 'none' }}
              />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '5px' }}>
                <div style={{ fontSize: '1.8rem' }}>🤖</div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#14532d', letterSpacing: '0.01em' }}>Agriculture AI Assistant</div>
                <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 500 }}>Powered by Groq LLM</div>
              </div>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '24px' }}>
              Ask me general questions about crop cultivation, soil health, fertilizer, irrigation, and more.
              I use AI to give you practical, farmer-friendly answers.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {STARTERS.map((s, i) => (
                <button key={i}
                  id={`starter-${i}`}
                  onClick={() => sendMessage(s)}
                  style={{
                    padding: '7px 14px', borderRadius: '999px', fontSize: '0.8rem',
                    border: '1px solid #bbf7d0', background: '#f0fdf4', color: 'var(--primary)',
                    cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s',
                    textAlign: 'left',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((m, i) => <Message key={i} msg={m} />)}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.8rem', paddingLeft: '40px' }}>
            <div className="spinner" />
            <span>Assistant is thinking...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{
        display: 'flex', gap: '10px', alignItems: 'flex-end',
        background: '#fff', border: '1px solid #e5e7eb',
        borderRadius: '12px', padding: '12px 14px',
      }}>
        <textarea
          ref={inputRef}
          id="chatbot-input"
          placeholder="Ask an agricultural question... (Enter to send, Shift+Enter for new line)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          rows={2}
          style={{
            flex: 1, resize: 'none', border: 'none', outline: 'none',
            fontSize: '0.875rem', color: 'var(--text-primary)',
            lineHeight: 1.5, background: 'transparent',
            fontFamily: 'inherit',
          }}
        />
        <button
          id="send-btn"
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="btn btn-primary"
          style={{
            padding: '8px 18px', flexShrink: 0,
            opacity: !input.trim() || loading ? 0.5 : 1,
          }}>
          {loading ? <span className="spinner" /> : 'Send'}
        </button>
      </div>

      {/* Disclaimer */}
      <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', textAlign: 'center', marginTop: '8px', lineHeight: 1.5 }}>
        AI responses are for informational purposes only. Answers may depend on local conditions.
        Do not rely solely on AI for critical farming decisions. Consult a local agronomist.
      </div>
    </div>
  )
}
