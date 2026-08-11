import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs'
import { LoadingScreen } from '@/shared/ui/LoadingScreen'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useToast } from '@/shared/ui/Toast'
import { PackageX } from 'lucide-react'
import { ProductForm } from '../components/ProductForm'
import { useProduct, useUpdateProduct } from '../hooks/useProducts'
import type { ProductInput } from '../services/productService'

export function ProductEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: product, isLoading } = useProduct(id)
  const updateProduct = useUpdateProduct()

  if (isLoading) return <LoadingScreen label="Loading product…" />
  if (!product) return <EmptyState icon={<PackageX className="size-5" />} title="Product not found" />

  const handleSubmit = async (input: ProductInput) => {
    await updateProduct.mutateAsync({ id: product.id, input })
    toast({ title: 'Product updated', description: `"${input.name}" has been saved.`, tone: 'success' })
    navigate(`/app/products/${product.id}`)
  }

  return (
    <div>
      <PageHeader
        title={`Edit ${product.name}`}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Products', to: '/app/products' }, { label: product.name, to: `/app/products/${product.id}` }, { label: 'Edit' }]} />}
      />
      <ProductForm initialValue={product} onSubmit={handleSubmit} isSubmitting={updateProduct.isPending} submitLabel="Save changes" />
    </div>
  )
}
