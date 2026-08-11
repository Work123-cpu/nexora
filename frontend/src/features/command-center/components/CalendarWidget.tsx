import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Badge } from '@/shared/ui/Badge'
import { formatDate } from '@/shared/lib/formatters'
import { getUpcomingEvents } from '@/mocks/seed/calendarEvents.seed'
import type { CalendarEventType } from '@/types/entities/calendarEvent'

const TYPE_TONE: Record<CalendarEventType, 'info' | 'primary' | 'warning' | 'neutral'> = {
  'government-holiday': 'info',
  'company-holiday': 'primary',
  'supplier-holiday': 'warning',
  maintenance: 'neutral',
}

const TYPE_LABEL: Record<CalendarEventType, string> = {
  'government-holiday': 'Holiday',
  'company-holiday': 'Company',
  'supplier-holiday': 'Supplier',
  maintenance: 'Maintenance',
}

export function CalendarWidget() {
  const events = getUpcomingEvents(5)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="size-4" /> Business Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id} className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">{event.title}</p>
                <p className="text-xs text-muted-foreground">{formatDate(event.date)}</p>
              </div>
              <Badge tone={TYPE_TONE[event.type]}>{TYPE_LABEL[event.type]}</Badge>
            </li>
          ))}
        </ul>
        <Link to="/app/business-calendar" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          Open full calendar <ArrowRight className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  )
}
