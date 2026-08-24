import type { RawMaterial, RawMaterialStatus } from '@/types/entities/rawMaterial'
import type { PaginatedResponse, QueryParams } from '@/services/base/types'
import { paginateFilterSort } from '@/services/base/paginate'
import { apiClient } from '@/shared/lib/apiClient'

export interface GetRawMaterialsParams extends QueryParams {
  category?: string
}

export interface RawMaterialInput {
  code: string
  name: string
  category: string
  unit: string
  unitCost: number
  leadTimeDays: number
  isPerishable: boolean
  primaryVendorId: string
  status: RawMaterialStatus
}

interface BackendRawMaterial {
  id: string
  code: string
  name: string
  category: string
  unit: string
  unitCost: number
  leadTimeDays: number
  isPerishable: boolean
  primaryVendorId: string
  status: string
  createdAt: string
}

function fromBackend(rm: BackendRawMaterial): RawMaterial {
  return {
    id: rm.id,
    code: rm.code,
    name: rm.name,
    category: rm.category,
    unit: rm.unit,
    unitCost: rm.unitCost,
    leadTimeDays: rm.leadTimeDays,
    isPerishable: rm.isPerishable,
    primaryVendorId: rm.primaryVendorId,
    status: rm.status as RawMaterialStatus,
    createdAt: rm.createdAt,
  }
}

export const rawMaterialService = {
  getRawMaterials: async (params: GetRawMaterialsParams = {}): Promise<PaginatedResponse<RawMaterial>> => {
    const all = (await apiClient.get<BackendRawMaterial[]>('/raw-materials')).map(fromBackend)
    return paginateFilterSort(all, {
      ...params,
      searchKeys: ['name', 'code', 'category'],
      filter: (rm) => (params.category ? rm.category === params.category : true),
    })
  },

  getRawMaterialById: (id: string): Promise<RawMaterial> => apiClient.get<BackendRawMaterial>(`/raw-materials/${id}`).then(fromBackend),

  createRawMaterial: (input: RawMaterialInput): Promise<RawMaterial> =>
    apiClient.post<BackendRawMaterial>('/raw-materials', input).then(fromBackend),

  updateRawMaterial: (id: string, input: Partial<RawMaterialInput>): Promise<RawMaterial> =>
    apiClient.put<BackendRawMaterial>(`/raw-materials/${id}`, input).then(fromBackend),

  deleteRawMaterial: (id: string): Promise<void> => apiClient.delete(`/raw-materials/${id}`),
}
