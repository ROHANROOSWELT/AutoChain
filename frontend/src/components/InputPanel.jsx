import { useState } from 'react'

const SAMPLE_INPUTS = [
  { label: 'Subscriptions', icon: '🔄', text: "I pay Netflix ₹499/month and Spotify ₹199/month. I also have a GitHub Pro subscription at $4/month and OpenAI ChatGPT Plus for $20/month." },
  { label: 'Bills (Spike)', icon: '⚡', text: "Electricity bill ₹2800 this month — last month was ₹1500. Gas bill ₹1800, was ₹800 previous month. Internet bill ₹999 same as last month. Mobile bill ₹499." },
  { label: 'Receipt',        icon: '🛍️', text: "Amazon order placed: Wireless headphones Sony WH-1000XM5, Amount ₹24,999. Order #402-8234932-4392832. Delivered to home address." },
  { label: 'Mixed',          icon: '✨', text: "Netflix ₹499/month, Electricity bill ₹2800 this month (was ₹1500 last month). Also bought a new laptop from Amazon for ₹58,000. Spotify ₹199/month renewal next week." },
]

export default function InputPanel({ onAnalyze, onPipeline, isLoading }) {
  const [text, setText] = useState('')
  const [autonomousMode, setAutonomousMode] = useState(false)

  const handleAnalyze = () => {
    if (!text.trim()) return
    autonomousMode ? onPipeline(text, autonomousMode) : onAnalyze(text, autonomousMode)
  }

  return (
    <div className="glass-card animate-enter" style={{ padding: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <span className="section-label">Protocol Entry</span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Financial Input
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.5, fontWeight: 400 }}>
            Paste emails, receipts, or raw transaction text.
          </p>
        </div>
        <div style={{
          width: '2.75rem', height: '2.75rem', borderRadius: '0.875rem', flexShrink: 0,
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
        }}>
          🧠
        </div>
      </div>

      {/* Presets */}
      <div style={{ marginBottom: '1.25rem' }}>
        <span className="section-label">Quick Presets</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {SAMPLE_INPUTS.map((s) => (
            <button
              key={s.label}
              onClick={() => setText(s.text)}
              className="btn-secondary"
              style={{ fontSize: '0.6rem', padding: '0.3rem 0.75rem', letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase' }}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <div style={{ position: 'relative' }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'Paste financial text here...\n\ne.g. "Bought iPhone ₹80,000 today"'}
          rows={6}
          style={{
            width: '100%',
            background: 'var(--input-bg)',
            border: '1px solid var(--input-border)',
            borderRadius: '0.875rem',
            padding: '1rem 1.25rem',
            color: 'var(--text-primary)',
            fontSize: '0.82rem',
            resize: 'none',
            outline: 'none',
            fontFamily: "'JetBrains Mono', monospace",
            lineHeight: 1.65,
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(16,185,129,0.5)'
            e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.08)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--input-border)'
            e.target.style.boxShadow = 'none'
          }}
        />
      </div>

      {/* Footer row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.25rem' }}>
        {/* Autonomous toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', userSelect: 'none' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="checkbox"
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
              checked={autonomousMode}
              onChange={(e) => setAutonomousMode(e.target.checked)}
            />
            <div style={{
              width: '2.75rem', height: '1.5rem', borderRadius: '99px',
              background: autonomousMode ? '#10b981' : 'var(--bg-overlay-hover)',
              border: `1px solid ${autonomousMode ? 'rgba(16,185,129,0.5)' : 'var(--border-base)'}`,
              transition: 'all 0.3s ease',
              position: 'relative',
            }}>
              <div style={{
                width: '1.1rem', height: '1.1rem', borderRadius: '50%', background: '#fff',
                position: 'absolute', top: '0.175rem',
                left: autonomousMode ? '1.45rem' : '0.18rem',
                transition: 'left 0.3s cubic-bezier(0.16,1,0.3,1)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
              }} />
            </div>
          </div>
          <div>
            <span style={{
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: autonomousMode ? '#34d399' : 'var(--text-muted)',
              transition: 'color 0.2s',
            }}>
              Autonomous Mode
            </span>
            {autonomousMode && (
              <p style={{ fontSize: '0.6rem', color: '#34d399', fontWeight: 600, margin: 0, marginTop: '1px', animation: 'pulse 2s ease-in-out infinite' }}>
                ⚡ Agent will execute on-chain
              </p>
            )}
          </div>
        </label>

        {/* Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={isLoading || !text.trim()}
          className="btn-primary"
          style={{ width: '100%', height: '2.75rem', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}
        >
          {isLoading ? (
            <>
              <div style={{
                width: '1rem', height: '1rem', borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                animation: 'spin 0.8s linear infinite',
              }} />
              Syncing...
            </>
          ) : (
            <>{autonomousMode ? '⚡ Run Protocol' : '🔍 Analyze Data'}</>
          )}
        </button>
      </div>
    </div>
  )
}
