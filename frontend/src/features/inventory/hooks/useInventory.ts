import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { inventoryService, type GetInventoryParams, type InventoryItemInput, type InventoryAdjustInput } from '../services/inventoryService'

export const inventoryKeys = {
  all: ['inventory'] as const,
  list: (params: GetInventoryParams) => [...inventoryKeys.all, 'list', params] as const,
  detail: (id: string) => [...inventoryKeys.all, 'detail', id] as const,
  movements: (itemId: string) => [...inventoryKeys.all, 'movements', itemId] as const,
  allMovements: () => [...inventoryKeys.all, 'movements', 'all'] as const,
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

export function useInventoryMovements(itemId: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.movements(itemId ?? ''),
    queryFn: () => inventoryService.getMovements(itemId!),
    enabled: Boolean(itemId),
  })
}

/** Company-wide, admin-only — powers the Stock Movements report. */
export function useAllStockMovements() {
  return useQuery({
    queryKey: inventoryKeys.allMovements(),
    queryFn: () => inventoryService.getAllMovements(),
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
