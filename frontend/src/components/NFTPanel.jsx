import { useState } from 'react'

// ─── Warranty progress bar ────────────────────────────────────────────────
function WarrantyBar({ warrantyStatus }) {
  if (!warrantyStatus) return null
  const { state, days_remaining, warranty_months, expiry_date } = warrantyStatus
  const totalDays = (warranty_months || 12) * 30
  const elapsed   = Math.max(0, totalDays - (days_remaining || 0))
  const pct       = Math.min(100, Math.round((elapsed / totalDays) * 100))

  const barColor =
    state === 'expired'     ? '#ef4444' :
    state === 'grace_period'? '#f59e0b' : '#10b981'

  const stateLabel =
    state === 'expired'     ? '🔴 Expired' :
    state === 'grace_period'? '🟡 Grace Period' : '🟢 Active'

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-slate-400 font-medium">Warranty Timeline</span>
        <span className="text-xs font-semibold" style={{ color: barColor }}>{stateLabel}</span>
      </div>
      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-slate-600">Purchase</span>
        <span className="text-[10px] text-slate-500">
          {days_remaining > 0 ? `${days_remaining}d left` : 'Expired'}
          {expiry_date ? ` · Expires ${expiry_date}` : ''}
        </span>
        <span className="text-[10px] text-slate-600">Expiry</span>
      </div>
    </div>
  )
}

// ─── NFT Hero Card ────────────────────────────────────────────────────────
function NFTHeroCard({ result }) {
  const blockchain = result.blockchain || {}
  const automation = result.automation || {}
  const item       = result.item || {}

  const tokenId   = blockchain.token_id
  const itemName  = item.name || 'Purchase'
  const amount    = item.amount || '0'
  const currency  = item.currency || 'INR'
  const symbol    = currency === 'INR' ? '₹' : '$'
  const txHash    = blockchain.tx_hash || ''
  const ownerWallet = blockchain.owner_wallet || blockchain.contract_address || ''
  const ownershipId = blockchain.ownership_id || ''
  const warrantyStatus = blockchain.warranty_status
  const explorerUrl = blockchain.explorer_url || '#'
  const mintedAt  = blockchain.minted_at || new Date().toISOString()

  return (
    <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/40 via-slate-900/60 to-teal-950/40 p-5 mb-4 animate-enter relative overflow-hidden">
      {/* Glow */}
      <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600
                          flex items-center justify-center text-xl shadow-lg shadow-emerald-500/30 shrink-0">
            🖼️
          </div>
          <div>
            <div className="text-xs text-emerald-400 font-semibold tracking-widest uppercase mb-0.5">NFT Receipt</div>
            <div className="text-white font-bold text-base leading-tight">{itemName}</div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-white">{symbol}{amount}</div>
          <div className="text-xs text-slate-500 mt-0.5">one-time</div>
        </div>
      </div>

      {/* Token + ERC badge */}
      <div className="flex items-center gap-2 mb-4">
        {tokenId !== undefined && (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
            Token #{tokenId}
          </span>
        )}
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-500/15 text-teal-300 border border-teal-500/25">
          ERC-721
        </span>
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-violet-500/15 text-violet-300 border border-violet-500/25">
          Polkadot Hub EVM
        </span>
      </div>

      {/* Warranty bar */}
      <WarrantyBar warrantyStatus={warrantyStatus} />

      {/* Ownership row */}
      <div className="flex items-center gap-2 mb-4 p-2.5 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
        <span className="text-emerald-400 text-base">✅</span>
        <div className="min-w-0">
          <div className="text-xs text-emerald-300 font-semibold">Ownership Verified</div>
          <div className="text-[10px] text-slate-500 font-mono truncate">{ownerWallet}</div>
        </div>
      </div>

      {/* Data rows */}
      <div className="space-y-1.5 mb-4 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Minted</span>
          <span className="text-slate-300">{new Date(mintedAt).toLocaleString()}</span>
        </div>
        {ownershipId && (
          <div className="flex justify-between">
            <span className="text-slate-500">Ownership ID</span>
            <span className="text-slate-400 font-mono">{ownershipId.slice(0, 18)}…</span>
          </div>
        )}
        {txHash && (
          <div className="flex justify-between">
            <span className="text-slate-500">Tx Hash</span>
            <span className="text-slate-400 font-mono">{txHash.slice(0, 18)}…</span>
          </div>
        )}
      </div>

      {/* Explorer link */}
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl
                   border border-emerald-500/25 bg-emerald-500/8 text-emerald-300
                   text-xs font-semibold hover:bg-emerald-500/15 transition-colors duration-200"
      >
        <span>🔗</span> View on Blockscout Explorer
      </a>
    </div>
  )
}

