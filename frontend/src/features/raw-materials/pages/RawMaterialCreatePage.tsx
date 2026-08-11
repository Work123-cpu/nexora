import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs'
import { useToast } from '@/shared/ui/Toast'
import { RawMaterialForm } from '../components/RawMaterialForm'
import { useCreateRawMaterial } from '../hooks/useRawMaterials'
import type { RawMaterialInput } from '../services/rawMaterialService'

export function RawMaterialCreatePage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const createRawMaterial = useCreateRawMaterial()

  const handleSubmit = async (input: RawMaterialInput) => {
    const material = await createRawMaterial.mutateAsync(input)
    toast({ title: 'Raw material added', description: `"${material.name}" has been added to your catalog.`, tone: 'success' })
    navigate(`/app/raw-materials/${material.id}`)
  }

  return (
    <div>
      <PageHeader
        title="Add Raw Material"
        breadcrumbs={<Breadcrumbs items={[{ label: 'Raw Materials', to: '/app/raw-materials' }, { label: 'Add Material' }]} />}
      />
      <RawMaterialForm onSubmit={handleSubmit} isSubmitting={createRawMaterial.isPending} submitLabel="Add material" />
    </div>
  )
}
