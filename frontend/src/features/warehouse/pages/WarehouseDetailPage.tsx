import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { MapPin, PackageX, Pencil, Trash2, User, Warehouse as WarehouseIcon } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { GaugeChart } from '@/shared/ui/charts/GaugeChart'
import { DataTable, type DataTableColumn } from '@/shared/ui/DataTable'
import { LoadingScreen } from '@/shared/ui/LoadingScreen'
import { EmptyState } from '@/shared/ui/EmptyState'
import { formatNumber } from '@/shared/lib/formatters'
import { useWarehouse, useWarehouseInventory } from '../hooks/useWarehouses'
import { DeleteWarehouseDialog } from '../components/DeleteWarehouseDialog'
import { RoleGuard } from '@/app/router/RoleGuard'
import type { InventoryItem } from '@/types/entities/inventory'

const TYPE_LABEL: Record<string, string> = {
  'raw-material': 'Raw Material Storage',
  'finished-goods': 'Finished Goods Storage',
  mixed: 'Mixed Use',
  'cold-storage': 'Cold Storage',
}

export function WarehouseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: warehouse, isLoading } = useWarehouse(id)
  const { data: inventory } = useWarehouseInventory(id)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (isLoading) return <LoadingScreen label="Loading warehouse…" />
  if (!warehouse) return <EmptyState icon={<PackageX className="size-5" />} title="Warehouse not found" />

  const pct = (warehouse.usedUnits / warehouse.capacityUnits) * 100

  const columns: DataTableColumn<InventoryItem>[] = [
    { key: 'itemName', header: 'Item', render: (item) => item.itemName },
    { key: 'category', header: 'Category', render: (item) => <Badge tone="neutral">{item.category}</Badge> },
    { key: 'onHand', header: 'On Hand', render: (item) => `${formatNumber(item.quantityOnHand)} ${item.unit}` },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        if (item.quantityOnHand <= item.safetyStock) return <Badge tone="danger">Critical</Badge>
        if (item.quantityOnHand <= item.reorderPoint) return <Badge tone="warning">Low</Badge>
        return <Badge tone="success">Healthy</Badge>
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title={warehouse.name}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Warehouses', to: '/app/inventory/warehouses' }, { label: warehouse.name }]} />}
        actions={
          <>
            <RoleGuard resource="warehouses" action="edit">
              <Button variant="outline" leftIcon={<Pencil className="size-4" />} onClick={() => navigate(`/app/inventory/warehouses/${warehouse.id}/edit`)}>
                Edit
              </Button>
            </RoleGuard>
            <RoleGuard resource="warehouses" action="delete">
              <Button variant="danger" leftIcon={<Trash2 className="size-4" />} onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            </RoleGuard>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card interactive>
          <CardHeader>
            <CardTitle>Capacity</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <GaugeChart value={pct} label="Utilization" size={170} />
            <p className="mt-2 text-xs text-muted-foreground">
              {formatNumber(warehouse.usedUnits)} / {formatNumber(warehouse.capacityUnits)} units
            </p>
          </CardContent>
        </Card>

        <Card interactive className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WarehouseIcon className="size-4" /> Warehouse Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Code</p>
                <p className="font-medium text-foreground">{warehouse.code}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <Badge tone="primary" className="mt-1">
                  {TYPE_LABEL[warehouse.type]}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge tone={warehouse.status === 'operational' ? 'success' : warehouse.status === 'at-capacity' ? 'danger' : 'warning'} className="mt-1 capitalize">
                  {warehouse.status.replace('-', ' ')}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="flex items-center gap-1.5 font-medium text-foreground">
                  <MapPin className="size-3.5" /> {warehouse.city}, {warehouse.state}, {warehouse.country}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Manager</p>
                <p className="flex items-center gap-1.5 font-medium text-foreground">
                  <User className="size-3.5" /> {warehouse.managerName}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Items Stored</p>
                <p className="font-medium text-foreground">{inventory?.length ?? 0} SKUs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Inventory at this Warehouse</h2>
        <DataTable columns={columns} data={inventory ?? []} rowKey={(item) => item.id} emptyTitle="No inventory stored here yet" />
      </div>

      <DeleteWarehouseDialog
        warehouse={confirmDelete ? warehouse : null}
        onClose={() => setConfirmDelete(false)}
        onDeleted={() => navigate('/app/inventory/warehouses')}
      />
    </div>
  )
}
