import { useState } from 'react'
import { AlertTriangle, Bell, CheckCheck, Inbox, MailWarning } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Button } from '@/shared/ui/Button'
import { StatCard } from '@/shared/ui/StatCard'
import { Card, CardContent } from '@/shared/ui/Card'
import { Badge, type BadgeTone } from '@/shared/ui/Badge'
import { FilterBar, FilterChip } from '@/shared/ui/FilterBar'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useToast } from '@/shared/ui/Toast'
import { formatRelativeTime } from '@/shared/lib/formatters'
import { aiService } from '@/services/ai'
import { useNotifications } from '../hooks/useNotifications'
import type { AppNotification, NotificationPriority } from '@/types/entities/notification'

const PRIORITY_TONE: Record<NotificationPriority, BadgeTone> = { critical: 'danger', high: 'danger', medium: 'warning', low: 'neutral' }

export function NotificationsPage() {
  const { notifications, unread, markRead, markAllRead } = useNotifications()
  const { toast } = useToast()
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | undefined>(undefined)
  const [explaining, setExplaining] = useState<string | null>(null)

  const filtered = notifications.filter((n) => !priorityFilter || n.priority === priorityFilter)
  const criticalCount = notifications.filter((n) => n.priority === 'critical').length
  const highCount = notifications.filter((n) => n.priority === 'high').length

  // Grounds the LLM in this alert's real numbers (already embedded in message/category/priority,
  // sourced from live backend inventory/PO/vendor data) rather than asking it to invent context.
  const handleExplain = async (n: AppNotification) => {
    setExplaining(n.id)
    try {
      const res = await aiService.explain({ subject: n.title, data: { message: n.message, category: n.category, priority: n.priority } })
      toast({ title: 'Nexora explains', description: res.explanation, tone: 'info' })
    } catch {
      toast({ title: 'Could not reach the AI service', description: 'Try again in a moment.', tone: 'error' })
    } finally {
      setExplaining(null)
    }
  }

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

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Unread" value={String(unread.length)} icon={<MailWarning className="size-5" />} tone="primary" />
        <StatCard label="Critical" value={String(criticalCount)} icon={<AlertTriangle className="size-5" />} tone="danger" />
        <StatCard label="High Priority" value={String(highCount)} icon={<Bell className="size-5" />} tone="warning" />
      </div>

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
                  <div className="flex shrink-0 items-center gap-1">
                    <Button size="sm" variant="ghost" isLoading={explaining === n.id} onClick={() => handleExplain(n)}>
                      Ask AI to explain
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>
                      Mark read
                    </Button>
                  </div>
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
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="sm" variant="ghost" isLoading={explaining === n.id} onClick={() => handleExplain(n)}>
                    Ask AI to explain
                  </Button>
                  {!n.read && (
                    <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>
                      Mark read
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
