import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/shared/ui/Toast'
import { rawMaterialService, type GetRawMaterialsParams, type RawMaterialInput } from '../services/rawMaterialService'
import { materialIntelligenceKeys } from '@/features/market-intelligence/hooks/useMaterialIntelligence'

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

/** Also invalidates Market Intelligence's own cache — a material there is classified and priced
 * server-side as soon as it's created, but the page's 5-minute staleTime would otherwise keep
 * showing its cached list without the new/changed/removed material until that expires. */
function invalidateRawMaterialCaches(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: rawMaterialKeys.all })
  queryClient.invalidateQueries({ queryKey: materialIntelligenceKeys.all })
}

// None of the three had error handling before -- a failed request just stopped the button
// spinner with zero feedback, indistinguishable from the button being broken (same gap found and
// fixed in useNotifications.ts). A toast at least makes a real failure visible.
export function useCreateRawMaterial() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (input: RawMaterialInput) => rawMaterialService.createRawMaterial(input),
    onSuccess: () => invalidateRawMaterialCaches(queryClient),
    onError: () => toast({ title: 'Could not create raw material', description: 'Please try again in a moment.', tone: 'error' }),
  })
}

export function useUpdateRawMaterial() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<RawMaterialInput> }) => rawMaterialService.updateRawMaterial(id, input),
    onSuccess: () => invalidateRawMaterialCaches(queryClient),
    onError: () => toast({ title: 'Could not save raw material', description: 'Please try again in a moment.', tone: 'error' }),
  })
}

export function useDeleteRawMaterial() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (id: string) => rawMaterialService.deleteRawMaterial(id),
    onSuccess: () => invalidateRawMaterialCaches(queryClient),
    onError: () => toast({ title: 'Could not delete raw material', description: 'Please try again in a moment.', tone: 'error' }),
  })
}
