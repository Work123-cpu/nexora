import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { vendorService, type GetVendorsParams, type VendorInput } from '../services/vendorService'

export const vendorKeys = {
  all: ['vendors'] as const,
  list: (params: GetVendorsParams) => [...vendorKeys.all, 'list', params] as const,
  detail: (id: string) => [...vendorKeys.all, 'detail', id] as const,
  purchaseOrders: (id: string) => [...vendorKeys.all, 'purchase-orders', id] as const,
}

export function useVendors(params: GetVendorsParams = {}) {
  return useQuery({ queryKey: vendorKeys.list(params), queryFn: () => vendorService.getVendors(params), placeholderData: keepPreviousData })
}

export function useVendor(id: string | undefined) {
  return useQuery({
    queryKey: vendorKeys.detail(id ?? ''),
    queryFn: () => vendorService.getVendorById(id!),
    enabled: Boolean(id),
  })
}

export function useVendorPurchaseOrders(id: string | undefined) {
  return useQuery({
    queryKey: vendorKeys.purchaseOrders(id ?? ''),
    queryFn: () => vendorService.getPurchaseOrdersForVendor(id!),
    enabled: Boolean(id),
  })
}

export function useCreateVendor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: VendorInput) => vendorService.createVendor(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.all }),
  })
}

export function useUpdateVendor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<VendorInput> }) => vendorService.updateVendor(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.all }),
  })
}

export function useDeleteVendor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => vendorService.deleteVendor(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.all }),
  })
}
