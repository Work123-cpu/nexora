import { describe, it, expect } from 'vitest'
import { mapSalesHistoryCsvRow } from './salesHistoryCsvMapper'
import type { Product } from '@/types/entities/product'
import type { Warehouse } from '@/types/entities/warehouse'

const product: Product = {
  id: 'p1',
  sku: 'SKU-1',
  name: 'Cashew Cookies',
  category: 'Bakery',
  description: '',
  unitOfMeasure: 'unit',
  unitPrice: 25,
  unitCost: 12,
  status: 'active',
  hasBOM: true,
  accentColor: '#000',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const warehouse: Warehouse = {
  id: 'w1',
  name: 'Main Warehouse',
  code: 'WH-1',
  type: 'finished-goods',
  city: '',
  state: '',
  country: '',
  managerName: '',
  capacityUnits: 0,
  usedUnits: 0,
  status: 'operational',
}

const products = [product]
const warehouses = [warehouse]

function row(overrides: Partial<Record<'Product' | 'Date' | 'Quantity' | 'Unit Price', string>> = {}) {
  return { Product: 'Cashew Cookies', Date: '2026-01-05', Quantity: '10', 'Unit Price': '', ...overrides }
}

describe('mapSalesHistoryCsvRow', () => {
  it('maps a valid row into a backdated BillInput', () => {
    const result = mapSalesHistoryCsvRow(row(), products, warehouses)
    expect('input' in result).toBe(true)
    if ('input' in result) {
      expect(result.input.warehouseId).toBe('w1')
      expect(result.input.items).toEqual([{ productId: 'p1', quantity: 10, unitPrice: 25 }])
      expect(result.input.createdAt).toBe('2026-01-05T12:00:00.000Z')
    }
  })

  it('falls back to the product price when Unit Price is blank', () => {
    const result = mapSalesHistoryCsvRow(row({ 'Unit Price': '' }), products, warehouses)
    if ('input' in result) expect(result.input.items[0]!.unitPrice).toBe(25)
    else throw new Error('expected input')
  })

  it('uses the provided Unit Price when present', () => {
    const result = mapSalesHistoryCsvRow(row({ 'Unit Price': '30' }), products, warehouses)
    if ('input' in result) expect(result.input.items[0]!.unitPrice).toBe(30)
    else throw new Error('expected input')
  })

  it('errors on an unknown product name', () => {
    const result = mapSalesHistoryCsvRow(row({ Product: 'Nonexistent Product' }), products, warehouses)
    expect('error' in result).toBe(true)
  })

  it('errors on a malformed date', () => {
    const result = mapSalesHistoryCsvRow(row({ Date: '01/05/2026' }), products, warehouses)
    expect('error' in result).toBe(true)
  })

  it('errors on a future date', () => {
    const result = mapSalesHistoryCsvRow(row({ Date: '2099-01-01' }), products, warehouses)
    expect('error' in result).toBe(true)
  })

  it('errors on a non-positive quantity', () => {
    const result = mapSalesHistoryCsvRow(row({ Quantity: '0' }), products, warehouses)
    expect('error' in result).toBe(true)
  })

  it('errors when no warehouse exists', () => {
    const result = mapSalesHistoryCsvRow(row(), products, [])
    expect('error' in result).toBe(true)
  })
})
