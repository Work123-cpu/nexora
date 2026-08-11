import { useNavigate, useParams } from 'react-router-dom'
import { PackageX } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs'
import { LoadingScreen } from '@/shared/ui/LoadingScreen'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useToast } from '@/shared/ui/Toast'
import { BomForm } from '../components/BomForm'
import { useBOM, useUpdateBOM } from '../hooks/useBOM'
import type { BomInput } from '../services/bomService'

export function BomEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: bom, isLoading } = useBOM(id)
  const updateBom = useUpdateBOM()

  if (isLoading) return <LoadingScreen label="Loading BOM…" />
  if (!bom) return <EmptyState icon={<PackageX className="size-5" />} title="BOM not found" />

  const handleSubmit = async (input: BomInput) => {
    await updateBom.mutateAsync({ id: bom.id, input })
    toast({ title: 'BOM updated', description: 'Your changes have been saved.', tone: 'success' })
    navigate('/app/bom')
  }

  return (
    <div>
      <PageHeader
        title={`Edit BOM — ${bom.productName}`}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Bill of Materials', to: '/app/bom' }, { label: bom.productName }]} />}
      />
      <BomForm initialValue={bom} onSubmit={handleSubmit} isSubmitting={updateBom.isPending} submitLabel="Save changes" lockProduct />
    </div>
  )
}
