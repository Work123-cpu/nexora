import { useQuery } from '@tanstack/react-query'
import { fetchLiveExchangeRates } from '../services/exchangeRateService'

export function useLiveExchangeRates() {
  return useQuery({
    queryKey: ['market-intelligence', 'live-exchange-rates'],
    queryFn: fetchLiveExchangeRates,
    staleTime: 60 * 60 * 1000,
    gcTime: 6 * 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}
