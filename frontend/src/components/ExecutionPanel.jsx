function TxChip({ hash }) {
  const short = hash ? `${hash.slice(0, 10)}...${hash.slice(-6)}` : ''
  return <span className="address-chip">{short}</span>
}

function AlertMessages({ messages }) {
  if (!messages || messages.length === 0) return null
  return (
    <div className="mb-3 space-y-1">
      {messages.map((msg, i) => (
        <div key={i} className="flex items-start gap-2 text-xs px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200">
          <span className="shrink-0">🔔</span>
          {msg}
        </div>
      ))}
    </div>
  )
}

function TimeSimulation({ sim }) {
  if (!sim) return null
  return (
    <div className="mb-3">
      <p className="text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wide">Time Simulation</p>
      <div className="grid grid-cols-2 gap-1">
        {[
          ['Start',           sim.start_time],
          ['Next Renewal',    sim.next_renewal],
          ['Expiry',          sim.expiry_time],
          ['Days to Renewal', sim.days_until_renewal != null ? `${sim.days_until_renewal}d` : '-'],
          ['Days to Expiry',  sim.days_until_expiry  != null ? `${sim.days_until_expiry}d`  : '-'],
        ].map(([label, val]) => val != null && (
          <div key={label} className="text-xs px-2 py-1 rounded bg-white/5 flex justify-between gap-2">
            <span className="text-slate-500">{label}</span>
            <span className="text-brand-300 font-mono">{val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SolidityStruct({ s }) {
  if (!s) return null
  return (
    <div className="mb-3">
      <p className="text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wide">Contract Struct</p>
      <div className="terminal-box text-xs leading-relaxed">
        <span className="text-purple-400">struct </span>
        <span className="text-blue-300">Subscription</span>
        <span className="text-slate-400"> {'{'}</span>
        {Object.entries(s).map(([k, v]) => (
          <div key={k} className="pl-4">
            <span className="text-green-400">{k}</span>
            <span className="text-slate-500">: </span>
            <span className="text-amber-300">{String(v)}</span>
          </div>
        ))}
        <span className="text-slate-400">{'}'}</span>
      </div>
    </div>
  )
}

function RuleItem({ rule }) {
  const icon = rule.triggered ? '✅' :
    rule.status === 'monitoring' ? '👁️' :
    rule.status === 'scheduled'  ? '🕐' : '⚙️'

  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-white/5 last:border-0">
      <span className="text-sm shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-slate-300">{rule.description}</div>
        {rule.trigger_date && <div className="text-xs text-slate-500 mt-0.5">Triggers: {rule.trigger_date}</div>}
        {rule.triggered && <div className="text-xs text-emerald-400 mt-0.5">▶ Triggered</div>}
      </div>
      <span className={`text-xs shrink-0 font-medium ${
        rule.triggered ? 'text-emerald-400' :
        rule.status === 'monitoring' ? 'text-amber-400' : 'text-slate-500'
      }`}>{rule.status}</span>
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

  return (
    <div className={`rounded-xl border p-5 mb-4 animate-enter ${
      success ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-red-500/25 bg-red-500/5'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{typeIcon}</span>
          <div>
            <h3 className="font-bold text-white">{item.name}</h3>
            <span className={`text-xs font-semibold ${success ? 'text-emerald-400' : 'text-red-400'}`}>
              {success ? `✓ ${actionLabel}` : '✗ Failed'}
            </span>
          </div>
        </div>
        <span className="text-xs text-slate-500">{blockchain?.network}</span>
      </div>

      {/* Alert messages */}
      <AlertMessages messages={blockchain?.alert_messages || automation?.alert_messages} />

      {/* Blockchain details */}
      {blockchain && (
        <div className="mb-4">
          <p className="text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wide">Blockchain</p>
          <div className="terminal-box space-y-1">
            {[
              ['tx_hash',   blockchain.tx_hash && <TxChip hash={blockchain.tx_hash} />],
              ['contract',  blockchain.contract_address && <TxChip hash={blockchain.contract_address} />],
              ['token_id',  blockchain.token_id  && <span className="text-green-400">#{blockchain.token_id}</span>],
              ['tracker',   blockchain.tracker_id && <span className="text-green-400">{blockchain.tracker_id}</span>],
              ['block',     blockchain.block_number && <span className="text-green-400">#{blockchain.block_number}</span>],
              ['explorer',  blockchain.explorer_url && (
                <a href={blockchain.explorer_url} target="_blank" rel="noopener noreferrer"
                   className="text-brand-400 hover:text-brand-300 underline text-xs">View →</a>
              )],
            ].filter(([, v]) => !!v).map(([label, val]) => (
              <div key={label} className="data-row border-0 py-1">
                <span className="text-slate-500">{label}</span>
                {val}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Solidity struct */}
      <SolidityStruct s={blockchain?.solidity_struct} />

      {/* Time simulation (subscriptions) */}
      <TimeSimulation sim={automation?.time_simulation} />

      {/* NFT metadata */}
      {blockchain?.metadata?.attributes?.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wide">NFT Metadata</p>
          <div className="grid grid-cols-2 gap-1">
            {blockchain.metadata.attributes.map((a, i) => (
              <div key={i} className="text-xs py-1 px-2 rounded bg-white/5">
                <span className="text-slate-500">{a.trait_type}: </span>
                <span className="text-slate-300">{a.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Automation rules */}
      {automation?.rules_applied?.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wide">
            Automation Rules ({automation.rules_applied.length})
          </p>
          <div className="rounded-lg bg-black/20 p-3">
            {automation.rules_applied.map((r, i) => <RuleItem key={i} rule={r} />)}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ExecutionPanel({ executionData }) {
  if (!executionData) return null
  const { results = [], successful_actions, total_items, network } = executionData

  return (
    <div className="glass-card p-6 animate-enter">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="section-title">Step 4</p>
          <h2 className="text-xl font-bold text-white">Execution Results</h2>
          <p className="text-sm text-slate-500 mt-1">{network}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-emerald-400">{successful_actions}/{total_items}</div>
          <div className="text-xs text-slate-500">Actions Executed</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/5 rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-brand-500 rounded-full transition-all duration-700"
          style={{ width: `${total_items ? (successful_actions / total_items) * 100 : 0}%` }}
        />
      </div>

      {results.map((r, i) => <ExecutionCard key={i} result={r} />)}
    </div>
  )
}
