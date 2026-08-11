import { describe, it, expect } from 'vitest'
import { calculateMaterialLineCost, calculateMaterialsCost, calculateTotalUnitCost } from './calculateBomCost'
import { rawMaterials } from '@/mocks/seed/rawMaterials.seed'

describe('calculateMaterialLineCost', () => {
  it('applies scrap percentage on top of the base quantity, priced at the material unit cost', () => {
    const material = rawMaterials[0]!
    const line = { rawMaterialId: material.id, quantityPerUnit: 2, unit: material.unit, scrapPct: 10 }

    const cost = calculateMaterialLineCost(line)

    expect(cost).toBeCloseTo(2 * 1.1 * material.unitCost, 5)
  })

  it('returns 0 for a scrap of 0%, i.e. exactly quantity * unitCost', () => {
    const material = rawMaterials[0]!
    const line = { rawMaterialId: material.id, quantityPerUnit: 5, unit: material.unit, scrapPct: 0 }

    expect(calculateMaterialLineCost(line)).toBeCloseTo(5 * material.unitCost, 5)
  })

  it('returns 0 when the raw material cannot be found (deleted/unknown reference)', () => {
    const line = { rawMaterialId: 'does-not-exist', quantityPerUnit: 10, unit: 'kg', scrapPct: 5 }
    expect(calculateMaterialLineCost(line)).toBe(0)
  })
})

describe('calculateMaterialsCost', () => {
  it('sums every line, matching the sum of individually-computed line costs', () => {
    const lines = rawMaterials.slice(0, 3).map((m) => ({ rawMaterialId: m.id, quantityPerUnit: 1, unit: m.unit, scrapPct: 2 }))
    const expected = lines.reduce((sum, l) => sum + calculateMaterialLineCost(l), 0)

    expect(calculateMaterialsCost(lines)).toBeCloseTo(expected, 5)
  })

  it('returns 0 for an empty materials list', () => {
    expect(calculateMaterialsCost([])).toBe(0)
  })
})

describe('calculateTotalUnitCost', () => {
  it('equals materials cost + labor + overhead, not just one of them', () => {
    const material = rawMaterials[0]!
    const materials = [{ rawMaterialId: material.id, quantityPerUnit: 1, unit: material.unit, scrapPct: 0 }]
    const bom = { materials, laborCostPerUnit: 3, overheadCostPerUnit: 1.5 }

    const total = calculateTotalUnitCost(bom)

    expect(total).toBeCloseTo(material.unitCost + 3 + 1.5, 5)
  })
})
