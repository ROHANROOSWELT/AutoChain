const TYPE_CONFIG = {
  subscription: {
    icon: '🔄',
    color: 'violet',
    label: 'Subscription',
    bgClass: 'bg-violet-500/5 border-violet-500/20',
    headerClass: 'text-violet-300',
    badgeClass: 'badge-subscription',
  },
  bill: {
    icon: '⚡',
    color: 'amber',
    label: 'Bill',
    bgClass: 'bg-amber-500/5 border-amber-500/20',
    headerClass: 'text-amber-300',
    badgeClass: 'badge-bill',
  },
  purchase: {
    icon: '🛍️',
    color: 'emerald',
    label: 'Purchase',
    bgClass: 'bg-emerald-500/5 border-emerald-500/20',
    headerClass: 'text-emerald-300',
    badgeClass: 'badge-purchase',
  },
}

const DECISION_LABELS = {
  deploy_contract: { icon: '📄', label: 'Deploy Smart Contract', color: 'text-brand-300' },
  create_subscription_contract: { icon: '📄', label: 'Deploy Subscription Contract', color: 'text-brand-300' },
  track_bill: { icon: '📊', label: 'Track Bill On-Chain', color: 'text-amber-300' },
  bill_alert: { icon: '📊', label: 'Track Bill On-Chain', color: 'text-amber-300' },
  mint_nft: { icon: '🖼️', label: 'Mint NFT Receipt', color: 'text-emerald-300' },
}

function ItemCard({ item }) {
  const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.subscription
  const decision = DECISION_LABELS[item.decision] || { icon: '⚙️', label: item.decision, color: 'text-slate-300' }

  return (
    <div className={`rounded-xl border p-4 mb-3 animate-enter ${config.bgClass}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{config.icon}</span>
          <div>
            <h3 className={`font-bold text-base ${config.headerClass}`}>{item.name}</h3>
            <span className={`badge ${config.badgeClass}`}>{config.label}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-white">
            {item.currency === 'INR' ? '₹' : '$'}{item.amount}
          </div>
          {item.frequency && item.frequency !== 'one-time' && (
            <div className="text-xs text-slate-500">/{item.frequency}</div>
          )}
        </div>
      </div>

      {/* Decision */}
      <div className="flex items-center gap-2 py-2 border-t border-white/5">
        <span className="text-sm">{decision.icon}</span>
        <div>
          <span className={`text-sm font-semibold ${decision.color}`}>{decision.label}</span>
        </div>
      </div>
    </div>
  )
}

export default function ResultsPanel({ extractionData }) {
  if (!extractionData) return null

  const { items = [], summary, autonomous_recommended } = extractionData
  const counts = {
    subscription: items.filter(i => i.type === 'subscription').length,
    bill: items.filter(i => i.type === 'bill').length,
    purchase: items.filter(i => i.type === 'purchase').length,
  }

  return (
    <div className="glass-card p-6 animate-enter">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="section-title">Step 2</p>
          <h2 className="text-xl font-bold text-white">Extracted Data</h2>
        </div>
        <div className="flex gap-2">
          {counts.subscription > 0 && (
            <span className="badge badge-subscription">{counts.subscription} sub</span>
          )}
          {counts.bill > 0 && (
            <span className="badge badge-bill">{counts.bill} bill</span>
          )}
          {counts.purchase > 0 && (
            <span className="badge badge-purchase">{counts.purchase} item</span>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="mb-4 p-3 rounded-lg bg-brand-500/5 border border-brand-500/20">
        <p className="text-sm text-brand-200">{summary}</p>
        {autonomous_recommended && (
          <p className="text-xs text-brand-400 mt-1">✓ Autonomous execution recommended</p>
        )}
      </div>

      {/* Items */}
      <div>
        {items.map((item, i) => (
          <ItemCard key={i} item={item} />
        ))}
      </div>
    </div>
  )
}
