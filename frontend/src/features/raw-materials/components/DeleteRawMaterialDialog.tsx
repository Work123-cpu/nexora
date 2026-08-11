import { Dialog } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/Button'
import { useDeleteRawMaterial } from '../hooks/useRawMaterials'
import { useToast } from '@/shared/ui/Toast'
import type { RawMaterial } from '@/types/entities/rawMaterial'

interface DeleteRawMaterialDialogProps {
  material: RawMaterial | null
  onClose: () => void
  onDeleted?: () => void
}

export function DeleteRawMaterialDialog({ material, onClose, onDeleted }: DeleteRawMaterialDialogProps) {
  const deleteRawMaterial = useDeleteRawMaterial()
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!material) return
    await deleteRawMaterial.mutateAsync(material.id)
    toast({ title: 'Raw material deleted', description: `"${material.name}" has been removed.`, tone: 'success' })
    onClose()
    onDeleted?.()
  }

  return (
    <Dialog
      open={Boolean(material)}
      onClose={onClose}
      title="Delete raw material"
      description="This action cannot be undone."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" isLoading={deleteRawMaterial.isPending} onClick={handleDelete}>
            Delete material
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">
        Are you sure you want to delete <span className="font-medium text-foreground">{material?.name}</span>? Any Bill of Materials
        referencing it will keep the reference to a removed material.
      </p>
    </Dialog>
  )
}
