import type { PurchaseOrder, PurchaseOrderLineItem, PurchaseOrderStatus, PurchaseOrderTimelineEvent } from '@/types/entities/purchaseOrder'
import type { PaginatedResponse, QueryParams } from '@/services/base/types'
import { mockClient, paginateFilterSort, findOrThrow, insertMock, updateMock } from '@/services/base/mockClient'
import { purchaseOrders } from '@/mocks/seed/purchaseOrders.seed'
import { makeIdFactory } from '@/mocks/generators/idGenerator'
import { getVendorById } from '@/mocks/seed/vendors.seed'
import { apiClient } from '@/shared/lib/apiClient'

const nextId = makeIdFactory('po-new')

/** Flip to "false" once the Spring Boot backend (backend/) is running — see AuthContext.tsx. */
const USE_MOCK_BACKEND = import.meta.env.VITE_USE_MOCK_BACKEND !== 'false'

export interface GetPurchaseOrdersParams extends QueryParams {
  status?: PurchaseOrderStatus
  vendorId?: string
}

export interface PurchaseOrderInput {
  vendorId: string
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

const mockPurchaseOrderService = {
  getPurchaseOrders: (params: GetPurchaseOrdersParams = {}): Promise<PaginatedResponse<PurchaseOrder>> =>
    mockClient.request(() =>
      paginateFilterSort(purchaseOrders, {
        ...params,
        searchKeys: ['poNumber'],
        filter: (po) => (params.status ? po.status === params.status : true) && (params.vendorId ? po.vendorId === params.vendorId : true),
      }),
    ),

  getPurchaseOrderById: (id: string): Promise<PurchaseOrder> => mockClient.request(() => findOrThrow(purchaseOrders, id)),

  createPurchaseOrder: (input: PurchaseOrderInput): Promise<PurchaseOrder> =>
    mockClient.request(() => {
      const now = new Date().toISOString()
      const totalAmount = Number(input.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0).toFixed(2))
      const po: PurchaseOrder = {
        id: nextId(),
        poNumber: `PO-${Math.floor(3000 + Math.random() * 6000)}`,
        vendorId: input.vendorId,
        status: 'pending_approval',
        items: input.items,
        totalAmount,
        createdAt: now,
        expectedDeliveryDate: input.expectedDeliveryDate,
        createdBy: input.createdBy,
        timeline: [
          { status: 'draft', date: now },
          { status: 'pending_approval', date: now },
        ],
        sourceRecommendationId: input.sourceRecommendationId,
      }
      return insertMock(purchaseOrders, po)
    }),

  advanceStatus: (id: string, status: PurchaseOrderStatus, note?: string, approvedBy?: string): Promise<PurchaseOrder> =>
    mockClient.request(() => {
      const po = findOrThrow(purchaseOrders, id)
      const timeline = [...po.timeline, { status, date: new Date().toISOString(), note }]
      return updateMock(purchaseOrders, id, { status, timeline, approvedBy: approvedBy ?? po.approvedBy })
    }),

  getNextStage: (status: PurchaseOrderStatus): PurchaseOrderStatus | undefined => {
    const index = STAGE_ORDER.indexOf(status)
    return index >= 0 && index < STAGE_ORDER.length - 1 ? STAGE_ORDER[index + 1] : undefined
  },

  getVendorName: (vendorId: string): string => getVendorById(vendorId)?.name ?? 'Unknown vendor',
}

const httpPurchaseOrderService = {
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

  getVendorName: (vendorId: string): string => getVendorById(vendorId)?.name ?? 'Unknown vendor',
}

export const purchaseOrderService = USE_MOCK_BACKEND ? mockPurchaseOrderService : httpPurchaseOrderService
