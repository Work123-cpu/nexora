import type { ActivityItem } from '@/types/entities/activity'
import { createSeededRandom, seededInt, seededPick, daysAgoISO } from '../generators/seedRandom'
import { makeIdFactory } from '../generators/idGenerator'
import { products } from './products.seed'
import { vendors } from './vendors.seed'
import { purchaseOrders } from './purchaseOrders.seed'
import { getLowStockItems } from './inventory.seed'

const rand = createSeededRandom(12012)
const nextId = makeIdFactory('act')

const ACTORS = ['Aditya Kapoor', 'Priya Subramaniam', 'Meera Krishnan', 'Rohan Deshmukh', 'Sanjay Kulkarni', 'Nexora']

const activities: ActivityItem[] = []

products.slice(0, 4).forEach((p, i) => {
  activities.push({
    id: nextId(),
    actorName: seededPick(rand, ACTORS),
    action: i === 0 ? 'created product' : 'updated pricing for',
    entityName: p.name,
    category: 'product',
    timestamp: daysAgoISO(seededInt(rand, 0, 12)),
  })
})

purchaseOrders.slice(0, 6).forEach((po) => {
  const vendor = vendors.find((v) => v.id === po.vendorId)
  activities.push({
    id: nextId(),
    actorName: po.approvedBy ?? po.createdBy,
    action: po.status === 'received' ? 'received order' : po.status === 'approved' ? 'approved purchase order' : 'created purchase order',
    entityName: `${po.poNumber} — ${vendor?.name ?? 'Vendor'}`,
    category: 'procurement',
    timestamp: daysAgoISO(seededInt(rand, 0, 10)),
  })
})

getLowStockItems()
  .slice(0, 4)
  .forEach((item) => {
    activities.push({
      id: nextId(),
      actorName: 'Nexora',
      action: 'flagged low stock for',
      entityName: item.itemName,
      category: 'ai',
      timestamp: daysAgoISO(seededInt(rand, 0, 5)),
    })
  })

vendors.slice(0, 3).forEach((vendor) => {
  activities.push({
    id: nextId(),
    actorName: seededPick(rand, ACTORS),
    action: 'reviewed performance for',
    entityName: vendor.name,
    category: 'vendor',
    timestamp: daysAgoISO(seededInt(rand, 0, 15)),
  })
})

activities.push({
  id: nextId(),
  actorName: 'Nexora',
  action: 'completed weekly health check for',
  entityName: 'Annapurna Foods & Beverages Pvt. Ltd.',
  category: 'system',
  timestamp: daysAgoISO(1),
})

export const activityFeed: ActivityItem[] = activities.sort(
  (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
)
