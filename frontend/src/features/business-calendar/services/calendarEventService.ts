import type { CalendarEvent, CalendarEventType } from '@/types/entities/calendarEvent'
import { mockClient, findOrThrow, insertMock, updateMock, removeMock } from '@/services/base/mockClient'
import { calendarEvents } from '@/mocks/seed/calendarEvents.seed'
import { makeIdFactory } from '@/mocks/generators/idGenerator'
import { apiClient } from '@/shared/lib/apiClient'

const nextId = makeIdFactory('cal-new')

const USE_MOCK_BACKEND = import.meta.env.VITE_USE_MOCK_BACKEND !== 'false'

export interface CalendarEventInput {
  title: string
  type: CalendarEventType
  date: string
  endDate?: string
  description?: string
  relatedVendorId?: string
}

const mockCalendarEventService = {
  getCalendarEvents: (): Promise<CalendarEvent[]> => mockClient.request(() => [...calendarEvents]),

  createCalendarEvent: (input: CalendarEventInput): Promise<CalendarEvent> =>
    mockClient.request(() => insertMock(calendarEvents, { id: nextId(), description: '', ...input })),

  updateCalendarEvent: (id: string, input: CalendarEventInput): Promise<CalendarEvent> =>
    mockClient.request(() => updateMock(calendarEvents, id, input)),

  deleteCalendarEvent: (id: string): Promise<void> =>
    mockClient.request(() => {
      findOrThrow(calendarEvents, id)
      removeMock(calendarEvents, id)
    }),
}

const httpCalendarEventService = {
  getCalendarEvents: (): Promise<CalendarEvent[]> => apiClient.get<CalendarEvent[]>('/calendar-events'),
  createCalendarEvent: (input: CalendarEventInput): Promise<CalendarEvent> => apiClient.post<CalendarEvent>('/calendar-events', input),
  updateCalendarEvent: (id: string, input: CalendarEventInput): Promise<CalendarEvent> => apiClient.put<CalendarEvent>(`/calendar-events/${id}`, input),
  deleteCalendarEvent: (id: string): Promise<void> => apiClient.delete(`/calendar-events/${id}`),
}

export const calendarEventService = USE_MOCK_BACKEND ? mockCalendarEventService : httpCalendarEventService
