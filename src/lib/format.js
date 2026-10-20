export const fmt = (n, c = 'USD') => {
  if (!Number.isFinite(n)) return '—'
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: c, maximumFractionDigits: 2 }).format(n) }
  catch { return n.toFixed(2) + ' ' + c }
}
export const pct = n => (Number.isFinite(n) ? `${n > 0 ? '+' : ''}${n.toFixed(2)}%` : '—')
export const cls = n => (n > 0.00001 ? 'pos' : n < -0.00001 ? 'neg' : '')
export const num = n => new Intl.NumberFormat(undefined, { maximumFractionDigits: 8 }).format(n)
export const uid = () => Math.random().toString(36).slice(2, 10)
export const today = () => new Date().toISOString().slice(0, 10)
export const normSymbol = (s, type) => (type === 'crypto' ? s.trim().toLowerCase() : s.trim().toUpperCase())
