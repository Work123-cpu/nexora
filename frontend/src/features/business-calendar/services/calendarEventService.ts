import type { CalendarEvent, CalendarEventType } from '@/types/entities/calendarEvent'
import { apiClient } from '@/shared/lib/apiClient'

export interface CalendarEventInput {
  title: string
  type: CalendarEventType
  date: string
  endDate?: string
  description?: string
  relatedVendorId?: string
}

export const calendarEventService = {
  getCalendarEvents: (): Promise<CalendarEvent[]> => apiClient.get<CalendarEvent[]>('/calendar-events'),
  createCalendarEvent: (input: CalendarEventInput): Promise<CalendarEvent> => apiClient.post<CalendarEvent>('/calendar-events', input),
  updateCalendarEvent: (id: string, input: CalendarEventInput): Promise<CalendarEvent> => apiClient.put<CalendarEvent>(`/calendar-events/${id}`, input),
  deleteCalendarEvent: (id: string): Promise<void> => apiClient.delete(`/calendar-events/${id}`),
}
