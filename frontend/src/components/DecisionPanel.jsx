import React from 'react'

const RISK_CONFIG = {
  low:    { label: 'Low Risk',  color: '#34d399', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)' },
  medium: { label: 'Med Risk',  color: '#fbbf24', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)' },
  high:   { label: 'High Risk', color: '#f87171', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)'  },
  normal: { label: 'Normal',    color: 'var(--text-muted)', bg: 'var(--bg-overlay)', border: 'var(--border-base)' },
}

const ACTION_CONFIG = {
  create_subscription_contract: { icon: '📄', label: 'Deploy Sub Contract', desc: 'Autonomous manager on Sepolia Testnet', color: '#34d399', itemBg: 'rgba(16,185,129,0.04)', itemBorder: 'rgba(16,185,129,0.15)' },
  deploy_contract:               { icon: '📄', label: 'Deploy Contract',     desc: 'Autonomous contract on Sepolia EVM',   color: '#34d399', itemBg: 'rgba(16,185,129,0.04)', itemBorder: 'rgba(16,185,129,0.15)' },
  track_bill:                    { icon: '📊', label: 'Track Bill',          desc: 'Due date + budget alerts',    color: '#fbbf24', itemBg: 'rgba(245,158,11,0.04)', itemBorder: 'rgba(245,158,11,0.15)' },
  bill_alert:                    { icon: '🔔', label: 'Bill Alert',          desc: 'Track with risk alert',       color: '#fbbf24', itemBg: 'rgba(245,158,11,0.04)', itemBorder: 'rgba(245,158,11,0.15)' },
  mint_nft:                      { icon: '🖼️', label: 'Mint NFT Receipt',   desc: 'ERC-721 proof + warranty',    color: '#34d399', itemBg: 'rgba(16,185,129,0.04)',  itemBorder: 'rgba(16,185,129,0.15)' },
}

function RiskBadge({ risk }) {
  const cfg = RISK_CONFIG[risk] || RISK_CONFIG.normal
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
      padding: '0.2rem 0.65rem', borderRadius: '99px', fontSize: '0.6rem',
      fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
      background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
    }}>
      <span style={{ width: '0.35rem', height: '0.35rem', borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
      {cfg.label}
    </span>
  )
}

function Tag({ children }) {
  return (
    <span style={{
      fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
      padding: '0.2rem 0.6rem', borderRadius: '0.4rem',
      background: 'var(--bg-overlay-hover)', border: '1px solid var(--border-base)', color: 'var(--text-muted)',
    }}>
      {children}
    </span>
  )
}

export default function DecisionPanel({ items = [], onExecute, isLoading }) {
  if (!items || items.length === 0) return null

  return (
    <div className="glass-card animate-enter" style={{ padding: '1.75rem', borderColor: 'rgba(245,158,11,0.12)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <span className="section-label">Step 3 · Intelligence</span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Agent Reasoning
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 400 }}>
            Risk-based autonomous action planning
          </p>
        </div>
        <div style={{
          width: '2.75rem', height: '2.75rem', borderRadius: '0.875rem', flexShrink: 0,
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
        }}>
          🤖
        </div>
      </div>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.25rem' }}>
        {items.map((item, i) => {
          const action   = item.action || item.decision || 'create_subscription_contract'
          const cfg      = ACTION_CONFIG[action] || ACTION_CONFIG.create_subscription_contract
          const risk     = item.risk || 'low'
          const duration = item.duration || item.contract_params?.duration_months

          return (
            <div key={i} style={{
              background: cfg.itemBg, border: `1px solid ${cfg.itemBorder}`,
              borderRadius: '1rem', padding: '1.1rem 1.25rem',
              position: 'relative', overflow: 'hidden',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 4px 16px -4px ${cfg.itemBorder}` }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
                    background: 'var(--bg-overlay)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem',
                  }}>
                    {cfg.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: cfg.color }}>
                      {cfg.label}
                    </div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '1px' }}>
                      {cfg.desc}
                    </div>
                  </div>
                </div>
                <span style={{
                  fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)',
                  padding: '0.2rem 0.65rem', borderRadius: '0.5rem',
                  background: 'var(--bg-overlay)', border: '1px solid var(--border-base)',
                  maxWidth: '8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item.name}
                </span>
              </div>

              {/* Risk + tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
                <RiskBadge risk={risk} />
                {duration && <Tag>⏱ {duration}mo</Tag>}
                {item.frequency && item.frequency !== 'one-time' && <Tag>🔄 {item.frequency}</Tag>}
              </div>

              {/* Reasoning */}
              <div style={{
                padding: '0.85rem 1rem', borderRadius: '0.75rem',
                background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
                marginBottom: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem',
              }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#fbbf24' }}>
                  AI Reasoning
                </div>
                {Array.isArray(item.reasoning) ? (
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {item.reasoning.map((r, idx) => (
                      <li key={idx} style={{ marginBottom: idx < item.reasoning.length - 1 ? '0.3rem' : 0 }}>
                        {r}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
                    "{item.reason || item.reasoning}"
                  </p>
                )}
              </div>

              {/* Automation Visibility Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                  Automation Configured
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {item.contract_params && (
                    <>
                      {item.contract_params.auto_cancel && <Tag>🛑 Auto-cancel (after {duration}mo)</Tag>}
                      {item.contract_params.auto_pause_if_inactive && <Tag>⏸️ Auto-pause enabled</Tag>}
                      <Tag>🔔 Renewal alert ({item.contract_params.alert_days_before}d prior)</Tag>
                    </>
                  )}
                  {item.bill_params && (
                    <>
                      <Tag>⚠️ Monitor spike ({item.bill_params.alert_threshold}%)</Tag>
                      {item.bill_params.due_date && <Tag>📅 Track due: {item.bill_params.due_date}</Tag>}
                    </>
                  )}
                  {item.nft_params && (
                    <>
                      <Tag>🖼️ Mint ERC-721 Proof</Tag>
                      <Tag>🛡️ Track Warranty ({item.nft_params.warranty_months}mo)</Tag>
                    </>
                  )}
                </div>
              </div>


            </div>
          )
        })}
      </div>

      {/* Execute button */}
      <button
        onClick={() => onExecute(items)}
        disabled={isLoading}
        className="btn-primary"
        style={{ width: '100%', height: '3rem', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}
      >
        {isLoading ? (
          <>
            <div style={{
              width: '1rem', height: '1rem', borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
              animation: 'spin 0.8s linear infinite',
            }} />
            Syncing to Hub...
          </>
        ) : (
          <>⛓️ Execute {(items || []).length} Protocol Action{(items || []).length > 1 ? 's' : ''}</>
        )}
      </button>
    </div>
  )
}
