import { useState } from 'react'
import { cls, fmt, normSymbol, pct } from '../lib/format'
import { CurrencySelect } from './Transactions'

export default function Watchlist({ watch, setWatch, held, ctx }) {
  const [f, setF] = useState({ symbol: '', name: '', assetType: 'stock', currency: 'USD' })
  const [err, setErr] = useState('')
  const add = e => {
    e.preventDefault()
    if (!f.symbol.trim()) return
    const symbol = normSymbol(f.symbol, f.assetType)
    if (watch.some(w => w.symbol === symbol)) return setErr(`${symbol} is already on your watchlist.`)
    if (held.some(h => h.symbol === symbol)) return setErr(`You already own ${symbol}.`)
    setWatch(w => [...w, { ...f, symbol }]); setErr(''); setF({ ...f, symbol: '', name: '' })
  }
  return (
    <section>
      <h2>Watchlist</h2>
      <form className="grid" onSubmit={add}>
        <label>Kind<select value={f.assetType} onChange={e => setF({ ...f, assetType: e.target.value })}><option value="stock">Stock / ETF</option><option value="crypto">Crypto</option></select></label>
        <label>{f.assetType === 'crypto' ? 'CoinGecko id' : 'Ticker'}<input value={f.symbol} onChange={e => setF({ ...f, symbol: e.target.value })} /></label>
        <label>Name<input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="optional" /></label>
        <label>Currency<CurrencySelect value={f.currency} onChange={e => setF({ ...f, currency: e.target.value })} /></label>
        <div className="actions"><button type="submit">Add to watchlist</button></div>
      </form>
      {err && <p className="note">{err}</p>}
      {!watch.length ? <p className="muted">Follow tickers you don't own yet. They get live prices and can have alerts.</p> : (
        <div className="scroll"><table>
          <thead><tr><th>Asset</th><th className="r">Price</th><th className="r">Day</th><th /></tr></thead>
          <tbody>{watch.map(w => {
            const p = ctx.priceOf(w.symbol), prev = ctx.prevOf(w.symbol)
            return (
              <tr key={w.symbol}>
                <td><b>{w.symbol}</b><small>{w.name} · {w.currency}</small></td>
                <td className="r">{p == null ? <span className="muted">no price</span> : fmt(p, w.currency)}</td>
                <td className={'r ' + cls(p - prev)}>{prev ? pct(((p - prev) / prev) * 100) : '—'}</td>
                <td className="r"><button className="link danger" onClick={() => setWatch(l => l.filter(x => x.symbol !== w.symbol))}>Remove</button></td>
              </tr>)
          })}</tbody>
        </table></div>
      )}
    </section>
  )
}
