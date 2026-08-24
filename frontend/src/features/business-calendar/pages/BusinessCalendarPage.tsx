import { useMemo, useState, type FormEvent } from 'react'
import { CalendarDays, Landmark, Plus, Trash2, Truck, Wrench } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Badge } from '@/shared/ui/Badge'
import { FilterBar, FilterChip } from '@/shared/ui/FilterBar'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatCard } from '@/shared/ui/StatCard'
import { Button } from '@/shared/ui/Button'
import { IconButton } from '@/shared/ui/IconButton'
import { Input } from '@/shared/ui/Input'
import { Select } from '@/shared/ui/Select'
import { Dialog } from '@/shared/ui/Dialog'
import { useToast } from '@/shared/ui/Toast'
import { RoleGuard } from '@/app/router/RoleGuard'
import { formatDate } from '@/shared/lib/formatters'
import { useVendors } from '@/features/vendors/hooks/useVendors'
import type { CalendarEventType } from '@/types/entities/calendarEvent'
import { MonthCalendarGrid } from '../components/MonthCalendarGrid'
import { useCalendarEvents, useCreateCalendarEvent, useDeleteCalendarEvent } from '../hooks/useCalendarEvents'

const TYPE_META: Record<CalendarEventType, { label: string; tone: 'info' | 'primary' | 'warning' | 'neutral'; icon: typeof Landmark }> = {
  'government-holiday': { label: 'Government Holiday', tone: 'info', icon: Landmark },
  'company-holiday': { label: 'Company Holiday', tone: 'primary', icon: CalendarDays },
  'supplier-holiday': { label: 'Supplier Holiday', tone: 'warning', icon: Truck },
  maintenance: { label: 'Maintenance', tone: 'neutral', icon: Wrench },
}

const todayIso = () => new Date().toISOString().slice(0, 10)

export function BusinessCalendarPage() {
  const { toast } = useToast()
  const { data: calendarEvents } = useCalendarEvents()
  const createEvent = useCreateCalendarEvent()
  const deleteEvent = useDeleteCalendarEvent()
  const { data: vendorsData } = useVendors({ pageSize: 10000 })
  const vendors = vendorsData?.items ?? []
  const getVendorById = (id: string) => vendors.find((v) => v.id === id)

  const [typeFilter, setTypeFilter] = useState<CalendarEventType | undefined>(undefined)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<CalendarEventType>('company-holiday')
  const [date, setDate] = useState(todayIso())
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')

  const events = calendarEvents ?? []

  const filteredEvents = useMemo(
    () => events.filter((e) => !typeFilter || e.type === typeFilter).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [events, typeFilter],
  )

  const upcoming = filteredEvents.filter((e) => new Date(e.date).getTime() >= Date.now() - 86400000)

  const counts = {
    'government-holiday': events.filter((e) => e.type === 'government-holiday').length,
    'company-holiday': events.filter((e) => e.type === 'company-holiday').length,
    'supplier-holiday': events.filter((e) => e.type === 'supplier-holiday').length,
    maintenance: events.filter((e) => e.type === 'maintenance').length,
  }

  const resetForm = () => {
    setTitle('')
    setType('company-holiday')
    setDate(todayIso())
    setEndDate('')
    setDescription('')
  }

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !date) return
    try {
      await createEvent.mutateAsync({
        title: title.trim(),
        type,
        date: new Date(date).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        description: description.trim() || undefined,
      })
      toast({ title: 'Event added', tone: 'success' })
      setDialogOpen(false)
      resetForm()
    } catch (err) {
      toast({ title: 'Could not add event', description: err instanceof Error ? err.message : undefined, tone: 'error' })
    }
  }

  const handleDelete = async (id: string, eventTitle: string) => {
    try {
      await deleteEvent.mutateAsync(id)
      toast({ title: 'Event removed', description: eventTitle, tone: 'warning' })
    } catch (err) {
      toast({ title: 'Could not remove event', description: err instanceof Error ? err.message : undefined, tone: 'error' })
    }
  }

  return (
    <div>
      <PageHeader
        title="Business Calendar"
        description="Government holidays, company closures, supplier downtime, and maintenance schedules."
        actions={
          <RoleGuard resource="business-calendar" action="create">
            <Button leftIcon={<Plus className="size-4" />} onClick={() => setDialogOpen(true)}>
              Add Event
            </Button>
          </RoleGuard>
        }
      />

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
                {(Object.keys(TYPE_META) as CalendarEventType[]).map((t) => (
                  <FilterChip key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)}>
                    {TYPE_META[t].label}
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
                          <div className="flex items-center gap-2">
                            <Badge tone={meta.tone}>{meta.label}</Badge>
                            <RoleGuard resource="business-calendar" action="delete">
                              <IconButton
                                icon={<Trash2 className="size-3.5 text-danger" />}
                                variant="ghost"
                                aria-label={`Remove ${event.title}`}
                                onClick={() => handleDelete(event.id, event.title)}
                              />
                            </RoleGuard>
                          </div>
                        </div>
                        {event.description && <p className="mt-0.5 text-xs text-muted-foreground">{event.description}</p>}
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

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          resetForm()
        }}
        title="Add Calendar Event"
        description="Any custom date — a company holiday, supplier downtime, or a maintenance window."
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Select
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value as CalendarEventType)}
            options={(Object.keys(TYPE_META) as CalendarEventType[]).map((t) => ({ label: TYPE_META[t].label, value: t }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            <Input label="End date (optional)" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <Input label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createEvent.isPending} leftIcon={<Plus className="size-4" />}>
              Add Event
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
