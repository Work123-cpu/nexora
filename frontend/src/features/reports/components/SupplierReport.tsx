import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { StatCard } from '@/shared/ui/StatCard'
import { BarChartCard } from '@/shared/ui/charts/BarChartCard'
import { DataTable, type DataTableColumn } from '@/shared/ui/DataTable'
import { Badge } from '@/shared/ui/Badge'
import { formatNumber } from '@/shared/lib/formatters'
import { useVendors } from '@/features/vendors/hooks/useVendors'
import type { Vendor } from '@/types/entities/vendor'
import { ExportMenu } from './ExportMenu'

export function SupplierReport() {
  const { data } = useVendors({ pageSize: 10000 })
  const vendors = data?.items ?? []
  const activeVendors = vendors.filter((v) => v.status !== 'inactive')
  const avgOnTime = activeVendors.length > 0 ? activeVendors.reduce((sum, v) => sum + v.onTimeDeliveryPct, 0) / activeVendors.length : 0
  const avgQuality = activeVendors.length > 0 ? activeVendors.reduce((sum, v) => sum + v.qualityScorePct, 0) / activeVendors.length : 0
  const underReview = vendors.filter((v) => v.status === 'under-review').length

  const chartData = vendors
    .slice()
    .sort((a, b) => b.onTimeDeliveryPct - a.onTimeDeliveryPct)
    .slice(0, 10)
    .map((v) => ({ vendor: v.name.split(' ').slice(0, 2).join(' '), onTime: v.onTimeDeliveryPct, quality: v.qualityScorePct }))

  const columns: DataTableColumn<Vendor>[] = [
    { key: 'name', header: 'Vendor', render: (v) => v.name },
    { key: 'category', header: 'Category', render: (v) => <Badge tone="neutral">{v.category}</Badge> },
    { key: 'onTime', header: 'On-Time %', render: (v) => `${v.onTimeDeliveryPct}%` },
    { key: 'quality', header: 'Quality %', render: (v) => `${v.qualityScorePct}%` },
    { key: 'leadTime', header: 'Lead Time', render: (v) => `${v.leadTimeDays} days` },
    { key: 'status', header: 'Status', render: (v) => <Badge tone={v.status === 'active' ? 'success' : v.status === 'under-review' ? 'warning' : 'neutral'} className="capitalize">{v.status.replace('-', ' ')}</Badge> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier Report"
        description="Vendor performance comparison across delivery reliability and quality."
        actions={
          <ExportMenu
            filename="supplier-report"
            rows={vendors.map((v) => ({ vendor: v.name, category: v.category, onTimeDeliveryPct: v.onTimeDeliveryPct, qualityScorePct: v.qualityScorePct, leadTimeDays: v.leadTimeDays, status: v.status }))}
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Avg On-Time Delivery" value={`${avgOnTime.toFixed(0)}%`} tone="primary" />
        <StatCard label="Avg Quality Score" value={`${avgQuality.toFixed(0)}%`} tone="success" />
        <StatCard label="Vendors Under Review" value={formatNumber(underReview)} tone="warning" />
      </div>

      <BarChartCard
        title="Top Performing Vendors"
        description="On-time delivery vs quality score"
        data={chartData}
        xKey="vendor"
        bars={[
          { key: 'onTime', label: 'On-Time %', colorIndex: 0 },
          { key: 'quality', label: 'Quality %', colorIndex: 1 },
        ]}
      />

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">All Vendors</h2>
        <DataTable columns={columns} data={vendors} rowKey={(v) => v.id} />
      </div>
    </div>
  )
}
