import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs'
import { Stepper } from '@/shared/ui/Stepper'
import { Button } from '@/shared/ui/Button'
import { useToast } from '@/shared/ui/Toast'
import { ProductForm } from '../components/ProductForm'
import { useCreateProduct } from '../hooks/useProducts'
import { BomForm } from '@/features/bom/components/BomForm'
import { useCreateBOM } from '@/features/bom/hooks/useBOM'
import type { ProductInput } from '../services/productService'
import type { BomInput } from '@/features/bom/services/bomService'
import type { Product } from '@/types/entities/product'

const STEPS = [
  { label: 'Product details', description: 'Name, pricing, category' },
  { label: 'Ingredients (BOM)', description: 'Raw materials to produce it' },
]

/** One guided flow for "adding a product": product details, then its bill of materials — instead
 * of separate visits to /app/products/new, /app/bom/new, and (if a material is missing)
 * /app/raw-materials/new. Reuses ProductForm and BomForm unmodified; the product is created at
 * the end of step 1 so step 2 can lock BomForm to its real id, same as BomCreatePage already does
 * when arriving with a productId. */
export function ProductCreateWizardPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const createProduct = useCreateProduct()
  const createBom = useCreateBOM()
  const [createdProduct, setCreatedProduct] = useState<Product | null>(null)

  const handleProductSubmit = async (input: ProductInput) => {
    const product = await createProduct.mutateAsync(input)
    toast({ title: 'Product created', description: `"${product.name}" has been added — now add its ingredients.`, tone: 'success' })
    setCreatedProduct(product)
  }

  const handleBomSubmit = async (input: BomInput) => {
    await createBom.mutateAsync(input)
    toast({ title: 'BOM created', description: 'Ingredients saved for this product.', tone: 'success' })
    navigate(`/app/products/${createdProduct!.id}`)
  }

  return (
    <div>
      <PageHeader
        title="Add Product"
        breadcrumbs={<Breadcrumbs items={[{ label: 'Products', to: '/app/products' }, { label: 'Add Product' }]} />}
      />

      <Stepper steps={STEPS} currentStep={createdProduct ? 1 : 0} className="mb-6" />

      {!createdProduct ? (
        <ProductForm onSubmit={handleProductSubmit} isSubmitting={createProduct.isPending} submitLabel="Next: add ingredients" />
      ) : (
        <div className="space-y-3">
          <BomForm
            onSubmit={handleBomSubmit}
            isSubmitting={createBom.isPending}
            submitLabel="Finish"
            initialProductId={createdProduct.id}
            lockProduct
          />
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/app/products/${createdProduct.id}`)}>
              Skip for now
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
