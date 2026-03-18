import { useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { getAssets } from '../api'

function ContractCard({ contract }) {
  return (
    <div className="animate-enter" style={{
      borderRadius: '1.25rem', border: '1px solid rgba(16,185,129,0.15)',
      background: 'rgba(16,185,129,0.05)', padding: '1.25rem',
      transition: 'border-color 0.3s, transform 0.3s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
            background: 'rgba(16,185,129,0.1)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem',
          }}>
            📄
          </div>
          <div>
            <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9rem', letterSpacing: '-0.01em' }}>
              {contract.service_name}
            </div>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.1rem' }}>
              Subscription Manager
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <div style={{ width: '0.35rem', height: '0.35rem', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 0 3px rgba(52,211,153,0.2)' }} />
          <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#34d399' }}>
            {contract.status}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0', borderBottom: '1px solid var(--border-base)' }}>
          <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Value</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{contract.currency} {contract.amount}/{contract.frequency}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0', borderBottom: '1px solid var(--border-base)' }}>
          <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Next Renewal</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fbbf24' }}>{contract.lifecycle?.next_renewal}</span>
        </div>
      </div>
      <div className="address-chip" style={{ fontSize: '0.55rem', background: 'var(--bg-overlay)' }}>{contract.contract_address}</div>
    </div>
  )
}

function NFTCard({ nft }) {
  const warranty = nft.warranty_status || {}
  const warrantyState  = warranty.state || 'active'
  const warrantyColor  = warrantyState === 'expired' ? '#f87171' : warrantyState === 'grace_period' ? '#fbbf24' : '#34d399'

  return (
    <div className="animate-enter" style={{
      borderRadius: '1.25rem', border: '1px solid rgba(16,185,129,0.15)',
      background: 'rgba(16,185,129,0.05)', padding: '1.25rem',
      transition: 'border-color 0.3s, transform 0.3s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
            background: 'rgba(16,185,129,0.1)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem',
          }}>
            🖼️
          </div>
          <div>
            <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9rem', letterSpacing: '-0.01em' }}>
              NFT #{nft.token_id}
            </div>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.1rem' }}>
              ERC-721 Receipt
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <div style={{ width: '0.35rem', height: '0.35rem', borderRadius: '50%', background: warrantyColor, boxShadow: `0 0 0 3px ${warrantyColor}33` }} />
          <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: warrantyColor }}>
            {warrantyState.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '1rem' }}>
        {(nft.metadata?.attributes || []).slice(0, 3).map((attr, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0', borderBottom: '1px solid var(--border-base)' }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{attr.trait_type}</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-primary)' }}>{attr.value}</span>
          </div>
        ))}
      </div>

      <div className="address-chip" style={{ fontSize: '0.55rem', background: 'var(--bg-overlay)', marginBottom: '0.75rem' }}>{nft.contract_address}</div>

      {nft.tx_hash && (
        <a
          href={`https://blockscout.polkadot.io/tx/${nft.tx_hash}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            width: '100%', padding: '0.6rem', borderRadius: '0.75rem',
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
            fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em',
            color: '#34d399', textDecoration: 'none', transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'}
        >
          <span>🔗</span> View Explorer
        </a>
      )}
    </div>
  )
}

/* ── Real Sepolia Tx Card (from localStorage) ─── */
function SepoliaTxCard({ tx, contractAddress }) {
  const short = h => h ? `${h.slice(0, 10)}...${h.slice(-6)}` : ''
  const handleCopy = (h) => { navigator.clipboard.writeText(h); }

  return (
    <div className="animate-enter" style={{
      borderRadius: '1rem', border: '1px solid rgba(16,185,129,0.15)',
      background: 'rgba(16,185,129,0.04)', padding: '1rem',
      transition: 'border-color 0.3s, transform 0.3s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem' }}>⛓️</span>
          <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{tx.name}</span>
        </div>
        <span style={{
          fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
          color: '#34d399', padding: '0.15rem 0.5rem', borderRadius: '99px',
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
        }}>On-Chain</span>
      </div>

      {tx.tx && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', width: '4rem', flexShrink: 0 }}>TX</span>
          <span style={{ fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace', color: '#60a5fa' }}>{short(tx.tx)}</span>
          <button onClick={() => handleCopy(tx.tx)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.6rem', color: 'var(--text-muted)', padding: 0 }} title="Copy">📋</button>
          <a href={`https://sepolia.etherscan.io/tx/${tx.tx}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.6rem', textDecoration: 'none' }} title="View on Etherscan">🔗</a>
        </div>
      )}
      {contractAddress && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', width: '4rem', flexShrink: 0 }}>CONTRACT</span>
          <span style={{ fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>{short(contractAddress)}</span>
          <button onClick={() => handleCopy(contractAddress)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.6rem', color: 'var(--text-muted)', padding: 0 }} title="Copy">📋</button>
          <a href={`https://sepolia.etherscan.io/address/${contractAddress}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.6rem', textDecoration: 'none' }} title="View Contract">🔗</a>
        </div>
      )}
    </div>
  )
}

const AssetsPanel = forwardRef(({ contractAddress, account, signer }, ref) => {
  const [assets, setAssets] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sepoliaTxs, setSepoliaTxs] = useState([])

  const fetchAssets = async () => {
    setLoading(true)
    try {
      const data = await getAssets()
      setAssets(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const loadSepoliaTxs = () => {
    try {
      const txLog = JSON.parse(localStorage.getItem('autochain_tx_log') || '[]')
      setSepoliaTxs(Array.isArray(txLog) ? txLog : [])
    } catch {
      setSepoliaTxs([])
    }
  }

  useImperativeHandle(ref, () => ({
    fetchAssets
  }))

  useEffect(() => { fetchAssets(); loadSepoliaTxs() }, [])

  // Re-check localStorage whenever contractAddress changes (new tx added)
  useEffect(() => { loadSepoliaTxs() }, [contractAddress])

  const totalAssets = (assets?.total_contracts || 0) + (assets?.total_nfts || 0)

  return (
    <div className="glass-card" style={{ padding: '1.75rem', borderColor: 'rgba(16,185,129,0.1)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <span className="section-label">Registry Archive</span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Managed Assets
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 400 }}>
            On-chain assets · Ethereum Sepolia Testnet
          </p>
        </div>
        <button
          onClick={fetchAssets}
          disabled={loading}
          style={{
            width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
            background: 'var(--bg-overlay)', border: '1px solid var(--border-base)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
            cursor: 'pointer', transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-overlay-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-overlay)'}
        >
          <span style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}>🔄</span>
        </button>
      </div>

      {/* Real Sepolia On-Chain Transactions from localStorage */}
      {sepoliaTxs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: totalAssets > 0 ? '0' : '0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="section-label">Real Sepolia Transactions</span>
              <span style={{
                fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
                color: '#34d399', padding: '0.15rem 0.5rem', borderRadius: '99px',
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
              }}>
                {sepoliaTxs.length} on-chain
              </span>
            </div>
            {sepoliaTxs.slice().reverse().map((tx, i) => (
              <SepoliaTxCard key={i} tx={tx} contractAddress={contractAddress} />
            ))}
          </div>
        </div>
      )}

      {totalAssets === 0 && sepoliaTxs.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '3rem 1.5rem', borderRadius: '1.25rem',
          border: '2px dashed var(--border-base)', background: 'var(--bg-overlay)',
        }}>
          <div style={{ fontSize: '3rem', opacity: 0.2, marginBottom: '1rem' }}>⛓️</div>
          <p style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
            No Assets Detected
          </p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: 400 }}>
            Connect MetaMask and execute contracts to see on-chain assets here.
          </p>
        </div>
      ) : totalAssets > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Stats Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {[
              ['Contracts', assets?.total_contracts, '#34d399'],
              ['NFTs',      assets?.total_nfts,      '#34d399'],
              ['TX Count',  assets?.total_transactions, '#fbbf24']
            ].map(([l, v, c]) => (
              <div key={l} style={{
                padding: '0.75rem', borderRadius: '1rem',
                background: 'var(--bg-overlay)', border: '1px solid var(--border-base)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: c, letterSpacing: '-0.02em', lineHeight: 1 }}>{v || 0}</div>
                <div style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Simulated Contracts */}
          {(assets?.contracts?.length ?? 0) > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span className="section-label">Active Contracts</span>
              {assets.contracts.map((c, i) => <ContractCard key={i} contract={c} />)}
            </div>
          )}

          {(assets?.nfts?.length ?? 0) > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span className="section-label">Verified Receipts</span>
              {assets.nfts.map((n, i) => <NFTCard key={i} nft={n} />)}
            </div>
          )}

          {/* Historical Feed */}
          {(assets?.transaction_history?.length ?? 0) > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span className="section-label">Historical Log</span>
              <div className="terminal-box" style={{ maxHeight: '12rem', overflowY: 'auto', background: 'var(--bg-overlay)', border: '1px solid var(--border-base)' }}>
                {assets.transaction_history.slice().reverse().map((tx, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-base)' }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800, flexShrink: 0 }}>
                      [{new Date(tx.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}]
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
                        color: tx.type === 'DEPLOY_CONTRACT' ? '#34d399' : tx.type === 'MINT_NFT' ? '#34d399' : '#fbbf24'
                      }}>
                        {(tx.type || '').replace('_', ' ')}
                      </div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginTop: '0.1rem', opacity: 0.6 }}>
                        {tx.tx_hash}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
})

export default AssetsPanel
