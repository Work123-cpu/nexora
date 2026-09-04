import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/shared/ui/Toast'
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

/** Company-wide, admin-only — powers the Stock Movements report and the dashboard's recent-
 * activity widget. `enabled` defaults to true for the report page; the dashboard widget passes
 * `session.role === 'admin'` so a non-admin viewing their dashboard never fires a request the
 * backend would just 403 on. */
export function useAllStockMovements(enabled = true) {
  return useQuery({
    queryKey: inventoryKeys.allMovements(),
    queryFn: () => inventoryService.getAllMovements(),
    enabled,
  })
}

export function useInventoryTrend(id: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.trend(id ?? ''),
    queryFn: () => inventoryService.getTrend(id!),
    enabled: Boolean(id),
  })
}

// Neither had error handling before -- callers that try/catch mutateAsync themselves (Add Stock,
// Edit Stock) already surfaced an inline error, but anything calling these without a try/catch
// (e.g. a future bulk flow) got zero feedback on failure. A toast covers that gap too.
export function useCreateInventoryItem() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (input: InventoryItemInput) => inventoryService.createInventoryItem(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
    onError: () => toast({ title: 'Could not save this stock entry', description: 'Please try again in a moment.', tone: 'error' }),
  })
}

export function useAdjustInventoryItem() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: InventoryAdjustInput }) => inventoryService.adjustInventoryItem(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
    onError: () => toast({ title: 'Could not update stock levels', description: 'Please try again in a moment.', tone: 'error' }),
  })
}
