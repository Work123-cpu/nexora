import type { ForecastRequest, ForecastResponse } from './types'

/**
 * Every forecast-consuming surface talks only to this contract. Swapping the mock adapter for
 * `httpForecastAdapter` (which calls the FastAPI /api/forecast/predict endpoint, backed by
 * genuinely-trained XGBoost/Random Forest models) is a one-line change in
 * `forecastServiceFactory.ts` — no consumer code changes.
 */
export interface IForecastService {
  predict(req: ForecastRequest): Promise<ForecastResponse>
}
