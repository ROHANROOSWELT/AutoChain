import { useState, useRef } from 'react'
import './index.css'
import InputPanel from './components/InputPanel'
import ResultsPanel from './components/ResultsPanel'
import DecisionPanel from './components/DecisionPanel'
import ExecutionPanel from './components/ExecutionPanel'
import BillsPanel from './components/BillsPanel'
import NFTPanel from './components/NFTPanel'
import AssetsPanel from './components/AssetsPanel'
import { analyzeText, executeItems, runPipeline } from './api'

function Header() {
  return (
    <header className="border-b border-white/5 bg-dark-900/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 
                          flex items-center justify-center text-base shadow-lg shadow-brand-500/30">
            ⛓️
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-none">AutoChain</h1>
            <p className="text-xs text-slate-500">Autonomous Web2 → Web3 AI Agent</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className="status-dot status-active" />
            Polkadot Hub EVM
          </div>
          <div className="text-xs px-3 py-1 rounded-full border border-brand-500/30 text-brand-300 bg-brand-500/10">
            v1.0 · Hackathon
          </div>
        </div>
      </div>
    </header>
  )
}

function AgentStatusLog({ logs }) {
  if (!logs || logs.length === 0) return null
  return (
    <div className="glass-card p-4 border-brand-500/20">
      <p className="section-title">Agent Activity Log</p>
      <div className="terminal-box max-h-32 overflow-auto">
        {logs.map((log, i) => (
          <div key={i} className="text-xs mb-1 flex items-start gap-2">
            <span className="text-slate-600 shrink-0">[{log.time}]</span>
            <span className={log.type === 'success' ? 'text-emerald-400' :
              log.type === 'error' ? 'text-red-400' :
              log.type === 'ai' ? 'text-brand-400' : 'text-green-400'}>
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [phase, setPhase] = useState('input') // input | analyzed | executed
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [extractionData, setExtractionData] = useState(null)
  const [extractedItems, setExtractedItems] = useState([])
  const [executionData, setExecutionData] = useState(null)
  const [logs, setLogs] = useState([])
  const assetsRef = useRef(null)

  const addLog = (message, type = 'info') => {
    const time = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { time, message, type }])
  }

  const handleAnalyze = async (text, autonomousMode) => {
    setLoading(true)
    setError(null)
    setPhase('input')
    addLog('AI agent started analysis...', 'ai')
    
    try {
      const result = await analyzeText(text, autonomousMode)
      setExtractionData(result.extraction)
      setExtractedItems(result.extraction?.items || [])
      setPhase('analyzed')
      addLog(`Extracted ${result.item_count} item(s) using ${result.model_used}`, 'success')
    } catch (e) {
      const msg = e.response?.data?.detail || e.message || 'Analysis failed'
      setError(msg)
      addLog(`Error: ${msg}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePipeline = async (text, autonomousMode) => {
    setLoading(true)
    setError(null)
    setPhase('input')
    addLog('⚡ Autonomous mode: full pipeline starting...', 'ai')
    
    try {
      const result = await runPipeline(text, autonomousMode)
      setExtractionData(result.ai_extraction)
      setExtractedItems(result.ai_extraction?.items || [])
      setExecutionData({
        results: result.execution_results,
        total_items: result.item_count,
        successful_actions: result.successful_actions,
        network: result.network
      })
      setPhase('executed')
      addLog(`Pipeline complete! ${result.successful_actions}/${result.item_count} actions executed in ${result.elapsed_seconds}s`, 'success')
    } catch (e) {
      const msg = e.response?.data?.detail || e.message || 'Pipeline failed'
      setError(msg)
      addLog(`Error: ${msg}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleExecute = async (items) => {
    setLoading(true)
    setError(null)
    addLog(`Executing ${items.length} blockchain action(s) on Polkadot Hub...`, 'ai')
    
    try {
      const result = await executeItems(items)
      setExecutionData(result)
      setPhase('executed')
      addLog(`✓ ${result.successful_actions}/${result.total_items} actions executed successfully`, 'success')
    } catch (e) {
      const msg = e.response?.data?.detail || e.message || 'Execution failed'
      setError(msg)
      addLog(`Error: ${msg}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setPhase('input')
    setExtractionData(null)
    setExtractedItems([])
    setExecutionData(null)
    setError(null)
    setLogs([])
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full 
                          bg-brand-500/10 border border-brand-500/20 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-xs text-brand-300 font-medium">AI Agent Online · Polkadot Hub EVM</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Your Financial Data,{' '}
            <span className="text-gradient">Automated On-Chain</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            AutoChain reads your Web2 financial text, understands it with AI, and converts 
            subscriptions, bills, and purchases into self-managing blockchain assets.
          </p>
        </div>

        {/* Flow indicator */}
        <div className="flex items-center justify-center gap-2 mb-8 text-xs">
          {['Input', 'AI Extract', 'Decisions', 'Execute', 'Assets'].map((step, i) => {
            const phaseNum = phase === 'input' ? 0 : phase === 'analyzed' ? 2 : 4
            const isActive = i <= phaseNum
            return (
              <div key={step} className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                    : 'bg-white/5 text-slate-600 border border-white/5'
                }`}>
                  {step}
                </span>
                {i < 4 && (
                  <span className={`transition-colors duration-300 ${isActive && i < phaseNum ? 'text-brand-400' : 'text-slate-700'}`}>
                    →
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/5 text-red-300 text-sm flex items-start gap-2 animate-enter">
            <span>⚠️</span>
            <div>
              <strong>Error:</strong> {error}
              <p className="text-xs text-red-400 mt-1">
                Make sure the FastAPI backend is running on http://localhost:8000
              </p>
            </div>
          </div>
        )}

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            <InputPanel
              onAnalyze={handleAnalyze}
              onPipeline={handlePipeline}
              isLoading={loading}
            />
            <AgentStatusLog logs={logs} />
            {phase !== 'input' && (
              <button onClick={handleReset} className="btn-secondary w-full justify-center py-2.5">
                🔄 Reset & Start Over
              </button>
            )}
          </div>

          {/* Middle column */}
          <div className="space-y-6">
            {extractionData && (
              <ResultsPanel extractionData={extractionData} />
            )}
            {phase === 'analyzed' && extractedItems.length > 0 && (
              <DecisionPanel
                items={extractedItems}
                onExecute={handleExecute}
                isLoading={loading}
              />
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6 xl:col-span-1">
            {phase === 'executed' && executionData && (
              <ExecutionPanel executionData={executionData} />
            )}
            {phase === 'executed' && executionData && (
              <NFTPanel executionData={executionData} />
            )}
            {phase === 'executed' && executionData && (
              <BillsPanel executionData={executionData} />
            )}
            <AssetsPanel ref={assetsRef} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-16 py-6 text-center">
        <p className="text-xs text-slate-600">
          AutoChain · Built on Polkadot Hub EVM · AI-Powered Asset Automation
        </p>
      </footer>
    </div>
  )
}
