import type { Product, ProductStatus } from '@/types/entities/product'
import type { PaginatedResponse, QueryParams } from '@/services/base/types'
import { mockClient, paginateFilterSort, findOrThrow, insertMock, updateMock, removeMock } from '@/services/base/mockClient'
import { products } from '@/mocks/seed/products.seed'
import { billsOfMaterials } from '@/mocks/seed/bom.seed'
import { makeIdFactory } from '@/mocks/generators/idGenerator'
import { apiClient } from '@/shared/lib/apiClient'

const nextId = makeIdFactory('prod-new')

/** Flip to "false" once the Spring Boot backend (backend/) is running — see AuthContext.tsx. */
const USE_MOCK_BACKEND = import.meta.env.VITE_USE_MOCK_BACKEND !== 'false'

/**
 * hasBOM is computed live from billsOfMaterials rather than trusted from the
 * stored flag — bom.seed.ts mutates products.seed.ts's hasBOM field as a
 * side effect at module init, but that only fires once bom.seed.ts is
 * actually imported somewhere in the loaded route chunk, which lazy-loaded
 * routes don't guarantee. Computing it here keeps it correct regardless of
 * which page loaded first.
 */
function withComputedHasBOM(product: Product): Product {
  return { ...product, hasBOM: billsOfMaterials.some((b) => b.productId === product.id) }
}

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

/** BOM linkage isn't wired to the real backend yet (see PROJECT_ROADMAP.md Phase 3 notes) — real-backend products always report hasBOM: false rather than checking the mock BOM array against a different data source. */
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

const mockProductService = {
  getProducts: (params: GetProductsParams = {}): Promise<PaginatedResponse<Product>> =>
    mockClient.request(() => {
      const result = paginateFilterSort(products, {
        ...params,
        searchKeys: ['name', 'sku', 'category'],
        filter: (p) => (params.category ? p.category === params.category : true) && (params.status ? p.status === params.status : true),
      })
      return { ...result, items: result.items.map(withComputedHasBOM) }
    }),

  getProductById: (id: string): Promise<Product> => mockClient.request(() => withComputedHasBOM(findOrThrow(products, id))),

  createProduct: (input: ProductInput): Promise<Product> =>
    mockClient.request(() => {
      const now = new Date().toISOString()
      const product: Product = {
        id: nextId(),
        sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        hasBOM: false,
        accentColor: '#4f46e5',
        createdAt: now,
        updatedAt: now,
        ...input,
      }
      return insertMock(products, product)
    }),

  updateProduct: (id: string, input: Partial<ProductInput>): Promise<Product> =>
    mockClient.request(() => updateMock(products, id, { ...input, updatedAt: new Date().toISOString() })),

  deleteProduct: (id: string): Promise<void> => mockClient.request(() => removeMock(products, id)),
}

const httpProductService = {
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

export const productService = USE_MOCK_BACKEND ? mockProductService : httpProductService
