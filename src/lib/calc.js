// Average-cost method. Buy/sell fees are folded into cost basis / proceeds.
export function positions(txs) {
  const m = {}
  ;[...txs].filter(t => t.symbol).sort((a, b) => a.date.localeCompare(b.date)).forEach(t => {
    const p = (m[t.symbol] ??= { symbol: t.symbol, name: t.name || t.symbol, assetType: t.assetType || 'stock', currency: t.currency || 'USD', qty: 0, cost: 0, realized: 0 })
    if (t.name) p.name = t.name
    if (t.currency) p.currency = t.currency
    if (t.assetType) p.assetType = t.assetType
    const q = +t.quantity || 0, pr = +t.price || 0, f = +t.fee || 0
    if (t.type === 'buy') { p.cost += q * pr + f; p.qty += q }
    else if (t.type === 'sell') {
      const avg = p.qty > 0 ? p.cost / p.qty : 0
      const sq = Math.min(q, p.qty)
      p.cost -= avg * sq; p.qty -= sq
      p.realized += sq * pr - f - avg * sq
    }
  })
  return Object.values(m).map(p => ({ ...p, avg: p.qty > 1e-9 ? p.cost / p.qty : 0 }))
}
