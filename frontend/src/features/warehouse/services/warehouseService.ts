import type { Warehouse, WarehouseType } from '@/types/entities/warehouse'
import type { PaginatedResponse, QueryParams } from '@/services/base/types'
import { paginateFilterSort } from '@/services/base/paginate'
import { apiClient } from '@/shared/lib/apiClient'
import { fromBackendInventoryItem, type BackendInventoryItem } from '@/features/inventory/services/inventoryService'

// No usedUnits -- the backend computes it from real inventory on every read, it's never
// something a create/update request can set (see WarehouseService.withComputedUsedUnits).
export interface WarehouseInput {
  name: string
  code: string
  type: WarehouseType
  city: string
  state: string
  country: string
  managerName: string
  capacityUnits: number
  status: Warehouse['status']
}

interface BackendWarehouse {
  id: string
  name: string
  code: string
  type: string
  city: string
  state: string
  country: string
  managerName: string
  capacityUnits: number
  usedUnits: number
  status: string
}

function fromBackend(w: BackendWarehouse): Warehouse {
  return {
    id: w.id,
    name: w.name,
    code: w.code,
    type: w.type as WarehouseType,
    city: w.city,
    state: w.state,
    country: w.country,
    managerName: w.managerName,
    capacityUnits: w.capacityUnits,
    usedUnits: w.usedUnits,
    status: w.status as Warehouse['status'],
  }
}

export const warehouseService = {
  getWarehouses: async (params: QueryParams = {}): Promise<PaginatedResponse<Warehouse>> => {
    const all = (await apiClient.get<BackendWarehouse[]>('/warehouses')).map(fromBackend)
    return paginateFilterSort(all, { ...params, searchKeys: ['name', 'code', 'city'] })
  },

  getWarehouseById: (id: string): Promise<Warehouse> => apiClient.get<BackendWarehouse>(`/warehouses/${id}`).then(fromBackend),

  getInventoryForWarehouse: (warehouseId: string) =>
    apiClient.get<BackendInventoryItem[]>('/inventory', { params: { warehouseId } }).then((list) => list.map(fromBackendInventoryItem)),

  createWarehouse: (input: WarehouseInput): Promise<Warehouse> => apiClient.post<BackendWarehouse>('/warehouses', input).then(fromBackend),

  updateWarehouse: (id: string, input: Partial<WarehouseInput>): Promise<Warehouse> =>
    apiClient.put<BackendWarehouse>(`/warehouses/${id}`, input).then(fromBackend),

  deleteWarehouse: (id: string): Promise<void> => apiClient.delete(`/warehouses/${id}`),
}
