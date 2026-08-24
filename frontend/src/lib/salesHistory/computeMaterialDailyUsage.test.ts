import { describe, it, expect } from 'vitest'
import { computeMaterialDailyUsage } from './computeMaterialDailyUsage'
import type { Bill } from '@/types/entities/bill'
import type { BillOfMaterials } from '@/types/entities/bom'

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function billFor(productId: string, quantity: number, daysAgo: number, status: Bill['status'] = 'completed'): Bill {
  return {
    id: `bill-${productId}-${daysAgo}-${quantity}`,
    billNumber: `B-${productId}-${daysAgo}`,
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

function bomFor(productId: string, rawMaterialId: string, quantityPerUnit: number, scrapPct: number): BillOfMaterials {
  return {
    id: `bom-${productId}`,
    productId,
    version: 'v1',
    materials: [{ rawMaterialId, quantityPerUnit, unit: 'kg', scrapPct }],
    laborCostPerUnit: 0,
    overheadCostPerUnit: 0,
    updatedAt: isoDaysAgo(0),
  }
}

describe('computeMaterialDailyUsage', () => {
  it('returns undefined when no BOM references the material', () => {
    const bills = [billFor('p1', 5, 40)]
    const boms = [bomFor('p1', 'rm-other', 2, 0)]
    expect(computeMaterialDailyUsage(bills, boms, 'rm-1')).toBeUndefined()
  })

  it('returns undefined when the referencing product has insufficient sales history', () => {
    const bills = [billFor('p1', 5, 10)] // only 10 days of history, needs 28
    const boms = [bomFor('p1', 'rm-1', 2, 0)]
    expect(computeMaterialDailyUsage(bills, boms, 'rm-1', 28)).toBeUndefined()
  })

  it('computes usage for a single contributing product, applying scrap %', () => {
    // First bill 40 days ago clears eligibility; 7 units sold 3 days ago -> avg = 7/28 per day.
    const bills = [billFor('p1', 5, 40), billFor('p1', 7, 3)]
    const boms = [bomFor('p1', 'rm-1', 2, 10)] // 2kg per unit, 10% scrap
    const result = computeMaterialDailyUsage(bills, boms, 'rm-1', 28)

    expect(result).toBeDefined()
    const expectedProductAvg = 7 / 28
    expect(result).toBeCloseTo(expectedProductAvg * 2 * 1.1, 6)
  })

  it('sums contributions across multiple products that share the same raw material', () => {
    const bills = [billFor('p1', 5, 40), billFor('p1', 7, 3), billFor('p2', 5, 40), billFor('p2', 3, 2)]
    const boms = [bomFor('p1', 'rm-1', 2, 0), bomFor('p2', 'rm-1', 1, 0)]
    const result = computeMaterialDailyUsage(bills, boms, 'rm-1', 28)

    const p1Avg = 7 / 28
    const p2Avg = 3 / 28
    expect(result).toBeCloseTo(p1Avg * 2 + p2Avg * 1, 6)
  })

  it('skips products with insufficient history while still counting products that qualify', () => {
    const bills = [
      billFor('p1', 5, 40),
      billFor('p1', 7, 3), // p1: 40 days ago, eligible
      billFor('p2', 4, 5), // p2: only 5 days ago, not eligible
    ]
    const boms = [bomFor('p1', 'rm-1', 2, 0), bomFor('p2', 'rm-1', 1, 0)]
    const result = computeMaterialDailyUsage(bills, boms, 'rm-1', 28)

    const p1Avg = 7 / 28
    expect(result).toBeCloseTo(p1Avg * 2, 6)
  })
})
