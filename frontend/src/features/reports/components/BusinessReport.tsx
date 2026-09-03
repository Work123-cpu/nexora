import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { StatCard } from '@/shared/ui/StatCard'
import { Reveal } from '@/shared/ui/Reveal'
import { PieChartCard } from '@/shared/ui/charts/PieChartCard'
import { AreaChartCard } from '@/shared/ui/charts/AreaChartCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { ProgressBar } from '@/shared/ui/ProgressBar'
import { formatCompactCurrency, formatNumber } from '@/shared/lib/formatters'
import { getTotalSpend, getOrderCount, getSpendChangePct, getDailySpend, getSpendByMaterialCategory } from '@/shared/lib/procurementAnalytics'
import { useBusinessHealth } from '@/shared/hooks/useBusinessHealth'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useVendors } from '@/features/vendors/hooks/useVendors'
import { usePurchaseOrders } from '@/features/procurement/hooks/usePurchaseOrders'
import { useRawMaterials } from '@/features/raw-materials/hooks/useRawMaterials'
import { ExportMenu } from './ExportMenu'

const STATUS_TONE = { excellent: 'success', good: 'success', fair: 'warning', poor: 'danger' } as const

export function BusinessReport() {
  const { health } = useBusinessHealth()
  const { data: productsData } = useProducts({ pageSize: 10000 })
  const { data: vendorsData } = useVendors({ pageSize: 10000 })
  const { data: poData } = usePurchaseOrders({ pageSize: 10000 })
  const { data: materialsData } = useRawMaterials({ pageSize: 10000 })

  const purchaseOrders = poData?.items ?? []
  const spend = getTotalSpend(purchaseOrders, 30)
  const orders = getOrderCount(purchaseOrders, 30)
  const changePct = getSpendChangePct(purchaseOrders, 30)
  const chartData = getDailySpend(purchaseOrders, 30).map((p) => ({
    date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    spend: p.spend,
  }))
  const spendByCategory = getSpendByMaterialCategory(purchaseOrders, materialsData?.items ?? [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Report"
        description="A consolidated view of procurement spend, business health, and operational scale."
        actions={
          <ExportMenu
            filename="business-report"
            rows={health.categories.map((c) => ({ category: c.label, score: c.score, status: c.status, summary: c.summary }))}
          />
        }
      />

      <Reveal>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Procurement Spend (30d)" value={formatCompactCurrency(spend)} trend={{ value: changePct }} tone="primary" />
          <StatCard label="Purchase Orders (30d)" value={formatNumber(orders)} tone="info" />
          <StatCard label="Active Products" value={formatNumber((productsData?.items ?? []).filter((p) => p.status === 'active').length)} tone="success" />
          <StatCard label="Active Vendors" value={formatNumber((vendorsData?.items ?? []).filter((v) => v.status === 'active').length)} tone="warning" />
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="grid gap-4 lg:grid-cols-3">
          <AreaChartCard title="Procurement Spend Trend" description="Last 30 days" data={chartData} xKey="date" areaKey="spend" label="Spend" className="lg:col-span-2" />
          <PieChartCard title="Spend by Material Category" data={spendByCategory} />
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <Card>
          <CardHeader>
            <CardTitle>Business Health Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {health.categories.map((cat) => (
              <div key={cat.key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{cat.label}</span>
                  <span className="text-muted-foreground">{cat.score} / 100</span>
                </div>
                <ProgressBar value={cat.score} tone={STATUS_TONE[cat.status]} />
                <p className="mt-1 text-xs text-muted-foreground">{cat.summary}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Open Purchase Orders" value={formatNumber(purchaseOrders.filter((po) => !['received', 'cancelled'].includes(po.status)).length)} tone="primary" />
          <StatCard label="Total Purchase Orders" value={formatNumber(purchaseOrders.length)} tone="info" />
          <StatCard label="Overall Health Score" value={`${health.overallScore} / 100`} tone="success" />
        </div>
      </Reveal>
    </div>
  )
}
