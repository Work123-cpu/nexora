import type { AppNotification, NotificationPriority } from '@/types/entities/notification'
import { createSeededRandom, seededBool, seededInt, daysAgoISO } from '../generators/seedRandom'
import { makeIdFactory } from '../generators/idGenerator'
import { getLowStockItems, getCriticalStockItems } from './inventory.seed'
import { purchaseOrders } from './purchaseOrders.seed'
import { vendors } from './vendors.seed'

const rand = createSeededRandom(10010)
const nextId = makeIdFactory('notif')

const notifications: AppNotification[] = []

getCriticalStockItems()
  .slice(0, 5)
  .forEach((item) => {
    notifications.push({
      id: nextId(),
      title: `Critical stock: ${item.itemName}`,
      message: `${item.itemName} has dropped below safety stock (${item.quantityOnHand} ${item.unit} on hand). Immediate reorder recommended.`,
      category: 'inventory',
      priority: 'critical',
      read: seededBool(rand, 0.2),
      createdAt: daysAgoISO(seededInt(rand, 0, 3)),
      link: '/app/procurement/recommendations',
    })
  })

getLowStockItems()
  .slice(5, 10)
  .forEach((item) => {
    notifications.push({
      id: nextId(),
      title: `Low stock warning: ${item.itemName}`,
      message: `${item.itemName} is approaching its reorder point. Consider placing a purchase order within the next few days.`,
      category: 'inventory',
      priority: 'medium',
      read: seededBool(rand, 0.5),
      createdAt: daysAgoISO(seededInt(rand, 1, 6)),
      link: '/app/inventory',
    })
  })

purchaseOrders
  .filter((po) => po.status === 'in_transit' || po.status === 'received')
  .slice(0, 4)
  .forEach((po) => {
    const vendor = vendors.find((v) => v.id === po.vendorId)
    notifications.push({
      id: nextId(),
      title: po.status === 'received' ? `Order received: ${po.poNumber}` : `Shipment in transit: ${po.poNumber}`,
      message:
        po.status === 'received'
          ? `${po.poNumber} from ${vendor?.name ?? 'vendor'} has been received and inventory updated.`
          : `${po.poNumber} from ${vendor?.name ?? 'vendor'} is in transit, expected ${new Date(po.expectedDeliveryDate).toLocaleDateString()}.`,
      category: 'procurement',
      priority: 'low',
      read: seededBool(rand, 0.6),
      createdAt: daysAgoISO(seededInt(rand, 0, 5)),
      link: `/app/procurement/purchase-orders/${po.id}`,
    })
  })

vendors
  .filter((v) => v.status === 'under-review')
  .forEach((vendor) => {
    notifications.push({
      id: nextId(),
      title: `Vendor performance flagged: ${vendor.name}`,
      message: `${vendor.name} has an on-time delivery rate of ${vendor.onTimeDeliveryPct}%, below the acceptable threshold. Review recommended.`,
      category: 'vendor',
      priority: 'high' as NotificationPriority,
      read: false,
      createdAt: daysAgoISO(seededInt(rand, 0, 4)),
      link: `/app/vendors/${vendor.id}`,
    })
  })

const SYSTEM_NOTIFICATIONS: Omit<AppNotification, 'id' | 'createdAt'>[] = [
  {
    title: 'Weekly business health report ready',
    message: 'Your AI-generated business health summary for this week is ready to review.',
    category: 'system',
    priority: 'low',
    read: true,
    link: '/app/ai/health-check',
  },
  {
    title: 'Market intelligence update',
    message: 'Cocoa commodity prices rose 6.2% this week — this may affect chocolate-based product costs.',
    category: 'market',
    priority: 'medium',
    read: false,
    link: '/app/market-intelligence',
  },
  {
    title: 'Forecast model refreshed',
    message: 'Demand forecasts have been refreshed using the latest 30 days of sales data.',
    category: 'forecast',
    priority: 'low',
    read: true,
    link: '/app',
  },
]

SYSTEM_NOTIFICATIONS.forEach((n) => {
  notifications.push({ ...n, id: nextId(), createdAt: daysAgoISO(seededInt(rand, 1, 10)) })
})

export const appNotifications: AppNotification[] = notifications.sort(
  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
)

export function getUnreadCount(): number {
  return appNotifications.filter((n) => !n.read).length
}
