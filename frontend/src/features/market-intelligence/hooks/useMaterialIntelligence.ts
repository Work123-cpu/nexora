import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { marketIntelService } from '../services/marketIntelService'

const QUERY_KEY = ['market-intelligence', 'materials']

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
