import type { Vendor, VendorStatus } from '@/types/entities/vendor'
import type { PaginatedResponse, QueryParams } from '@/services/base/types'
import { paginateFilterSort } from '@/services/base/paginate'
import { apiClient } from '@/shared/lib/apiClient'
import { fromBackendPO, type BackendPurchaseOrder } from '@/features/procurement/services/purchaseOrderService'

export interface GetVendorsParams extends QueryParams {
  category?: string
  status?: VendorStatus
}

// No materialsSupplied -- which materials a vendor supplies is shown from the live, authoritative
// side instead (each RawMaterial's own primaryVendorId), not a separately hand-maintained list
// that could silently drift out of sync with it. See VendorForm.tsx/VendorDetailPage.tsx.
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

export const vendorService = {
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
