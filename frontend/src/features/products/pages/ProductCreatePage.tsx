import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs'
import { useToast } from '@/shared/ui/Toast'
import { ProductForm } from '../components/ProductForm'
import { useCreateProduct } from '../hooks/useProducts'
import type { ProductInput } from '../services/productService'

export function ProductCreatePage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const createProduct = useCreateProduct()

  const handleSubmit = async (input: ProductInput) => {
    const product = await createProduct.mutateAsync(input)
    toast({ title: 'Product created', description: `"${product.name}" has been added to your catalog.`, tone: 'success' })
    navigate(`/app/products/${product.id}`)
  }

  return (
    <div>
      <PageHeader
        title="Add Product"
        breadcrumbs={<Breadcrumbs items={[{ label: 'Products', to: '/app/products' }, { label: 'Add Product' }]} />}
      />
      <ProductForm onSubmit={handleSubmit} isSubmitting={createProduct.isPending} submitLabel="Create product" />
    </div>
  )
}
