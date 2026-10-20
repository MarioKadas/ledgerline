import { cls, fmt, num, pct } from '../lib/format'

export default function Holdings({ held, ctx, onAdd }) {
  const { base, conv, priceOf, prevOf, prices, manual, setManual } = ctx
  if (!held.length) return (
    <section className="empty"><h2>No holdings yet</h2><p>Add your first buy transaction and your positions appear here.</p><button onClick={onAdd}>Add a transaction</button></section>
  )
  const setPrice = h => {
    const v = prompt(`Manual price for ${h.symbol} (${h.currency}). Leave empty to clear.`, manual[h.symbol] ?? '')
    if (v === null) return
    setManual(m => { const n = { ...m }; v === '' ? delete n[h.symbol] : (n[h.symbol] = +v); return n })
  }
  const rows = held.map(h => {
    const live = priceOf(h.symbol)
    const p = live ?? h.avg
    const valueAsset = h.qty * p
    const gainAsset = valueAsset - h.cost
    const prev = prevOf(h.symbol)
    return { h, live, p, value: conv(valueAsset, h.currency), gain: conv(gainAsset, h.currency), gainPct: h.cost ? (gainAsset / h.cost) * 100 : NaN, dayPct: prev ? ((p - prev) / prev) * 100 : NaN, fromFeed: !!prices[h.symbol] }
  }).sort((a, b) => b.value - a.value)
  const total = rows.reduce((s, r) => s + r.value, 0)

  return (
    <section>
      <h2>Holdings</h2>
      <div className="scroll">
        <table>
          <thead><tr>
            <th>Asset</th><th className="r">Quantity</th><th className="r">Avg buy</th><th className="r">Price</th><th className="r">Day</th>
            <th className="r">Value ({base})</th><th className="r">Gain / loss ({base})</th><th className="r">Gain / loss %</th><th className="r">Weight</th>
          </tr></thead>
          <tbody>{rows.map(({ h, live, p, value, gain, gainPct, dayPct, fromFeed }) => (
            <tr key={h.symbol}>
              <td><b>{h.assetType === 'crypto' ? h.name : h.symbol}</b><small>{h.assetType === 'crypto' ? h.symbol : h.name} · {h.currency}</small></td>
              <td className="r">{num(h.qty)}</td>
              <td className="r">{fmt(h.avg, h.currency)}</td>
              <td className="r">
                {live == null ? <span className="muted">no price</span> : fmt(p, h.currency)}
                <button className="icon" title={fromFeed ? 'Feed price' : 'Set manual price'} onClick={() => setPrice(h)}>{!fromFeed && live != null ? 'manual' : '✎'}</button>
              </td>
              <td className={'r ' + cls(dayPct)}>{pct(dayPct)}</td>
              <td className="r">{fmt(value, base)}</td>
              <td className={'r ' + cls(gain)}>{live == null ? '—' : fmt(gain, base)}</td>
              <td className={'r ' + cls(gainPct)}>{live == null ? '—' : pct(gainPct)}</td>
              <td className="r">{total ? ((value / total) * 100).toFixed(1) + '%' : '—'}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  )
}
