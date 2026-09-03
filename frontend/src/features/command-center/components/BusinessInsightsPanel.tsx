import { Lightbulb } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { useBusinessHealth } from '@/shared/hooks/useBusinessHealth'
import { useLiveMarketSignals } from '@/shared/hooks/useLiveMarketSignals'
import { getSpendChangePct } from '@/shared/lib/procurementAnalytics'
import { useRawMaterials } from '@/features/raw-materials/hooks/useRawMaterials'
import { usePurchaseOrders } from '@/features/procurement/hooks/usePurchaseOrders'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'

export function BusinessInsightsPanel() {
  const { health } = useBusinessHealth()
  const { notifications } = useNotifications()
  const { data: materialsData } = useRawMaterials({ pageSize: 10000 })
  const { data: poData } = usePurchaseOrders({ pageSize: 10000 })
  const { signals: marketSignals } = useLiveMarketSignals(materialsData?.items ?? [])

  const criticalCount = notifications.filter((n) => n.category === 'inventory' && n.priority === 'critical').length
  const spendChange = getSpendChangePct(poData?.items ?? [])

  const insights = [
    (poData?.items.length ?? 0) > 0
      ? `Procurement spend is ${spendChange >= 0 ? 'up' : 'down'} ${Math.abs(spendChange)}% over the last 30 days compared to the prior period.`
      : 'No purchase orders yet — spend trends will appear once you start ordering from vendors.',
    criticalCount > 0
      ? `${criticalCount} item(s) are below safety stock — this is the leading driver of your current inventory health score.`
      : 'No items are currently below safety stock — inventory health is stable.',
    marketSignals.length > 0
      ? `${marketSignals.length} live market indicator(s) are tracked against your raw materials this week.`
      : 'No live market data tracked yet — add a free Alpha Vantage key in Settings to enable this.',
    `Overall business health is "${health.status}" at ${health.overallScore}/100, led by ${health.categories.slice().sort((a, b) => a.score - b.score)[0]?.label ?? 'inventory'} needing the most attention.`,
  ]

  return (
    <Card interactive>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="size-4" /> Business Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {insights.map((insight, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
