import type { PurchaseOrder, PurchaseOrderLineItem, PurchaseOrderStatus, PurchaseOrderTimelineEvent } from '@/types/entities/purchaseOrder'
import type { PaginatedResponse, QueryParams } from '@/services/base/types'
import { paginateFilterSort } from '@/services/base/paginate'
import { apiClient } from '@/shared/lib/apiClient'

export interface GetPurchaseOrdersParams extends QueryParams {
  status?: PurchaseOrderStatus
  vendorId?: string
}

export interface PurchaseOrderInput {
  vendorId: string
  warehouseId: string
  items: PurchaseOrderLineItem[]
  expectedDeliveryDate: string
  createdBy: string
  sourceRecommendationId?: string
}

const STAGE_ORDER: PurchaseOrderStatus[] = ['draft', 'pending_approval', 'approved', 'ordered', 'in_transit', 'received']

export interface BackendPurchaseOrder {
  id: string
  poNumber: string
  vendorId: string
  warehouseId: string
  status: string
  items: PurchaseOrderLineItem[]
  totalAmount: number
  createdAt: string
  expectedDeliveryDate: string
  createdBy: string
  approvedBy?: string
  timeline: { status: string; date: string; note?: string }[]
  sourceRecommendationId?: string
}

/** Exported so other features (e.g. vendorService's getPurchaseOrdersForVendor) can map the same shape without duplicating this logic. */
export function fromBackendPO(po: BackendPurchaseOrder): PurchaseOrder {
  return {
    id: po.id,
    poNumber: po.poNumber,
    vendorId: po.vendorId,
    warehouseId: po.warehouseId,
    status: po.status as PurchaseOrderStatus,
    items: po.items,
    totalAmount: po.totalAmount,
    createdAt: po.createdAt,
    expectedDeliveryDate: po.expectedDeliveryDate,
    createdBy: po.createdBy,
    approvedBy: po.approvedBy,
    timeline: po.timeline.map((t): PurchaseOrderTimelineEvent => ({ status: t.status as PurchaseOrderStatus, date: t.date, note: t.note })),
    sourceRecommendationId: po.sourceRecommendationId,
  }
}

export const purchaseOrderService = {
  getPurchaseOrders: async (params: GetPurchaseOrdersParams = {}): Promise<PaginatedResponse<PurchaseOrder>> => {
    const all = (
      await apiClient.get<BackendPurchaseOrder[]>('/purchase-orders', { params: { vendorId: params.vendorId } })
    ).map(fromBackendPO)
    return paginateFilterSort(all, {
      ...params,
      searchKeys: ['poNumber'],
      filter: (po) => (params.status ? po.status === params.status : true) && (params.vendorId ? po.vendorId === params.vendorId : true),
    })
  },

  getPurchaseOrderById: (id: string): Promise<PurchaseOrder> =>
    apiClient.get<BackendPurchaseOrder>(`/purchase-orders/${id}`).then(fromBackendPO),

  createPurchaseOrder: (input: PurchaseOrderInput): Promise<PurchaseOrder> =>
    apiClient.post<BackendPurchaseOrder>('/purchase-orders', input).then(fromBackendPO),

  advanceStatus: (id: string, status: PurchaseOrderStatus, note?: string, approvedBy?: string): Promise<PurchaseOrder> =>
    apiClient.post<BackendPurchaseOrder>(`/purchase-orders/${id}/advance-status`, { status, note, approvedBy }).then(fromBackendPO),

  getNextStage: (status: PurchaseOrderStatus): PurchaseOrderStatus | undefined => {
    const index = STAGE_ORDER.indexOf(status)
    return index >= 0 && index < STAGE_ORDER.length - 1 ? STAGE_ORDER[index + 1] : undefined
  },
}
