import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/shared/ui/Toast'
import { billService, type BillInput, type GetBillsParams } from '../services/billService'

export const billKeys = {
  all: ['bills'] as const,
  list: (params: GetBillsParams) => [...billKeys.all, 'list', params] as const,
  detail: (id: string) => [...billKeys.all, 'detail', id] as const,
}

export function useBills(params: GetBillsParams = {}) {
  return useQuery({ queryKey: billKeys.list(params), queryFn: () => billService.getBills(params), placeholderData: keepPreviousData })
}

export function useBill(id: string | undefined) {
  return useQuery({
    queryKey: billKeys.detail(id ?? ''),
    queryFn: () => billService.getBillById(id!),
    enabled: Boolean(id),
  })
}

// Neither had error handling before -- a failed request just stopped the button spinner with
// zero feedback, indistinguishable from the button being broken (same gap found and fixed in
// useNotifications.ts). A toast at least makes a real failure visible.
export function useCreateBill() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (input: BillInput) => billService.createBill(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billKeys.all })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
    onError: () => toast({ title: 'Could not create bill', description: 'Please try again in a moment.', tone: 'error' }),
  })
}

export function useCancelBill() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (id: string) => billService.cancelBill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billKeys.all })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
    onError: () => toast({ title: 'Could not cancel bill', description: 'Please try again in a moment.', tone: 'error' }),
  })
}
