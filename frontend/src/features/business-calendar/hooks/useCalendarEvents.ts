import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { calendarEventService, type CalendarEventInput } from '../services/calendarEventService'

export const calendarEventKeys = {
  all: ['calendar-events'] as const,
}

export function useCalendarEvents() {
  return useQuery({ queryKey: calendarEventKeys.all, queryFn: () => calendarEventService.getCalendarEvents() })
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CalendarEventInput) => calendarEventService.createCalendarEvent(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: calendarEventKeys.all }),
  })
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => calendarEventService.deleteCalendarEvent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: calendarEventKeys.all }),
  })
}
