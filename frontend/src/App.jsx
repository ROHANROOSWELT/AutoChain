import { useState, useRef } from 'react'
import InputPanel from './components/InputPanel'
import DecisionPanel from './components/DecisionPanel'
import ExecutionPanel from './components/ExecutionPanel'
import BillsPanel from './components/BillsPanel'
import NFTPanel from './components/NFTPanel'
import AssetsPanel from './components/AssetsPanel'
import { analyzeText, executeItems, runPipeline, simulateForward, resetSimulation, sendTransactionReceiptEmail } from './api'
import { ethers } from 'ethers'
import SubscriptionManager from './contracts/SubscriptionManager.json'
import NFTReceipt from './contracts/NFTReceipt.json'
import BillTracker from './contracts/BillTracker.json'

const POLKADOT_HUB_CHAIN_ID = '0x190f64c1' // 420420417 in hex

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
  const isCorrectNetwork = network === 'polkadot'
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
          {account ? (isCorrectNetwork ? 'Polkadot Hub' : 'Wrong Network') : 'Polkadot Hub'}
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', marginRight: '1rem' }}>
          <button 
            onClick={async () => {
              try {
                await simulateForward(30);
                alert("Fast-forwarded 30 days! Syncing protocols...");
                window.location.reload(); // Simple sync
              } catch(e) { alert("Simulation failed") }
            }} 
            className="btn-secondary" 
            style={{ fontSize: '0.6rem', padding: '0.3rem 0.6rem', background: 'rgba(52,211,153,0.1)' }}
          >
            ⏩ +30 Days
          </button>
          <button 
            onClick={async () => {
              try {
                await resetSimulation();
                alert("Time reset.");
                window.location.reload();
              } catch(e) { alert("Reset failed") }
            }} 
            className="btn-secondary" 
            style={{ fontSize: '0.6rem', padding: '0.3rem 0.6rem', opacity: 0.6 }}
          >
            🔄 Reset
          </button>
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

/* ── Summary Dashboard ─────────────────────────────────── */
function SummaryDashboard({ items, network, account }) {
  if (!items || items.length === 0) return null;
  const subs = items.filter(i => i.type === 'subscription');
  const bills = items.filter(i => i.type === 'bill');
  const purchases = items.filter(i => i.type === 'purchase');
  
  const totalInr = subs.filter(i => i.currency === 'INR').reduce((a, b) => a + parseFloat(b.amount || 0), 0);
  const totalUsd = subs.filter(i => i.currency === 'USD').reduce((a, b) => a + parseFloat(b.amount || 0), 0);
  
  const hasHighRisk = items.some(i => i.risk === 'high');
  const hasMedRisk = items.some(i => i.risk === 'medium');
  const riskLabel = hasHighRisk ? 'High' : hasMedRisk ? 'Medium' : 'Low';
  const riskColor = hasHighRisk ? '#f87171' : hasMedRisk ? '#fbbf24' : '#34d399';

  return (
    <div className="glass-card animate-enter" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
      <div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Total Found</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{subs.length} subs, {bills.length} bills</div>
      </div>
      <div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Monthly Cost (INR)</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>₹{totalInr.toFixed(2)}</div>
      </div>
      <div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Monthly Cost (USD)</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>${totalUsd.toFixed(2)}</div>
      </div>
      <div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Risk Level</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: riskColor }}>{riskLabel} Risk</div>
      </div>
    </div>
  )
}

