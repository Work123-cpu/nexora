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

export type StockMovementType = 'inbound' | 'outbound' | 'adjustment'

export interface StockMovement {
  id: string
  inventoryItemId: string
  itemName: string
  type: StockMovementType
  quantity: number
  date: string
  reason: string
}
