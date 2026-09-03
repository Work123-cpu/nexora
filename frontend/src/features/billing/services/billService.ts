import type { Bill, BillStatus } from '@/types/entities/bill'
import type { PaginatedResponse, QueryParams } from '@/services/base/types'
import { paginateFilterSort } from '@/services/base/paginate'
import { apiClient } from '@/shared/lib/apiClient'

export interface GetBillsParams extends QueryParams {
  status?: BillStatus
}

export interface BillLineItemInput {
  productId: string
  quantity: number
  unitPrice: number
}

export interface BillInput {
  warehouseId: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  items: BillLineItemInput[]
  taxPct: number
  discountPct: number
  createdBy: string
  /** Historical-import only — omitted means "now". Normal bill creation never sends this. */
  createdAt?: string
}

export const billService = {
  getBills: async (params: GetBillsParams = {}): Promise<PaginatedResponse<Bill>> => {
    const all = await apiClient.get<Bill[]>('/bills')
    return paginateFilterSort(all, {
      ...params,
      searchKeys: ['billNumber', 'customerName'],
      filter: (b) => (params.status ? b.status === params.status : true),
    })
  },

  getBillById: (id: string): Promise<Bill> => apiClient.get<Bill>(`/bills/${id}`),

  createBill: (input: BillInput): Promise<Bill> => apiClient.post<Bill>('/bills', input),

  cancelBill: (id: string): Promise<Bill> => apiClient.post<Bill>(`/bills/${id}/cancel`),
}
