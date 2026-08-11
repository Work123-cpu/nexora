import type { IForecastService } from './ForecastServiceInterface'
import { mockForecastAdapter } from './adapters/mockForecastAdapter'
import { httpForecastAdapter } from './adapters/httpForecastAdapter'

const useMock = import.meta.env.VITE_USE_MOCK_FORECAST !== 'false'

export function createForecastService(): IForecastService {
  return useMock ? mockForecastAdapter : httpForecastAdapter
}
