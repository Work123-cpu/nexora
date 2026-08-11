import { useQuery } from '@tanstack/react-query'
import { fetchLiveCommodities } from '../services/commodityService'

export function useLiveCommodities(rawMaterialNames: string[], apiKey: string) {
  return useQuery({
    queryKey: ['market-intelligence', 'live-commodities', rawMaterialNames.slice().sort(), apiKey ? 'keyed' : 'unkeyed'],
    queryFn: () => fetchLiveCommodities(rawMaterialNames, apiKey),
    enabled: Boolean(apiKey.trim()) && rawMaterialNames.length > 0,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}
