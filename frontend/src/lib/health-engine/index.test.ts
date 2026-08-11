import { describe, it, expect } from 'vitest'
import { computeBusinessHealth, type BusinessHealthInputs } from './index'
import { inventoryItems } from '@/mocks/seed/inventory.seed'
import { vendors } from '@/mocks/seed/vendors.seed'
import { purchaseOrders } from '@/mocks/seed/purchaseOrders.seed'

const inputs: BusinessHealthInputs = { inventoryItems, vendors, purchaseOrders, marketSignals: [] }

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

  it('returns a healthy default when a company has no data yet', () => {
    const health = computeBusinessHealth({ inventoryItems: [], vendors: [], purchaseOrders: [], marketSignals: [] })
    expect(health.overallScore).toBeGreaterThan(0)
    for (const category of health.categories) {
      expect(category.score).toBeGreaterThanOrEqual(0)
    }
  })
})
