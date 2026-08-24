import { RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'

/** Re-add the timeline rendering once the backend logs real stock movements — see inventoryService.ts. */
export function StockMovementTimeline() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Movement Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <EmptyState
          icon={<RefreshCw className="size-5" />}
          title="Movement history not tracked yet"
          description="Stock movement logging isn't modeled in the backend yet — inventory quantities update correctly, but a per-transaction history isn't recorded."
        />
      </CardContent>
    </Card>
  )
}
