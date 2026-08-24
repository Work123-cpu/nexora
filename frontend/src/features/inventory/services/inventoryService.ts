import type { InventoryItem, InventoryItemType, StockMovement } from '@/types/entities/inventory'
import type { PaginatedResponse, QueryParams } from '@/services/base/types'
import { paginateFilterSort } from '@/services/base/paginate'
import { apiClient } from '@/shared/lib/apiClient'

export interface GetInventoryParams extends QueryParams {
  itemType?: InventoryItemType
  warehouseId?: string
  lowStockOnly?: boolean
}

export interface InventoryItemInput {
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
}

export interface InventoryAdjustInput {
  quantityOnHand: number
  safetyStock: number
  reorderPoint: number
  reorderQuantity: number
  avgDailyUsage: number
}

export interface BackendInventoryItem {
  id: string
  itemType: string
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

/** Exported so warehouseService's getInventoryForWarehouse can reuse this without duplicating the mapping. */
export function fromBackendInventoryItem(item: BackendInventoryItem): InventoryItem {
  return {
    id: item.id,
    itemType: item.itemType as InventoryItemType,
    itemId: item.itemId,
    itemName: item.itemName,
    category: item.category,
    unit: item.unit,
    warehouseId: item.warehouseId,
    quantityOnHand: item.quantityOnHand,
    safetyStock: item.safetyStock,
    reorderPoint: item.reorderPoint,
    reorderQuantity: item.reorderQuantity,
    avgDailyUsage: item.avgDailyUsage,
    lastRestockedAt: item.lastRestockedAt,
  }
}

export const inventoryService = {
  getInventoryItems: async (params: GetInventoryParams = {}): Promise<PaginatedResponse<InventoryItem>> => {
    const all = (
      await apiClient.get<BackendInventoryItem[]>('/inventory', { params: { warehouseId: params.warehouseId } })
    ).map(fromBackendInventoryItem)
    return paginateFilterSort(all, {
      ...params,
      searchKeys: ['itemName', 'category'],
      filter: (item) =>
        (params.itemType ? item.itemType === params.itemType : true) &&
        (params.lowStockOnly ? item.quantityOnHand <= item.reorderPoint : true),
    })
  },

  getInventoryItemById: (id: string): Promise<InventoryItem> =>
    apiClient.get<BackendInventoryItem>(`/inventory/${id}`).then(fromBackendInventoryItem),

  // Stock movement history and trend charts aren't modeled on the backend yet — report no history
  // rather than fabricating one. Revisit once the backend logs per-transaction movements.
  getMovements: async (_inventoryItemId: string): Promise<StockMovement[]> => [],

  getTrend: async (_inventoryItemId: string): Promise<undefined> => undefined,

  createInventoryItem: (input: InventoryItemInput): Promise<InventoryItem> =>
    apiClient.post<BackendInventoryItem>('/inventory', input).then(fromBackendInventoryItem),

  adjustInventoryItem: (id: string, input: InventoryAdjustInput): Promise<InventoryItem> =>
    apiClient.put<BackendInventoryItem>(`/inventory/${id}`, input).then(fromBackendInventoryItem),
}
