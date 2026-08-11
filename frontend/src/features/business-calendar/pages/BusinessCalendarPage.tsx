import { useMemo, useState } from 'react'
import { CalendarDays, Landmark, Truck, Wrench } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Badge } from '@/shared/ui/Badge'
import { FilterBar, FilterChip } from '@/shared/ui/FilterBar'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatCard } from '@/shared/ui/StatCard'
import { formatDate } from '@/shared/lib/formatters'
import { calendarEvents } from '@/mocks/seed/calendarEvents.seed'
import { getVendorById } from '@/mocks/seed/vendors.seed'
import type { CalendarEventType } from '@/types/entities/calendarEvent'
import { MonthCalendarGrid } from '../components/MonthCalendarGrid'

const TYPE_META: Record<CalendarEventType, { label: string; tone: 'info' | 'primary' | 'warning' | 'neutral'; icon: typeof Landmark }> = {
  'government-holiday': { label: 'Government Holiday', tone: 'info', icon: Landmark },
  'company-holiday': { label: 'Company Holiday', tone: 'primary', icon: CalendarDays },
  'supplier-holiday': { label: 'Supplier Holiday', tone: 'warning', icon: Truck },
  maintenance: { label: 'Maintenance', tone: 'neutral', icon: Wrench },
}

export function BusinessCalendarPage() {
  const [typeFilter, setTypeFilter] = useState<CalendarEventType | undefined>(undefined)
  const [selectedDate, setSelectedDate] = useState(new Date())

  const filteredEvents = useMemo(
    () => calendarEvents.filter((e) => !typeFilter || e.type === typeFilter).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [typeFilter],
  )

  const upcoming = filteredEvents.filter((e) => new Date(e.date).getTime() >= Date.now() - 86400000)

  const counts = {
    'government-holiday': calendarEvents.filter((e) => e.type === 'government-holiday').length,
    'company-holiday': calendarEvents.filter((e) => e.type === 'company-holiday').length,
    'supplier-holiday': calendarEvents.filter((e) => e.type === 'supplier-holiday').length,
    maintenance: calendarEvents.filter((e) => e.type === 'maintenance').length,
  }

  return (
    <div>
      <PageHeader title="Business Calendar" description="Government holidays, company closures, supplier downtime, and maintenance schedules." />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Government Holidays" value={String(counts['government-holiday'])} icon={<Landmark className="size-5" />} tone="info" />
        <StatCard label="Company Holidays" value={String(counts['company-holiday'])} icon={<CalendarDays className="size-5" />} tone="primary" />
        <StatCard label="Supplier Holidays" value={String(counts['supplier-holiday'])} icon={<Truck className="size-5" />} tone="warning" />
        <StatCard label="Maintenance" value={String(counts.maintenance)} icon={<Wrench className="size-5" />} tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent>
            <MonthCalendarGrid events={filteredEvents} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <FilterBar>
                <FilterChip active={!typeFilter} onClick={() => setTypeFilter(undefined)}>
                  All
                </FilterChip>
                {(Object.keys(TYPE_META) as CalendarEventType[]).map((type) => (
                  <FilterChip key={type} active={typeFilter === type} onClick={() => setTypeFilter(type)}>
                    {TYPE_META[type].label}
                  </FilterChip>
                ))}
              </FilterBar>
            </div>

            {upcoming.length === 0 ? (
              <EmptyState icon={<CalendarDays className="size-5" />} title="No upcoming events" />
            ) : (
              <ul className="space-y-3">
                {upcoming.map((event) => {
                  const meta = TYPE_META[event.type]
                  const vendor = event.relatedVendorId ? getVendorById(event.relatedVendorId) : undefined
                  return (
                    <li key={event.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                        <meta.icon className="size-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">{event.title}</p>
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{event.description}</p>
                        <p className="mt-1 text-xs font-medium text-foreground">
                          {formatDate(event.date)}
                          {event.endDate ? ` – ${formatDate(event.endDate)}` : ''}
                          {vendor ? ` · ${vendor.name}` : ''}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
