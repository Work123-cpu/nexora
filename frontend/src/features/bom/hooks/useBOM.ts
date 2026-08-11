import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

export function useCreateBOM() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BomInput) => bomService.createBOM(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bomKeys.all }),
  })
}

export function useUpdateBOM() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<BomInput> }) => bomService.updateBOM(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bomKeys.all }),
  })
}

export function useDeleteBOM() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => bomService.deleteBOM(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bomKeys.all }),
  })
}
