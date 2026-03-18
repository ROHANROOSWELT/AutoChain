// Bill samples for InputPanel
const BILL_SAMPLES = [
  {
    label: "Electricity",
    text: "Electricity bill ₹2800 this month. Last month was ₹1500.",
    icon: "⚡",
  },
  {
    label: "Gas Spike",
    text: "Gas bill ₹1800 this month, was only ₹800 last month.",
    icon: "🔥",
  },
  {
    label: "All Utilities",
    text: "Electricity bill ₹2800, Internet bill ₹999, Mobile bill ₹499, Water bill ₹300 this month.",
    icon: "🏠",
  },
  {
    label: "Maintenance",
    text: "Maintenance bill ₹2500 due in 3 days. Previous was ₹2000.",
    icon: "🔧",
  },
]

function SparkBar({ prev, curr, currency = "INR" }) {
  const sym = currency === "INR" ? "₹" : "$"
  const pct = prev > 0 ? ((curr - prev) / prev) * 100 : 0
  const isSpike = pct > 20
  const barMax = Math.max(curr, prev)
  const prevPct = (prev / barMax) * 100
  const currPct = (curr / barMax) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 w-16 shrink-0">Last mo</span>
        <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
          <div className="h-full bg-slate-600 rounded-full" style={{ width: `${prevPct}%` }} />
        </div>
        <span className="text-xs text-slate-400 w-16 text-right">{sym}{prev}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 w-16 shrink-0">This mo</span>
        <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
          <div className={`h-full rounded-full ${isSpike ? 'bg-red-500' : 'bg-amber-500'}`}
               style={{ width: `${currPct}%` }} />
        </div>
        <span className={`text-xs w-16 text-right font-semibold ${isSpike ? 'text-red-400' : 'text-amber-300'}`}>
          {sym}{curr}
        </span>
      </div>
      <div className={`text-xs font-semibold flex items-center gap-1 ${isSpike ? 'text-red-400' : pct > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
        <span>{pct > 0 ? '↑' : pct < 0 ? '↓' : '→'}</span>
        <span>{Math.abs(pct).toFixed(1)}% {isSpike ? '⚠️ Spike' : 'change'}</span>
      </div>
    </div>
  )
}

function EmittedEventChip({ event }) {
  const colors = {
    AbnormalIncreaseAlert: 'border-red-500/30 bg-red-500/5 text-red-300',
    HighUsageAlert:        'border-amber-500/30 bg-amber-500/5 text-amber-300',
    DueSoonAlert:          'border-orange-500/30 bg-orange-500/5 text-orange-300',
    BudgetWarning:         'border-yellow-500/30 bg-yellow-500/5 text-yellow-300',
  }
  const icons = {
    AbnormalIncreaseAlert: '📈',
    HighUsageAlert:        '💰',
    DueSoonAlert:          '🔔',
    BudgetWarning:         '📊',
  }
  const cls = colors[event.event] || 'border-white/10 bg-white/5 text-slate-300'
  const icon = icons[event.event] || '⚙️'

  return (
    <div className={`rounded-lg border p-2 text-xs ${cls}`}>
      <div className="font-semibold mb-1">{icon} {event.event}</div>
      {event.data && Object.entries(event.data).map(([k, v]) => (
        <div key={k} className="text-slate-400 flex gap-1">
          <span className="shrink-0">{k}:</span>
          <span className="font-medium">{String(v)}</span>
        </div>
      ))}
    </div>
  )
}

function BillCard({ result }) {
  const { item, blockchain, automation } = result
  const hist = blockchain?.historical_comparison || automation?.historical_comparison
  const prevAmt = parseFloat(item.previous_amount || blockchain?.solidity_struct?.previousAmount || 0)
  const currAmt = parseFloat(item.amount || 0)
  const isAbnormal = item.is_abnormal || blockchain?.is_abnormal
  const risk = item.risk || 'normal'

  return (
    <div className={`rounded-xl border p-4 mb-4 animate-enter ${
      isAbnormal ? 'border-red-500/25 bg-red-500/5' :
      risk === 'high' ? 'border-amber-500/25 bg-amber-500/5' :
      'border-white/8 bg-white/3'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <div>
            <h3 className="font-bold text-white">{item.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                isAbnormal ? 'text-red-300 bg-red-500/10 border-red-500/30' :
                risk === 'high' ? 'text-amber-300 bg-amber-500/10 border-amber-500/30' :
                'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
              }`}>
                {isAbnormal ? '🔴 Abnormal' : risk === 'high' ? '🟡 High' : '🟢 Normal'}
              </span>
              {item.dueDate && (
                <span className="text-xs text-slate-500">Due: {item.dueDate}</span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-white">₹{item.amount}</div>
          {blockchain?.tracker_id && (
            <span className="text-xs font-mono text-amber-400">{blockchain.tracker_id}</span>
          )}
        </div>
      </div>

      {/* Alert messages */}
      {blockchain?.alert_messages?.length > 0 && (
        <div className="mb-3 space-y-1">
          {blockchain.alert_messages.map((msg, i) => (
            <div key={i} className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg border ${
              msg.includes('OVERDUE') ? 'bg-red-500/10 border-red-500/20 text-red-200' :
              msg.includes('Spike') ? 'bg-red-500/8 border-red-500/15 text-red-200' :
              'bg-amber-500/10 border-amber-500/20 text-amber-200'
            }`}>
              <span className="shrink-0 mt-0.5">🔔</span>
              <span>{msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Historical comparison bar */}
      {prevAmt > 0 && prevAmt !== currAmt && (
        <div className="mb-3 p-3 rounded-lg bg-black/20 border border-white/5">
          <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Historical Comparison</p>
          <SparkBar prev={prevAmt} curr={currAmt} currency={item.currency} />
          {hist && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-slate-500">Status:</span>
              <span className="text-xs font-semibold">{hist.status}</span>
            </div>
          )}
        </div>
      )}

      {/* Emitted events from BillTracker.sol */}
      {blockchain?.emitted_events?.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wide">
            BillTracker.sol Events ({blockchain.emitted_events.length})
          </p>
          <div className="grid gap-1.5">
            {blockchain.emitted_events.map((ev, i) => (
              <EmittedEventChip key={i} event={ev} />
            ))}
          </div>
        </div>
      )}

      {/* Automation rules */}
      {automation?.rules_applied?.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wide">
            Automation Rules
          </p>
          <div className="rounded-lg bg-black/20 p-2 space-y-1">
            {automation.rules_applied.map((rule, i) => (
              <div key={i} className="flex items-start gap-2 py-1 border-b border-white/5 last:border-0">
                <span className="text-xs shrink-0">{rule.triggered ? '✅' : rule.status === 'monitoring' ? '👁️' : '🕐'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-300">{rule.description}</div>
                  {rule.trigger_date && <div className="text-xs text-slate-500 mt-0.5">Triggers: {rule.trigger_date}</div>}
                </div>
                <span className={`text-xs shrink-0 font-medium ${
                  rule.triggered ? 'text-emerald-400' :
                  rule.status === 'monitoring' ? 'text-amber-400' : 'text-slate-500'
                }`}>{rule.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blockchain info */}
      {blockchain?.tx_hash && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-500">{blockchain.tx_hash?.slice(0, 16)}...</span>
          <span className="text-xs text-slate-500">Block #{blockchain.block_number}</span>
          {blockchain.explorer_url && (
            <a href={blockchain.explorer_url} target="_blank" rel="noopener noreferrer"
               className="text-xs text-brand-400 hover:text-brand-300">View →</a>
          )}
        </div>
      )}
    </div>
  )
}

export default function BillsPanel({ executionData }) {
  if (!executionData?.results) return null

  const billResults = executionData.results.filter(r => r.item.type === 'bill')
  if (billResults.length === 0) return null

  const abnormal = billResults.filter(r => r.item.is_abnormal || r.blockchain?.is_abnormal)
  const highRisk = billResults.filter(r =>
    (r.item.risk === 'high' && !r.item.is_abnormal && !r.blockchain?.is_abnormal)
  )
  const normal   = billResults.filter(r =>
    r.item.risk !== 'high' && !r.item.is_abnormal && !r.blockchain?.is_abnormal
  )

  return (
    <div className="glass-card p-6 animate-enter">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="section-title">Bills Dashboard</p>
          <h2 className="text-xl font-bold text-white">Bill Analysis</h2>
          <p className="text-sm text-slate-500 mt-1">Historical comparison · Due alerts · Spike detection</p>
        </div>
        <div className="flex gap-2">
          {abnormal.length > 0 && (
            <span className="badge bg-red-500/20 text-red-300 border-red-500/30">
              {abnormal.length} spike{abnormal.length > 1 ? 's' : ''}
            </span>
          )}
          {highRisk.length > 0 && (
            <span className="badge badge-bill">{highRisk.length} high</span>
          )}
          <span className="badge bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
            {normal.length} normal
          </span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-lg bg-white/5 p-3 text-center">
          <div className="text-xl font-bold text-red-400">{abnormal.length}</div>
          <div className="text-xs text-slate-500">Spikes</div>
        </div>
        <div className="rounded-lg bg-white/5 p-3 text-center">
          <div className="text-xl font-bold text-amber-400">{highRisk.length}</div>
          <div className="text-xs text-slate-500">High Value</div>
        </div>
        <div className="rounded-lg bg-white/5 p-3 text-center">
          <div className="text-xl font-bold text-emerald-400">{normal.length}</div>
          <div className="text-xs text-slate-500">Normal</div>
        </div>
      </div>

      {/* Bill cards */}
      {billResults.map((r, i) => <BillCard key={i} result={r} />)}
    </div>
  )
}

export { BILL_SAMPLES }
