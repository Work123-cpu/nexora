import type { AppNotification, NotificationCategory, NotificationPriority } from '@/types/entities/notification'
import { apiClient } from '@/shared/lib/apiClient'

interface BackendNotification {
  id: string
  category: NotificationCategory
  priority: NotificationPriority
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: string
}

function fromBackend(n: BackendNotification): AppNotification {
  return { id: n.id, title: n.title, message: n.message, category: n.category, priority: n.priority, read: n.read, createdAt: n.createdAt, link: n.link }
}

export const notificationService = {
  getNotifications: (): Promise<AppNotification[]> => apiClient.get<BackendNotification[]>('/notifications').then((list) => list.map(fromBackend)),
  markRead: (id: string): Promise<void> => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: (): Promise<void> => apiClient.post('/notifications/mark-all-read'),
}
