import { Dialog } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/Button'
import { useDeleteVendor } from '../hooks/useVendors'
import { useToast } from '@/shared/ui/Toast'
import type { Vendor } from '@/types/entities/vendor'

interface DeleteVendorDialogProps {
  vendor: Vendor | null
  onClose: () => void
  onDeleted?: () => void
}

export function DeleteVendorDialog({ vendor, onClose, onDeleted }: DeleteVendorDialogProps) {
  const deleteVendor = useDeleteVendor()
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!vendor) return
    await deleteVendor.mutateAsync(vendor.id)
    toast({ title: 'Vendor deleted', description: `"${vendor.name}" has been removed.`, tone: 'success' })
    onClose()
    onDeleted?.()
  }

  return (
    <Dialog
      open={Boolean(vendor)}
      onClose={onClose}
      title="Delete vendor"
      description="This action cannot be undone."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" isLoading={deleteVendor.isPending} onClick={handleDelete}>
            Delete vendor
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">
        Are you sure you want to delete <span className="font-medium text-foreground">{vendor?.name}</span>? Raw materials referencing
        it as their primary vendor will keep the reference to a removed vendor.
      </p>
    </Dialog>
  )
}
