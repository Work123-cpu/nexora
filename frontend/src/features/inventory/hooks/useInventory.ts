import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { inventoryService, type GetInventoryParams, type InventoryItemInput, type InventoryAdjustInput } from '../services/inventoryService'

export const inventoryKeys = {
  all: ['inventory'] as const,
  list: (params: GetInventoryParams) => [...inventoryKeys.all, 'list', params] as const,
  detail: (id: string) => [...inventoryKeys.all, 'detail', id] as const,
  movements: (id: string) => [...inventoryKeys.all, 'movements', id] as const,
  trend: (id: string) => [...inventoryKeys.all, 'trend', id] as const,
}

export function useInventoryItems(params: GetInventoryParams) {
  return useQuery({
    queryKey: inventoryKeys.list(params),
    queryFn: () => inventoryService.getInventoryItems(params),
    placeholderData: keepPreviousData,
  })
}

export function useInventoryItem(id: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.detail(id ?? ''),
    queryFn: () => inventoryService.getInventoryItemById(id!),
    enabled: Boolean(id),
  })
}

export function useInventoryMovements(id: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.movements(id ?? ''),
    queryFn: () => inventoryService.getMovements(id!),
    enabled: Boolean(id),
  })
}

export function useInventoryTrend(id: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.trend(id ?? ''),
    queryFn: () => inventoryService.getTrend(id!),
    enabled: Boolean(id),
  })
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: InventoryItemInput) => inventoryService.createInventoryItem(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}

export function useAdjustInventoryItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: InventoryAdjustInput }) => inventoryService.adjustInventoryItem(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}
