import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs'
import { useToast } from '@/shared/ui/Toast'
import { BomForm } from '../components/BomForm'
import { useCreateBOM } from '../hooks/useBOM'
import type { BomInput } from '../services/bomService'

export function BomCreatePage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const createBom = useCreateBOM()

  const handleSubmit = async (input: BomInput) => {
    await createBom.mutateAsync(input)
    toast({ title: 'BOM created', description: 'The bill of materials has been saved.', tone: 'success' })
    navigate('/app/bom')
  }

  return (
    <div>
      <PageHeader title="Create BOM" breadcrumbs={<Breadcrumbs items={[{ label: 'Bill of Materials', to: '/app/bom' }, { label: 'Create' }]} />} />
      <BomForm onSubmit={handleSubmit} isSubmitting={createBom.isPending} submitLabel="Create BOM" />
    </div>
  )
}
