import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { rawMaterialService, type GetRawMaterialsParams, type RawMaterialInput } from '../services/rawMaterialService'

export const rawMaterialKeys = {
  all: ['raw-materials'] as const,
  list: (params: GetRawMaterialsParams) => [...rawMaterialKeys.all, 'list', params] as const,
  detail: (id: string) => [...rawMaterialKeys.all, 'detail', id] as const,
}

export function useRawMaterials(params: GetRawMaterialsParams) {
  return useQuery({
    queryKey: rawMaterialKeys.list(params),
    queryFn: () => rawMaterialService.getRawMaterials(params),
    placeholderData: keepPreviousData,
  })
}

export function useRawMaterial(id: string | undefined) {
  return useQuery({
    queryKey: rawMaterialKeys.detail(id ?? ''),
    queryFn: () => rawMaterialService.getRawMaterialById(id!),
    enabled: Boolean(id),
  })
}

export function useCreateRawMaterial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RawMaterialInput) => rawMaterialService.createRawMaterial(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rawMaterialKeys.all }),
  })
}

export function useUpdateRawMaterial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<RawMaterialInput> }) => rawMaterialService.updateRawMaterial(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rawMaterialKeys.all }),
  })
}

export function useDeleteRawMaterial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => rawMaterialService.deleteRawMaterial(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rawMaterialKeys.all }),
  })
}
