export type BillStatus = 'completed' | 'cancelled'

export interface BillLineItem {
  productId: string
  productName: string
  quantity: number
  unit: string
  unitPrice: number
  lineTotal: number
}

export interface Bill {
  id: string
  billNumber: string
  warehouseId: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  status: BillStatus
  items: BillLineItem[]
  subtotal: number
  taxPct: number
  taxAmount: number
  discountPct: number
  discountAmount: number
  totalAmount: number
  createdAt: string
  createdBy?: string
  cancelledAt?: string
}
