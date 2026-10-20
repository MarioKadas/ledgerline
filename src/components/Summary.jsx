import { cls, fmt, pct } from '../lib/format'

export default function Summary({ held, all, txs, ctx }) {
  const { base, conv, priceOf, prevOf } = ctx
  let value = 0, invested = 0, day = 0, dayPrev = 0
  held.forEach(h => {
    const p = priceOf(h.symbol) ?? h.avg
    const prev = prevOf(h.symbol)
    value += conv(h.qty * p, h.currency)
    invested += conv(h.cost, h.currency)
    if (prev != null) { day += conv(h.qty * (p - prev), h.currency); dayPrev += conv(h.qty * prev, h.currency) }
  })
  const realized = all.reduce((s, p) => s + conv(p.realized, p.currency), 0)
  const dividends = txs.filter(t => t.type === 'dividend').reduce((s, t) => s + conv(+t.amount || 0, t.currency), 0)
  const fees = txs.filter(t => t.type === 'fee').reduce((s, t) => s + conv(+t.amount || 0, t.currency), 0)
  const unrealized = value - invested
  const total = unrealized + realized + dividends - fees
  const items = [
    { k: 'Total value', v: fmt(value, base), big: true },
    { k: 'Invested', v: fmt(invested, base) },
    { k: 'Total profit / loss', v: fmt(total, base), sub: invested ? pct((total / invested) * 100) : '', c: cls(total) },
    { k: 'Day change', v: fmt(day, base), sub: dayPrev ? pct((day / dayPrev) * 100) : '', c: cls(day) },
  ]
  return (
    <section className="summary">
      {items.map(i => (
        <div key={i.k} className={'stat' + (i.big ? ' big' : '')}>
          <span className="label">{i.k}</span>
          <strong className={i.c}>{i.v}</strong>
          {i.sub && <span className={'sub ' + i.c}>{i.sub}</span>}
        </div>
      ))}
      <p className="breakdown">
        Unrealized <b className={cls(unrealized)}>{fmt(unrealized, base)}</b> · Realized <b className={cls(realized)}>{fmt(realized, base)}</b> · Dividends <b>{fmt(dividends, base)}</b> · Fees <b>{fmt(-fees, base)}</b>
      </p>
    </section>
  )
}
