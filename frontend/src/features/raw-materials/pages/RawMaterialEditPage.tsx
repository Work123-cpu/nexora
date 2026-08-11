import { useNavigate, useParams } from 'react-router-dom'
import { PackageX } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs'
import { LoadingScreen } from '@/shared/ui/LoadingScreen'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useToast } from '@/shared/ui/Toast'
import { RawMaterialForm } from '../components/RawMaterialForm'
import { useRawMaterial, useUpdateRawMaterial } from '../hooks/useRawMaterials'
import type { RawMaterialInput } from '../services/rawMaterialService'

export function RawMaterialEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: material, isLoading } = useRawMaterial(id)
  const updateRawMaterial = useUpdateRawMaterial()

  if (isLoading) return <LoadingScreen label="Loading material…" />
  if (!material) return <EmptyState icon={<PackageX className="size-5" />} title="Material not found" />

  const handleSubmit = async (input: RawMaterialInput) => {
    await updateRawMaterial.mutateAsync({ id: material.id, input })
    toast({ title: 'Raw material updated', description: `"${input.name}" has been saved.`, tone: 'success' })
    navigate(`/app/raw-materials/${material.id}`)
  }

  return (
    <div>
      <PageHeader
        title={`Edit ${material.name}`}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Raw Materials', to: '/app/raw-materials' }, { label: material.name, to: `/app/raw-materials/${material.id}` }, { label: 'Edit' }]} />}
      />
      <RawMaterialForm initialValue={material} onSubmit={handleSubmit} isSubmitting={updateRawMaterial.isPending} submitLabel="Save changes" />
    </div>
  )
}
