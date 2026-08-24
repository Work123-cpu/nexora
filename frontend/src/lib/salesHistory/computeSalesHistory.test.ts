import { describe, it, expect } from 'vitest'
import { computeDailySalesHistory, averageDailyUsage } from './computeSalesHistory'
import type { Bill } from '@/types/entities/bill'

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function billFor(productId: string, quantity: number, daysAgo: number, status: Bill['status'] = 'completed'): Bill {
  return {
    id: `bill-${daysAgo}-${quantity}`,
    billNumber: `B-${daysAgo}`,
    warehouseId: 'w1',
    customerName: 'Test Customer',
    status,
    items: [{ productId, productName: 'x', quantity, unit: 'unit', unitPrice: 10, lineTotal: quantity * 10 }],
    subtotal: quantity * 10,
    taxPct: 0,
    taxAmount: 0,
    discountPct: 0,
    discountAmount: 0,
    totalAmount: quantity * 10,
    createdAt: isoDaysAgo(daysAgo),
  }
}

describe('computeDailySalesHistory', () => {
  it('returns undefined for an empty bill list', () => {
    expect(computeDailySalesHistory([], 'p1')).toBeUndefined()
  })

  it('returns undefined when the product has real history but fewer than `days` calendar days have elapsed', () => {
    const bills = [billFor('p1', 5, 10), billFor('p1', 3, 5)]
    expect(computeDailySalesHistory(bills, 'p1', 28)).toBeUndefined()
  })

  it('returns undefined for a product with no bills at all, even if other products have plenty', () => {
    const bills = [billFor('p1', 5, 40)]
    expect(computeDailySalesHistory(bills, 'p2', 28)).toBeUndefined()
  })

  it('ignores cancelled bills when checking eligibility and totals', () => {
    const bills = [billFor('p1', 5, 40, 'cancelled')]
    expect(computeDailySalesHistory(bills, 'p1', 28)).toBeUndefined()
  })

  it('returns a chronological, zero-filled daily series once enough real history exists', () => {
    // First bill 40 days ago clears the 28-day eligibility gate; one more bill 3 days ago.
    const bills = [billFor('p1', 5, 40), billFor('p1', 7, 3)]
    const series = computeDailySalesHistory(bills, 'p1', 28)

    expect(series).toBeDefined()
    expect(series).toHaveLength(28)
    // Day index 24 (28 - 4, 0-indexed) corresponds to 3 days ago (i=1 is yesterday, ..., i=28 is 28 days ago,
    // series[0] is oldest (28 days ago) through series[27] is newest (yesterday)); the bill placed 3 days
    // ago should be the only nonzero entry, and everything else should be a real zero.
    const nonZeroEntries = series!.filter((v) => v !== 0)
    expect(nonZeroEntries).toEqual([7])
  })
})

describe('averageDailyUsage', () => {
  it('returns 0 for an empty series', () => {
    expect(averageDailyUsage([])).toBe(0)
  })

  it('averages a flat series', () => {
    expect(averageDailyUsage([2, 4, 6])).toBe(4)
  })

  it('averages a zero-padded series correctly', () => {
    const series = [0, 0, 0, 12]
    expect(averageDailyUsage(series)).toBe(3)
  })
})
