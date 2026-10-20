import { useRef, useState } from 'react'
import { download, parseCSV, toCSV, TX_COLS } from '../lib/csv'
import { fmt, normSymbol, today, uid } from '../lib/format'

const blank = () => ({ date: today(), type: 'buy', symbol: '', name: '', assetType: 'stock', currency: 'USD', quantity: '', price: '', fee: '', amount: '', notes: '' })
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'TRY', 'CNY', 'HKD', 'SGD', 'INR', 'BRL', 'MXN', 'ZAR', 'NZD']

export function CurrencySelect(props) {
  return <select {...props}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select>
}

export default function Transactions({ txs, setTxs }) {
  const [f, setF] = useState(blank())
  const [editing, setEditing] = useState(null)
  const [err, setErr] = useState('')
  const file = useRef()
  const trade = f.type === 'buy' || f.type === 'sell'
  const set = k => e => setF({ ...f, [k]: e.target.value })

  const submit = e => {
    e.preventDefault()
    if (trade && (!f.symbol.trim() || !(+f.quantity > 0) || !(+f.price >= 0) || f.price === '')) return setErr('Trades need a symbol, a quantity above 0 and a price.')
    if (!trade && !(+f.amount > 0)) return setErr('Enter an amount above 0.')
    if (f.type === 'dividend' && !f.symbol.trim()) return setErr('Dividends need the symbol that paid them.')
    const tx = { ...f, symbol: f.symbol.trim() ? normSymbol(f.symbol, f.assetType) : '', id: editing || uid() }
    setTxs(list => (editing ? list.map(t => (t.id === editing ? tx : t)) : [...list, tx]))
    setErr(''); setEditing(null); setF({ ...blank(), currency: f.currency, assetType: f.assetType })
  }
  const edit = t => { setF({ ...blank(), ...t }); setEditing(t.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const remove = id => confirm('Delete this transaction?') && setTxs(l => l.filter(t => t.id !== id))

  const importCSV = async e => {
    const text = await e.target.files[0]?.text(); e.target.value = ''
    if (!text) return
    const rows = parseCSV(text).map(r => {
      const assetType = r.assetType === 'crypto' ? 'crypto' : 'stock'
      return { ...blank(), ...r, id: uid(), type: (r.type || 'buy').toLowerCase(), assetType, symbol: r.symbol ? normSymbol(r.symbol, assetType) : '', currency: (r.currency || 'USD').toUpperCase() }
    }).filter(r => ['buy', 'sell', 'dividend', 'fee'].includes(r.type) && r.date)
    if (!rows.length) return setErr('No valid rows found. Expected columns: ' + TX_COLS.join(', '))
    setTxs(l => [...l, ...rows]); setErr(`Imported ${rows.length} transactions.`)
  }

  const sorted = [...txs].sort((a, b) => b.date.localeCompare(a.date))
  return (
    <section>
      <h2>{editing ? 'Edit transaction' : 'Add transaction'}</h2>
      <form className="grid" onSubmit={submit}>
        <label>Type<select value={f.type} onChange={set('type')}><option value="buy">Buy</option><option value="sell">Sell</option><option value="dividend">Dividend</option><option value="fee">Fee</option></select></label>
        <label>Date<input type="date" value={f.date} onChange={set('date')} required /></label>
        <label>Asset kind<select value={f.assetType} onChange={set('assetType')}><option value="stock">Stock / ETF</option><option value="crypto">Crypto</option></select></label>
        <label>{f.assetType === 'crypto' ? 'CoinGecko id (e.g. bitcoin)' : 'Ticker (e.g. AAPL)'}<input value={f.symbol} onChange={set('symbol')} placeholder={f.type === 'fee' ? 'optional' : ''} /></label>
        <label>Name<input value={f.name} onChange={set('name')} placeholder="optional" /></label>
        <label>Currency<CurrencySelect value={f.currency} onChange={set('currency')} /></label>
        {trade ? <>
          <label>Quantity<input type="number" step="any" min="0" value={f.quantity} onChange={set('quantity')} /></label>
          <label>Price per unit<input type="number" step="any" min="0" value={f.price} onChange={set('price')} /></label>
          <label>Fee<input type="number" step="any" min="0" value={f.fee} onChange={set('fee')} placeholder="0" /></label>
        </> : <label>Amount<input type="number" step="any" min="0" value={f.amount} onChange={set('amount')} /></label>}
        <label className="wide">Notes<input value={f.notes} onChange={set('notes')} /></label>
        <div className="actions">
          <button type="submit">{editing ? 'Save changes' : 'Add transaction'}</button>
          {editing && <button type="button" className="ghost" onClick={() => { setEditing(null); setF(blank()) }}>Cancel</button>}
        </div>
      </form>
      {err && <p className="note">{err}</p>}

      <div className="row-between">
        <h2>History <small>{txs.length}</small></h2>
        <div className="actions">
          <button className="ghost" onClick={() => file.current.click()}>Import CSV</button>
          <button className="ghost" disabled={!txs.length} onClick={() => download('transactions.csv', toCSV(txs, TX_COLS))}>Export CSV</button>
          <input ref={file} type="file" accept=".csv,text/csv" hidden onChange={importCSV} />
        </div>
      </div>
      {!txs.length ? <p className="muted">Nothing here yet. Add a transaction above, or import a CSV with the columns {TX_COLS.join(', ')}.</p> : (
        <div className="scroll"><table>
          <thead><tr><th>Date</th><th>Type</th><th>Asset</th><th className="r">Quantity</th><th className="r">Price</th><th className="r">Fee</th><th className="r">Amount</th><th /></tr></thead>
          <tbody>{sorted.map(t => (
            <tr key={t.id}>
              <td>{t.date}</td><td><span className={'tag ' + t.type}>{t.type}</span></td>
              <td><b>{t.symbol || '—'}</b><small>{t.name} · {t.currency}</small></td>
              <td className="r">{t.quantity || ''}</td>
              <td className="r">{t.price !== '' && t.price != null ? fmt(+t.price, t.currency) : ''}</td>
              <td className="r">{+t.fee ? fmt(+t.fee, t.currency) : ''}</td>
              <td className="r">{t.type === 'dividend' || t.type === 'fee' ? fmt(+t.amount, t.currency) : fmt(+t.quantity * +t.price, t.currency)}</td>
              <td className="r nowrap"><button className="link" onClick={() => edit(t)}>Edit</button><button className="link danger" onClick={() => remove(t.id)}>Delete</button></td>
            </tr>))}</tbody>
        </table></div>
      )}
    </section>
  )
}
