import { CurrencySelect } from './Transactions'
import { sampleTxs, sampleWatch } from '../sample'

export default function Settings({ settings, setSettings, setTxs, setWatch, setAlerts, setManual, setPrices }) {
  const set = k => e => setSettings({ ...settings, [k]: e.target.type === 'number' ? +e.target.value : e.target.value })
  const clear = () => {
    if (!confirm('Delete all transactions, watchlist, alerts and cached prices from this browser?')) return
    setTxs([]); setWatch([]); setAlerts([]); setManual({}); setPrices({})
  }
  return (
    <section>
      <h2>Settings</h2>
      <div className="grid">
        <label>Base currency<CurrencySelect value={settings.base} onChange={set('base')} /></label>
        <label>Refresh every (seconds, 0 = manual)<input type="number" min="0" step="10" value={settings.refreshSec} onChange={set('refreshSec')} /></label>
        <label className="wide">Finnhub API key (stocks &amp; ETFs)<input value={settings.finnhubKey} onChange={set('finnhubKey')} placeholder="Paste your free key from finnhub.io" autoComplete="off" /></label>
      </div>
      <ul className="muted">
        <li>Stocks: Finnhub free tier — US symbols, 60 calls/min, quotes may be delayed. For other markets use the “✎” button on a holding to enter a price by hand.</li>
        <li>Crypto: CoinGecko, no key. Use the coin id (bitcoin, ethereum, solana…) as the symbol.</li>
        <li>Exchange rates: Frankfurter (ECB reference rates, daily). Values are converted at the current rate.</li>
      </ul>
      <div className="actions">
        <button className="ghost" onClick={() => { setTxs(t => [...t, ...sampleTxs()]); setWatch(w => [...w, ...sampleWatch()]) }}>Load sample data</button>
        <button className="ghost danger" onClick={clear}>Delete all data</button>
      </div>
    </section>
  )
}
