import type { Vendor, VendorStatus } from '@/types/entities/vendor'
import type { PaginatedResponse, QueryParams } from '@/services/base/types'
import { mockClient, paginateFilterSort, findOrThrow, insertMock, updateMock, removeMock } from '@/services/base/mockClient'
import { vendors } from '@/mocks/seed/vendors.seed'
import { purchaseOrders } from '@/mocks/seed/purchaseOrders.seed'
import { makeIdFactory } from '@/mocks/generators/idGenerator'
import { apiClient } from '@/shared/lib/apiClient'
import { fromBackendPO, type BackendPurchaseOrder } from '@/features/procurement/services/purchaseOrderService'

const nextId = makeIdFactory('vnd-new')

/** Flip to "false" once the Spring Boot backend (backend/) is running — see AuthContext.tsx. */
const USE_MOCK_BACKEND = import.meta.env.VITE_USE_MOCK_BACKEND !== 'false'

export interface GetVendorsParams extends QueryParams {
  category?: string
  status?: VendorStatus
}

export interface VendorInput {
  name: string
  category: string
  contactName: string
  email: string
  phone: string
  city: string
  country: string
  rating: number
  onTimeDeliveryPct: number
  qualityScorePct: number
  leadTimeDays: number
  activeContracts: number
  materialsSupplied: string[]
  status: VendorStatus
}

interface BackendVendor {
  id: string
  name: string
  category: string
  contactName: string
  email: string
  phone: string
  city: string
  country: string
  rating: number
  onTimeDeliveryPct: number
  qualityScorePct: number
  leadTimeDays: number
  activeContracts: number
  materialsSupplied: string[]
  status: string
  createdAt: string
}

function fromBackend(v: BackendVendor): Vendor {
  return {
    id: v.id,
    name: v.name,
    category: v.category,
    contactName: v.contactName,
    email: v.email,
    phone: v.phone,
    city: v.city,
    country: v.country,
    rating: v.rating,
    onTimeDeliveryPct: v.onTimeDeliveryPct,
    qualityScorePct: v.qualityScorePct,
    leadTimeDays: v.leadTimeDays,
    activeContracts: v.activeContracts,
    materialsSupplied: v.materialsSupplied,
    status: v.status as VendorStatus,
    createdAt: v.createdAt,
  }
}

const mockVendorService = {
  getVendors: (params: GetVendorsParams = {}): Promise<PaginatedResponse<Vendor>> =>
    mockClient.request(() =>
      paginateFilterSort(vendors, {
        ...params,
        searchKeys: ['name', 'category', 'city'],
        filter: (v) => (params.category ? v.category === params.category : true) && (params.status ? v.status === params.status : true),
      }),
    ),

  getVendorById: (id: string): Promise<Vendor> => mockClient.request(() => findOrThrow(vendors, id)),

  getPurchaseOrdersForVendor: (vendorId: string) => mockClient.request(() => purchaseOrders.filter((po) => po.vendorId === vendorId)),

  createVendor: (input: VendorInput): Promise<Vendor> =>
    mockClient.request(() => {
      const vendor: Vendor = {
        id: nextId(),
        createdAt: new Date().toISOString(),
        ...input,
      }
      return insertMock(vendors, vendor)
    }),

  updateVendor: (id: string, input: Partial<VendorInput>): Promise<Vendor> =>
    mockClient.request(() => updateMock<Vendor>(vendors, id, input)),

  deleteVendor: (id: string): Promise<void> => mockClient.request(() => removeMock(vendors, id)),
}

const httpVendorService = {
  getVendors: async (params: GetVendorsParams = {}): Promise<PaginatedResponse<Vendor>> => {
    const all = (await apiClient.get<BackendVendor[]>('/vendors')).map(fromBackend)
    return paginateFilterSort(all, {
      ...params,
      searchKeys: ['name', 'category', 'city'],
      filter: (v) => (params.category ? v.category === params.category : true) && (params.status ? v.status === params.status : true),
    })
  },

  getVendorById: (id: string): Promise<Vendor> => apiClient.get<BackendVendor>(`/vendors/${id}`).then(fromBackend),

  getPurchaseOrdersForVendor: (vendorId: string) =>
    apiClient.get<BackendPurchaseOrder[]>('/purchase-orders', { params: { vendorId } }).then((list) => list.map(fromBackendPO)),

  createVendor: (input: VendorInput): Promise<Vendor> => apiClient.post<BackendVendor>('/vendors', input).then(fromBackend),

  updateVendor: (id: string, input: Partial<VendorInput>): Promise<Vendor> =>
    apiClient.put<BackendVendor>(`/vendors/${id}`, input).then(fromBackend),

  deleteVendor: (id: string): Promise<void> => apiClient.delete(`/vendors/${id}`),
}

export const vendorService = USE_MOCK_BACKEND ? mockVendorService : httpVendorService
