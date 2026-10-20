export const TX_COLS = ['date', 'type', 'symbol', 'name', 'assetType', 'currency', 'quantity', 'price', 'fee', 'amount', 'notes']
const esc = v => { v = v == null ? '' : String(v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v }
export const toCSV = (rows, cols) => [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n')

export function parseCSV(text) {
  const rows = []; let row = [], f = '', q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++ } else q = false } else f += c
    } else if (c === '"') q = true
    else if (c === ',') { row.push(f); f = '' }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = '' }
    else f += c
  }
  if (f || row.length) { row.push(f); rows.push(row) }
  const [head, ...body] = rows.filter(r => r.some(x => x.trim()))
  if (!head) return []
  const keys = head.map(h => h.trim())
  return body.map(r => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])))
}

export function download(name, text) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }))
  a.download = name; a.click(); URL.revokeObjectURL(a.href)
}
