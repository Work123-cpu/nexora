import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/shared/ui/Toast'
import { bomService, type BomInput } from '../services/bomService'
import type { QueryParams } from '@/services/base/types'

export const bomKeys = {
  all: ['bom'] as const,
  list: (params: QueryParams) => [...bomKeys.all, 'list', params] as const,
  detail: (id: string) => [...bomKeys.all, 'detail', id] as const,
}

export function useBOMs(params: QueryParams) {
  return useQuery({ queryKey: bomKeys.list(params), queryFn: () => bomService.getBOMs(params), placeholderData: keepPreviousData })
}

export function useBOM(id: string | undefined) {
  return useQuery({
    queryKey: bomKeys.detail(id ?? ''),
    queryFn: () => bomService.getBOMById(id!),
    enabled: Boolean(id),
  })
}

// None of the three had error handling before -- a failed request just stopped the button
// spinner with zero feedback, indistinguishable from the button being broken (same gap found and
// fixed in useNotifications.ts). A toast at least makes a real failure visible.
export function useCreateBOM() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (input: BomInput) => bomService.createBOM(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bomKeys.all }),
    onError: () => toast({ title: 'Could not create bill of materials', description: 'Please try again in a moment.', tone: 'error' }),
  })
}

export function useUpdateBOM() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<BomInput> }) => bomService.updateBOM(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bomKeys.all }),
    onError: () => toast({ title: 'Could not save bill of materials', description: 'Please try again in a moment.', tone: 'error' }),
  })
}

export function useDeleteBOM() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (id: string) => bomService.deleteBOM(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bomKeys.all }),
    onError: () => toast({ title: 'Could not delete bill of materials', description: 'Please try again in a moment.', tone: 'error' }),
  })
}
