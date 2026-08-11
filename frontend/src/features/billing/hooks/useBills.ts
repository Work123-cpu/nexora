import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { billService, type BillInput } from '../services/billService'
import type { QueryParams } from '@/services/base/types'

export const billKeys = {
  all: ['bills'] as const,
  list: (params: QueryParams) => [...billKeys.all, 'list', params] as const,
  detail: (id: string) => [...billKeys.all, 'detail', id] as const,
}

export function useBills(params: QueryParams = {}) {
  return useQuery({ queryKey: billKeys.list(params), queryFn: () => billService.getBills(params), placeholderData: keepPreviousData })
}

export function useBill(id: string | undefined) {
  return useQuery({
    queryKey: billKeys.detail(id ?? ''),
    queryFn: () => billService.getBillById(id!),
    enabled: Boolean(id),
  })
}

export function useCreateBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BillInput) => billService.createBill(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billKeys.all })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export function useCancelBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => billService.cancelBill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billKeys.all })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}
