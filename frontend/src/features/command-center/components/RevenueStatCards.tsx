import { DollarSign, Package, ShoppingCart, TrendingUp } from 'lucide-react'
import { StatCard } from '@/shared/ui/StatCard'
import { formatCompactCurrency, formatNumber } from '@/shared/lib/formatters'
import { getTotalSpend, getOrderCount, getSpendChangePct } from '@/shared/lib/procurementAnalytics'
import { useProducts } from '@/features/products/hooks/useProducts'
import { usePurchaseOrders } from '@/features/procurement/hooks/usePurchaseOrders'

export function RevenueStatCards() {
  const { data: productsData } = useProducts({ pageSize: 10000 })
  const { data: poData } = usePurchaseOrders({ pageSize: 10000 })
  const purchaseOrders = poData?.items ?? []

  const spend = getTotalSpend(purchaseOrders, 30)
  const orders = getOrderCount(purchaseOrders, 30)
  const changePct = getSpendChangePct(purchaseOrders, 30)
  const activeProducts = (productsData?.items ?? []).filter((p) => p.status === 'active').length
  const openPOs = purchaseOrders.filter((po) => !['received', 'cancelled'].includes(po.status)).length

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Procurement Spend (30 days)"
        value={formatCompactCurrency(spend)}
        icon={<DollarSign className="size-5" />}
        trend={{ value: changePct }}
        tone="primary"
      />
      <StatCard
        label="Purchase Orders (30 days)"
        value={formatNumber(orders)}
        icon={<ShoppingCart className="size-5" />}
        tone="info"
      />
      <StatCard label="Active Products" value={formatNumber(activeProducts)} icon={<Package className="size-5" />} tone="success" />
      <StatCard label="Open Purchase Orders" value={formatNumber(openPOs)} icon={<TrendingUp className="size-5" />} tone="warning" />
    </div>
  )
}
