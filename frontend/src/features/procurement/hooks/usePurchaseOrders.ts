import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PurchaseOrderInput) => purchaseOrderService.createPurchaseOrder(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: poKeys.all }),
  })
}

export function useAdvancePurchaseOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, note, approvedBy }: { id: string; status: PurchaseOrderStatus; note?: string; approvedBy?: string }) =>
      purchaseOrderService.advanceStatus(id, status, note, approvedBy),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: poKeys.all }),
  })
}
