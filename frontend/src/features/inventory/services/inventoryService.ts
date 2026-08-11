import type { InventoryItem, InventoryItemType } from '@/types/entities/inventory'
import type { PaginatedResponse, QueryParams } from '@/services/base/types'
import { mockClient, paginateFilterSort, findOrThrow, insertMock, updateMock } from '@/services/base/mockClient'
import { inventoryItems } from '@/mocks/seed/inventory.seed'
import { getMovementsForItem } from '@/mocks/seed/stockMovements.seed'
import { getTrendForItem } from '@/mocks/seed/inventoryTrends.seed'
import { makeIdFactory } from '@/mocks/generators/idGenerator'
import { apiClient } from '@/shared/lib/apiClient'
import { ApiError } from '@/services/base/types'

const nextId = makeIdFactory('inv-new')

/** Flip to "false" once the Spring Boot backend (backend/) is running — see AuthContext.tsx. */
const USE_MOCK_BACKEND = import.meta.env.VITE_USE_MOCK_BACKEND !== 'false'

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

const mockInventoryService = {
  getInventoryItems: (params: GetInventoryParams = {}): Promise<PaginatedResponse<InventoryItem>> =>
    mockClient.request(() =>
      paginateFilterSort(inventoryItems, {
        ...params,
        searchKeys: ['itemName', 'category'],
        filter: (item) =>
          (params.itemType ? item.itemType === params.itemType : true) &&
          (params.warehouseId ? item.warehouseId === params.warehouseId : true) &&
          (params.lowStockOnly ? item.quantityOnHand <= item.reorderPoint : true),
      }),
    ),

  getInventoryItemById: (id: string): Promise<InventoryItem> => mockClient.request(() => findOrThrow(inventoryItems, id)),

  getMovements: (inventoryItemId: string) => mockClient.request(() => getMovementsForItem(inventoryItemId)),

  getTrend: (inventoryItemId: string) => mockClient.request(() => getTrendForItem(inventoryItemId)),

  createInventoryItem: (input: InventoryItemInput): Promise<InventoryItem> =>
    mockClient.request(() => {
      const exists = inventoryItems.some(
        (i) => i.itemType === input.itemType && i.itemId === input.itemId && i.warehouseId === input.warehouseId,
      )
      if (exists) throw new ApiError(400, 'This item is already tracked in the selected warehouse — use adjust stock instead.')
      const item: InventoryItem = { id: nextId(), lastRestockedAt: new Date().toISOString(), ...input }
      return insertMock(inventoryItems, item)
    }),

  adjustInventoryItem: (id: string, input: InventoryAdjustInput): Promise<InventoryItem> =>
    mockClient.request(() => updateMock(inventoryItems, id, { ...input, lastRestockedAt: new Date().toISOString() })),
}

const httpInventoryService = {
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

  // Stock movement history and trend charts aren't modeled on the backend yet — fall back to
  // the mock seed's generated history rather than pretending real data exists.
  getMovements: (inventoryItemId: string) => mockClient.request(() => getMovementsForItem(inventoryItemId)),

  getTrend: (inventoryItemId: string) => mockClient.request(() => getTrendForItem(inventoryItemId)),

  createInventoryItem: (input: InventoryItemInput): Promise<InventoryItem> =>
    apiClient.post<BackendInventoryItem>('/inventory', input).then(fromBackendInventoryItem),

  adjustInventoryItem: (id: string, input: InventoryAdjustInput): Promise<InventoryItem> =>
    apiClient.put<BackendInventoryItem>(`/inventory/${id}`, input).then(fromBackendInventoryItem),
}

export const inventoryService = USE_MOCK_BACKEND ? mockInventoryService : httpInventoryService
