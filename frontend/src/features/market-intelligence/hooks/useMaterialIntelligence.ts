import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { marketIntelService } from '../services/marketIntelService'

/** Exported so mutations elsewhere (raw material create/update/delete) can invalidate this
 * alongside their own query — otherwise a newly added material sits fully classified in the DB
 * but the Market Intelligence page keeps serving its stale 5-minute cache and never shows it. */
export const materialIntelligenceKeys = { all: ['market-intelligence', 'materials'] as const }
const QUERY_KEY = materialIntelligenceKeys.all

export function useMaterialIntelligence() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => marketIntelService.getMarketIntelligence(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useRefreshMaterialIntelligence() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => marketIntelService.refreshMarketIntelligence(),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data)
    },
  })
}
