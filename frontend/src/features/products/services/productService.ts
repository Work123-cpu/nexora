import type { Product, ProductStatus } from '@/types/entities/product'
import type { PaginatedResponse, QueryParams } from '@/services/base/types'
import { paginateFilterSort } from '@/services/base/paginate'
import { apiClient } from '@/shared/lib/apiClient'

export interface GetProductsParams extends QueryParams {
  category?: string
  status?: ProductStatus
}

export interface ProductInput {
  name: string
  category: string
  description: string
  unitOfMeasure: string
  unitPrice: number
  unitCost: number
  status: ProductStatus
}

interface BackendProduct {
  id: string
  sku: string
  name: string
  category: string
  description: string
  unitOfMeasure: string
  unitPrice: number
  unitCost: number
  status: string
  accentColor: string
  createdAt: string
  updatedAt: string
}

/** BOM linkage isn't wired to the real backend yet (see PROJECT_ROADMAP.md Phase 3 notes) — always report hasBOM: false; callers that need to know cross-reference the live BOM list directly instead (see BomForm.tsx). */
function fromBackend(p: BackendProduct): Product {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    description: p.description,
    unitOfMeasure: p.unitOfMeasure,
    unitPrice: p.unitPrice,
    unitCost: p.unitCost,
    status: p.status.toLowerCase() as ProductStatus,
    hasBOM: false,
    accentColor: p.accentColor,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }
}

function toBackendInput(input: ProductInput) {
  return { ...input, status: input.status.toUpperCase() }
}

export const productService = {
  getProducts: async (params: GetProductsParams = {}): Promise<PaginatedResponse<Product>> => {
    const all = (await apiClient.get<BackendProduct[]>('/products')).map(fromBackend)
    return paginateFilterSort(all, {
      ...params,
      searchKeys: ['name', 'sku', 'category'],
      filter: (p) => (params.category ? p.category === params.category : true) && (params.status ? p.status === params.status : true),
    })
  },

  getProductById: (id: string): Promise<Product> => apiClient.get<BackendProduct>(`/products/${id}`).then(fromBackend),

  createProduct: (input: ProductInput): Promise<Product> =>
    apiClient.post<BackendProduct>('/products', toBackendInput(input)).then(fromBackend),

  updateProduct: (id: string, input: Partial<ProductInput>): Promise<Product> =>
    apiClient.put<BackendProduct>(`/products/${id}`, toBackendInput(input as ProductInput)).then(fromBackend),

  deleteProduct: (id: string): Promise<void> => apiClient.delete(`/products/${id}`),
}
