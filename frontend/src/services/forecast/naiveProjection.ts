import type { ForecastGranularity, ForecastPoint, ForecastRequest, ForecastResponse } from './types'

const DAYS_PER_PERIOD: Record<ForecastGranularity, number> = { day: 1, week: 7, month: 30, quarter: 91 }

function formatLabel(date: Date, granularity: ForecastGranularity): string {
  if (granularity === 'day') return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  if (granularity === 'week') return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  if (granularity === 'month') return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  const quarter = Math.floor(date.getMonth() / 3) + 1
  return `Q${quarter} ${date.getFullYear()}`
}

/**
 * A flat "avg daily usage x period length" projection with no seasonality or trend — the same
 * math ForecastReport used before real ML forecasting existed. Shared by the mock adapter (so
 * mock mode looks identical to today's behavior) and the http adapter's failure fallback (so a
 * down ai-service degrades to this instead of an error state).
 */
export function buildNaiveProjection(req: ForecastRequest, degraded = false): ForecastResponse {
  const periodDays = DAYS_PER_PERIOD[req.granularity]
  const points: ForecastPoint[] = []
  const start = new Date()
  start.setDate(start.getDate() + 1)

  for (let i = 0; i < req.horizon; i++) {
    const periodStart = new Date(start)
    periodStart.setDate(periodStart.getDate() + i * periodDays)
    const predictedUnits = Math.round(req.avgDailyUsage * periodDays * 10) / 10

    points.push({
      periodLabel: formatLabel(periodStart, req.granularity),
      periodStart: periodStart.toISOString().slice(0, 10),
      predictedUnits,
      lowerBound: Math.round(predictedUnits * 0.85 * 10) / 10,
      upperBound: Math.round(predictedUnits * 1.15 * 10) / 10,
    })
  }

  return {
    productId: req.productId,
    category: req.category,
    granularity: req.granularity,
    horizon: req.horizon,
    points,
    modelUsed: 'naive_projection',
    validationMae: 0,
    confidence: 0.5,
    generatedAt: new Date().toISOString(),
    isSynthetic: true,
    degraded,
  }
}
