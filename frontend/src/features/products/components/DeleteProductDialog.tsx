import { Dialog } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/Button'
import { useDeleteProduct } from '../hooks/useProducts'
import { useToast } from '@/shared/ui/Toast'
import type { Product } from '@/types/entities/product'

interface DeleteProductDialogProps {
  product: Product | null
  onClose: () => void
  onDeleted?: () => void
}

export function DeleteProductDialog({ product, onClose, onDeleted }: DeleteProductDialogProps) {
  const deleteProduct = useDeleteProduct()
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!product) return
    await deleteProduct.mutateAsync(product.id)
    toast({ title: 'Product deleted', description: `"${product.name}" has been removed.`, tone: 'success' })
    onClose()
    onDeleted?.()
  }

  return (
    <Dialog
      open={Boolean(product)}
      onClose={onClose}
      title="Delete product"
      description="This action cannot be undone."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" isLoading={deleteProduct.isPending} onClick={handleDelete}>
            Delete product
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">
        Are you sure you want to delete <span className="font-medium text-foreground">{product?.name}</span>? Any linked Bill of
        Materials will remain but reference a removed product.
      </p>
    </Dialog>
  )
}
