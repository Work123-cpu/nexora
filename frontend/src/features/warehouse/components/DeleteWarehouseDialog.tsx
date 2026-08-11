import { Dialog } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/Button'
import { useDeleteWarehouse } from '../hooks/useWarehouses'
import { useToast } from '@/shared/ui/Toast'
import type { Warehouse } from '@/types/entities/warehouse'

interface DeleteWarehouseDialogProps {
  warehouse: Warehouse | null
  onClose: () => void
  onDeleted?: () => void
}

export function DeleteWarehouseDialog({ warehouse, onClose, onDeleted }: DeleteWarehouseDialogProps) {
  const deleteWarehouse = useDeleteWarehouse()
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!warehouse) return
    await deleteWarehouse.mutateAsync(warehouse.id)
    toast({ title: 'Warehouse deleted', description: `"${warehouse.name}" has been removed.`, tone: 'success' })
    onClose()
    onDeleted?.()
  }

  return (
    <Dialog
      open={Boolean(warehouse)}
      onClose={onClose}
      title="Delete warehouse"
      description="This action cannot be undone."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" isLoading={deleteWarehouse.isPending} onClick={handleDelete}>
            Delete warehouse
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">
        Are you sure you want to delete <span className="font-medium text-foreground">{warehouse?.name}</span>? Inventory items
        referencing it will keep the reference to a removed warehouse.
      </p>
    </Dialog>
  )
}