// ─── Metadata Explorer ────────────────────────────────────────────────────
function MetadataExplorer({ metadata }) {
  const [open, setOpen] = useState(false)
  if (!metadata) return null

  return (
    <div className="mb-3 rounded-xl border border-white/8 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/3 hover:bg-white/5
                   text-sm font-semibold text-slate-300 transition-colors"
      >
        <span className="flex items-center gap-2"><span>📋</span> NFT Metadata</span>
        <span className="text-slate-600 text-xs">{open ? '▲ Collapse' : '▼ Expand'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2 bg-black/20">
          <div className="text-[10px] text-slate-600 mb-2 font-semibold uppercase tracking-wider">
            {metadata.name}
          </div>
          <div className="space-y-1.5">
            {(metadata.attributes || []).map((attr, i) => (
              <div key={i} className="flex justify-between items-center py-1 border-b border-white/5 last:border-0">
                <span className="text-xs text-slate-500">{attr.trait_type}</span>
                <span className="text-xs text-slate-200 font-medium">{attr.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Solidity Struct Preview ──────────────────────────────────────────────
function SolidityStructPreview({ solidityStruct }) {
  const [open, setOpen] = useState(false)
  if (!solidityStruct) return null

  return (
    <div className="mb-3 rounded-xl border border-white/8 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/3 hover:bg-white/5
                   text-sm font-semibold text-slate-300 transition-colors"
      >
        <span className="flex items-center gap-2"><span>📝</span> Solidity Struct (NFTReceipt.sol)</span>
        <span className="text-slate-600 text-xs">{open ? '▲ Collapse' : '▼ Expand'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2 bg-black/30">
          <pre className="text-[10px] text-emerald-300/80 font-mono leading-relaxed overflow-auto">
{`Receipt {
  itemName:          "${solidityStruct.itemName}",
  amount:            ${solidityStruct.amount},         // ${solidityStruct.currency}
  currency:          "${solidityStruct.currency}",
  purchaseTimestamp: ${solidityStruct.purchaseTimestamp},
  warrantyExpiry:    ${solidityStruct.warrantyExpiry},
  buyer:             ${solidityStruct.buyer},
  warrantyActive:    ${solidityStruct.warrantyActive},
  tokenId:           ${solidityStruct.tokenId}
}`}
          </pre>
        </div>
      )}
    </div>
  )
}

// ─── Automation Rules ─────────────────────────────────────────────────────
function AutomationRules({ rules }) {
  if (!rules || rules.length === 0) return null

  const statusColor = (s) =>
    s === 'executed' || s === 'stored' ? 'text-emerald-400' :
    s === 'active'   ? 'text-teal-400' :
    s === 'triggered'? 'text-amber-400' : 'text-slate-500'

  const statusDot = (s) =>
    s === 'executed' || s === 'stored' ? 'bg-emerald-400' :
    s === 'active'   ? 'bg-teal-400' :
    s === 'triggered'? 'bg-amber-400' : 'bg-slate-600'

  return (
    <div className="rounded-xl border border-white/8 overflow-hidden mb-3">
      <div className="px-4 py-3 bg-white/3 border-b border-white/5">
        <span className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <span>⚙️</span> Automation Rules Applied
        </span>
      </div>
      <div className="divide-y divide-white/5">
        {rules.map((r, i) => (
          <div key={i} className="px-4 py-2.5 bg-black/10 flex items-start gap-3">
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${statusDot(r.status)}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">{r.rule}</span>
                <span className={`text-[10px] font-medium ${statusColor(r.status)}`}>{r.status}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{r.description}</div>
              {r.expiry_date && (
                <div className="text-[10px] text-slate-600 mt-0.5">Expires: {r.expiry_date}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Panel ───────────────────────────────────────────────────────────
export default function NFTPanel({ executionData }) {
  if (!executionData) return null

  const purchaseResults = (executionData.results || []).filter(
    r => r.item?.type === 'purchase' && r.blockchain?.success
  )

  if (purchaseResults.length === 0) return null

  return (
    <div className="glass-card p-6 animate-enter">
      <div className="mb-5">
        <p className="section-title">NFT Receipt Module</p>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          🖼️ NFT Receipts
          <span className="text-sm font-normal text-emerald-400 ml-1">
            {purchaseResults.length} minted
          </span>
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          On-chain proof of ownership with warranty tracking · ERC-721 · Polkadot Hub EVM
        </p>
      </div>

      {purchaseResults.map((result, i) => {
        const blockchain = result.blockchain || {}
        const automation = result.automation || {}
        return (
          <div key={i}>
            <NFTHeroCard result={result} />
            <MetadataExplorer metadata={blockchain.metadata} />
            <SolidityStructPreview solidityStruct={blockchain.solidity_struct} />
            <AutomationRules rules={automation.rules_applied} />
            {i < purchaseResults.length - 1 && (
              <div className="border-t border-white/5 my-4" />
            )}
          </div>
        )
      })}
    </div>
  )
}
