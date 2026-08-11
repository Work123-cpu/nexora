import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { IconButton } from '@/shared/ui/IconButton'
import { cn } from '@/shared/lib/cn'
import type { CalendarEvent, CalendarEventType } from '@/types/entities/calendarEvent'

const TYPE_DOT: Record<CalendarEventType, string> = {
  'government-holiday': 'bg-info',
  'company-holiday': 'bg-primary',
  'supplier-holiday': 'bg-warning',
  maintenance: 'bg-muted-foreground',
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface MonthCalendarGridProps {
  events: CalendarEvent[]
  selectedDate: Date
  onSelectDate: (date: Date) => void
}

export function MonthCalendarGrid({ events, selectedDate, onSelectDate }: MonthCalendarGridProps) {
  const [viewDate, setViewDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const event of events) {
      const start = new Date(event.date)
      const end = event.endDate ? new Date(event.endDate) : start
      const cursor = new Date(start)
      while (cursor <= end) {
        const key = cursor.toDateString()
        map.set(key, [...(map.get(key) ?? []), event])
        cursor.setDate(cursor.getDate() + 1)
      }
    }
    return map
  }, [events])

  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()
  const startOffset = firstDayOfMonth.getDay()

  const cells: (Date | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewDate.getFullYear(), viewDate.getMonth(), i + 1)),
  ]

  const today = new Date()

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        <div className="flex gap-1">
          <IconButton
            icon={<ChevronLeft className="size-4" />}
            variant="ghost"
            aria-label="Previous month"
            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
          />
          <IconButton
            icon={<ChevronRight className="size-4" />}
            variant="ghost"
            aria-label="Next month"
            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
          />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />
          const dayEvents = eventsByDay.get(date.toDateString()) ?? []
          const isToday = date.toDateString() === today.toDateString()
          const isSelected = date.toDateString() === selectedDate.toDateString()

          return (
            <button
              key={i}
              onClick={() => onSelectDate(date)}
              className={cn(
                'flex aspect-square flex-col items-center justify-center gap-1 rounded-lg text-xs transition-colors hover:bg-surface-elevated',
                isSelected && 'bg-primary-soft text-primary font-semibold',
                isToday && !isSelected && 'ring-1 ring-primary/50',
              )}
            >
              <span>{date.getDate()}</span>
              {dayEvents.length > 0 && (
                <span className="flex gap-0.5">
                  {dayEvents.slice(0, 3).map((e, idx) => (
                    <span key={idx} className={cn('size-1 rounded-full', TYPE_DOT[e.type])} />
                  ))}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
