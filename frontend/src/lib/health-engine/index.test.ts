import { describe, it, expect } from 'vitest'
import { computeBusinessHealth, type BusinessHealthInputs } from './index'
import type { InventoryItem } from '@/types/entities/inventory'
import type { Vendor } from '@/types/entities/vendor'
import type { PurchaseOrder } from '@/types/entities/purchaseOrder'
import type { Bill } from '@/types/entities/bill'

const inventoryItems: InventoryItem[] = [
  {
    id: 'inv-1', itemType: 'rawMaterial', itemId: 'rm-1', itemName: 'Wheat Flour', category: 'Grains', unit: 'kg',
    warehouseId: 'wh-1', quantityOnHand: 20, safetyStock: 50, reorderPoint: 100, reorderQuantity: 200,
    avgDailyUsage: 10, lastRestockedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'inv-2', itemType: 'rawMaterial', itemId: 'rm-2', itemName: 'Sugar', category: 'Sweeteners', unit: 'kg',
    warehouseId: 'wh-1', quantityOnHand: 80, safetyStock: 50, reorderPoint: 100, reorderQuantity: 150,
    avgDailyUsage: 5, lastRestockedAt: '2026-01-01T00:00:00.000Z',
  },
]

const vendors: Vendor[] = [
  {
    id: 'vnd-1', name: 'Golden Grain Co', category: 'Grains', contactName: 'Asha Rao', email: 'asha@goldengrain.test',
    phone: '555-0100', city: 'Pune', country: 'India', rating: 4.2, onTimeDeliveryPct: 92, qualityScorePct: 88,
    leadTimeDays: 5, activeContracts: 2, materialsSupplied: ['Wheat Flour'], status: 'active', createdAt: '2026-01-01T00:00:00.000Z',
  },
]

const purchaseOrders: PurchaseOrder[] = [
  {
    id: 'po-1', poNumber: 'PO-1001', vendorId: 'vnd-1', warehouseId: 'wh-1', status: 'pending_approval',
    items: [{ rawMaterialId: 'rm-1', rawMaterialName: 'Wheat Flour', quantity: 200, unit: 'kg', unitCost: 1.2 }],
    totalAmount: 240, createdAt: '2026-01-01T00:00:00.000Z', expectedDeliveryDate: '2026-01-10T00:00:00.000Z',
    createdBy: 'user-1', timeline: [{ status: 'draft', date: '2026-01-01T00:00:00.000Z' }],
  },
]

const bills: Bill[] = [
  {
    id: 'bill-1', billNumber: 'BILL-1001', warehouseId: 'wh-1', customerName: 'Walk-in Customer', status: 'completed',
    items: [{ productId: 'prod-1', productName: 'Chocolate Cake', quantity: 2, unit: 'unit', unitPrice: 450, lineTotal: 900 }],
    subtotal: 900, taxPct: 5, taxAmount: 45, discountPct: 0, discountAmount: 0, totalAmount: 945,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

const inputs: BusinessHealthInputs = {
  inventoryItems,
  vendors,
  purchaseOrders,
  marketSignals: [],
  bills,
  systemHealth: { databaseHealthy: true, databaseLatencyMs: 5 },
}

describe('computeBusinessHealth', () => {
  it('produces an overall score that is the average of all category scores', () => {
    const health = computeBusinessHealth(inputs)
    const expectedAverage = Math.round(health.categories.reduce((sum, c) => sum + c.score, 0) / health.categories.length)

    expect(health.overallScore).toBe(expectedAverage)
  })

  it('keeps every category score within the valid 0-100 range', () => {
    const health = computeBusinessHealth(inputs)
    for (const category of health.categories) {
      expect(category.score).toBeGreaterThanOrEqual(0)
      expect(category.score).toBeLessThanOrEqual(100)
    }
  })

  it('assigns a status consistent with the score thresholds', () => {
    const health = computeBusinessHealth(inputs)
    for (const category of health.categories) {
      if (category.score >= 88) expect(category.status).toBe('excellent')
      else if (category.score >= 72) expect(category.status).toBe('good')
      else if (category.score >= 55) expect(category.status).toBe('fair')
      else expect(category.status).toBe('poor')
    }
  })

  it('covers all 7 expected health categories exactly once', () => {
    const health = computeBusinessHealth(inputs)
    const keys = health.categories.map((c) => c.key).sort()
    expect(keys).toEqual(['billing', 'database', 'forecast', 'inventory', 'market', 'procurement', 'supplier'])
  })

  it('scores Database Health from the real backend signal, not a hardcoded value', () => {
    const healthyDb = computeBusinessHealth({ ...inputs, systemHealth: { databaseHealthy: true, databaseLatencyMs: 5 } })
    const unhealthyDb = computeBusinessHealth({ ...inputs, systemHealth: { databaseHealthy: false, databaseLatencyMs: 0 } })
    const dbScore = (health: ReturnType<typeof computeBusinessHealth>) => health.categories.find((c) => c.key === 'database')!.score

    expect(dbScore(healthyDb)).toBeGreaterThan(80)
    expect(dbScore(unhealthyDb)).toBeLessThan(30)
  })

  it('scores Billing Health from real bill cancellation rate, not a hardcoded value', () => {
    const cancelledBill: Bill = { ...bills[0]!, id: 'bill-2', status: 'cancelled', cancelledAt: '2026-01-02T00:00:00.000Z' }
    const mostlyCancelled = computeBusinessHealth({ ...inputs, bills: [cancelledBill, cancelledBill, cancelledBill, bills[0]!] })
    const noneCancelled = computeBusinessHealth({ ...inputs, bills: [bills[0]!, bills[0]!] })
    const billingScore = (health: ReturnType<typeof computeBusinessHealth>) => health.categories.find((c) => c.key === 'billing')!.score

    expect(billingScore(mostlyCancelled)).toBeLessThan(billingScore(noneCancelled))
  })

  it('returns a healthy default when a company has no data yet', () => {
    const health = computeBusinessHealth({
      inventoryItems: [],
      vendors: [],
      purchaseOrders: [],
      marketSignals: [],
      bills: [],
      systemHealth: null,
    })
    expect(health.overallScore).toBeGreaterThan(0)
    for (const category of health.categories) {
      expect(category.score).toBeGreaterThanOrEqual(0)
    }
  })
})
