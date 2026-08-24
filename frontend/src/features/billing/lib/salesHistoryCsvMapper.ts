import type { Product } from '@/types/entities/product'
import type { Warehouse } from '@/types/entities/warehouse'
import type { BillInput } from '../services/billService'

export const SALES_HISTORY_CSV_TEMPLATE = {
  filename: 'sales-history-template.csv',
  headers: ['Product', 'Date', 'Quantity', 'Unit Price'],
  exampleRow: (products: Product[]) => [products[0]?.name ?? 'Product name', '2026-01-05', '10', ''],
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** One CSV row = one historical sale: a product, the date it sold, and how many units.
 * `createdBy` is fixed and `warehouseId` defaults to the first warehouse — this import exists to
 * seed sales history for forecasting, not to reconstruct exact original bill details. */
export function mapSalesHistoryCsvRow(
  row: Record<string, string>,
  products: Product[],
  warehouses: Warehouse[],
): { input: BillInput } | { error: string } {
  const productName = row['Product']?.trim()
  if (!productName) return { error: 'Missing product name' }

  const product = products.find((p) => p.name.toLowerCase() === productName.toLowerCase())
  if (!product) return { error: `Unknown product "${productName}". It must match an existing product name exactly.` }

  const dateStr = row['Date']?.trim()
  if (!dateStr || !DATE_PATTERN.test(dateStr)) return { error: 'Date must be in YYYY-MM-DD format' }
  const date = new Date(`${dateStr}T12:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return { error: `Invalid date "${dateStr}"` }
  if (date.getTime() > Date.now()) return { error: `Date "${dateStr}" is in the future` }

  const quantity = Number(row['Quantity'])
  if (!quantity || quantity <= 0) return { error: 'Quantity must be a positive number' }

  const unitPriceRaw = row['Unit Price']?.trim()
  const unitPrice = unitPriceRaw ? Number(unitPriceRaw) : product.unitPrice
  if (!Number.isFinite(unitPrice) || unitPrice < 0) return { error: 'Unit Price must be a non-negative number' }

  const warehouse = warehouses[0]
  if (!warehouse) return { error: 'No warehouse exists yet — add a warehouse before importing sales history.' }

  return {
    input: {
      warehouseId: warehouse.id,
      customerName: 'Historical Sale Import',
      items: [{ productId: product.id, quantity, unitPrice }],
      taxPct: 0,
      discountPct: 0,
      createdBy: 'Sales history import',
      createdAt: date.toISOString(),
    },
  }
}
