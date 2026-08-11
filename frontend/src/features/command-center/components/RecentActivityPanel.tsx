import { Box, ShoppingCart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { formatRelativeTime } from '@/shared/lib/formatters'
import { usePurchaseOrders } from '@/features/procurement/hooks/usePurchaseOrders'
import { cn } from '@/shared/lib/cn'

interface TimelineActivity {
  id: string
  poNumber: string
  status: string
  date: string
  note?: string
}

/** Real activity, sourced from purchase order status timelines — the only entity with genuine timestamped history. */
export function RecentActivityPanel() {
  const { data } = usePurchaseOrders({ pageSize: 10000 })

  const activities: TimelineActivity[] = (data?.items ?? [])
    .flatMap((po) => po.timeline.map((event, i) => ({ id: `${po.id}-${i}`, poNumber: po.poNumber, status: event.status, date: event.date, note: event.note })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <EmptyState icon={<Box className="size-5" />} title="No activity yet" description="Purchase order status changes will appear here." />
        ) : (
          <ul className="space-y-4">
            {activities.map((activity) => (
              <li key={activity.id} className="flex items-start gap-3">
                <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary')}>
                  <ShoppingCart className="size-3.5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{activity.poNumber}</span> moved to <span className="font-medium capitalize">{activity.status.replace('_', ' ')}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{formatRelativeTime(activity.date)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
