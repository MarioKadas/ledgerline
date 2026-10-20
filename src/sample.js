import { uid } from './lib/format'
const t = (date, type, symbol, name, assetType, currency, quantity, price, extra = {}) => ({ id: uid(), date, type, symbol, name, assetType, currency, quantity, price, fee: '', amount: '', notes: '', ...extra })
export const sampleTxs = () => [
  t('2025-02-10', 'buy', 'AAPL', 'Apple Inc.', 'stock', 'USD', 10, 182.5, { fee: 1 }),
  t('2025-04-02', 'buy', 'NVDA', 'NVIDIA', 'stock', 'USD', 5, 95.2),
  t('2025-06-18', 'sell', 'AAPL', 'Apple Inc.', 'stock', 'USD', 3, 205),
  t('2025-08-15', 'dividend', 'AAPL', 'Apple Inc.', 'stock', 'USD', '', '', { amount: 2.4 }),
  t('2025-03-05', 'buy', 'bitcoin', 'Bitcoin', 'crypto', 'EUR', 0.05, 61000),
  t('2025-03-06', 'fee', '', 'Account fee', 'stock', 'EUR', '', '', { amount: 4.5 }),
]
export const sampleWatch = () => [{ symbol: 'TSLA', name: 'Tesla', assetType: 'stock', currency: 'USD' }]
