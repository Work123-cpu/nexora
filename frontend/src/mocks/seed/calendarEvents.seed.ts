import type { CalendarEvent } from '@/types/entities/calendarEvent'
import { makeIdFactory } from '../generators/idGenerator'
import { VENDOR_IDS } from './vendorIds'

const nextId = makeIdFactory('cal')

/** Next future occurrence of a fixed month/day, rolling to next year if already passed. */
function nextOccurrence(month: number, day: number): Date {
  const now = new Date()
  const candidate = new Date(now.getFullYear(), month - 1, day)
  if (candidate.getTime() < now.setHours(0, 0, 0, 0)) candidate.setFullYear(candidate.getFullYear() + 1)
  return candidate
}

function iso(month: number, day: number, offsetDays = 0): string {
  const date = nextOccurrence(month, day)
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString()
}

const RAW_EVENTS: Omit<CalendarEvent, 'id'>[] = [
  { title: "New Year's Day", type: 'government-holiday', date: iso(1, 1), description: 'Federal holiday — plan procurement around the closure.' },
  { title: 'Memorial Day', type: 'government-holiday', date: iso(5, 25), description: 'Federal holiday — reduced logistics capacity.' },
  { title: 'Independence Day', type: 'government-holiday', date: iso(7, 4), description: 'Federal holiday — most suppliers closed.' },
  { title: 'Labor Day', type: 'government-holiday', date: iso(9, 7), description: 'Federal holiday — reduced carrier availability nationwide.' },
  { title: 'Thanksgiving Day', type: 'government-holiday', date: iso(11, 26), description: 'Federal holiday — most vendors closed, expect shipping delays.' },
  {
    title: 'Winter Company Shutdown',
    type: 'company-holiday',
    date: iso(12, 24),
    endDate: iso(12, 26),
    description: 'Facility closed for winter holidays; no inbound/outbound shipments.',
  },
  {
    title: 'Prairie Dairy Cooperative — Annual Maintenance',
    type: 'supplier-holiday',
    date: iso(9, 10),
    endDate: iso(9, 13),
    description: 'Dairy supplier facility offline for scheduled maintenance — expect delayed dairy shipments.',
    relatedVendorId: VENDOR_IDS.prairieDairyCoop,
  },
  {
    title: 'Heritage Grain Mill — Equipment Upgrade',
    type: 'supplier-holiday',
    date: iso(10, 5),
    endDate: iso(10, 8),
    description: 'Grain mill upgrading milling equipment — flour orders may be delayed by 3-4 days.',
    relatedVendorId: VENDOR_IDS.heritageGrainMill,
  },
  {
    title: 'Atlantic Fruit Co. — Harvest Season Closure',
    type: 'supplier-holiday',
    date: iso(9, 15),
    endDate: iso(9, 20),
    description: 'Supplier prioritizing harvest operations — fruit deliveries may be delayed.',
    relatedVendorId: VENDOR_IDS.atlanticFruitCo,
  },
  { title: 'Main Distribution Center — Conveyor Maintenance', type: 'maintenance', date: iso(8, 18), description: 'Scheduled preventive maintenance on the main conveyor system.' },
  { title: 'Cold Storage Facility — Refrigeration Inspection', type: 'maintenance', date: iso(9, 22), description: 'Annual refrigeration compliance inspection — brief capacity reduction expected.' },
]

export const calendarEvents: CalendarEvent[] = RAW_EVENTS.map((event) => ({ ...event, id: nextId() })).sort(
  (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
)

export function getUpcomingEvents(limit = 5): CalendarEvent[] {
  const now = Date.now()
  return calendarEvents
    .filter((e) => new Date(e.date).getTime() >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit)
}
