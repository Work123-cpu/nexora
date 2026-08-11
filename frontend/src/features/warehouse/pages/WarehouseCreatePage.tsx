import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs'
import { useToast } from '@/shared/ui/Toast'
import { WarehouseForm } from '../components/WarehouseForm'
import { useCreateWarehouse } from '../hooks/useWarehouses'
import type { WarehouseInput } from '../services/warehouseService'

export function WarehouseCreatePage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const createWarehouse = useCreateWarehouse()

  const handleSubmit = async (input: WarehouseInput) => {
    const warehouse = await createWarehouse.mutateAsync(input)
    toast({ title: 'Warehouse added', description: `"${warehouse.name}" has been added.`, tone: 'success' })
    navigate(`/app/inventory/warehouses/${warehouse.id}`)
  }

  return (
    <div>
      <PageHeader
        title="Add Warehouse"
        breadcrumbs={<Breadcrumbs items={[{ label: 'Warehouses', to: '/app/inventory/warehouses' }, { label: 'Add Warehouse' }]} />}
      />
      <WarehouseForm onSubmit={handleSubmit} isSubmitting={createWarehouse.isPending} submitLabel="Add warehouse" />
    </div>
  )
}
