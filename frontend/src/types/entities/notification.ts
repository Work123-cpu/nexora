export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low'
export type NotificationCategory = 'inventory' | 'procurement' | 'vendor' | 'forecast' | 'system' | 'market'

export interface AppNotification {
  id: string
  title: string
  message: string
  category: NotificationCategory
  priority: NotificationPriority
  read: boolean
  createdAt: string
  link?: string
}
