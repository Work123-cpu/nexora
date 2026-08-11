import { createForecastService } from './forecastServiceFactory'

export const forecastService = createForecastService()
export type { IForecastService } from './ForecastServiceInterface'
export * from './types'
