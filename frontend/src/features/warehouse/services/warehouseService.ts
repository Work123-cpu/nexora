import type { Warehouse, WarehouseType } from '@/types/entities/warehouse'
import type { PaginatedResponse, QueryParams } from '@/services/base/types'
import { mockClient, paginateFilterSort, findOrThrow, insertMock, updateMock, removeMock } from '@/services/base/mockClient'
import { warehouses } from '@/mocks/seed/warehouses.seed'
import { inventoryItems } from '@/mocks/seed/inventory.seed'
import { makeIdFactory } from '@/mocks/generators/idGenerator'
import { apiClient } from '@/shared/lib/apiClient'
import { fromBackendInventoryItem, type BackendInventoryItem } from '@/features/inventory/services/inventoryService'

const nextId = makeIdFactory('wh-new')

/** Flip to "false" once the Spring Boot backend (backend/) is running — see AuthContext.tsx. */
const USE_MOCK_BACKEND = import.meta.env.VITE_USE_MOCK_BACKEND !== 'false'

export interface WarehouseInput {
  name: string
  code: string
  type: WarehouseType
  city: string
  state: string
  country: string
  managerName: string
  capacityUnits: number
  usedUnits: number
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

const mockWarehouseService = {
  getWarehouses: (params: QueryParams = {}): Promise<PaginatedResponse<Warehouse>> =>
    mockClient.request(() => paginateFilterSort(warehouses, { ...params, searchKeys: ['name', 'code', 'city'] })),

  getWarehouseById: (id: string): Promise<Warehouse> => mockClient.request(() => findOrThrow(warehouses, id)),

  getInventoryForWarehouse: (warehouseId: string) =>
    mockClient.request(() => inventoryItems.filter((item) => item.warehouseId === warehouseId)),

  createWarehouse: (input: WarehouseInput): Promise<Warehouse> =>
    mockClient.request(() => {
      const warehouse: Warehouse = { id: nextId(), ...input }
      return insertMock(warehouses, warehouse)
    }),

  updateWarehouse: (id: string, input: Partial<WarehouseInput>): Promise<Warehouse> =>
    mockClient.request(() => updateMock<Warehouse>(warehouses, id, input)),

  deleteWarehouse: (id: string): Promise<void> => mockClient.request(() => removeMock(warehouses, id)),
}

const httpWarehouseService = {
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

export const warehouseService = USE_MOCK_BACKEND ? mockWarehouseService : httpWarehouseService
