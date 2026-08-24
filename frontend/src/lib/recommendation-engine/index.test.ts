import { describe, it, expect } from 'vitest'
import { getAllRecommendations, getCriticalRecommendations, getRecommendationsByCategory, type RecommendationInputs } from './index'
import type { RawMaterial } from '@/types/entities/rawMaterial'
import type { Vendor } from '@/types/entities/vendor'
import type { InventoryItem } from '@/types/entities/inventory'

const rawMaterials: RawMaterial[] = [
  {
    id: 'rm-1', code: 'RM-001', name: 'Wheat Flour', category: 'Grains', unit: 'kg', unitCost: 1.2,
    leadTimeDays: 5, isPerishable: false, primaryVendorId: 'vnd-1', status: 'active', createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'rm-2', code: 'RM-002', name: 'Sugar', category: 'Sweeteners', unit: 'kg', unitCost: 0.8,
    leadTimeDays: 3, isPerishable: false, primaryVendorId: 'vnd-1', status: 'active', createdAt: '2026-01-01T00:00:00.000Z',
  },
]

const vendors: Vendor[] = [
  {
    id: 'vnd-1', name: 'Golden Grain Co', category: 'Grains', contactName: 'Asha Rao', email: 'asha@goldengrain.test',
    phone: '555-0100', city: 'Pune', country: 'India', rating: 4.2, onTimeDeliveryPct: 60, qualityScorePct: 70,
    leadTimeDays: 5, activeContracts: 2, materialsSupplied: ['Wheat Flour'], status: 'under-review', createdAt: '2026-01-01T00:00:00.000Z',
  },
]

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

const liveMarketSignals: RecommendationInputs['marketSignals'] = [
  { name: 'Wheat', changePct: 7.2, matchedMaterials: [rawMaterials[0]!.name] },
]

const inputs: RecommendationInputs = { inventoryItems, rawMaterials, vendors, marketSignals: liveMarketSignals, products: [], boms: [], bills: [] }

describe('getAllRecommendations', () => {
  it('sorts strictly by severity, most severe first', () => {
    const weight = { critical: 4, high: 3, medium: 2, low: 1, info: 0 } as const
    const recs = getAllRecommendations(inputs)

    for (let i = 1; i < recs.length; i++) {
      expect(weight[recs[i - 1]!.severity]).toBeGreaterThanOrEqual(weight[recs[i]!.severity])
    }
  })

  it('gives every recommendation a confidence score between 0 and 100', () => {
    for (const rec of getAllRecommendations(inputs)) {
      expect(rec.confidenceScore).toBeGreaterThanOrEqual(0)
      expect(rec.confidenceScore).toBeLessThanOrEqual(100)
    }
  })

  it('only produces a market-impact recommendation when there is a live market signal for a used raw material', () => {
    const recs = getRecommendationsByCategory(inputs, 'market-impact')
    expect(recs).toHaveLength(1)
    expect(recs[0]!.entityName).toBe(rawMaterials[0]!.name)
  })

  it('returns no market-impact recommendations when there are no live market signals', () => {
    const noSignalInputs: RecommendationInputs = { inventoryItems: [], vendors: [], rawMaterials, marketSignals: [], products: [], boms: [], bills: [] }
    expect(getRecommendationsByCategory(noSignalInputs, 'market-impact')).toEqual([])
  })

  it('ignores live market signals below the significant-move threshold', () => {
    const tinyMoveInputs: RecommendationInputs = {
      inventoryItems: [],
      vendors: [],
      rawMaterials,
      marketSignals: [{ name: 'Wheat', changePct: 0.4, matchedMaterials: [rawMaterials[0]!.name] }],
      products: [],
      boms: [],
      bills: [],
    }
    expect(getRecommendationsByCategory(tinyMoveInputs, 'market-impact')).toEqual([])
  })
})

describe('getCriticalRecommendations', () => {
  it('only includes critical or high severity recommendations', () => {
    for (const rec of getCriticalRecommendations(inputs)) {
      expect(['critical', 'high']).toContain(rec.severity)
    }
  })
})