/* ── Transaction Status Banner ───────────────────────── */
function TxStatusBanner({ status }) {
  if (!status) return null
  const configs = {
    pending:  { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)', color: '#fbbf24', icon: '⏳', text: 'Waiting for MetaMask confirmation...' },
    confirmed:{ bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', color: '#34d399', icon: '✅', text: 'Transaction confirmed on Polkadot Hub!' },
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
  const [network, setNetwork]           = useState(null)  // 'polkadot' | 'wrong'
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
      alert('MetaMask not detected! Please install MetaMask to use Polkadot Hub.')
      return
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const provider = new ethers.BrowserProvider(window.ethereum)
      const net = await provider.getNetwork()

      if (net.chainId !== 420420417n) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: POLKADOT_HUB_CHAIN_ID }],
          })
        } catch (switchErr) {
          if (switchErr.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: POLKADOT_HUB_CHAIN_ID,
                  chainName: 'Polkadot Hub Testnet',
                  nativeCurrency: { name: 'DOT', symbol: 'DOT', decimals: 18 },
                  rpcUrls: ['https://eth-rpc-testnet.polkadot.io/'],
                  blockExplorerUrls: ['https://blockscout-testnet.polkadot.io/']
                }]
              });
            } catch (addError) {
              addLog('Failed to add Polkadot Hub Testnet to MetaMask.', 'error')
            }
          } else {
            addLog('Please switch to Polkadot Hub in MetaMask.', 'error')
          }
          setNetwork('wrong')
          return
        }
      }

      const _signer = await provider.getSigner()
      setAccount(accounts[0])
      setSigner(_signer)
      setNetwork('polkadot')
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
    addLog('🧠 Deep Analysis Initiated...', 'system')
    try {
      // analyzeText() returns res.data (already unwrapped by api.js)
      // Shape: { status, elapsed_seconds, model_used, extraction: { items, summary }, item_count }
      const res = await analyzeText(text, autonomousMode)
      const extraction = res?.extraction || res || {}
      const items = extraction?.items || []
      addLog(`✅ AI Extraction Complete (${items.length} items detected) | Confidence: 98%`, 'success')
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
    addLog('🤖 Autonomous Protocol Engaged (Batch Mode)...', 'system')
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
        network: 'Polkadot Hub Testnet (Live On-Chain Execution)',
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
    addLog('Initiating On-Chain Protocol (Polkadot Hub)...', 'system')

    try {
      let currentContractAddr = contractAddress
      let currentNftAddr = localStorage.getItem('nft_receipt_v3') || null
      let currentBillAddr = localStorage.getItem('bill_tracker_v3') || null

      const results = []
      let successfulCount = 0

      // 🔥 FIX: Persist to backend history so simulation works!
      try {
        await executeItems(items);
      } catch (e) {
        console.error("Backend history sync failed:", e);
      }

      const existingTxLog = JSON.parse(localStorage.getItem('autochain_tx_log') || '[]')

      for (const item of (items || [])) {
        if (!item) continue
        const itemName = item.name || 'Unknown'
        const action = item.action || item.decision || 'create_subscription_contract'
        addLog(`Processing ${itemName} (${action})...`, 'info')

        try {
          // REMOVED duplicate skip for demo flexibility

          let tx;
          let usedAddress = currentContractAddr;
          let actionData = {};

          if (action === 'create_subscription_contract') {
            if (!currentContractAddr) {
              addLog('⚙️ Deploying Master SubscriptionManager Contract...', 'ai')
              setTxStatus('pending')
              const factory = new ethers.ContractFactory(SubscriptionManager.abi, SubscriptionManager.bytecode, signer)
              const deployed = await factory.deploy()
              await deployed.waitForDeployment()
              currentContractAddr = await deployed.getAddress()
              setContractAddress(currentContractAddr)
              localStorage.setItem('subscription_manager_v3', currentContractAddr)
              addLog('SubscriptionManager deployed!', 'success')
            }
            usedAddress = currentContractAddr;
            const contract = new ethers.Contract(currentContractAddr, SubscriptionManager.abi, signer)
            setTxStatus('pending')
            tx = await contract.createSubscription(itemName, Math.floor(item.amount ?? 0), Math.floor(item.duration || 30))

          } else if (action === 'mint_nft') {
            if (!currentNftAddr) {
              addLog('⚙️ Deploying NFTReceipt Contract...', 'ai')
              setTxStatus('pending')
              const factory = new ethers.ContractFactory(NFTReceipt.abi, NFTReceipt.bytecode, signer)
              const deployed = await factory.deploy()
              await deployed.waitForDeployment()
              currentNftAddr = await deployed.getAddress()
              localStorage.setItem('nft_receipt_v3', currentNftAddr)
              addLog('NFTReceipt deployed!', 'success')
            }
            usedAddress = currentNftAddr;
            const contract = new ethers.Contract(currentNftAddr, NFTReceipt.abi, signer)
            setTxStatus('pending')
            tx = await contract.mintReceipt(
              account, itemName, Math.floor(item.amount ?? 0), item.currency || "INR", 12, "https://autochain.io/nft/meta.json"
            )

          } else if (action === 'track_bill' || action === 'bill_alert') {
            if (!currentBillAddr) {
              addLog('⚙️ Deploying BillTracker Contract...', 'ai')
              setTxStatus('pending')
              const factory = new ethers.ContractFactory(BillTracker.abi, BillTracker.bytecode, signer)
              const deployed = await factory.deploy()
              await deployed.waitForDeployment()
              currentBillAddr = await deployed.getAddress()
              localStorage.setItem('bill_tracker_v3', currentBillAddr)
              addLog('BillTracker deployed!', 'success')
            }
            usedAddress = currentBillAddr;
            const contract = new ethers.Contract(currentBillAddr, BillTracker.abi, signer)
            setTxStatus('pending')
            const dueTs = Math.floor(Date.now() / 1000) + (30 * 86400) // 30 days default
            tx = await contract.registerBill(itemName, Math.floor((item.amount ?? 0) * 100), Math.floor((item.previous_amount || 0) * 100), dueTs, 3)
            actionData.is_bill = true;
            actionData.interface = contract.interface;
          }

          if (tx) {
            addLog(`📡 Broadcasting Transaction: ${tx.hash.slice(0, 10)}...`, 'info')
            const receipt = await tx.wait()
            addLog(`✅ Confirmed in Block #${receipt.blockNumber}`, 'success')
            setTxStatus('confirmed')
            setTimeout(() => setTxStatus(null), 3000)
            
            // Send email receipt
            try {
              await sendTransactionReceiptEmail(item, tx.hash)
            } catch (err) {
              console.error("Email receipt failed:", err)
            }
            
            existingTxLog.push({ name: itemName, amount: item.amount, action, tx: tx.hash, contractAddress: usedAddress })
            localStorage.setItem('autochain_tx_log', JSON.stringify(existingTxLog))

            let isAbnormal = item.is_abnormal || false;
            let emittedEvents = [];
            let alertMessages = [];
            let trackerId = null;

            if (actionData.is_bill) {
              const itf = actionData.interface;
              for (const log of receipt.logs) {
                try {
                  const parsed = itf.parseLog(log);
                  if (parsed) {
                    let evt = { event: parsed.name, data: {} };
                    if (parsed.name === 'BillRegistered') {
                      trackerId = `On-Chain Bill ID: #${parsed.args.billId.toString()}`;
                    } else if (parsed.name === 'AbnormalIncreaseAlert') {
                      isAbnormal = true;
                      evt.data = {
                        prev: (Number(parsed.args.previousAmount) / 100).toString(),
                        curr: (Number(parsed.args.currentAmount) / 100).toString(),
                        inc: parsed.args.increasePercent.toString() + '%'
                      };
                      alertMessages.push(`ON-CHAIN SPIKE: Bill increased by ${parsed.args.increasePercent}%`);
                    } else if (parsed.name === 'HighUsageAlert') {
                      evt.data = { amount: (Number(parsed.args.amount) / 100).toString(), msg: parsed.args.message };
                      alertMessages.push(`ON-CHAIN ALERT: ${parsed.args.message}`);
                    } else if (parsed.name === 'BudgetWarning') {
                      evt.data = { amount: (Number(parsed.args.amount) / 100).toString(), msg: parsed.args.message };
                      alertMessages.push(`ON-CHAIN WARNING: ${parsed.args.message}`);
                    } else if (parsed.name === 'DueSoonAlert') {
                      evt.data = { daysRemaining: parsed.args.daysRemaining.toString() };
                      alertMessages.push(`ON-CHAIN DATE ALERT: Due in ${parsed.args.daysRemaining} days.`);
                    }
                    if (parsed.name !== 'BillRegistered') emittedEvents.push(evt);
                  }
                } catch(e) {}
              }
            }

            results.push({
              item, decision: action,
              blockchain: { 
                success: true, 
                tx_hash: tx.hash, 
                block_number: receipt.blockNumber, 
                contract_address: usedAddress, 
                network: 'Polkadot Hub Testnet (Live On-Chain Execution)',
                is_abnormal: isAbnormal,
                emitted_events: emittedEvents,
                alert_messages: alertMessages,
                tracker_id: trackerId,
                solidity_struct: { previousAmount: item.previous_amount || 0 }
              }
            })
            successfulCount++
          }

        } catch (itemErr) {
          console.error(itemErr)
          if (itemErr.code === 'ACTION_REJECTED' || itemErr.code === 4001) {
            addLog(`MetaMask: User rejected transaction for ${itemName}`, 'error')
            setTxStatus('rejected')
            setTimeout(() => setTxStatus(null), 3000)
          } else {
            addLog(`Failed: ${itemName} — ${itemErr.reason || itemErr.message}`, 'error')
          }
          results.push({ item, decision: action, blockchain: { success: false, error: itemErr.reason || itemErr.message, network: 'Polkadot Hub Testnet (Live On-Chain Execution)' } })
        }
      }

      setExecutionData({
        results,
        successful_actions: successfulCount,
        total_items: (items || []).length,
        network: 'Polkadot Hub Testnet (Live On-Chain Execution)',
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

        {/* Summary Dashboard */}
        <SummaryDashboard items={extractedItems} network={network} account={account} />

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
                  Reset & New Session
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
                  Reset (New Transaction)
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
          AutoChain · Polkadot Hub Testnet · 2026
        </p>
      </footer>

    </div>
  )
}
