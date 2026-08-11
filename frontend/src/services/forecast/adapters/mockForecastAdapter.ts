import type { IForecastService } from '../ForecastServiceInterface'
import type { ForecastRequest, ForecastResponse } from '../types'
import { buildNaiveProjection } from '../naiveProjection'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const mockForecastAdapter: IForecastService = {
  async predict(req: ForecastRequest): Promise<ForecastResponse> {
    await delay(300 + Math.random() * 200)
    return buildNaiveProjection(req)
  },
}
