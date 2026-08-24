import type { BillOfMaterials, BOMLineItem } from '@/types/entities/bom'
import type { PaginatedResponse, QueryParams } from '@/services/base/types'
import { paginateFilterSort } from '@/services/base/paginate'
import { apiClient } from '@/shared/lib/apiClient'
import { productService } from '@/features/products/services/productService'

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

function withProductName(bom: BillOfMaterials, nameById: Map<string, string>): BomWithProductName {
  return { ...bom, productName: nameById.get(bom.productId) ?? 'Unknown product' }
}

function buildProductNameMap(items: { id: string; name: string }[]): Map<string, string> {
  return new Map(items.map((p) => [p.id, p.name]))
}

export const bomService = {
  getBOMs: async (params: QueryParams = {}): Promise<PaginatedResponse<BomWithProductName>> => {
    const [boms, productsResult] = await Promise.all([
      apiClient.get<BackendBom[]>('/bom').then((list) => list.map(fromBackend)),
      productService.getProducts({ pageSize: 10000 }),
    ])
    const nameById = buildProductNameMap(productsResult.items)
    const enriched = boms.map((b) => withProductName(b, nameById))
    return paginateFilterSort(enriched, { ...params, searchKeys: ['productName', 'version'] })
  },

  getBOMById: async (id: string): Promise<BomWithProductName> => {
    const [bom, productsResult] = await Promise.all([
      apiClient.get<BackendBom>(`/bom/${id}`).then(fromBackend),
      productService.getProducts({ pageSize: 10000 }),
    ])
    return withProductName(bom, buildProductNameMap(productsResult.items))
  },

  createBOM: (input: BomInput): Promise<BillOfMaterials> => apiClient.post<BackendBom>('/bom', input).then(fromBackend),

  updateBOM: (id: string, input: Partial<BomInput>): Promise<BillOfMaterials> =>
    apiClient.put<BackendBom>(`/bom/${id}`, input).then(fromBackend),

  deleteBOM: (id: string): Promise<void> => apiClient.delete(`/bom/${id}`),
}
