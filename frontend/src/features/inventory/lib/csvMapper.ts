import type { InventoryItemType } from '@/types/entities/inventory'

export const INVENTORY_CSV_TEMPLATE = {
  filename: 'inventory-bulk-upload-template.csv',
  headers: ['itemType', 'itemName', 'warehouseName', 'quantityOnHand', 'safetyStock', 'reorderPoint', 'reorderQuantity', 'avgDailyUsage'],
  exampleRow: (warehouseName: string) => ['product', 'Sample Product', warehouseName, '100', '20', '', '', ''],
}

/** itemName/warehouseName are resolved to real ids at import time (see InventoryDashboardPage) —
 * the item and warehouse must already exist, since an inventory record can't stand on its own.
 * reorderPoint/reorderQuantity/avgDailyUsage are optional: leave them blank in the CSV and
 * they're forecasted automatically the same way Add Stock does it, from real sales history. */
export interface InventoryCsvInput {
  itemType: InventoryItemType
  itemName: string
  warehouseName: string
  quantityOnHand: number
  safetyStock: number
  reorderPoint?: number
  reorderQuantity?: number
  avgDailyUsage?: number
}

export function mapInventoryCsvRow(row: Record<string, string>): { input: InventoryCsvInput } | { error: string } {
  const typeRaw = row.itemType?.trim().toLowerCase()
  if (typeRaw !== 'product' && typeRaw !== 'rawmaterial') return { error: 'itemType must be "product" or "rawMaterial"' }
  const itemType: InventoryItemType = typeRaw === 'product' ? 'product' : 'rawMaterial'

  const itemName = row.itemName?.trim()
  if (!itemName) return { error: 'Missing itemName' }

  const warehouseName = row.warehouseName?.trim()
  if (!warehouseName) return { error: 'Missing warehouseName' }

  const quantityOnHand = Number(row.quantityOnHand)
  if (!Number.isFinite(quantityOnHand) || quantityOnHand < 0) return { error: 'Invalid quantityOnHand' }

  const safetyStock = row.safetyStock?.trim() ? Number(row.safetyStock) : 0
  if (!Number.isFinite(safetyStock) || safetyStock < 0) return { error: 'Invalid safetyStock' }

  const reorderPoint = row.reorderPoint?.trim() ? Number(row.reorderPoint) : undefined
  if (reorderPoint !== undefined && (!Number.isFinite(reorderPoint) || reorderPoint < 0)) return { error: 'Invalid reorderPoint' }

  const reorderQuantity = row.reorderQuantity?.trim() ? Number(row.reorderQuantity) : undefined
  if (reorderQuantity !== undefined && (!Number.isFinite(reorderQuantity) || reorderQuantity < 0)) return { error: 'Invalid reorderQuantity' }

  const avgDailyUsage = row.avgDailyUsage?.trim() ? Number(row.avgDailyUsage) : undefined
  if (avgDailyUsage !== undefined && (!Number.isFinite(avgDailyUsage) || avgDailyUsage < 0)) return { error: 'Invalid avgDailyUsage' }

  return { input: { itemType, itemName, warehouseName, quantityOnHand, safetyStock, reorderPoint, reorderQuantity, avgDailyUsage } }
}
