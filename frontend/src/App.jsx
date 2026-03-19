import { useState, useRef } from 'react'
import InputPanel from './components/InputPanel'
import DecisionPanel from './components/DecisionPanel'
import ExecutionPanel from './components/ExecutionPanel'
import BillsPanel from './components/BillsPanel'
import NFTPanel from './components/NFTPanel'
import AssetsPanel from './components/AssetsPanel'
import { analyzeText, runPipeline } from './api'
import { ethers } from 'ethers'
import SubscriptionManager from './contracts/SubscriptionManager.json'

const SEPOLIA_CHAIN_ID = '0xaa36a7' // 11155111 in hex

/* ── Theme Toggle Icon ───────────────────────────────── */
function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}
function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function Header({ isDark, onToggleTheme, account, onConnect, network }) {
  const isCorrectNetwork = network === 'sepolia'
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '1.25rem 2rem', borderBottom: '1px solid var(--border-base)',
      background: 'var(--bg-surface)', position: 'sticky', top: 0, zIndex: 50,
      backdropFilter: 'blur(12px)', transition: 'all 0.4s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <div style={{
          width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px -2px rgba(5,150,105,0.4)',
          color: '#fff', fontSize: '1.2rem',
        }}>
          ⛓️
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, color: 'var(--text-primary)' }}>
            AutoChain
          </h1>
          <div style={{ fontSize: '0.625rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Autonomous Manager
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Wallet Button */}
        <button
          onClick={onConnect}
          className="btn-secondary"
          id="wallet-connect-btn"
          style={{
            fontSize: '0.65rem', padding: '0.4rem 1rem',
            borderColor: account ? 'rgba(16,185,129,0.3)' : 'var(--border-base)',
            color: account ? '#34d399' : 'var(--text-primary)'
          }}
        >
          {account ? `🦊 ${account.slice(0, 6)}...${account.slice(-4)}` : '🦊 Connect Wallet'}
        </button>

        {/* Network Badge */}
        <div style={{
          padding: '0.35rem 0.8rem', borderRadius: '99px',
          border: `1px solid ${isCorrectNetwork ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
          color: isCorrectNetwork ? '#34d399' : '#f87171',
          background: isCorrectNetwork ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
          fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
          display: 'flex', alignItems: 'center', gap: '0.4rem',
        }}>
          <span className={`status-dot ${isCorrectNetwork ? 'status-active' : ''}`} style={{
            width: '0.35rem', height: '0.35rem', borderRadius: '50%',
            background: isCorrectNetwork ? '#34d399' : '#f87171',
            display: 'inline-block',
          }} />
          {account ? (isCorrectNetwork ? 'Sepolia Testnet' : 'Wrong Network') : 'Sepolia Testnet'}
        </div>

        <button className="theme-toggle" onClick={onToggleTheme} aria-label="Toggle Theme">
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </header>
  )
}

/* ── Step Pipeline ───────────────────────────────────── */
function PhaseStepper({ phase }) {
  const steps = [
    { id: 'input',     label: 'Input' },
    { id: 'extract',   label: 'AI Extraction' },
    { id: 'decision',  label: 'AI Decision' },
    { id: 'automation',label: 'Automation Rules' },
    { id: 'executed',  label: 'Blockchain' },
  ]
  const phaseOrder = ['input', 'extract', 'decision', 'automation', 'executed']
  let phaseNum = phaseOrder.indexOf(phase)
  if (phaseNum === -1) phaseNum = 0
  if (phase === 'analyzed') phaseNum = 2

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
      {steps.map((step, i) => {
        const isActive  = i <= phaseNum
        const isCurrent = i === phaseNum
        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{
              padding: '0.4rem 0.8rem', borderRadius: '99px',
              fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em',
              background: isActive ? (isCurrent ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--bg-overlay)') : 'transparent',
              color: isActive ? (isCurrent ? '#fff' : 'var(--text-primary)') : 'var(--text-muted)',
              border: `1px solid ${isActive ? (isCurrent ? 'transparent' : 'var(--border-base)') : 'var(--border-base)'}`,
              boxShadow: isCurrent ? '0 4px 12px rgba(16,185,129,0.3)' : 'none',
              transition: 'all 0.3s ease',
            }}>
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <span style={{
                width: '1.5rem', height: '2px', borderRadius: '2px',
                background: isActive && i < phaseNum ? '#34d399' : 'var(--border-base)',
                transition: 'background 0.4s ease', display: 'block',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Transaction Status Banner ───────────────────────── */
function TxStatusBanner({ status }) {
  if (!status) return null
  const configs = {
    pending:  { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)', color: '#fbbf24', icon: '⏳', text: 'Waiting for MetaMask confirmation...' },
    confirmed:{ bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', color: '#34d399', icon: '✅', text: 'Transaction confirmed on Sepolia!' },
    rejected: { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)', color: '#f87171', icon: '❌', text: 'Transaction rejected by user' },
  }
  const cfg = configs[status]
  if (!cfg) return null
  return (
    <div className="animate-enter" style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.875rem 1.25rem', borderRadius: '1rem',
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      color: cfg.color, fontSize: '0.75rem', fontWeight: 700,
    }}>
      <span style={{ fontSize: '1.1rem' }}>{cfg.icon}</span>
      {cfg.text}
    </div>
  )
}

/* ── Main App ────────────────────────────────────────── */
export default function App() {
  const [isDark, setIsDark]             = useState(true)
  const [phase, setPhase]               = useState('input')   // input | analyzed | executed
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState(null)
  const [logs, setLogs]                 = useState([])
  const [extractedItems, setExtractedItems]   = useState([])
  const [extractionData, setExtractionData]   = useState(null)
  const [executionData, setExecutionData]     = useState(null)
  const [txStatus, setTxStatus]         = useState(null) // pending|confirmed|rejected|null

  // Wallet state
  const [account, setAccount]           = useState(null)
  const [signer, setSigner]             = useState(null)
  const [network, setNetwork]           = useState(null)  // 'sepolia' | 'wrong'
  const [contractAddress, setContractAddress] = useState(
    () => localStorage.getItem('subscription_manager_v3') || null
  )

  const assetsRef = useRef(null)

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, type }])
  }

  /* ── Wallet Connection ────────────────────── */
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('MetaMask not detected! Please install MetaMask to use Sepolia Testnet.')
      return
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const provider = new ethers.BrowserProvider(window.ethereum)
      const net = await provider.getNetwork()

      if (net.chainId !== 11155111n) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: SEPOLIA_CHAIN_ID }],
          })
        } catch (switchErr) {
          addLog('Please switch to Sepolia Testnet in MetaMask.', 'error')
          setNetwork('wrong')
          return
        }
      }

      const _signer = await provider.getSigner()
      setAccount(accounts[0])
      setSigner(_signer)
      setNetwork('sepolia')
      addLog(`Wallet connected: ${accounts[0].slice(0, 8)}...${accounts[0].slice(-4)}`, 'success')
    } catch (e) {
      if (e.code !== 4001) { // 4001 = user rejected
        console.error(e)
        addLog('Wallet connection failed: ' + (e.message || 'Unknown error'), 'error')
      }
    }
  }

  // Auto-reconnect if MetaMask account changes
  if (window.ethereum) {
    window.ethereum.on?.('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        setAccount(null); setSigner(null); setNetwork(null)
      } else {
        setAccount(accounts[0])
      }
    })
    window.ethereum.on?.('chainChanged', () => window.location.reload())
  }

  /* ── Analysis ─────────────────────────────── */
  const handleAnalyze = async (text, autonomousMode) => {
    setLoading(true); setError(null); setPhase('input'); setLogs([])
    addLog('Initiating Deep Analysis block...', 'system')
    try {
      // analyzeText() returns res.data (already unwrapped by api.js)
      // Shape: { status, elapsed_seconds, model_used, extraction: { items, summary }, item_count }
      const res = await analyzeText(text, autonomousMode)
      const extraction = res?.extraction || res || {}
      const items = extraction?.items || []
      addLog(`Extracted ${items.length} financial element${items.length !== 1 ? 's' : ''}.`, 'success')
      setExtractionData(extraction)
      setExtractedItems(items)
      setPhase('analyzed')
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || 'Analysis failed'
      setError(msg)
      addLog('Extraction failed: ' + msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  /* ── Pipeline (Autonomous Mode) ───────────── */
  const handlePipeline = async (text, autonomousMode) => {
    setLoading(true); setError(null); setPhase('input'); setLogs([])
    addLog('Initiating Autonomous Protocol...', 'system')
    try {
      // runPipeline() returns res.data
      // Shape: { status, successful_actions, execution_results, ai_extraction, ... }
      const res = await runPipeline(text, autonomousMode)
      const results = res?.execution_results || res?.results || []
      const successful = res?.successful_actions ?? results.filter(r => r?.blockchain?.success).length
      addLog(`Execution complete. ${successful} action${successful !== 1 ? 's' : ''} executed.`, 'success')
      setExecutionData({
        results,
        successful_actions: successful,
        total_items: results.length,
        network: 'Sepolia Testnet (Real Blockchain)',
        ...(res || {}),
      })
      setPhase('executed')
      assetsRef.current?.fetchAssets?.()
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || 'Pipeline failed'
      setError(msg)
      addLog('Pipeline terminated: ' + msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  /* ── Execute On-Chain ─────────────────────── */
  const handleExecute = async (items) => {
    if (!items || items.length === 0) return

    // Auto-connect wallet if not connected
    if (!signer) {
      addLog('Wallet not connected. Requesting connection...', 'ai')
      await connectWallet()
      // If still no signer after connect attempt, bail
      if (!signer) return
    }

    setLoading(true); setError(null); setTxStatus(null)
    addLog('Initiating On-Chain Protocol (Sepolia)...', 'system')

    try {
      let currentContractAddr = contractAddress

      // 1. Deploy SubscriptionManager contract if not yet deployed
      if (!currentContractAddr) {
        addLog('No active manager found. Deploying SubscriptionManager to Sepolia...', 'ai')
        setTxStatus('pending')
        const factory = new ethers.ContractFactory(
          SubscriptionManager.abi,
          SubscriptionManager.bytecode,
          signer
        )
        const deployedContract = await factory.deploy()
        addLog('Deployment tx sent. Waiting for confirmation...', 'info')
        await deployedContract.waitForDeployment()
        currentContractAddr = await deployedContract.getAddress()
        setContractAddress(currentContractAddr)
        localStorage.setItem('subscription_manager_v3', currentContractAddr)
        addLog(`SubscriptionManager deployed: ${currentContractAddr.slice(0, 10)}...`, 'success')
        setTxStatus('confirmed')
        setTimeout(() => setTxStatus(null), 3000)
      }

      const contract = new ethers.Contract(currentContractAddr, SubscriptionManager.abi, signer)
      const results = []
      let successfulCount = 0

      // Read existing tx log for duplicate checks
      const existingTxLog = JSON.parse(localStorage.getItem('autochain_tx_log') || '[]')

      // 2. Process each item
      for (const item of (items || [])) {
        if (!item) continue
        const itemName = item.name || 'Unknown'
        addLog(`Processing ${itemName}...`, 'info')

        try {
          // Duplicate check (same name + amount combination)
          const isDuplicate = existingTxLog.some(log =>
            log?.name?.toLowerCase() === itemName.toLowerCase() &&
            Math.floor(log?.amount ?? -1) === Math.floor(item.amount ?? 0)
          )

          if (isDuplicate) {
            addLog(`Skipping ${itemName}: Protocol already active for this value.`, 'ai')
            results.push({
              item,
              decision: item.action || 'create_subscription_contract',
              blockchain: {
                success: true,
                message: 'Existing protocol detected — skipped duplicate',
                network: 'Sepolia Testnet (Real Blockchain)',
                contract_address: currentContractAddr,
              }
            })
            successfulCount++
            continue
          }

          const amount   = Math.floor(item.amount ?? 0)
          const duration = Math.floor(
            item.duration ||
            item.contract_params?.duration_months ||
            30
          )

          addLog(`Awaiting MetaMask approval for ${itemName}...`, 'ai')
          setTxStatus('pending')

          const tx = await contract.createSubscription(itemName, amount, duration)
          addLog(`Transaction sent: ${tx.hash.slice(0, 10)}...${tx.hash.slice(-6)}`, 'info')

          const receipt = await tx.wait()
          addLog(`Confirmed in block #${receipt.blockNumber}`, 'success')
          setTxStatus('confirmed')
          setTimeout(() => setTxStatus(null), 3000)

          // Persist to local log for duplicate prevention
          existingTxLog.push({ name: itemName, amount: item.amount, tx: tx.hash })
          localStorage.setItem('autochain_tx_log', JSON.stringify(existingTxLog))

          results.push({
            item,
            decision: item.action || 'create_subscription_contract',
            blockchain: {
              success: true,
              tx_hash: tx.hash,
              block_number: receipt.blockNumber,
              contract_address: currentContractAddr,
              network: 'Sepolia Testnet (Real Blockchain)',
            }
          })
          successfulCount++

        } catch (itemErr) {
          console.error(itemErr)
          // Handle user rejection gracefully
          if (itemErr.code === 'ACTION_REJECTED' || itemErr.code === 4001) {
            addLog(`MetaMask: User rejected transaction for ${itemName}`, 'error')
            setTxStatus('rejected')
            setTimeout(() => setTxStatus(null), 3000)
          } else {
            addLog(`Failed: ${itemName} — ${itemErr.reason || itemErr.message}`, 'error')
          }
          results.push({
            item,
            decision: item.action || 'create_subscription_contract',
            blockchain: {
              success: false,
              error: itemErr.reason || itemErr.message,
              network: 'Sepolia Testnet (Real Blockchain)',
            }
          })
        }
      }

      setExecutionData({
        results,
        successful_actions: successfulCount,
        total_items: (items || []).length,
        network: 'Sepolia Testnet (Real Blockchain)',
        contract_address: currentContractAddr,
      })
      setPhase('executed')

    } catch (e) {
      console.error(e)
      setError(e.message)
      addLog('On-Chain Protocol Terminated: ' + (e.message || 'Unknown error'), 'error')
    } finally {
      setLoading(false)
    }
  }

  /* ── Reset ────────────────────────────────── */
  const handleReset = () => {
    setPhase('input')
    setExtractionData(null)
    setExtractedItems([])
    setExecutionData(null)
    setError(null)
    setLogs([])
    setTxStatus(null)
  }



  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <Header
        isDark={isDark}
        onToggleTheme={() => setIsDark(d => !d)}
        account={account}
        onConnect={connectWallet}
        network={network}
      />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Header / Stepper */}
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 1.25rem 0' }}>
            Transform Text into <span className="text-gradient">Smart Contracts</span>
          </h2>
          <PhaseStepper phase={phase} />
        </div>

        {/* Error Banner */}
        {error && (
          <div className="animate-enter" style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171', padding: '1rem 1.5rem', borderRadius: '1rem',
            textAlign: 'center', fontSize: '0.8rem', fontWeight: 600
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Tx Status Banner */}
        <TxStatusBanner status={txStatus} />

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '2rem', alignItems: 'start' }}>

          {/* Left Column: Interaction */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {phase === 'input' && (
              <InputPanel onAnalyze={handleAnalyze} onPipeline={handlePipeline} isLoading={loading} />
            )}

            {phase === 'analyzed' && (
              <>
                <DecisionPanel
                  items={extractedItems || []}
                  onExecute={handleExecute}
                  isLoading={loading}
                  walletConnected={!!account}
                  onConnectWallet={connectWallet}
                />
                <button
                  onClick={handleReset}
                  className="btn-secondary animate-enter"
                  style={{ width: '100%', padding: '0.875rem', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                >
                  Discard & Restart
                </button>
              </>
            )}

            {phase === 'executed' && (
              <>
                <ExecutionPanel executionData={executionData} />
                <button
                  onClick={handleReset}
                  className="btn-primary animate-enter"
                  style={{ width: '100%', padding: '1rem', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                >
                  New Protocol Session
                </button>
              </>
            )}
          </div>

          {/* Right Column: Assets & Logs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <AssetsPanel ref={assetsRef} contractAddress={contractAddress} account={account} signer={signer} />

            {/* System Feed */}
            {logs.length > 0 && (
              <div className="glass-card animate-enter" style={{ padding: '1.25rem' }}>
                <span className="section-label" style={{ marginBottom: '1rem' }}>System Feed</span>
                <div className="terminal-box" style={{ maxHeight: '16rem', overflowY: 'auto' }}>
                  {logs.map((log, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.6rem', opacity: 0.9 }}>
                      <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{log.time}</span>
                      <span style={{
                        color: log.type === 'error' ? '#f87171'
                          : log.type === 'success' ? '#34d399'
                          : log.type === 'ai' ? '#fbbf24'
                          : log.type === 'system' ? '#a78bfa'
                          : '#60a5fa'
                      }}>
                        {log.msg}
                      </span>
                    </div>
                  ))}
                  {loading && (
                    <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-muted)', animation: 'pulse 1.5s infinite' }}>
                      <span>...</span>
                      <span>Processing block...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer style={{
        borderTop: '1px solid var(--border-base)',
        padding: '2rem 1.5rem',
        textAlign: 'center',
        transition: 'border-color 0.4s ease',
      }}>
        <p style={{
          fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.3em',
          textTransform: 'uppercase', color: 'var(--text-muted)',
        }}>
          AutoChain · Ethereum Sepolia Testnet · 2026
        </p>
      </footer>

    </div>
  )
}
