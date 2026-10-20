// Free feeds: Finnhub (stocks/ETFs, free key, US symbols), CoinGecko (crypto, no key), Frankfurter (FX, no key).
export async function fetchStock(symbol, key) {
  const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(key)}`)
  if (!r.ok) throw new Error(`Finnhub ${r.status} for ${symbol}`)
  const d = await r.json()
  if (!d.c) throw new Error(`No quote for ${symbol} (Finnhub free tier covers US symbols)`)
  return { price: d.c, prevClose: d.pc || d.c }
}

// items: [{symbol (coingecko id), currency}]
export async function fetchCrypto(items) {
  const out = {}
  const cur = [...new Set(items.map(i => i.currency.toLowerCase()))]
  const ids = [...new Set(items.map(i => i.symbol))]
  const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=${cur.join(',')}&include_24hr_change=true`)
  if (!r.ok) throw new Error(`CoinGecko ${r.status}`)
  const d = await r.json()
  for (const { symbol, currency } of items) {
    const c = currency.toLowerCase(), p = d[symbol]?.[c]
    if (p == null) continue
    const chg = d[symbol][`${c}_24h_change`] ?? 0
    out[symbol] = { price: p, prevClose: p / (1 + chg / 100) }
  }
  return out
}

// rates[X] = units of X per 1 unit of base
export async function fetchRates(base) {
  const r = await fetch(`https://api.frankfurter.dev/v1/latest?base=${base}`)
  if (!r.ok) throw new Error(`Frankfurter ${r.status}`)
  return (await r.json()).rates
}
