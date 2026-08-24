import { describe, it, expect } from 'vitest'
import { computeMissingBomRecommendations } from './missingBom.rule'
import type { Product } from '@/types/entities/product'
import type { BillOfMaterials } from '@/types/entities/bom'
import type { Bill } from '@/types/entities/bill'

function product(id: string, name: string): Product {
  return { id, sku: `SKU-${id}`, name, category: 'Bakery', description: '', unitOfMeasure: 'unit', unitPrice: 10, unitCost: 5, status: 'active', hasBOM: false, accentColor: '#000', createdAt: '', updatedAt: '' }
}

function billFor(productId: string): Bill {
  return {
    id: `bill-${productId}`,
    billNumber: `B-${productId}`,
    warehouseId: 'w1',
    customerName: 'Test Customer',
    status: 'completed',
    items: [{ productId, productName: 'x', quantity: 1, unit: 'unit', unitPrice: 10, lineTotal: 10 }],
    subtotal: 10,
    taxPct: 0,
    taxAmount: 0,
    discountPct: 0,
    discountAmount: 0,
    totalAmount: 10,
    createdAt: new Date().toISOString(),
  }
}

function bomFor(productId: string): BillOfMaterials {
  return { id: `bom-${productId}`, productId, version: 'v1.0', materials: [], laborCostPerUnit: 0, overheadCostPerUnit: 0, updatedAt: '' }
}

describe('computeMissingBomRecommendations', () => {
  it('returns nothing when there are no products, bills, or BOMs', () => {
    expect(computeMissingBomRecommendations([], [], [])).toEqual([])
  })

  it('flags a product that has been billed but has no BOM', () => {
    const cake = product('p1', 'Cake')
    const recs = computeMissingBomRecommendations([cake], [], [billFor('p1')])

    expect(recs).toHaveLength(1)
    expect(recs[0]!.entityId).toBe('p1')
    expect(recs[0]!.entityName).toBe('Cake')
  })

  it('does not flag a product that already has a BOM, even if it has been billed', () => {
    const cake = product('p1', 'Cake')
    const recs = computeMissingBomRecommendations([cake], [bomFor('p1')], [billFor('p1')])

    expect(recs).toEqual([])
  })

  it('does not flag a product that has never been billed, even without a BOM', () => {
    const untouched = product('p2', 'Untouched Product')
    const recs = computeMissingBomRecommendations([untouched], [], [])

    expect(recs).toEqual([])
  })
})
