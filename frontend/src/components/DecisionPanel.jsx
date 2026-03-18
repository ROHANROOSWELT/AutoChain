const RISK_CONFIG = {
  low:    { label: 'Low Risk',    color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-400' },
  medium: { label: 'Med Risk',    color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30',     dot: 'bg-amber-400' },
  high:   { label: 'High Risk',   color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30',         dot: 'bg-red-400' },
  normal: { label: 'Normal',      color: 'text-slate-400',   bg: 'bg-slate-500/10 border-slate-500/30',     dot: 'bg-slate-400' },
}

const ACTION_CONFIG = {
  create_subscription_contract: {
    icon: '📄', label: 'Deploy Subscription Contract',
    desc: 'Autonomous SubscriptionManager on Polkadot Hub EVM',
    textColor: 'text-brand-300', borderColor: 'border-brand-500/30', bgColor: 'bg-brand-500/5',
  },
  deploy_contract: {
    icon: '📄', label: 'Deploy Smart Contract',
    desc: 'Autonomous contract on Polkadot Hub EVM',
    textColor: 'text-brand-300', borderColor: 'border-brand-500/30', bgColor: 'bg-brand-500/5',
  },
  track_bill: {
    icon: '📊', label: 'Track Bill On-Chain',
    desc: 'Due date + budget alerts registered',
    textColor: 'text-amber-300', borderColor: 'border-amber-500/30', bgColor: 'bg-amber-500/5',
  },
  bill_alert: {
    icon: '🔔', label: 'Bill Alert',
    desc: 'Track bill with risk alert',
    textColor: 'text-amber-300', borderColor: 'border-amber-500/30', bgColor: 'bg-amber-500/5',
  },
  mint_nft: {
    icon: '🖼️', label: 'Mint NFT Receipt',
    desc: 'ERC-721 proof of ownership + warranty',
    textColor: 'text-emerald-300', borderColor: 'border-emerald-500/30', bgColor: 'bg-emerald-500/5',
  },
}

function RiskBadge({ risk }) {
  const cfg = RISK_CONFIG[risk] || RISK_CONFIG.normal
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

export default function DecisionPanel({ items, onExecute, isLoading }) {
  if (!items || items.length === 0) return null

  return (
    <div className="glass-card p-6 animate-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="section-title">Step 3</p>
          <h2 className="text-xl font-bold text-white">AI Decisions</h2>
          <p className="text-sm text-slate-500 mt-1">Agent reasoning with risk assessment</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl">
          🤖
        </div>
      </div>

      <div className="space-y-4 mb-5">
        {items.map((item, i) => {
          const action = item.action || item.decision || 'create_subscription_contract'
          const cfg = ACTION_CONFIG[action] || ACTION_CONFIG.create_subscription_contract
          const risk = item.risk || 'low'
          const duration = item.duration || item.contract_params?.duration_months

          return (
            <div key={i} className={`rounded-xl border p-4 ${cfg.borderColor} ${cfg.bgColor} animate-enter`}>
              {/* Row 1: action + name */}
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cfg.icon}</span>
                  <div>
                    <div className={`font-bold text-sm ${cfg.textColor}`}>{cfg.label}</div>
                    <div className="text-xs text-slate-500">{cfg.desc}</div>
                  </div>
                </div>
                <span className="text-sm font-semibold text-white">{item.name}</span>
              </div>

              {/* Row 2: risk + duration */}
              <div className="flex items-center gap-2 mt-2 mb-3">
                <RiskBadge risk={risk} />
                {duration && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                    ⏱ {duration} months
                  </span>
                )}
                {item.frequency && item.frequency !== 'one-time' && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400 capitalize">
                    🔄 {item.frequency}
                  </span>
                )}
              </div>

              {/* Reasoning box */}
              <div className="reasoning-box">
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5 shrink-0">💭</span>
                  <p className="text-amber-200 leading-relaxed">{item.reason || item.reasoning}</p>
                </div>
              </div>

              {/* Contract params (subscriptions) */}
              {item.contract_params && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Tag>✓ Auto-cancel</Tag>
                  <Tag>✓ Auto-pause</Tag>
                  <Tag>Alert {item.contract_params.alert_days_before}d before renewal</Tag>
                  <Tag>{item.contract_params.duration_months}mo duration</Tag>
                </div>
              )}

              {/* Bill params */}
              {item.bill_params && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Tag>Alert at {item.bill_params.alert_threshold}% budget</Tag>
                  {item.bill_params.due_date && <Tag>Due: {item.bill_params.due_date}</Tag>}
                </div>
              )}

              {/* NFT params */}
              {item.nft_params && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Tag>🖼️ ERC-721 NFT</Tag>
                  <Tag>Warranty: {item.nft_params.warranty_months} months</Tag>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Execute */}
      <button
        onClick={() => onExecute(items)}
        disabled={isLoading}
        className="btn-primary w-full justify-center text-base py-3.5"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Executing on Polkadot Hub...
          </>
        ) : (
          <>⛓️ Execute {items.length} Blockchain Action{items.length > 1 ? 's' : ''}</>
        )}
      </button>
    </div>
  )
}

function Tag({ children }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/8 text-slate-400">
      {children}
    </span>
  )
}
