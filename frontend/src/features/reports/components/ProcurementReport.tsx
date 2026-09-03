import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { StatCard } from '@/shared/ui/StatCard'
import { Reveal } from '@/shared/ui/Reveal'
import { BarChartCard } from '@/shared/ui/charts/BarChartCard'
import { PieChartCard } from '@/shared/ui/charts/PieChartCard'
import { DataTable, type DataTableColumn } from '@/shared/ui/DataTable'
import { formatCompactCurrency, formatDate, formatNumber } from '@/shared/lib/formatters'
import { usePurchaseOrders } from '@/features/procurement/hooks/usePurchaseOrders'
import { useVendors } from '@/features/vendors/hooks/useVendors'
import type { PurchaseOrder } from '@/types/entities/purchaseOrder'
import { POStatusBadge } from '@/features/procurement/components/POStatusBadge'
import { ExportMenu } from './ExportMenu'

export function ProcurementReport() {
  const { data: poData } = usePurchaseOrders({ pageSize: 10000 })
  const { data: vendorsData } = useVendors({ pageSize: 10000 })
  const purchaseOrders = poData?.items ?? []
  const getVendorById = (id: string) => vendorsData?.items.find((v) => v.id === id)

  const totalSpend = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0)
  const avgOrderValue = purchaseOrders.length > 0 ? totalSpend / purchaseOrders.length : 0

  const spendByVendor = new Map<string, number>()
  purchaseOrders.forEach((po) => spendByVendor.set(po.vendorId, (spendByVendor.get(po.vendorId) ?? 0) + po.totalAmount))
  const topVendors = Array.from(spendByVendor.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([vendorId, spend]) => ({ vendor: getVendorById(vendorId)?.name.split(' ').slice(0, 2).join(' ') ?? 'Unknown', spend: Math.round(spend) }))

  const statusCounts = new Map<string, number>()
  purchaseOrders.forEach((po) => statusCounts.set(po.status, (statusCounts.get(po.status) ?? 0) + 1))
  const statusBreakdown = Array.from(statusCounts.entries()).map(([name, value]) => ({ name: name.replace('_', ' '), value }))

  const columns: DataTableColumn<PurchaseOrder>[] = [
    { key: 'poNumber', header: 'PO Number', render: (po) => po.poNumber },
    { key: 'vendor', header: 'Vendor', render: (po) => getVendorById(po.vendorId)?.name ?? '—' },
    { key: 'total', header: 'Total', render: (po) => formatCompactCurrency(po.totalAmount) },
    { key: 'status', header: 'Status', render: (po) => <POStatusBadge status={po.status} /> },
    { key: 'date', header: 'Created', render: (po) => formatDate(po.createdAt) },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Procurement Report"
        description="Spend analysis, vendor distribution, and order status across all purchase orders."
        actions={
          <ExportMenu
            filename="procurement-report"
            rows={purchaseOrders.map((po) => ({
              poNumber: po.poNumber,
              vendor: getVendorById(po.vendorId)?.name,
              total: po.totalAmount,
              status: po.status,
              createdAt: po.createdAt,
            }))}
          />
        }
      />

      <Reveal>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total Spend" value={formatCompactCurrency(totalSpend)} tone="primary" />
          <StatCard label="Total Orders" value={formatNumber(purchaseOrders.length)} tone="info" />
          <StatCard label="Average Order Value" value={formatCompactCurrency(avgOrderValue)} tone="success" />
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="grid gap-4 lg:grid-cols-3">
          <BarChartCard title="Top Vendors by Spend" data={topVendors} xKey="vendor" bars={[{ key: 'spend', label: 'Spend (₹)' }]} className="lg:col-span-2" />
          <PieChartCard title="Orders by Status" data={statusBreakdown} />
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Recent Purchase Orders</h2>
          <DataTable columns={columns} data={purchaseOrders.slice(0, 10)} rowKey={(po) => po.id} />
        </div>
      </Reveal>
    </div>
  )
}
