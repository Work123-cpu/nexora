import { Link, useNavigate, useParams } from 'react-router-dom'
import { Layers, ListTree, Package, PackageX, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { Badge } from '@/shared/ui/Badge'
import { LoadingScreen } from '@/shared/ui/LoadingScreen'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatCard } from '@/shared/ui/StatCard'
import { formatCurrency, formatDate, formatPercent } from '@/shared/lib/formatters'
import { contrastColor } from '@/shared/lib/contrastColor'
import { useProduct } from '../hooks/useProducts'
import { ProductStatusBadge } from '../components/ProductStatusBadge'
import { useBOMs } from '@/features/bom/hooks/useBOM'
import { useRawMaterials } from '@/features/raw-materials/hooks/useRawMaterials'
import { useInventoryItems } from '@/features/inventory/hooks/useInventory'
import { useState } from 'react'
import { DeleteProductDialog } from '../components/DeleteProductDialog'
import { RoleGuard } from '@/app/router/RoleGuard'

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: product, isLoading } = useProduct(id)
  const { data: bomsData } = useBOMs({ pageSize: 10000 })
  const { data: materialsData } = useRawMaterials({ pageSize: 10000 })
  const { data: inventoryData } = useInventoryItems({ pageSize: 10000 })
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (isLoading) return <LoadingScreen label="Loading product…" />
  if (!product) return <EmptyState icon={<PackageX className="size-5" />} title="Product not found" />

  const bom = bomsData?.items.find((b) => b.productId === product.id)
  const getRawMaterialById = (rmId: string) => materialsData?.items.find((rm) => rm.id === rmId)
  const inventory = inventoryData?.items.find((i) => i.itemId === product.id)
  const margin = ((product.unitPrice - product.unitCost) / product.unitPrice) * 100

  return (
    <div>
      <PageHeader
        title={product.name}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Products', to: '/app/products' }, { label: product.name }]} />}
        actions={
          <>
            <RoleGuard resource="products" action="edit">
              <Button variant="outline" leftIcon={<Pencil className="size-4" />} onClick={() => navigate(`/app/products/${product.id}/edit`)}>
                Edit
              </Button>
            </RoleGuard>
            <RoleGuard resource="products" action="delete">
              <Button variant="danger" leftIcon={<Trash2 className="size-4" />} onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            </RoleGuard>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Unit Price" value={formatCurrency(product.unitPrice, true)} tone="primary" />
        <StatCard label="Unit Cost" value={formatCurrency(product.unitCost, true)} tone="warning" />
        <StatCard label="Gross Margin" value={formatPercent(margin)} tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card interactive className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div
                className="flex size-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: product.accentColor, color: contrastColor(product.accentColor) }}
              >
                <Layers className="size-5" />
              </div>
              <div>
                <CardTitle>{product.sku}</CardTitle>
                <CardDescription>{product.category}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{product.description}</p>
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <div className="mt-1">
                  <ProductStatusBadge status={product.status} />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unit of measure</p>
                <p className="mt-1 font-medium text-foreground">{product.unitOfMeasure}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last updated</p>
                <p className="mt-1 font-medium text-foreground">{formatDate(product.updatedAt)}</p>
              </div>
            </div>

            {inventory && (
              <div className="rounded-xl border border-border bg-surface-elevated/50 p-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Inventory snapshot</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">On hand</p>
                    <p className="font-semibold text-foreground">{inventory.quantityOnHand} {inventory.unit}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Safety stock</p>
                    <p className="font-semibold text-foreground">{inventory.safetyStock} {inventory.unit}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Reorder point</p>
                    <p className="font-semibold text-foreground">{inventory.reorderPoint} {inventory.unit}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card interactive>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTree className="size-4" /> Bill of Materials
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bom ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Version {bom.version}</span>
                  <Badge tone="primary">{bom.materials.length} materials</Badge>
                </div>
                <ul className="space-y-2">
                  {bom.materials.map((line) => {
                    const material = getRawMaterialById(line.rawMaterialId)
                    return (
                      <li key={line.rawMaterialId} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{material?.name ?? 'Unknown material'}</span>
                        <span className="text-muted-foreground">
                          {line.quantityPerUnit} {line.unit}
                        </span>
                      </li>
                    )
                  })}
                </ul>
                <Link to={`/app/bom/${bom.id}/edit`} className="inline-block text-sm font-medium text-primary hover:underline">
                  Edit BOM
                </Link>
              </div>
            ) : (
              <EmptyState
                icon={<Package className="size-5" />}
                title="No BOM linked"
                description="Create a bill of materials to enable material requirement calculations."
                action={
                  <Link to="/app/bom/new" className="text-sm font-medium text-primary hover:underline">
                    Create BOM
                  </Link>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      <DeleteProductDialog
        product={confirmDelete ? product : null}
        onClose={() => setConfirmDelete(false)}
        onDeleted={() => navigate('/app/products')}
      />
    </div>
  )
}
