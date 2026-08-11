import { describe, it, expect } from 'vitest'
import { getAllRecommendations, getCriticalRecommendations, getRecommendationsByCategory, type RecommendationInputs } from './index'
import { rawMaterials } from '@/mocks/seed/rawMaterials.seed'
import { inventoryItems } from '@/mocks/seed/inventory.seed'
import { vendors } from '@/mocks/seed/vendors.seed'

const liveMarketSignals: RecommendationInputs['marketSignals'] = [
  { name: 'Wheat', changePct: 7.2, matchedMaterials: [rawMaterials[0]!.name] },
]

const inputs: RecommendationInputs = { inventoryItems, rawMaterials, vendors, marketSignals: liveMarketSignals }

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
    const noSignalInputs: RecommendationInputs = { inventoryItems: [], vendors: [], rawMaterials, marketSignals: [] }
    expect(getRecommendationsByCategory(noSignalInputs, 'market-impact')).toEqual([])
  })

  it('ignores live market signals below the significant-move threshold', () => {
    const tinyMoveInputs: RecommendationInputs = {
      inventoryItems: [],
      vendors: [],
      rawMaterials,
      marketSignals: [{ name: 'Wheat', changePct: 0.4, matchedMaterials: [rawMaterials[0]!.name] }],
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
