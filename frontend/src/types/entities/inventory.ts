export type InventoryItemType = 'product' | 'rawMaterial'

export interface InventoryItem {
  id: string
  itemType: InventoryItemType
  itemId: string
  itemName: string
  category: string
  unit: string
  warehouseId: string
  quantityOnHand: number
  safetyStock: number
  reorderPoint: number
  reorderQuantity: number
  avgDailyUsage: number
  lastRestockedAt: string
}

export type StockMovementSource = 'po_receipt' | 'manual'

/** Every stock-increasing event — a purchase order marked Received, or a manual "Add Stock"/
 * adjustment entry. Outbound consumption isn't tracked here (that's inferred from bills), so
 * quantity is always positive. */
export interface StockMovement {
  id: string
  itemType: InventoryItemType
  itemId: string
  itemName: string
  warehouseId: string
  quantity: number
  unit: string
  source: StockMovementSource
  sourceReferenceId?: string
  createdAt: string
}
