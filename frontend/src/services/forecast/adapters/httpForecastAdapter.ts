import type { IForecastService } from '../ForecastServiceInterface'
import type { ForecastRequest, ForecastResponse } from '../types'
import { buildNaiveProjection } from '../naiveProjection'

/**
 * Talks to the FastAPI ai-service's /api/forecast/predict endpoint (genuinely-trained
 * XGBoost/Random Forest models) — never computes forecasts itself. Fails soft: a down/unstarted
 * service or a model still warming up (503 forecast_model_unavailable) degrades to the same naive
 * projection used in mock mode, tagged `degraded: true`, so the UI never shows a hard error for
 * what is fundamentally just a numbers table.
 */
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL ?? 'http://localhost:8000'

export const httpForecastAdapter: IForecastService = {
  async predict(req: ForecastRequest): Promise<ForecastResponse> {
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/forecast/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      })
      if (!response.ok) throw new Error(`Forecast service responded ${response.status}`)
      return (await response.json()) as ForecastResponse
    } catch {
      return buildNaiveProjection(req, true)
    }
  },
}
