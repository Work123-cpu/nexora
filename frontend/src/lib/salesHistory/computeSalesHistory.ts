import type { Bill } from '@/types/entities/bill'

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Trailing daily units-sold for one product, computed from real bill history — chronological,
 * oldest first, ending yesterday. Real zeros are filled in for days with no sales; this is
 * genuine information (the product simply didn't sell that day), not fabricated data.
 *
 * Returns undefined (never a synthetic-looking zero-padded array) unless at least `days` real
 * calendar days have elapsed since this product's first bill — matching the ai-service's
 * MIN_HISTORY_WINDOW, so a brand-new product honestly falls back to the category estimate
 * instead of seeding a forecast from a misleadingly short real window. */
export function computeDailySalesHistory(bills: Bill[], productId: string, days = 28): number[] | undefined {
  const relevantBills = bills.filter((b) => b.status === 'completed' && b.items.some((i) => i.productId === productId))
  if (relevantBills.length === 0) return undefined

  const earliestDate = relevantBills.reduce((min, b) => (b.createdAt < min ? b.createdAt : min), relevantBills[0]!.createdAt)
  const daysSinceFirst = Math.floor((Date.now() - new Date(earliestDate).getTime()) / MS_PER_DAY)
  if (daysSinceFirst < days) return undefined

  const dailyTotals = new Map<string, number>()
  for (const bill of relevantBills) {
    const dateKey = bill.createdAt.slice(0, 10)
    const qty = bill.items.filter((i) => i.productId === productId).reduce((sum, i) => sum + i.quantity, 0)
    dailyTotals.set(dateKey, (dailyTotals.get(dateKey) ?? 0) + qty)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const series: number[] = []
  for (let i = days; i >= 1; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    series.push(dailyTotals.get(d.toISOString().slice(0, 10)) ?? 0)
  }
  return series
}

/** Plain average of a daily series — shared rounding/aggregation point so the product path
 * (computeDailySalesHistory) and the raw-material path (computeMaterialDailyUsage) can't drift
 * out of sync on how "average" is computed. */
export function averageDailyUsage(series: number[]): number {
  if (series.length === 0) return 0
  return series.reduce((sum, v) => sum + v, 0) / series.length
}
