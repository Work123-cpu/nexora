import { useQueries } from '@tanstack/react-query'
import { forecastService } from '@/services/forecast'
import type { ForecastRequest } from '@/services/forecast'

export const forecastKeys = {
  all: ['forecast'] as const,
  predict: (req: ForecastRequest) => [...forecastKeys.all, 'predict', req] as const,
}

/** Fires all product forecast requests in parallel rather than one query per render pass. */
export function useProductForecasts(requests: ForecastRequest[]) {
  return useQueries({
    queries: requests.map((req) => ({
      queryKey: forecastKeys.predict(req),
      queryFn: () => forecastService.predict(req),
      staleTime: 60_000,
    })),
  })
}
