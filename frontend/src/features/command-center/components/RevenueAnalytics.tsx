import { AreaChartCard } from '@/shared/ui/charts/AreaChartCard'
import { PieChartCard } from '@/shared/ui/charts/PieChartCard'
import { getDailySpend, getSpendByMaterialCategory } from '@/shared/lib/procurementAnalytics'
import { usePurchaseOrders } from '@/features/procurement/hooks/usePurchaseOrders'
import { useRawMaterials } from '@/features/raw-materials/hooks/useRawMaterials'

export function RevenueAnalytics() {
  const { data: poData } = usePurchaseOrders({ pageSize: 10000 })
  const { data: materialsData } = useRawMaterials({ pageSize: 10000 })
  const purchaseOrders = poData?.items ?? []

  const chartData = getDailySpend(purchaseOrders, 30).map((p) => ({
    date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    spend: p.spend,
  }))
  const spendByCategory = getSpendByMaterialCategory(purchaseOrders, materialsData?.items ?? [])

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <AreaChartCard
        title="Procurement Spend Trend"
        description="Last 30 days"
        data={chartData}
        xKey="date"
        areaKey="spend"
        label="Spend"
        className="lg:col-span-2"
      />
      <PieChartCard title="Spend by Material Category" description="Last 30 days" data={spendByCategory} />
    </div>
  )
}
