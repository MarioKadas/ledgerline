import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocal } from './hooks'
import { positions } from './lib/calc'
import { fetchCrypto, fetchRates, fetchStock } from './lib/api'
import { fmt } from './lib/format'
import Summary from './components/Summary'
import Holdings from './components/Holdings'
import Transactions from './components/Transactions'
import Watchlist from './components/Watchlist'
import Alerts from './components/Alerts'
import Settings from './components/Settings'

const TABS = ['Portfolio', 'Transactions', 'Watchlist', 'Alerts', 'Settings']

export default function App() {
  const [tab, setTab] = useState('Portfolio')
  const [txs, setTxs] = useLocal('lt.txs', [])
  const [watch, setWatch] = useLocal('lt.watch', [])
  const [alerts, setAlerts] = useLocal('lt.alerts', [])
  const [manual, setManual] = useLocal('lt.manual', {})
  const [settings, setSettings] = useLocal('lt.settings', { base: 'EUR', finnhubKey: '', refreshSec: 60 })
  const [prices, setPrices] = useLocal('lt.prices', {})
  const [rates, setRates] = useState({})
  const [status, setStatus] = useState({ busy: false, errors: [], at: null })
  const [toasts, setToasts] = useState([])
  const { base } = settings

  const open = useMemo(() => positions(txs), [txs])
  const held = open.filter(p => p.qty > 1e-9)

  // everything we need prices for
  const assets = useMemo(() => {
    const m = {}
    ;[...held, ...watch].forEach(a => { m[a.symbol] = { symbol: a.symbol, assetType: a.assetType, currency: a.currency } })
    return Object.values(m)
  }, [held, watch])
  const assetsRef = useRef(assets); assetsRef.current = assets
  const keyRef = useRef(settings.finnhubKey); keyRef.current = settings.finnhubKey

  const refresh = useCallback(async () => {
    const list = assetsRef.current
    setStatus(s => ({ ...s, busy: true }))
    const errors = [], next = {}
    const stocks = list.filter(a => a.assetType !== 'crypto')
    const crypto = list.filter(a => a.assetType === 'crypto')
    if (stocks.length && !keyRef.current) errors.push('Add a Finnhub API key in Settings to fetch stock prices.')
    else await Promise.all(stocks.map(a => fetchStock(a.symbol, keyRef.current).then(q => { next[a.symbol] = { ...q, at: Date.now() } }).catch(e => errors.push(e.message))))
    if (crypto.length) {
      try { const q = await fetchCrypto(crypto); Object.entries(q).forEach(([k, v]) => (next[k] = { ...v, at: Date.now() })) }
      catch (e) { errors.push(e.message) }
    }
    setPrices(p => ({ ...p, ...next }))
    setStatus({ busy: false, errors, at: Date.now() })
  }, [setPrices])

  // refresh on changes to the asset set, then on an interval
  const assetKey = assets.map(a => a.symbol).sort().join('|')
  useEffect(() => { refresh() }, [assetKey, settings.finnhubKey, refresh])
  useEffect(() => {
    if (!settings.refreshSec) return
    const id = setInterval(refresh, settings.refreshSec * 1000)
    return () => clearInterval(id)
  }, [settings.refreshSec, refresh])

  useEffect(() => { fetchRates(base).then(setRates).catch(() => setRates({})) }, [base])

  const conv = useCallback((amount, from) => {
    if (!from || from === base) return amount
    const r = rates[from]
    return r ? amount / r : amount
  }, [base, rates])
  const missingFx = [...new Set([...held.map(h => h.currency), ...txs.map(t => t.currency)])].filter(c => c && c !== base && !rates[c])

  const priceOf = s => prices[s]?.price ?? manual[s]
  const prevOf = s => prices[s]?.prevClose

  // price alerts
  useEffect(() => {
    const fired = []
    const nextAlerts = alerts.map(a => {
      const p = priceOf(a.symbol)
      if (!a.active || p == null) return a
      if ((a.dir === 'above' && p >= a.target) || (a.dir === 'below' && p <= a.target)) { fired.push({ a, p }); return { ...a, active: false, firedAt: Date.now(), firedPrice: p } }
      return a
    })
    if (!fired.length) return
    setAlerts(nextAlerts)
    fired.forEach(({ a, p }) => {
      const msg = `${a.symbol.toUpperCase()} is ${a.dir} ${a.target} (now ${p})`
      setToasts(t => [...t, { id: a.id, msg }])
      if ('Notification' in window && Notification.permission === 'granted') new Notification('Price alert', { body: msg })
    })
  }, [prices, manual, alerts]) // eslint-disable-line

  const ctx = { base, conv, priceOf, prevOf, prices, manual, setManual, missingFx }

  return (
    <div className="app">
      <header className="top">
        <h1>Ledgerline</h1>
        <nav>{TABS.map(t => <button key={t} className={t === tab ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>)}</nav>
        <div className="feed">
          <button className="ghost" onClick={refresh} disabled={status.busy}>{status.busy ? 'Updating…' : 'Refresh prices'}</button>
          <small>{status.at ? `Updated ${new Date(status.at).toLocaleTimeString()}` : ''}</small>
        </div>
      </header>

      {toasts.length > 0 && (
        <div className="toasts">{toasts.map(t => (
          <div key={t.id} className="toast"><span>{t.msg}</span><button onClick={() => setToasts(x => x.filter(y => y.id !== t.id))}>Dismiss</button></div>
        ))}</div>
      )}
      {status.errors.length > 0 && <div className="banner warn">{[...new Set(status.errors)].join(' · ')}</div>}
      {missingFx.length > 0 && <div className="banner warn">No exchange rate for {missingFx.join(', ')} → {base}. Those amounts are shown unconverted.</div>}

      <main>
        {tab === 'Portfolio' && <><Summary held={held} all={open} txs={txs} ctx={ctx} /><Holdings held={held} ctx={ctx} onAdd={() => setTab('Transactions')} /></>}
        {tab === 'Transactions' && <Transactions txs={txs} setTxs={setTxs} />}
        {tab === 'Watchlist' && <Watchlist watch={watch} setWatch={setWatch} held={held} ctx={ctx} />}
        {tab === 'Alerts' && <Alerts alerts={alerts} setAlerts={setAlerts} assets={assets} ctx={ctx} />}
        {tab === 'Settings' && <Settings settings={settings} setSettings={setSettings} setTxs={setTxs} setWatch={setWatch} setAlerts={setAlerts} setManual={setManual} setPrices={setPrices} />}
      </main>
      <footer>
        Data is stored only in this browser's local storage. Quotes can be delayed; not financial advice.
        <details>
          <summary>Limits to know about</summary>

          <ul>
            <li>Finnhub’s free tier covers US symbols only. For other markets, click the ✎ button next to a holding’s price to enter it by hand.</li>
            <li>Crypto symbols use the CoinGecko id (bitcoin, ethereum), not the ticker.</li>
            <li>Alerts are only checked while the tab is open, because everything runs in the browser. Server-side alerts would need a small backend.</li>
            <li>Values and cost basis are converted at today’s exchange rate, not the rate on each transaction date. This is simpler but won’t match a tax-grade calculation.</li>
            <li>Cost basis uses the average-cost method, and a sell larger than the current holding is capped at that holding.</li>
            <li>Data is stored in your browser’s localStorage, so use “Export CSV” as your backup.</li>
          </ul>

        </details>

      </footer>
    </div>
  )
}
