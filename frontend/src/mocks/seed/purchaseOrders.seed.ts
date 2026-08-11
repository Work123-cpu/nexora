import type { PurchaseOrder, PurchaseOrderLineItem, PurchaseOrderStatus, PurchaseOrderTimelineEvent } from '@/types/entities/purchaseOrder'
import { createSeededRandom, seededInt, seededPick, daysAgoISO, daysFromNowISO } from '../generators/seedRandom'
import { makeIdFactory } from '../generators/idGenerator'
import { rawMaterials } from './rawMaterials.seed'
import { vendors } from './vendors.seed'

const rand = createSeededRandom(9009)
const nextId = makeIdFactory('po')

const STATUS_WEIGHTS: PurchaseOrderStatus[] = [
  'draft',
  'pending_approval',
  'pending_approval',
  'approved',
  'ordered',
  'ordered',
  'in_transit',
  'in_transit',
  'received',
  'received',
  'received',
  'received',
  'cancelled',
]

const BUYERS = ['Aditya Kapoor', 'Priya Subramaniam', 'Meera Krishnan', 'Rohan Deshmukh', 'Sanjay Kulkarni']

function buildTimeline(status: PurchaseOrderStatus, createdAt: string): PurchaseOrderTimelineEvent[] {
  const stages: PurchaseOrderStatus[] = ['draft', 'pending_approval', 'approved', 'ordered', 'in_transit', 'received']
  const cancelledAtIndex = status === 'cancelled' ? seededInt(rand, 1, 3) : -1
  const timeline: PurchaseOrderTimelineEvent[] = []
  const created = new Date(createdAt)

  const targetIndex = status === 'cancelled' ? cancelledAtIndex : stages.indexOf(status)

  let dayOffset = 0
  for (let i = 0; i <= targetIndex; i++) {
    if (i > 0) dayOffset += seededInt(rand, 1, 3)
    const date = new Date(created)
    date.setDate(date.getDate() + dayOffset)
    timeline.push({ status: stages[i]!, date: date.toISOString() })
  }
  if (status === 'cancelled') {
    dayOffset += seededInt(rand, 1, 3)
    const date = new Date(created)
    date.setDate(date.getDate() + dayOffset)
    timeline.push({ status: 'cancelled', date: date.toISOString(), note: 'Cancelled due to changed procurement priorities' })
  }
  return timeline
}

const PO_COUNT = 42

export const purchaseOrders: PurchaseOrder[] = Array.from({ length: PO_COUNT }, (_, index) => {
  const vendor = seededPick(rand, vendors.filter((v) => v.status !== 'inactive'))
  const materialPool = rawMaterials.filter((rm) => rm.primaryVendorId === vendor.id)
  const pool = materialPool.length > 0 ? materialPool : rawMaterials
  const itemCount = seededInt(rand, 1, Math.min(4, pool.length))
  const chosenMaterials = [...pool].sort(() => rand() - 0.5).slice(0, itemCount)

  const items: PurchaseOrderLineItem[] = chosenMaterials.map((material) => {
    const quantity = seededInt(rand, 50, 2000)
    return {
      rawMaterialId: material.id,
      rawMaterialName: material.name,
      quantity,
      unit: material.unit,
      unitCost: material.unitCost,
    }
  })

  const totalAmount = Number(items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0).toFixed(2))
  const status = seededPick(rand, STATUS_WEIGHTS)
  const createdAt = daysAgoISO(seededInt(rand, 2, 60))
  const timeline = buildTimeline(status, createdAt)
  const isApprovedOrLater = ['approved', 'ordered', 'in_transit', 'received'].includes(status)

  return {
    id: nextId(),
    poNumber: `PO-${String(2000 + index).padStart(5, '0')}`,
    vendorId: vendor.id,
    status,
    items,
    totalAmount,
    createdAt,
    expectedDeliveryDate: daysFromNowISO(seededInt(rand, 3, 21), new Date(createdAt)),
    createdBy: seededPick(rand, BUYERS),
    approvedBy: isApprovedOrLater ? seededPick(rand, BUYERS) : undefined,
    timeline,
  }
}).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

export function getPurchaseOrderById(id: string): PurchaseOrder | undefined {
  return purchaseOrders.find((po) => po.id === id)
}

export function getPurchaseOrdersForVendor(vendorId: string): PurchaseOrder[] {
  return purchaseOrders.filter((po) => po.vendorId === vendorId)
}
