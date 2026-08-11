import { useState } from 'react'
import { Select } from '@/shared/ui/Select'
import { AreaChartCard } from '@/shared/ui/charts/AreaChartCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { LineChart } from 'lucide-react'
import { inventoryTrends } from '@/mocks/seed/inventoryTrends.seed'

/** Flip to "false" once the backend records daily on-hand snapshots — see inventoryService.ts. */
const USE_MOCK_BACKEND = import.meta.env.VITE_USE_MOCK_BACKEND !== 'false'

export function InventoryTrendsChart() {
  const [selectedId, setSelectedId] = useState(inventoryTrends[0]?.inventoryItemId ?? '')

  if (!USE_MOCK_BACKEND) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<LineChart className="size-5" />}
            title="Trend history not tracked yet"
            description="Daily on-hand snapshots aren't modeled in the backend yet — current quantities are always accurate, but a 90-day history isn't recorded."
          />
        </CardContent>
      </Card>
    )
  }

  const trend = inventoryTrends.find((t) => t.inventoryItemId === selectedId) ?? inventoryTrends[0]

  const chartData =
    trend?.points.map((p) => ({
      date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      quantity: p.quantity,
    })) ?? []

  return (
    <div className="relative">
      <AreaChartCard title="Inventory Trend" description="90-day on-hand quantity" data={chartData} xKey="date" areaKey="quantity" label={trend?.itemName} colorIndex={2} />
      <div className="absolute right-5 top-5">
        <Select
          options={inventoryTrends.map((t) => ({ label: t.itemName, value: t.inventoryItemId }))}
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="h-8 text-xs"
        />
      </div>
    </div>
  )
}
