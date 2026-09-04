import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useToast } from '@/shared/ui/Toast'
import { notificationService } from '../services/notificationService'

const notificationKeys = { all: ['notifications'] as const }

/** Polls the backend every 60s so the bell badge and notifications page stay current without a
 * full page reload — the backend itself re-syncs low-stock/PO/vendor alerts on every read (see
 * NotificationService.list), so this is effectively as fresh as the last minute of activity. */
export function useNotifications() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { data } = useQuery({
    queryKey: notificationKeys.all,
    queryFn: () => notificationService.getNotifications(),
    refetchInterval: 60_000,
  })
  const notifications = data ?? []
  const unread = notifications.filter((n) => !n.read)

  // Neither mutation had error handling before -- a failed request (a network blip, the backend
  // restarting mid-click) just did nothing with zero feedback, indistinguishable from the button
  // being broken. A toast at least makes a real failure visible instead of silent.
  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
    onError: () => toast({ title: 'Could not mark as read', description: 'Please try again in a moment.', tone: 'error' }),
  })
  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
    onError: () => toast({ title: 'Could not mark all as read', description: 'Please try again in a moment.', tone: 'error' }),
  })

  return {
    notifications,
    unread,
    markRead: (id: string) => markReadMutation.mutate(id),
    markAllRead: () => markAllReadMutation.mutate(),
  }
}
