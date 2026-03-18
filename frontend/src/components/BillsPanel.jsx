// Bill samples for InputPanel
const BILL_SAMPLES = [
  { label: 'Electricity', text: 'Electricity bill ₹2800 this month. Last month was ₹1500.', icon: '⚡' },
  { label: 'Gas Spike', text: 'Gas bill ₹1800 this month, was only ₹800 last month.', icon: '🔥' },
  { label: 'All Utilities', text: 'Electricity bill ₹2800, Internet bill ₹999, Mobile bill ₹499, Water bill ₹300 this month.', icon: '🏠' },
  { label: 'Maintenance', text: 'Maintenance bill ₹2500 due in 3 days. Previous was ₹2000.', icon: '🔧' },
]

function SparkBar({ prev, curr, currency = 'INR' }) {
  const sym = currency === 'INR' ? '₹' : '$'
  const pct = prev > 0 ? ((curr - prev) / prev) * 100 : 0
  const isSpike = pct > 20
  const barMax = Math.max(curr, prev, 1)
  const prevPct = (prev / barMax) * 100
  const currPct = (curr / barMax) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
          <span>Last Month</span>
          <span>{sym}{prev}</span>
        </div>
        <div style={{ height: '0.35rem', background: 'var(--bg-overlay)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'var(--text-muted)', borderRadius: '99px', width: `${prevPct}%` }} />
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
          <span>This Month</span>
          <span style={{ color: isSpike ? '#f87171' : '#fbbf24' }}>{sym}{curr}</span>
        </div>
        <div style={{ height: '0.35rem', background: 'var(--bg-overlay)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: '99px', background: isSpike ? '#ef4444' : '#f59e0b', boxShadow: isSpike ? 'none' : '0 0 10px rgba(245,158,11,0.5)', width: `${currPct}%` }} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: isSpike ? '#f87171' : pct > 0 ? '#fbbf24' : '#34d399', marginTop: '0.25rem' }}>
        <span style={{ fontSize: '0.8rem' }}>{pct > 0 ? '↑' : pct < 0 ? '↓' : '→'}</span>
        <span>{Math.abs(pct).toFixed(1)}% {isSpike ? 'Anomalous Increase Detected' : 'Variation'}</span>
      </div>
    </div>
  )
}

function EmittedEventChip({ event }) {
  const colors = {
    AbnormalIncreaseAlert: { border: 'rgba(239,68,68,0.2)', bg: 'rgba(239,68,68,0.1)', text: '#fca5a5' },
    HighUsageAlert:        { border: 'rgba(245,158,11,0.2)', bg: 'rgba(245,158,11,0.1)', text: '#fcd34d' },
    DueSoonAlert:          { border: 'rgba(249,115,22,0.2)', bg: 'rgba(249,115,22,0.1)', text: '#fdba74' },
    BudgetWarning:         { border: 'rgba(234,179,8,0.2)', bg: 'rgba(234,179,8,0.1)', text: '#fde047' },
  }
  const icons = { AbnormalIncreaseAlert: '📈', HighUsageAlert: '💰', DueSoonAlert: '🔔', BudgetWarning: '📊' }
  const c = colors[event.event] || { border: 'var(--border-base)', bg: 'var(--bg-overlay)', text: 'var(--text-secondary)' }
  const icon = icons[event.event] || '⚙️'

  return (
    <div className="animate-enter" style={{
      borderRadius: '1rem', border: `1px solid ${c.border}`, background: c.bg,
      padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem',
    }}>
      <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: c.text, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem' }}>{icon}</span> {event.event}
      </div>
      {event.data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginTop: '0.25rem' }}>
          {Object.entries(event.data).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.5rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.6, color: c.text }}>{k}</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: c.text }}>{String(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BillCard({ result }) {
  const { item, blockchain } = result
  const prevAmt = parseFloat(item.previous_amount || blockchain?.solidity_struct?.previousAmount || 0)
  const currAmt = parseFloat(item.amount || 0)
  const isAbnormal = item.is_abnormal || blockchain?.is_abnormal
  const risk = item.risk || 'normal'

  const cardBorder = isAbnormal ? 'rgba(239,68,68,0.2)' : risk === 'high' ? 'rgba(245,158,11,0.2)' : 'var(--border-base)'
  const cardBg     = isAbnormal ? 'rgba(239,68,68,0.05)' : risk === 'high' ? 'rgba(245,158,11,0.05)' : 'var(--bg-overlay)'
  const badgeColor = isAbnormal ? '#f87171' : risk === 'high' ? '#fbbf24' : '#34d399'
  const badgeBg    = isAbnormal ? 'rgba(239,68,68,0.1)' : risk === 'high' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)'
  const badgeBdr   = isAbnormal ? 'rgba(239,68,68,0.2)' : risk === 'high' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'
  const badgeText  = isAbnormal ? 'Abnormal Spike' : risk === 'high' ? 'High Utilization' : 'Nominal Status'

  return (
    <div className="animate-enter" style={{
      borderRadius: '1.5rem', border: `2px solid ${cardBorder}`, background: cardBg,
      padding: '1.75rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden',
      transition: 'border-color 0.3s, transform 0.3s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '3.5rem', height: '3.5rem', borderRadius: '1rem',
            background: 'var(--input-bg)', border: '1px solid var(--border-base)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem',
          }}>
            ⚡
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>{item.name}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{
                padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.55rem', fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.12em', color: badgeColor,
                background: badgeBg, border: `1px solid ${badgeBdr}`
              }}>
                {badgeText}
              </span>
              {item.dueDate && (
                <span style={{
                  fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase',
                  letterSpacing: '0.1em', border: '1px solid var(--border-base)', padding: '0.2rem 0.5rem',
                  borderRadius: '0.5rem', background: 'var(--bg-overlay)'
                }}>
                  Due: {item.dueDate}
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '2px' }}>₹</span>
            {item.amount}
          </div>
          {blockchain?.tracker_id && (
            <p style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(245,158,11,0.6)', fontFamily: 'JetBrains Mono, monospace', marginTop: '0.25rem' }}>
              {blockchain.tracker_id}
            </p>
          )}
        </div>
      </div>

      {blockchain?.alert_messages?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem', position: 'relative', zIndex: 10 }}>
          {blockchain.alert_messages.map((msg, i) => {
            const isRed = msg.includes('OVERDUE') || msg.includes('Spike')
            const bg = isRed ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)'
            const bdr = isRed ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'
            const txt = isRed ? '#fecaca' : '#fde68a'
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '1rem', border: `1px solid ${bdr}`, background: bg }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>🔔</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, lineHeight: 1.5, color: txt }}>{msg}</span>
              </div>
            )
          })}
        </div>
      )}

      {prevAmt > 0 && prevAmt !== currAmt && (
        <div style={{
          padding: '1.25rem 1.5rem', borderRadius: '1.25rem', background: 'var(--input-bg)',
          border: '1px solid var(--border-base)', marginBottom: '1.25rem', position: 'relative', zIndex: 10,
        }}>
          <p className="section-label" style={{ marginBottom: '1rem' }}>Historical Delta Analysis</p>
          <SparkBar prev={prevAmt} curr={currAmt} currency={item.currency} />
        </div>
      )}

      {blockchain?.emitted_events?.length > 0 && (
        <div style={{ marginBottom: '1.25rem', position: 'relative', zIndex: 10 }}>
          <p className="section-label" style={{ marginBottom: '0.75rem' }}>Smart Contract Events</p>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {blockchain.emitted_events.map((ev, i) => <EmittedEventChip key={i} event={ev} />)}
          </div>
        </div>
      )}

      {blockchain?.tx_hash && (
        <div style={{
          marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-base)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.5rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>Transaction Pulse</span>
            <span style={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{blockchain.tx_hash.slice(0, 24)}...</span>
          </div>
          {blockchain.explorer_url && (
            <a href={blockchain.explorer_url} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Explorer →
            </a>
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
  const highRisk = billResults.filter(r => (r.item.risk === 'high' && !r.item.is_abnormal))
  const normal   = billResults.filter(r => r.item.risk !== 'high' && !r.item.is_abnormal)

  return (
    <div className="glass-card animate-enter" style={{ padding: '2rem', borderColor: 'rgba(245,158,11,0.12)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <span className="section-label">Utility Intelligence</span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
            Expenditure Audit
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 500 }}>
            Neural spike detection · Delta analysis · On-chain alerts
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {abnormal.length > 0 && (
            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
              📈
            </div>
          )}
          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
            💰
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          ['Critical Spikes', abnormal.length, '#f87171'],
          ['High Variance',   highRisk.length, '#fbbf24'],
          ['Nominal usage',   normal.length,   '#34d399']
        ].map(([l, v, c]) => (
          <div key={l} style={{
            padding: '1rem', borderRadius: '1.25rem', background: 'var(--input-bg)',
            border: '1px solid var(--border-base)', textAlign: 'center',
            transition: 'background 0.2s', cursor: 'default',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-overlay)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--input-bg)'}
          >
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: c, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '0.25rem' }}>{v}</div>
            <div style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {billResults.map((r, i) => <BillCard key={i} result={r} />)}
      </div>
    </div>
  )
}

export { BILL_SAMPLES }
