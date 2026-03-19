function TxChip({ hash }) {
  const short = hash ? `${hash.slice(0, 10)}...${hash.slice(-6)}` : ''
  
  const handleCopy = () => {
    navigator.clipboard.writeText(hash)
    alert('Hash copied to clipboard!')
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span className="address-chip">{short}</span>
      <button 
        onClick={handleCopy}
        style={{ 
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, 
          fontSize: '0.7rem', color: 'var(--text-muted)' 
        }}
        title="Copy Full Hash"
      >
        📋
      </button>
      {hash.startsWith('0x') && (
        <a 
          href={`https://blockscout-testnet.polkadot.io/tx/${hash}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn-secondary"
          style={{ padding: '0.3rem 0.8rem', fontSize: '0.65rem' }}
        >
          View Transaction 🔗
        </a>
      )}
    </div>
  )
}

function AlertMessages({ messages }) {
  if (!messages || messages.length === 0) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
      {messages.map((msg, i) => (
        <div key={i} className="animate-enter" style={{
          display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
          padding: '0.75rem 1rem', borderRadius: '1rem',
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
          color: 'rgba(251,191,36,0.9)', boxShadow: '0 4px 12px rgba(245,158,11,0.05)',
        }}>
          <span style={{ fontSize: '1rem', flexShrink: 0 }}>🔔</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, lineHeight: 1.5 }}>{msg}</span>
        </div>
      ))}
    </div>
  )
}

function ExecutionCard({ result }) {
  const { item, decision, blockchain, automation } = result
  const success = blockchain?.success
  const typeIcon = { subscription: '🔄', bill: '⚡', purchase: '🛍️' }[item.type] || '📋'

  const actionLabel = {
    create_subscription_contract: 'Contract Deployed',
    deploy_contract: 'Contract Deployed',
    mint_nft: 'NFT Minted',
    track_bill: 'Bill Tracked',
    bill_alert: 'Bill Tracked',
  }[decision] || 'Action Executed'

  const cardBorder = success ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'
  const cardBg     = success ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)'
  const iconBg     = success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'
  const textColor  = success ? '#34d399' : '#f87171'

  return (
    <div className="animate-enter" style={{
      borderRadius: '1.25rem', border: `2px solid ${cardBorder}`, background: cardBg,
      padding: '1.25rem', marginBottom: '1.25rem', position: 'relative', overflow: 'hidden',
      transition: 'border-color 0.3s, transform 0.3s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
            background: iconBg, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '1.25rem',
          }}>
            {typeIcon}
          </div>
          <div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
              {item.name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
              <span style={{ width: '0.35rem', height: '0.35rem', borderRadius: '50%', background: textColor, boxShadow: `0 0 0 3px ${iconBg}` }} />
              <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: textColor }}>
                {success ? actionLabel : 'Protocol Terminated'}
              </span>
            </div>
          </div>
        </div>
        <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
          {blockchain?.network || 'EVM Mainnet'}
        </div>
      </div>

      <AlertMessages messages={blockchain?.alert_messages || automation?.alert_messages} />

      {/* Terminal */}
      {blockchain && (
        <div style={{ marginBottom: '1.25rem', position: 'relative', zIndex: 10 }}>
          <p style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '0.5rem', marginLeft: '0.25rem' }}>
            On-Chain Registry
          </p>
          <div className="terminal-box" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-overlay)' }}>
            {[
              ['TX_HASH',   blockchain.tx_hash && <TxChip hash={blockchain.tx_hash} />],
              ['STMT_ADDR', blockchain.contract_address && <TxChip hash={blockchain.contract_address} />],
              ['TOKEN_ID',  blockchain.token_id  && <span style={{ color: '#34d399', fontWeight: 700 }}>#{blockchain.token_id}</span>],
              ['TRACKER',   blockchain.tracker_id && <span style={{ color: '#34d399', fontWeight: 700 }}>{blockchain.tracker_id}</span>],
              ['BLOCK',     blockchain.block_number && <span style={{ color: 'var(--text-muted)' }}>#{blockchain.block_number}</span>],
            ].filter(([, v]) => !!v).map(([label, val]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.35rem', borderBottom: '1px solid var(--border-base)' }}>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800 }}>{label}</span>
                {val}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', position: 'relative', zIndex: 10 }}>
        {automation?.time_simulation && Object.entries(automation.time_simulation).slice(0, 4).map(([k, v]) => (
          <div key={k} style={{ padding: '0.6rem', borderRadius: '0.75rem', background: 'var(--bg-overlay)', border: '1px solid var(--border-base)' }}>
            <p style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              {k.replace('_', ' ')}
            </p>
            <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>
              {v}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ExecutionPanel({ executionData }) {
  if (!executionData) return null
  const { results = [], successful_actions, total_items, network } = executionData

  return (
    <div className="glass-card animate-enter" style={{ padding: '1.75rem', borderColor: 'rgba(16,185,129,0.12)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <span className="section-label">Step 4 · Finalization</span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            On-Chain Results
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 400 }}>
            {network}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#34d399', letterSpacing: '-0.05em', lineHeight: 1, textShadow: '0 4px 12px rgba(52,211,153,0.2)' }}>
            {successful_actions}/{total_items}
          </div>
          <p style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Status: On-Chain Confirmed
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        height: '0.5rem', borderRadius: '99px', background: 'var(--bg-overlay)',
        marginBottom: '2rem', overflow: 'hidden', padding: '1px', border: '1px solid var(--border-base)',
      }}>
        <div style={{
          height: '100%', borderRadius: '99px',
          background: 'linear-gradient(90deg, #34d399, #10b981)',
          width: `${total_items ? (successful_actions / total_items) * 100 : 0}%`,
          transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 0 12px rgba(16,185,129,0.5)',
        }} />
      </div>

      <div style={{ maxHeight: '36rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
        {results.map((r, i) => <ExecutionCard key={i} result={r} />)}
      </div>
    </div>
  )
}
