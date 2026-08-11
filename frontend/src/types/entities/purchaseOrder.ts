export type PurchaseOrderStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'ordered'
  | 'in_transit'
  | 'received'
  | 'cancelled'

export interface PurchaseOrderLineItem {
  rawMaterialId: string
  rawMaterialName: string
  quantity: number
  unit: string
  unitCost: number
}

export interface PurchaseOrderTimelineEvent {
  status: PurchaseOrderStatus
  date: string
  note?: string
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  vendorId: string
  status: PurchaseOrderStatus
  items: PurchaseOrderLineItem[]
  totalAmount: number
  createdAt: string
  expectedDeliveryDate: string
  createdBy: string
  approvedBy?: string
  timeline: PurchaseOrderTimelineEvent[]
  sourceRecommendationId?: string
}
