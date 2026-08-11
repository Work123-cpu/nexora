export type ActivityCategory = 'product' | 'inventory' | 'procurement' | 'vendor' | 'system' | 'ai'

export interface ActivityItem {
  id: string
  actorName: string
  action: string
  entityName: string
  category: ActivityCategory
  timestamp: string
}
