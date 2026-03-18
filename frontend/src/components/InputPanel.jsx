import { useState } from 'react'

const SAMPLE_INPUTS = [
  {
    label: "Subscriptions",
    icon: "🔄",
    text: "I pay Netflix ₹499/month and Spotify ₹199/month. I also have a GitHub Pro subscription at $4/month and OpenAI ChatGPT Plus for $20/month."
  },
  {
    label: "Bills (Spike)",
    icon: "⚡",
    text: "Electricity bill ₹2800 this month — last month was ₹1500. Gas bill ₹1800, was ₹800 previous month. Internet bill ₹999 same as last month. Mobile bill ₹499."
  },
  {
    label: "Purchase Receipt",
    icon: "🛍️",
    text: "Amazon order placed: Wireless headphones Sony WH-1000XM5, Amount ₹24,999. Order #402-8234932-4392832. Delivered to home address."
  },
  {
    label: "Mixed Data",
    icon: "✨",
    text: "Netflix ₹499/month, Electricity bill ₹2800 this month (was ₹1500 last month). Also bought a new laptop from Amazon for ₹58,000. Spotify ₹199/month renewal next week."
  }
]

export default function InputPanel({ onAnalyze, onPipeline, isLoading }) {
  const [text, setText] = useState('')
  const [autonomousMode, setAutonomousMode] = useState(false)

  const handleAnalyze = () => {
    if (!text.trim()) return
    if (autonomousMode) {
      onPipeline(text, autonomousMode)
    } else {
      onAnalyze(text, autonomousMode)
    }
  }

  return (
    <div className="glass-card p-6 animate-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="section-title">Step 1</p>
          <h2 className="text-xl font-bold text-white">Input Financial Data</h2>
          <p className="text-sm text-slate-500 mt-1">
            Paste emails, receipts, transaction descriptions, or any financial text
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 
                        flex items-center justify-center text-2xl">
          🧠
        </div>
      </div>

      {/* Sample inputs */}
      <div className="mb-4">
        <p className="text-xs text-slate-500 mb-2 font-medium">Quick samples:</p>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_INPUTS.map((s) => (
            <button
              key={s.label}
              onClick={() => setText(s.text)}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <span>{s.icon}</span> {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Text area */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste financial text here...&#10;&#10;Examples:&#10;• Netflix ₹499/month renewal next Monday&#10;• Amazon order: iPhone 15 for ₹79,999&#10;• Electricity bill ₹1,800 due Feb 28"
        rows={7}
        className="w-full bg-black/30 border border-white/8 rounded-xl px-4 py-3 
                   text-sm text-slate-200 placeholder-slate-600 resize-none
                   focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20
                   transition-all duration-200 font-mono leading-relaxed"
      />

      {/* Footer controls */}
      <div className="flex items-center justify-between mt-4">
        {/* Autonomous mode toggle */}
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={autonomousMode}
              onChange={(e) => setAutonomousMode(e.target.checked)}
            />
            <div className={`w-11 h-6 rounded-full transition-all duration-200 ${
              autonomousMode
                ? 'bg-brand-500 shadow-lg shadow-brand-500/30'
                : 'bg-slate-700'
            }`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200 ${
                autonomousMode ? 'left-6' : 'left-1'
              }`} />
            </div>
          </div>
          <div>
            <span className={`text-sm font-medium ${autonomousMode ? 'text-brand-300' : 'text-slate-400'}`}>
              Autonomous Mode
            </span>
            {autonomousMode && (
              <p className="text-xs text-brand-400 animate-fade-in">
                ⚡ AI will analyze and execute automatically
              </p>
            )}
          </div>
        </label>

        {/* Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={isLoading || !text.trim()}
          className="btn-primary"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Processing...
            </>
          ) : (
            <>
              {autonomousMode ? '⚡ Auto-Execute' : '🔍 Analyze'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
