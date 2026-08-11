import { useNavigate, useParams } from 'react-router-dom'
import { PackageX } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs'
import { LoadingScreen } from '@/shared/ui/LoadingScreen'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useToast } from '@/shared/ui/Toast'
import { WarehouseForm } from '../components/WarehouseForm'
import { useUpdateWarehouse, useWarehouse } from '../hooks/useWarehouses'
import type { WarehouseInput } from '../services/warehouseService'

export function WarehouseEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: warehouse, isLoading } = useWarehouse(id)
  const updateWarehouse = useUpdateWarehouse()

  if (isLoading) return <LoadingScreen label="Loading warehouse…" />
  if (!warehouse) return <EmptyState icon={<PackageX className="size-5" />} title="Warehouse not found" />

  const handleSubmit = async (input: WarehouseInput) => {
    await updateWarehouse.mutateAsync({ id: warehouse.id, input })
    toast({ title: 'Warehouse updated', description: `"${input.name}" has been saved.`, tone: 'success' })
    navigate(`/app/inventory/warehouses/${warehouse.id}`)
  }

  return (
    <div>
      <PageHeader
        title={`Edit ${warehouse.name}`}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Warehouses', to: '/app/inventory/warehouses' }, { label: warehouse.name, to: `/app/inventory/warehouses/${warehouse.id}` }, { label: 'Edit' }]} />}
      />
      <WarehouseForm initialValue={warehouse} onSubmit={handleSubmit} isSubmitting={updateWarehouse.isPending} submitLabel="Save changes" />
    </div>
  )
}
