import { useState } from 'react'
import { Bell, CheckCheck, Inbox } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent } from '@/shared/ui/Card'
import { Badge, type BadgeTone } from '@/shared/ui/Badge'
import { FilterBar, FilterChip } from '@/shared/ui/FilterBar'
import { EmptyState } from '@/shared/ui/EmptyState'
import { formatRelativeTime } from '@/shared/lib/formatters'
import { useNotifications } from '../hooks/useNotifications'
import type { NotificationPriority } from '@/types/entities/notification'

const PRIORITY_TONE: Record<NotificationPriority, BadgeTone> = { critical: 'danger', high: 'danger', medium: 'warning', low: 'neutral' }

export function NotificationsPage() {
  const { notifications, unread, markRead, markAllRead } = useNotifications()
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | undefined>(undefined)

  const filtered = notifications.filter((n) => !priorityFilter || n.priority === priorityFilter)

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Alerts and updates from across your business, prioritized by Nexora."
        actions={
          <Button variant="outline" leftIcon={<CheckCheck className="size-4" />} onClick={markAllRead}>
            Mark all as read
          </Button>
        }
      />

      {unread.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Bell className="size-4 text-primary" /> Unread ({unread.length})
          </h2>
          <div className="space-y-2">
            {unread.map((n) => (
              <Card key={n.id} className="border-primary/30 bg-primary-soft/30">
                <CardContent className="flex items-start justify-between gap-3 py-3.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{n.title}</p>
                      <Badge tone={PRIORITY_TONE[n.priority]} className="capitalize">
                        {n.priority}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{formatRelativeTime(n.createdAt)}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>
                    Mark read
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <FilterBar>
          <FilterChip active={!priorityFilter} onClick={() => setPriorityFilter(undefined)}>
            All
          </FilterChip>
          {(['critical', 'high', 'medium', 'low'] as NotificationPriority[]).map((p) => (
            <FilterChip key={p} active={priorityFilter === p} onClick={() => setPriorityFilter(p)}>
              {p}
            </FilterChip>
          ))}
        </FilterBar>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-foreground">History</h2>
      {filtered.length === 0 ? (
        <EmptyState icon={<Inbox className="size-5" />} title="No notifications" />
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <Card key={n.id} className={n.read ? 'opacity-70' : undefined}>
              <CardContent className="flex items-start justify-between gap-3 py-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <Badge tone={PRIORITY_TONE[n.priority]} className="capitalize">
                      {n.priority}
                    </Badge>
                    <Badge tone="neutral" className="capitalize">
                      {n.category}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{formatRelativeTime(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>
                    Mark read
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
