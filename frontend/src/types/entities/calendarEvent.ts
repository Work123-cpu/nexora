export type CalendarEventType = 'government-holiday' | 'company-holiday' | 'supplier-holiday' | 'maintenance'

export interface CalendarEvent {
  id: string
  title: string
  type: CalendarEventType
  date: string
  endDate?: string
  description: string
  relatedVendorId?: string
}
