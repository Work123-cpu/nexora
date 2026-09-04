import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/shared/ui/Toast'
import { purchaseOrderService, type GetPurchaseOrdersParams, type PurchaseOrderInput } from '../services/purchaseOrderService'
import type { PurchaseOrderStatus } from '@/types/entities/purchaseOrder'

export const poKeys = {
  all: ['purchase-orders'] as const,
  list: (params: GetPurchaseOrdersParams) => [...poKeys.all, 'list', params] as const,
  detail: (id: string) => [...poKeys.all, 'detail', id] as const,
}

export function usePurchaseOrders(params: GetPurchaseOrdersParams) {
  return useQuery({ queryKey: poKeys.list(params), queryFn: () => purchaseOrderService.getPurchaseOrders(params), placeholderData: keepPreviousData })
}

export function usePurchaseOrder(id: string | undefined) {
  return useQuery({
    queryKey: poKeys.detail(id ?? ''),
    queryFn: () => purchaseOrderService.getPurchaseOrderById(id!),
    enabled: Boolean(id),
  })
}

// Neither had error handling before -- a failed request just stopped the button spinner with
// zero feedback, indistinguishable from the button being broken (same gap found and fixed in
// useNotifications.ts). A toast at least makes a real failure visible.
export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (input: PurchaseOrderInput) => purchaseOrderService.createPurchaseOrder(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: poKeys.all }),
    onError: () => toast({ title: 'Could not create purchase order', description: 'Please try again in a moment.', tone: 'error' }),
  })
}

export function useAdvancePurchaseOrder() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: ({ id, status, note, approvedBy }: { id: string; status: PurchaseOrderStatus; note?: string; approvedBy?: string }) =>
      purchaseOrderService.advanceStatus(id, status, note, approvedBy),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: poKeys.all }),
    onError: () => toast({ title: 'Could not update purchase order', description: 'Please try again in a moment.', tone: 'error' }),
  })
}
