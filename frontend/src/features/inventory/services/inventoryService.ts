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

export interface BackendStockMovement {
  id: string
  itemType: string
  itemId: string
  itemName: string
  warehouseId: string
  quantity: number
  unit: string
  source: string
  sourceReferenceId?: string
  createdAt: string
}

function fromBackendMovement(m: BackendStockMovement): StockMovement {
  return {
    id: m.id,
    itemType: m.itemType as InventoryItemType,
    itemId: m.itemId,
    itemName: m.itemName,
    warehouseId: m.warehouseId,
    quantity: m.quantity,
    unit: m.unit,
    source: m.source as StockMovement['source'],
    sourceReferenceId: m.sourceReferenceId,
    createdAt: m.createdAt,
  }
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

  getMovements: (itemId: string): Promise<StockMovement[]> =>
    apiClient.get<BackendStockMovement[]>(`/inventory/movements/by-item/${itemId}`).then((rows) => rows.map(fromBackendMovement)),

  /** Company-wide, admin-only — every stock addition, for the Stock Movements report. */
  getAllMovements: (): Promise<StockMovement[]> =>
    apiClient.get<BackendStockMovement[]>('/inventory/movements').then((rows) => rows.map(fromBackendMovement)),

  // Trend charts aren't modeled on the backend yet — report no trend rather than fabricating one.
  getTrend: async (_inventoryItemId: string): Promise<undefined> => undefined,

  createInventoryItem: (input: InventoryItemInput): Promise<InventoryItem> =>
    apiClient.post<BackendInventoryItem>('/inventory', input).then(fromBackendInventoryItem),

  adjustInventoryItem: (id: string, input: InventoryAdjustInput): Promise<InventoryItem> =>
    apiClient.put<BackendInventoryItem>(`/inventory/${id}`, input).then(fromBackendInventoryItem),
}
