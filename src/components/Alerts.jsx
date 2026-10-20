import { useState } from 'react'
import { fmt, uid } from '../lib/format'

export default function Alerts({ alerts, setAlerts, assets, ctx }) {
  const [f, setF] = useState({ symbol: '', dir: 'above', target: '' })
  const [perm, setPerm] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported')
  const sym = f.symbol || assets[0]?.symbol || ''
  const cur = s => assets.find(a => a.symbol === s)?.currency || ''
  const add = e => {
    e.preventDefault()
    if (!sym || !(+f.target > 0)) return
    setAlerts(a => [...a, { id: uid(), symbol: sym, dir: f.dir, target: +f.target, active: true }])
    setF({ ...f, target: '' })
  }
  return (
    <section>
      <div className="row-between">
        <h2>Price alerts</h2>
        {perm === 'default' && <button className="ghost" onClick={() => Notification.requestPermission().then(setPerm)}>Enable browser notifications</button>}
      </div>
      <p className="muted">Alerts are checked each time prices update while this tab is open. In-app banners always show; browser notifications need permission.</p>
      {!assets.length ? <p className="muted">Add a holding or a watchlist ticker first, then set a target here.</p> : (
        <form className="grid" onSubmit={add}>
          <label>Asset<select value={sym} onChange={e => setF({ ...f, symbol: e.target.value })}>{assets.map(a => <option key={a.symbol}>{a.symbol}</option>)}</select></label>
          <label>Notify when price is<select value={f.dir} onChange={e => setF({ ...f, dir: e.target.value })}><option value="above">at or above</option><option value="below">at or below</option></select></label>
          <label>Target ({cur(sym)})<input type="number" step="any" min="0" value={f.target} onChange={e => setF({ ...f, target: e.target.value })} /></label>
          <div className="actions"><button type="submit">Create alert</button></div>
        </form>
      )}
      {alerts.length > 0 && (
        <div className="scroll"><table>
          <thead><tr><th>Asset</th><th>Condition</th><th className="r">Now</th><th>Status</th><th /></tr></thead>
          <tbody>{alerts.map(a => {
            const p = ctx.priceOf(a.symbol)
            return (
              <tr key={a.id}>
                <td><b>{a.symbol}</b></td>
                <td>{a.dir} {fmt(a.target, cur(a.symbol) || 'USD')}</td>
                <td className="r">{p == null ? '—' : fmt(p, cur(a.symbol) || 'USD')}</td>
                <td>{a.active ? <span className="tag buy">watching</span> : <span className="tag fee">triggered {a.firedAt ? new Date(a.firedAt).toLocaleString() : ''}</span>}</td>
                <td className="r nowrap">
                  {!a.active && <button className="link" onClick={() => setAlerts(l => l.map(x => (x.id === a.id ? { ...x, active: true } : x)))}>Re-arm</button>}
                  <button className="link danger" onClick={() => setAlerts(l => l.filter(x => x.id !== a.id))}>Delete</button>
                </td>
              </tr>)
          })}</tbody>
        </table></div>
      )}
    </section>
  )
}
