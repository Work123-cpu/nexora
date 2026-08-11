import { useMemo } from 'react'
import { useLocalStorage } from '@/shared/hooks/useLocalStorage'
import { useInventoryItems } from '@/features/inventory/hooks/useInventory'
import { usePurchaseOrders } from '@/features/procurement/hooks/usePurchaseOrders'
import { useVendors } from '@/features/vendors/hooks/useVendors'
import type { AppNotification } from '@/types/entities/notification'

/** Derives live notifications from real inventory/PO/vendor state — no fabricated demo feed. */
function buildNotifications(
  inventoryItems: ReturnType<typeof useInventoryItems>['data'],
  purchaseOrders: ReturnType<typeof usePurchaseOrders>['data'],
  vendors: ReturnType<typeof useVendors>['data'],
): AppNotification[] {
  const notifications: AppNotification[] = []

  for (const item of inventoryItems?.items ?? []) {
    if (item.quantityOnHand <= item.safetyStock) {
      notifications.push({
        id: `notif-critical-${item.id}`,
        title: `Critical stock: ${item.itemName}`,
        message: `${item.itemName} has dropped below safety stock (${item.quantityOnHand} ${item.unit} on hand). Immediate reorder recommended.`,
        category: 'inventory',
        priority: 'critical',
        read: false,
        createdAt: item.lastRestockedAt,
        link: '/app/procurement/recommendations',
      })
    } else if (item.quantityOnHand <= item.reorderPoint) {
      notifications.push({
        id: `notif-low-${item.id}`,
        title: `Low stock warning: ${item.itemName}`,
        message: `${item.itemName} is approaching its reorder point. Consider placing a purchase order within the next few days.`,
        category: 'inventory',
        priority: 'medium',
        read: false,
        createdAt: item.lastRestockedAt,
        link: '/app/inventory',
      })
    }
  }

  for (const po of purchaseOrders?.items ?? []) {
    if (po.status !== 'in_transit' && po.status !== 'received') continue
    const vendor = vendors?.items.find((v) => v.id === po.vendorId)
    notifications.push({
      id: `notif-po-${po.id}`,
      title: po.status === 'received' ? `Order received: ${po.poNumber}` : `Shipment in transit: ${po.poNumber}`,
      message:
        po.status === 'received'
          ? `${po.poNumber} from ${vendor?.name ?? 'vendor'} has been received and inventory updated.`
          : `${po.poNumber} from ${vendor?.name ?? 'vendor'} is in transit, expected ${new Date(po.expectedDeliveryDate).toLocaleDateString()}.`,
      category: 'procurement',
      priority: 'low',
      read: false,
      createdAt: po.createdAt,
      link: `/app/procurement/purchase-orders/${po.id}`,
    })
  }

  for (const vendor of vendors?.items ?? []) {
    if (vendor.status !== 'under-review') continue
    notifications.push({
      id: `notif-vendor-${vendor.id}`,
      title: `Vendor performance flagged: ${vendor.name}`,
      message: `${vendor.name} has an on-time delivery rate of ${vendor.onTimeDeliveryPct}%, below the acceptable threshold. Review recommended.`,
      category: 'vendor',
      priority: 'high',
      read: false,
      createdAt: new Date().toISOString(),
      link: `/app/vendors/${vendor.id}`,
    })
  }

  return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function useNotifications() {
  const [readOverrides, setReadOverrides] = useLocalStorage<Record<string, boolean>>('Nexora.notifications-read', {})
  const { data: inventoryData } = useInventoryItems({ pageSize: 10000 })
  const { data: poData } = usePurchaseOrders({ pageSize: 10000 })
  const { data: vendorData } = useVendors({ pageSize: 10000 })

  const notifications: AppNotification[] = useMemo(() => {
    const derived = buildNotifications(inventoryData, poData, vendorData)
    return derived.map((n) => ({ ...n, read: readOverrides[n.id] ?? n.read }))
  }, [inventoryData, poData, vendorData, readOverrides])

  const unread = notifications.filter((n) => !n.read)

  const markRead = (id: string) => setReadOverrides((prev) => ({ ...prev, [id]: true }))
  const markAllRead = () => setReadOverrides(Object.fromEntries(notifications.map((n) => [n.id, true])))

  return { notifications, unread, markRead, markAllRead }
}
