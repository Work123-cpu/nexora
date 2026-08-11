import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Boxes, Sparkles, Truck } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/Card'
import { Sparkline } from '@/shared/ui/charts/Sparkline'
import { useInventoryItems } from '@/features/inventory/hooks/useInventory'
import { useVendors } from '@/features/vendors/hooks/useVendors'
import { useAllRecommendations } from '@/shared/hooks/useRecommendations'
import { formatNumber, formatPercent } from '@/shared/lib/formatters'

function OverviewCard({
  title,
  to,
  icon,
  metric,
  metricLabel,
  sparklineData,
  tone,
  footnote,
}: {
  title: string
  to: string
  icon: ReactNode
  metric: string
  metricLabel: string
  sparklineData: number[]
  tone: 'success' | 'warning' | 'danger' | 'primary'
  footnote: string
}) {
  return (
    <Card interactive tilt className="flex flex-col">
      <CardContent className="flex-1">
        <div className="flex items-start justify-between">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">{icon}</div>
        </div>
        <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
        <p className="text-2xl font-semibold text-foreground">{metric}</p>
        <p className="text-xs text-muted-foreground">{metricLabel}</p>
        <div className="mt-3">
          <Sparkline data={sparklineData} tone={tone} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{footnote}</p>
      </CardContent>
      <Link to={to} className="flex items-center justify-between border-t border-border px-5 py-3 text-xs font-medium text-primary hover:bg-surface-elevated">
        View details <ArrowRight className="size-3.5" />
      </Link>
    </Card>
  )
}

export function DomainOverviewCards() {
  const { data: inventoryData } = useInventoryItems({ pageSize: 10000 })
  const { data: vendorsData } = useVendors({ pageSize: 10000 })
  const { recommendations } = useAllRecommendations()

  const inventoryItems = inventoryData?.items ?? []
  const lowStock = inventoryItems.filter((i) => i.quantityOnHand <= i.reorderPoint).length
  const critical = inventoryItems.filter((i) => i.quantityOnHand <= i.safetyStock).length
  const healthyPct = inventoryItems.length > 0 ? Math.round(((inventoryItems.length - lowStock) / inventoryItems.length) * 100) : 100

  const vendors = vendorsData?.items ?? []
  const activeVendors = vendors.filter((v) => v.status === 'active')
  const avgOnTime = activeVendors.length > 0 ? Math.round(activeVendors.reduce((sum, v) => sum + v.onTimeDeliveryPct, 0) / activeVendors.length) : 0

  const highPriorityCount = recommendations.filter((r) => r.severity === 'critical' || r.severity === 'high').length

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <OverviewCard
        title="Inventory Overview"
        to="/app/inventory"
        icon={<Boxes className="size-4.5" />}
        metric={`${healthyPct}% healthy`}
        metricLabel={`${critical} critical · ${lowStock} low stock`}
        sparklineData={inventoryItems.slice(0, 14).map((i) => i.quantityOnHand)}
        tone={critical > 0 ? 'danger' : 'success'}
        footnote={`${inventoryItems.length} tracked SKUs across all warehouses`}
      />
      <OverviewCard
        title="Supplier Overview"
        to="/app/vendors"
        icon={<Truck className="size-4.5" />}
        metric={formatPercent(avgOnTime, 0)}
        metricLabel="Average on-time delivery"
        sparklineData={activeVendors.slice(0, 14).map((v) => v.onTimeDeliveryPct)}
        tone={avgOnTime > 85 ? 'success' : 'warning'}
        footnote={`${activeVendors.length} active vendors`}
      />
      <OverviewCard
        title="AI Recommendations"
        to="/app/ai/action-center"
        icon={<Sparkles className="size-4.5" />}
        metric={`${formatNumber(recommendations.length)} active`}
        metricLabel={`${highPriorityCount} high priority`}
        sparklineData={recommendations.slice(0, 14).map((r) => (r.severity === 'critical' ? 4 : r.severity === 'high' ? 3 : r.severity === 'medium' ? 2 : 1))}
        tone={highPriorityCount > 0 ? 'warning' : 'primary'}
        footnote="Generated from your live inventory, vendor, and market data"
      />
    </div>
  )
}
