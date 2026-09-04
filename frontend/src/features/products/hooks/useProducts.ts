import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/shared/ui/Toast'
import { productService, type GetProductsParams, type ProductInput } from '../services/productService'

export const productKeys = {
  all: ['products'] as const,
  list: (params: GetProductsParams) => [...productKeys.all, 'list', params] as const,
  detail: (id: string) => [...productKeys.all, 'detail', id] as const,
}

export function useProducts(params: GetProductsParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productService.getProducts(params),
    placeholderData: keepPreviousData,
  })
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(id ?? ''),
    queryFn: () => productService.getProductById(id!),
    enabled: Boolean(id),
  })
}

// None of the three had error handling before -- a failed request just stopped the button
// spinner with zero feedback, indistinguishable from the button being broken (same gap found and
// fixed in useNotifications.ts). A toast at least makes a real failure visible.
export function useCreateProduct() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (input: ProductInput) => productService.createProduct(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
    onError: () => toast({ title: 'Could not create product', description: 'Please try again in a moment.', tone: 'error' }),
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ProductInput> }) => productService.updateProduct(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
    onError: () => toast({ title: 'Could not save product', description: 'Please try again in a moment.', tone: 'error' }),
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
    onError: () => toast({ title: 'Could not delete product', description: 'Please try again in a moment.', tone: 'error' }),
  })
}
