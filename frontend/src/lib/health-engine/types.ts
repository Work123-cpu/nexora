export type HealthStatus = 'excellent' | 'good' | 'fair' | 'poor'

export interface HealthCategory {
  key: string
  label: string
  score: number
  status: HealthStatus
  summary: string
}

export interface BusinessHealth {
  overallScore: number
  status: HealthStatus
  categories: HealthCategory[]
  generatedAt: string
}
