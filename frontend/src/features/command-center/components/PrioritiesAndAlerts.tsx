import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, CheckCircle2, Circle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Badge } from '@/shared/ui/Badge'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useAllRecommendations } from '@/shared/hooks/useRecommendations'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'

export function PrioritiesAndAlerts() {
  const { recommendations } = useAllRecommendations()
  const priorities = recommendations.slice(0, 5)
  const { notifications } = useNotifications()
  const criticalAlerts = notifications.filter((n) => n.priority === 'critical' || n.priority === 'high').slice(0, 5)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Today's Priorities</CardTitle>
        </CardHeader>
        <CardContent>
          {priorities.length === 0 ? (
            <EmptyState icon={<CheckCircle2 className="size-5" />} title="Nothing urgent today" description="All systems look healthy." />
          ) : (
            <ul className="space-y-3">
              {priorities.map((rec) => (
                <li key={rec.id} className="flex items-start gap-3">
                  <Circle className="mt-0.5 size-2.5 shrink-0 fill-primary text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{rec.title}</p>
                    <p className="text-xs text-muted-foreground">{rec.suggestedAction}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/app/ai/action-center"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            View AI Action Center <ArrowRight className="size-3.5" />
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Critical Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {criticalAlerts.length === 0 ? (
            <EmptyState icon={<CheckCircle2 className="size-5" />} title="No critical alerts" description="Everything is running smoothly." />
          ) : (
            <ul className="space-y-3">
              {criticalAlerts.map((alert) => (
                <li key={alert.id} className="flex items-start gap-3">
                  <AlertTriangle className={alert.priority === 'critical' ? 'mt-0.5 size-4 shrink-0 text-danger' : 'mt-0.5 size-4 shrink-0 text-warning'} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.message}</p>
                  </div>
                  <Badge tone={alert.priority === 'critical' ? 'danger' : 'warning'} className="capitalize">
                    {alert.priority}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <Link to="/app/notifications" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            View all notifications <ArrowRight className="size-3.5" />
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
