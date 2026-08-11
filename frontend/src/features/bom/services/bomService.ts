import type { BillOfMaterials, BOMLineItem } from '@/types/entities/bom'
import type { PaginatedResponse, QueryParams } from '@/services/base/types'
import { mockClient, paginateFilterSort, findOrThrow, insertMock, updateMock, removeMock } from '@/services/base/mockClient'
import { billsOfMaterials } from '@/mocks/seed/bom.seed'
import { getProductById, products } from '@/mocks/seed/products.seed'
import { makeIdFactory } from '@/mocks/generators/idGenerator'
import { apiClient } from '@/shared/lib/apiClient'

const nextId = makeIdFactory('bom-new')

/** Flip to "false" once the Spring Boot backend (backend/) is running — see AuthContext.tsx. */
const USE_MOCK_BACKEND = import.meta.env.VITE_USE_MOCK_BACKEND !== 'false'

export interface BomInput {
  productId: string
  version: string
  materials: BOMLineItem[]
  laborCostPerUnit: number
  overheadCostPerUnit: number
  notes?: string
}

interface BomWithProductName extends BillOfMaterials {
  productName: string
}

interface BackendBom {
  id: string
  productId: string
  version: string
  materials: BOMLineItem[]
  laborCostPerUnit: number
  overheadCostPerUnit: number
  updatedAt: string
  notes?: string
}

function fromBackend(bom: BackendBom): BillOfMaterials {
  return {
    id: bom.id,
    productId: bom.productId,
    version: bom.version,
    materials: bom.materials,
    laborCostPerUnit: bom.laborCostPerUnit,
    overheadCostPerUnit: bom.overheadCostPerUnit,
    updatedAt: bom.updatedAt,
    notes: bom.notes,
  }
}

function withProductName(bom: BillOfMaterials): BomWithProductName {
  return { ...bom, productName: getProductById(bom.productId)?.name ?? 'Unknown product' }
}

const mockBomService = {
  getBOMs: (params: QueryParams = {}): Promise<PaginatedResponse<BomWithProductName>> =>
    mockClient.request(() => {
      const enriched = billsOfMaterials.map(withProductName)
      return paginateFilterSort(enriched, { ...params, searchKeys: ['productName', 'version'] })
    }),

  getBOMById: (id: string): Promise<BomWithProductName> =>
    mockClient.request(() => withProductName(findOrThrow(billsOfMaterials, id))),

  createBOM: (input: BomInput): Promise<BillOfMaterials> =>
    mockClient.request(() => {
      const bom: BillOfMaterials = { id: nextId(), updatedAt: new Date().toISOString(), ...input }
      const product = products.find((p) => p.id === input.productId)
      if (product) product.hasBOM = true
      return insertMock(billsOfMaterials, bom)
    }),

  updateBOM: (id: string, input: Partial<BomInput>): Promise<BillOfMaterials> =>
    mockClient.request(() => updateMock(billsOfMaterials, id, { ...input, updatedAt: new Date().toISOString() })),

  deleteBOM: (id: string): Promise<void> => mockClient.request(() => removeMock(billsOfMaterials, id)),
}

const httpBomService = {
  getBOMs: async (params: QueryParams = {}): Promise<PaginatedResponse<BomWithProductName>> => {
    const enriched = (await apiClient.get<BackendBom[]>('/bom')).map(fromBackend).map(withProductName)
    return paginateFilterSort(enriched, { ...params, searchKeys: ['productName', 'version'] })
  },

  getBOMById: (id: string): Promise<BomWithProductName> =>
    apiClient.get<BackendBom>(`/bom/${id}`).then(fromBackend).then(withProductName),

  createBOM: (input: BomInput): Promise<BillOfMaterials> => apiClient.post<BackendBom>('/bom', input).then(fromBackend),

  updateBOM: (id: string, input: Partial<BomInput>): Promise<BillOfMaterials> =>
    apiClient.put<BackendBom>(`/bom/${id}`, input).then(fromBackend),

  deleteBOM: (id: string): Promise<void> => apiClient.delete(`/bom/${id}`),
}

export const bomService = USE_MOCK_BACKEND ? mockBomService : httpBomService
