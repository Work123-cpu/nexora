import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/shared/ui/Toast'
import { warehouseService, type WarehouseInput } from '../services/warehouseService'
import type { QueryParams } from '@/services/base/types'

export const warehouseKeys = {
  all: ['warehouses'] as const,
  list: (params: QueryParams) => [...warehouseKeys.all, 'list', params] as const,
  detail: (id: string) => [...warehouseKeys.all, 'detail', id] as const,
  inventory: (id: string) => [...warehouseKeys.all, 'inventory', id] as const,
}

export function useWarehouses(params: QueryParams = {}) {
  return useQuery({ queryKey: warehouseKeys.list(params), queryFn: () => warehouseService.getWarehouses(params) })
}

export function useWarehouse(id: string | undefined) {
  return useQuery({
    queryKey: warehouseKeys.detail(id ?? ''),
    queryFn: () => warehouseService.getWarehouseById(id!),
    enabled: Boolean(id),
  })
}

export function useWarehouseInventory(id: string | undefined) {
  return useQuery({
    queryKey: warehouseKeys.inventory(id ?? ''),
    queryFn: () => warehouseService.getInventoryForWarehouse(id!),
    enabled: Boolean(id),
  })
}

// None of the three had error handling before -- a failed request just stopped the button
// spinner with zero feedback, indistinguishable from the button being broken (same gap found and
// fixed in useNotifications.ts). A toast at least makes a real failure visible.
export function useCreateWarehouse() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (input: WarehouseInput) => warehouseService.createWarehouse(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: warehouseKeys.all }),
    onError: () => toast({ title: 'Could not create warehouse', description: 'Please try again in a moment.', tone: 'error' }),
  })
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<WarehouseInput> }) => warehouseService.updateWarehouse(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: warehouseKeys.all }),
    onError: () => toast({ title: 'Could not save warehouse', description: 'Please try again in a moment.', tone: 'error' }),
  })
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (id: string) => warehouseService.deleteWarehouse(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: warehouseKeys.all }),
    onError: () => toast({ title: 'Could not delete warehouse', description: 'Please try again in a moment.', tone: 'error' }),
  })
}
