export type ForecastGranularity = 'day' | 'week' | 'month' | 'quarter'
export type ForecastModelName = 'xgboost' | 'random_forest' | 'naive_projection'

export interface ForecastRequest {
  productId: string
  productName: string
  category: string
  unitPrice: number
  avgDailyUsage: number
  granularity: ForecastGranularity
  horizon: number
}

export interface ForecastPoint {
  periodLabel: string
  periodStart: string
  predictedUnits: number
  lowerBound: number
  upperBound: number
}

export interface ForecastResponse {
  productId: string
  category: string
  granularity: ForecastGranularity
  horizon: number
  points: ForecastPoint[]
  modelUsed: ForecastModelName
  validationMae: number
  confidence: number
  generatedAt: string
  isSynthetic: boolean
  /** Frontend-only signal: this response came from the fail-soft fallback, not the live models. */
  degraded?: boolean
}
