import { Link, useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { Boxes, PackageX, Pencil, Snowflake, Trash2, Truck } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { StatCard } from '@/shared/ui/StatCard'
import { LoadingScreen } from '@/shared/ui/LoadingScreen'
import { EmptyState } from '@/shared/ui/EmptyState'
import { formatCurrency, formatDate, formatNumber } from '@/shared/lib/formatters'
import { useRawMaterial } from '../hooks/useRawMaterials'
import { DeleteRawMaterialDialog } from '../components/DeleteRawMaterialDialog'
import { useInventoryItems, useInventoryMovements } from '@/features/inventory/hooks/useInventory'
import { useVendor } from '@/features/vendors/hooks/useVendors'
import { useBOMs } from '@/features/bom/hooks/useBOM'
import { useProducts } from '@/features/products/hooks/useProducts'
import { RoleGuard } from '@/app/router/RoleGuard'

export function RawMaterialDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: material, isLoading } = useRawMaterial(id)
  const { data: inventoryData } = useInventoryItems({ pageSize: 10000 })
  const [confirmDelete, setConfirmDelete] = useState(false)

  const inventory = inventoryData?.items.find((i) => i.itemId === material?.id)
  const { data: movementsData } = useInventoryMovements(inventory?.id)
  const { data: vendor } = useVendor(material?.primaryVendorId)
  const { data: bomsData } = useBOMs({ pageSize: 10000 })
  const { data: productsData } = useProducts({ pageSize: 10000 })

  if (isLoading) return <LoadingScreen label="Loading material…" />
  if (!material) return <EmptyState icon={<PackageX className="size-5" />} title="Material not found" />

  const movements = (movementsData ?? []).slice(0, 8)
  const usedInProducts = (bomsData?.items ?? [])
    .filter((bom) => bom.materials.some((m) => m.rawMaterialId === material.id))
    .map((bom) => (productsData?.items ?? []).find((p) => p.id === bom.productId))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))

  return (
    <div>
      <PageHeader
        title={material.name}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Raw Materials', to: '/app/raw-materials' }, { label: material.name }]} />}
        actions={
          <>
            <RoleGuard resource="raw-materials" action="edit">
              <Button variant="outline" leftIcon={<Pencil className="size-4" />} onClick={() => navigate(`/app/raw-materials/${material.id}/edit`)}>
                Edit
              </Button>
            </RoleGuard>
            <RoleGuard resource="raw-materials" action="delete">
              <Button variant="danger" leftIcon={<Trash2 className="size-4" />} onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            </RoleGuard>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Unit Cost" value={formatCurrency(material.unitCost, true)} tone="primary" />
        <StatCard label="Lead Time" value={`${material.leadTimeDays} days`} tone="info" />
        <StatCard label="On Hand" value={inventory ? `${formatNumber(inventory.quantityOnHand)} ${inventory.unit}` : '—'} tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes className="size-4" /> Material Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Code</p>
                <p className="font-medium text-foreground">{material.code}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <Badge tone="neutral" className="mt-1">
                  {material.category}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unit</p>
                <p className="font-medium text-foreground">{material.unit}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Perishable</p>
                <p className="mt-0.5 flex items-center gap-1 font-medium text-foreground">
                  {material.isPerishable ? (
                    <>
                      <Snowflake className="size-3.5 text-info" /> Yes
                    </>
                  ) : (
                    'No'
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Added on</p>
                <p className="font-medium text-foreground">{formatDate(material.createdAt)}</p>
              </div>
            </div>

            {inventory && (
              <div className="rounded-xl border border-border bg-surface-elevated/50 p-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Inventory thresholds</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Safety stock</p>
                    <p className="font-semibold text-foreground">{inventory.safetyStock} {inventory.unit}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Reorder point</p>
                    <p className="font-semibold text-foreground">{inventory.reorderPoint} {inventory.unit}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Reorder qty</p>
                    <p className="font-semibold text-foreground">{inventory.reorderQuantity} {inventory.unit}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Used in products</p>
              {usedInProducts.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {usedInProducts.map((p) => (
                    <Link key={p!.id} to={`/app/products/${p!.id}`}>
                      <Badge tone="primary">{p!.name}</Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not currently linked to any product BOM.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="size-4" /> Primary Vendor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vendor ? (
              <div className="space-y-3">
                <Link to={`/app/vendors/${vendor.id}`} className="text-sm font-semibold text-primary hover:underline">
                  {vendor.name}
                </Link>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">On-time delivery</p>
                    <p className="font-medium text-foreground">{vendor.onTimeDeliveryPct}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Quality score</p>
                    <p className="font-medium text-foreground">{vendor.qualityScorePct}%</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No vendor assigned.</p>
            )}

            <div className="mt-5">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Recent movements</p>
              {movements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent movement history.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {movements.map((m) => (
                    <li key={m.id} className="flex items-center justify-between">
                      <span className="text-muted-foreground">{m.reason}</span>
                      <span className={m.quantity < 0 ? 'font-medium text-danger' : 'font-medium text-success'}>
                        {m.quantity > 0 ? '+' : ''}
                        {m.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <DeleteRawMaterialDialog
        material={confirmDelete ? material : null}
        onClose={() => setConfirmDelete(false)}
        onDeleted={() => navigate('/app/raw-materials')}
      />
    </div>
  )
}
