import type { Bill, BillLineItem } from '@/types/entities/bill'
import { ApiError, type PaginatedResponse, type QueryParams } from '@/services/base/types'
import { mockClient, paginateFilterSort, findOrThrow, insertMock, updateMock } from '@/services/base/mockClient'
import { bills } from '@/mocks/seed/bills.seed'
import { getProductById } from '@/mocks/seed/products.seed'
import { inventoryItems } from '@/mocks/seed/inventory.seed'
import { makeIdFactory } from '@/mocks/generators/idGenerator'
import { apiClient } from '@/shared/lib/apiClient'

const nextId = makeIdFactory('bill-new')

/** Flip to "false" once the Spring Boot backend (backend/) is running — see AuthContext.tsx. */
const USE_MOCK_BACKEND = import.meta.env.VITE_USE_MOCK_BACKEND !== 'false'

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
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function computeTotals(lineTotals: number[], taxPct: number, discountPct: number) {
  const subtotal = round2(lineTotals.reduce((sum, v) => sum + v, 0))
  const discountAmount = round2((subtotal * discountPct) / 100)
  const taxableAmount = subtotal - discountAmount
  const taxAmount = round2((taxableAmount * taxPct) / 100)
  const totalAmount = round2(taxableAmount + taxAmount)
  return { subtotal, discountAmount, taxAmount, totalAmount }
}

const mockBillService = {
  getBills: (params: QueryParams = {}): Promise<PaginatedResponse<Bill>> =>
    mockClient.request(() => paginateFilterSort(bills, { ...params, searchKeys: ['billNumber', 'customerName'] })),

  getBillById: (id: string): Promise<Bill> => mockClient.request(() => findOrThrow(bills, id)),

  createBill: (input: BillInput): Promise<Bill> =>
    mockClient.request(() => {
      const items: BillLineItem[] = input.items.map((line) => {
        const product = getProductById(line.productId)
        if (!product) throw new ApiError(400, `Unknown product: ${line.productId}`)

        const inv = inventoryItems.find((i) => i.itemType === 'product' && i.itemId === line.productId)
        if (inv) {
          if (inv.quantityOnHand < line.quantity) {
            throw new ApiError(400, `Insufficient stock for ${product.name}: have ${inv.quantityOnHand} ${inv.unit}, need ${line.quantity}`)
          }
          inv.quantityOnHand -= line.quantity
        }

        return {
          productId: product.id,
          productName: product.name,
          unit: product.unitOfMeasure,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal: round2(line.quantity * line.unitPrice),
        }
      })

      const { subtotal, discountAmount, taxAmount, totalAmount } = computeTotals(items.map((i) => i.lineTotal), input.taxPct, input.discountPct)

      const bill: Bill = {
        id: nextId(),
        billNumber: `BILL-${Math.floor(1000 + Math.random() * 9000)}`,
        warehouseId: input.warehouseId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        status: 'completed',
        items,
        subtotal,
        taxPct: input.taxPct,
        taxAmount,
        discountPct: input.discountPct,
        discountAmount,
        totalAmount,
        createdAt: new Date().toISOString(),
        createdBy: input.createdBy,
      }
      return insertMock(bills, bill)
    }),

  cancelBill: (id: string): Promise<Bill> =>
    mockClient.request(() => {
      const bill = findOrThrow(bills, id)
      if (bill.status === 'cancelled') return bill
      for (const line of bill.items) {
        const inv = inventoryItems.find((i) => i.itemType === 'product' && i.itemId === line.productId)
        if (inv) inv.quantityOnHand += line.quantity
      }
      return updateMock(bills, id, { status: 'cancelled', cancelledAt: new Date().toISOString() })
    }),
}

const httpBillService = {
  getBills: async (params: QueryParams = {}): Promise<PaginatedResponse<Bill>> => {
    const all = await apiClient.get<Bill[]>('/bills')
    return paginateFilterSort(all, { ...params, searchKeys: ['billNumber', 'customerName'] })
  },

  getBillById: (id: string): Promise<Bill> => apiClient.get<Bill>(`/bills/${id}`),

  createBill: (input: BillInput): Promise<Bill> => apiClient.post<Bill>('/bills', input),

  cancelBill: (id: string): Promise<Bill> => apiClient.post<Bill>(`/bills/${id}/cancel`),
}

export const billService = USE_MOCK_BACKEND ? mockBillService : httpBillService
