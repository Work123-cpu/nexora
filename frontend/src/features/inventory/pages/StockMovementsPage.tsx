import { useMemo, useState } from 'react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { StatCard } from '@/shared/ui/StatCard'
import { Reveal } from '@/shared/ui/Reveal'
import { Button } from '@/shared/ui/Button'
import { BarChartCard } from '@/shared/ui/charts/BarChartCard'
import { DataTable, type DataTableColumn } from '@/shared/ui/DataTable'
import { Badge } from '@/shared/ui/Badge'
import { formatDate, formatDateTime, formatNumber } from '@/shared/lib/formatters'
import { useAllStockMovements } from '../hooks/useInventory'
import type { StockMovement } from '@/types/entities/inventory'
import { ExportMenu } from '@/features/reports/components/ExportMenu'

type Period = 'day' | 'week' | 'month'

const PERIOD_OPTIONS: { value: Period; label: string; buckets: number }[] = [
  { value: 'day', label: 'Daily', buckets: 14 },
  { value: 'week', label: 'Weekly', buckets: 8 },
  { value: 'month', label: 'Monthly', buckets: 6 },
]

function bucketKey(date: Date, period: Period): string {
  if (period === 'month') return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  if (period === 'week') {
    const weekStart = new Date(date)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    return weekStart.toISOString().slice(0, 10)
  }
  return date.toISOString().slice(0, 10)
}

function bucketLabel(key: string, period: Period): string {
  if (period === 'month') {
    const [year, month] = key.split('-').map(Number)
    return new Date(year!, month! - 1, 1).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
  }
  return new Date(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** Buckets movements into the trailing N periods (oldest first) — event COUNT only, since
 * quantities across different materials use different units and can't be meaningfully summed
 * into one number. Per-material totals (with their own unit) are shown separately below. */
function buildChartData(movements: StockMovement[], period: Period, buckets: number) {
  const counts = new Map<string, number>()
  for (const m of movements) counts.set(bucketKey(new Date(m.createdAt), period), (counts.get(bucketKey(new Date(m.createdAt), period)) ?? 0) + 1)

  const now = new Date()
  const series: { key: string; period: string; movements: number }[] = []
  for (let i = buckets - 1; i >= 0; i--) {
    const d = new Date(now)
    if (period === 'month') d.setMonth(d.getMonth() - i)
    else if (period === 'week') d.setDate(d.getDate() - i * 7)
    else d.setDate(d.getDate() - i)
    const key = bucketKey(d, period)
    series.push({ key, period: bucketLabel(key, period), movements: counts.get(key) ?? 0 })
  }
  return series
}

export function StockMovementsPage() {
  const { data: movementsData, isLoading } = useAllStockMovements()
  const movements = useMemo(() => movementsData ?? [], [movementsData])
  const [period, setPeriod] = useState<Period>('day')

  const activePeriod = PERIOD_OPTIONS.find((p) => p.value === period)!
  const chartData = useMemo(() => buildChartData(movements, period, activePeriod.buckets), [movements, period, activePeriod.buckets])

  const windowStart = chartData[0] ? new Date(chartData[0].key) : null
  const inWindow = windowStart ? movements.filter((m) => new Date(m.createdAt) >= windowStart) : movements

  const poReceipts = inWindow.filter((m) => m.source === 'po_receipt').length
  const manualEntries = inWindow.filter((m) => m.source === 'manual').length
  const distinctMaterials = new Set(inWindow.map((m) => m.itemId)).size

  // Per-material totals within the visible window — each row keeps its own unit, so "5 kg" and
  // "12 unit" are never added together into a meaningless combined number.
  const byMaterial = new Map<string, { itemName: string; unit: string; quantity: number; lastAt: string }>()
  for (const m of inWindow) {
    const existing = byMaterial.get(m.itemId)
    if (existing) {
      existing.quantity += m.quantity
      if (m.createdAt > existing.lastAt) existing.lastAt = m.createdAt
    } else {
      byMaterial.set(m.itemId, { itemName: m.itemName, unit: m.unit, quantity: m.quantity, lastAt: m.createdAt })
    }
  }
  const materialRows = Array.from(byMaterial.values()).sort((a, b) => b.quantity - a.quantity)

  const materialColumns: DataTableColumn<(typeof materialRows)[number]>[] = [
    { key: 'itemName', header: 'Material', render: (r) => r.itemName },
    { key: 'quantity', header: 'Total Added', render: (r) => `${formatNumber(r.quantity)} ${r.unit}` },
    { key: 'lastAt', header: 'Last Added', render: (r) => formatDate(r.lastAt) },
  ]

  const movementColumns: DataTableColumn<StockMovement>[] = [
    { key: 'itemName', header: 'Material', render: (m) => m.itemName },
    { key: 'quantity', header: 'Quantity', render: (m) => `+${formatNumber(m.quantity)} ${m.unit}` },
    {
      key: 'source',
      header: 'Source',
      render: (m) => <Badge tone={m.source === 'po_receipt' ? 'info' : 'neutral'}>{m.source === 'po_receipt' ? 'Purchase order' : 'Manual entry'}</Badge>,
    },
    { key: 'createdAt', header: 'When', render: (m) => formatDateTime(m.createdAt) },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Movements"
        description="Every stock addition — purchase order receipts and manual entries — so you can see how much came in and when."
        actions={
          <ExportMenu
            filename="stock-movements"
            rows={movements.map((m) => ({
              material: m.itemName,
              quantity: m.quantity,
              unit: m.unit,
              source: m.source,
              date: m.createdAt,
            }))}
          />
        }
      />

      <Reveal>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <StatCard label={`Movements (${activePeriod.label.toLowerCase()} window)`} value={formatNumber(inWindow.length)} tone="primary" />
          <StatCard label="Materials Restocked" value={formatNumber(distinctMaterials)} tone="info" />
          <StatCard label="Via Purchase Orders" value={formatNumber(poReceipts)} tone="success" />
          <StatCard label="Via Manual Entry" value={formatNumber(manualEntries)} tone="warning" />
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {PERIOD_OPTIONS.map((opt) => (
              <Button key={opt.value} type="button" size="sm" variant={period === opt.value ? 'primary' : 'outline'} onClick={() => setPeriod(opt.value)}>
                {opt.label}
              </Button>
            ))}
          </div>
          <BarChartCard
            title="Stock Movements Over Time"
            description="Number of stock-in events per period — quantities aren't summed here since materials use different units."
            data={chartData}
            xKey="period"
            bars={[{ key: 'movements', label: 'Movements' }]}
          />
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Added by Material ({activePeriod.label.toLowerCase()} window)</h2>
          <DataTable columns={materialColumns} data={materialRows} isLoading={isLoading} rowKey={(r) => r.itemName} emptyTitle="No stock added in this window" />
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Recent Movements</h2>
          <DataTable columns={movementColumns} data={movements.slice(0, 20)} isLoading={isLoading} rowKey={(m) => m.id} emptyTitle="No stock movements yet" />
        </div>
      </Reveal>
    </div>
  )
}
