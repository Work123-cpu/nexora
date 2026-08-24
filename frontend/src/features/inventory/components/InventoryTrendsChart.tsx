import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { LineChart } from 'lucide-react'

/** Re-add the trend chart once the backend records daily on-hand snapshots — see inventoryService.ts. */
export function InventoryTrendsChart() {
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
