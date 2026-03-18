import { useEffect, useState } from 'react'
import { getAssets } from '../api'

function ContractCard({ contract }) {
  return (
    <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-4 animate-enter">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span>📄</span>
          <div>
            <div className="font-semibold text-white text-sm">{contract.service_name}</div>
            <div className="text-xs text-slate-500">SubscriptionManager</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="status-dot status-deployed" />
          <span className="text-xs text-brand-400 font-medium">{contract.status}</span>
        </div>
      </div>
      <div className="space-y-1 mb-2">
        <div className="data-row">
          <span className="data-label">Amount</span>
          <span className="data-value">{contract.currency} {contract.amount}/{contract.frequency}</span>
        </div>
        <div className="data-row">
          <span className="data-label">Next Renewal</span>
          <span className="data-value text-amber-300">{contract.lifecycle?.next_renewal}</span>
        </div>
        <div className="data-row">
          <span className="data-label">Expiry</span>
          <span className="data-value">{contract.lifecycle?.expiry}</span>
        </div>
        <div className="data-row">
          <span className="data-label">Network</span>
          <span className="data-value text-xs">{contract.network}</span>
        </div>
      </div>
      <div className="address-chip text-xs truncate">{contract.contract_address}</div>
    </div>
  )
}

function NFTCard({ nft }) {
  const warranty = nft.warranty_status || {}
  const warrantyState  = warranty.state || 'active'
  const warrantyActive = warrantyState === 'active'
  const warrantyColor  =
    warrantyState === 'expired'      ? 'text-red-400' :
    warrantyState === 'grace_period' ? 'text-amber-400' : 'text-emerald-400'
  const warrantyDot =
    warrantyState === 'expired'      ? 'bg-red-400' :
    warrantyState === 'grace_period' ? 'bg-amber-400' : 'bg-emerald-400'

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 animate-enter">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span>🖼️</span>
          <div>
            <div className="font-semibold text-white text-sm">NFT #{nft.token_id}</div>
            <div className="text-xs text-slate-500">NFT Receipt · ERC-721</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${warrantyDot}`} />
          <span className={`text-xs font-medium ${warrantyColor}`}>
            {warrantyState === 'expired' ? 'Expired' :
             warrantyState === 'grace_period' ? 'Grace Period' : 'Warranty Active'}
          </span>
        </div>
      </div>

      <div className="space-y-1 mb-2">
        {(nft.metadata?.attributes || []).map((attr, i) => (
          <div key={i} className="data-row">
            <span className="data-label">{attr.trait_type}</span>
            <span className="data-value text-xs">{attr.value}</span>
          </div>
        ))}
        {warranty.days_remaining !== undefined && (
          <div className="data-row">
            <span className="data-label">Days Remaining</span>
            <span className={`data-value text-xs font-semibold ${warrantyColor}`}>
              {warranty.days_remaining > 0 ? `${warranty.days_remaining}d` : 'Expired'}
            </span>
          </div>
        )}
      </div>

      <div className="address-chip text-xs truncate mb-2">{nft.contract_address}</div>

      {nft.tx_hash && (
        <a
          href={`https://blockscout.polkadot.io/tx/${nft.tx_hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-teal-500 hover:text-teal-300 transition-colors"
        >
          🔗 View on Explorer
        </a>
      )}
    </div>
  )
}

export default function AssetsPanel() {
  const [assets, setAssets] = useState(null)
  const [loading, setLoading] = useState(false)

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

  useEffect(() => {
    fetchAssets()
  }, [])

  const totalAssets = (assets?.total_contracts || 0) + (assets?.total_nfts || 0)

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="section-title">Assets Registry</p>
          <h2 className="text-xl font-bold text-white">Managed Assets</h2>
          <p className="text-sm text-slate-500 mt-1">All contracts and NFTs on Polkadot Hub</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-bold text-gradient">{totalAssets}</div>
            <div className="text-xs text-slate-500">Total Assets</div>
          </div>
          <button
            onClick={fetchAssets}
            disabled={loading}
            className="btn-secondary p-2"
            title="Refresh"
          >
            <svg
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {totalAssets === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3 opacity-30">⛓️</div>
          <p className="text-slate-500 text-sm">No assets yet. Run the pipeline to create contracts and NFTs.</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-lg bg-white/5 p-3 text-center">
              <div className="text-xl font-bold text-brand-300">{assets?.total_contracts || 0}</div>
              <div className="text-xs text-slate-500">Contracts</div>
            </div>
            <div className="rounded-lg bg-white/5 p-3 text-center">
              <div className="text-xl font-bold text-emerald-300">{assets?.total_nfts || 0}</div>
              <div className="text-xs text-slate-500">NFTs</div>
            </div>
            <div className="rounded-lg bg-white/5 p-3 text-center">
              <div className="text-xl font-bold text-amber-300">{assets?.total_transactions || 0}</div>
              <div className="text-xs text-slate-500">Transactions</div>
            </div>
          </div>

          {/* Contracts */}
          {assets?.contracts?.length > 0 && (
            <div className="mb-5">
              <p className="section-title">Smart Contracts</p>
              <div className="grid gap-3">
                {assets.contracts.map((c, i) => <ContractCard key={i} contract={c} />)}
              </div>
            </div>
          )}

          {/* NFTs */}
          {assets?.nfts?.length > 0 && (
            <div className="mb-5">
              <p className="section-title">NFT Receipts</p>
              <div className="grid gap-3">
                {assets.nfts.map((n, i) => <NFTCard key={i} nft={n} />)}
              </div>
            </div>
          )}

          {/* Transaction history */}
          {assets?.transaction_history?.length > 0 && (
            <div>
              <p className="section-title">Recent Transactions</p>
              <div className="terminal-box overflow-auto max-h-40">
                {assets.transaction_history.slice().reverse().map((tx, i) => (
                  <div key={i} className="text-xs mb-1 flex items-center gap-2">
                    <span className="text-slate-600">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                    <span className={`
                      ${tx.type === 'DEPLOY_CONTRACT' ? 'text-brand-400' :
                        tx.type === 'MINT_NFT' ? 'text-emerald-400' : 'text-amber-400'}
                    `}>{tx.type}</span>
                    <span className="text-slate-500 font-mono">{tx.tx_hash?.slice(0, 14)}...</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
