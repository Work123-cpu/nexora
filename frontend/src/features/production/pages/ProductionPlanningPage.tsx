import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Factory, Plus, ShoppingCart } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Select } from '@/shared/ui/Select'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import { ProgressBar } from '@/shared/ui/ProgressBar'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useToast } from '@/shared/ui/Toast'
import { formatNumber } from '@/shared/lib/formatters'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useRawMaterials } from '@/features/raw-materials/hooks/useRawMaterials'
import { useBOMs } from '@/features/bom/hooks/useBOM'
import { useVendors } from '@/features/vendors/hooks/useVendors'
import { useWarehouses } from '@/features/warehouse/hooks/useWarehouses'
import { useInventoryItems } from '@/features/inventory/hooks/useInventory'
import { useCreatePurchaseOrder } from '@/features/procurement/hooks/usePurchaseOrders'
import { useAuth } from '@/features/auth/context/AuthContext'
import type { PurchaseOrderLineItem } from '@/types/entities/purchaseOrder'

interface RequirementLine {
  materialId: string
  name: string
  unit: string
  unitCost: number
  required: number
  available: number
  shortfall: number
  vendorId: string
}

/** Standalone version of what used to live only inside the BOM edit form's "Material
 * Requirement Preview" — pulled out so planning a production run doesn't require opening a
 * specific BOM to edit first, and extended with per-material vendor choice + a real Order action
 * (creates one purchase order per distinct chosen vendor for whatever's short, nothing more). */
export function ProductionPlanningPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { session } = useAuth()
  const { data: productsData } = useProducts({ pageSize: 10000 })
  const { data: rawMaterialsData } = useRawMaterials({ pageSize: 10000 })
  const { data: bomsData } = useBOMs({ pageSize: 10000 })
  const { data: vendorsData } = useVendors({ pageSize: 10000 })
  const { data: warehousesData } = useWarehouses({ pageSize: 10000 })
  const { data: inventoryData } = useInventoryItems({ pageSize: 10000 })
  const createPO = useCreatePurchaseOrder()

  const products = productsData?.items ?? []
  const rawMaterials = rawMaterialsData?.items ?? []
  const boms = bomsData?.items ?? []
  const vendors = vendorsData?.items ?? []
  const warehouses = warehousesData?.items ?? []
  const inventoryItems = inventoryData?.items ?? []

  const getRawMaterialById = (id: string) => rawMaterials.find((rm) => rm.id === id)
  const getInventoryForWarehouse = (materialId: string, warehouseId: string) =>
    inventoryItems.find((i) => i.itemId === materialId && i.warehouseId === warehouseId)

  // Only products with a real BOM have a basis for a requirement calc.
  const producibleProducts = useMemo(() => products.filter((p) => boms.some((b) => b.productId === p.id)), [products, boms])

  const [productId, setProductId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [unitsToProduce, setUnitsToProduce] = useState<number | ''>(100)
  const [vendorOverrides, setVendorOverrides] = useState<Record<string, string>>({})
  const [isOrdering, setIsOrdering] = useState(false)

  useEffect(() => {
    if (!productId && producibleProducts.length > 0) setProductId(producibleProducts[0]!.id)
  }, [producibleProducts, productId])

  useEffect(() => {
    if (!warehouseId && warehouses.length > 0) setWarehouseId(warehouses[0]!.id)
  }, [warehouses, warehouseId])

  const bom = boms.find((b) => b.productId === productId)
  const quantity = unitsToProduce === '' ? 0 : unitsToProduce

  const lines: RequirementLine[] = useMemo(() => {
    if (!bom) return []
    return bom.materials
      .map((line): RequirementLine | null => {
        const material = getRawMaterialById(line.rawMaterialId)
        if (!material) return null
        const required = line.quantityPerUnit * (1 + line.scrapPct / 100) * quantity
        const available = getInventoryForWarehouse(material.id, warehouseId)?.quantityOnHand ?? 0
        return {
          materialId: material.id,
          name: material.name,
          unit: material.unit,
          unitCost: material.unitCost,
          required,
          available,
          shortfall: Math.max(required - available, 0),
          vendorId: vendorOverrides[material.id] ?? material.primaryVendorId,
        }
      })
      .filter((l): l is RequirementLine => l !== null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bom, quantity, warehouseId, inventoryItems, vendorOverrides])

  const setVendorForMaterial = (materialId: string, vendorId: string) => setVendorOverrides((prev) => ({ ...prev, [materialId]: vendorId }))

  const materialsNeedingOrder = lines.filter((l) => l.shortfall > 0)
  const vendorCount = new Set(materialsNeedingOrder.map((l) => l.vendorId)).size

  const handleOrder = async () => {
    if (materialsNeedingOrder.length === 0) {
      toast({ title: 'Nothing to order', description: 'Every material already has enough stock for this run.', tone: 'info' })
      return
    }
    setIsOrdering(true)
    try {
      const byVendor = new Map<string, RequirementLine[]>()
      for (const l of materialsNeedingOrder) {
        const group = byVendor.get(l.vendorId) ?? []
        group.push(l)
        byVendor.set(l.vendorId, group)
      }

      const deliveryDate = new Date()
      deliveryDate.setDate(deliveryDate.getDate() + 7)

      const createdIds: string[] = []
      for (const [vendorId, group] of byVendor.entries()) {
        const items: PurchaseOrderLineItem[] = group.map((l) => ({
          rawMaterialId: l.materialId,
          rawMaterialName: l.name,
          quantity: Math.ceil(l.shortfall),
          unit: l.unit,
          unitCost: l.unitCost,
        }))
        const po = await createPO.mutateAsync({
          vendorId,
          warehouseId,
          items,
          expectedDeliveryDate: deliveryDate.toISOString(),
          createdBy: session?.user?.name ?? 'Unknown user',
        })
        createdIds.push(po.id)
      }

      toast({
        title: `${createdIds.length} purchase order${createdIds.length === 1 ? '' : 's'} created`,
        description: `Pre-filled and ready to review for ${byVendor.size} vendor${byVendor.size === 1 ? '' : 's'}.`,
        tone: 'success',
      })
      navigate(createdIds.length === 1 ? `/app/procurement/purchase-orders/${createdIds[0]}` : '/app/procurement/purchase-orders')
    } catch {
      // useCreatePurchaseOrder's own onError toast already surfaced the failure — some orders in
      // the batch may have been created before the failing one; the list page shows what landed.
    } finally {
      setIsOrdering(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Production Planning"
        description="Estimate raw material needs for a production run, choose a vendor per material, and order what's short."
      />

      {producibleProducts.length === 0 ? (
        <EmptyState
          icon={<Factory className="size-5" />}
          title="No products with a Bill of Materials yet"
          description="Create a BOM for a product first, then plan a production run here."
          action={
            <Link to="/app/bom/new">
              <Button type="button" variant="outline" size="sm" leftIcon={<Plus className="size-3.5" />}>
                Create a BOM
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Production Run</CardTitle>
                <CardDescription className="mt-1">Choose what you're making, how many, and which warehouse it'll come out of.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <Select
                label="Product"
                options={producibleProducts.map((p) => ({ label: p.name, value: p.id }))}
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              />
              <Select
                label="Warehouse"
                options={warehouses.map((w) => ({ label: w.name, value: w.id }))}
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                placeholder={warehouses.length === 0 ? 'No warehouses yet' : undefined}
              />
              <Input
                label="Units to produce"
                type="number"
                min={0}
                value={unitsToProduce}
                onChange={(e) => setUnitsToProduce(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Material Requirements</CardTitle>
                <CardDescription className="mt-1">
                  Need vs. have for this run. For anything short, pick which vendor to order it from — Order creates one purchase
                  order per vendor you've chosen.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {lines.length === 0 ? (
                <p className="text-sm text-muted-foreground">This product's Bill of Materials has no materials yet.</p>
              ) : (
                lines.map((line) => {
                  const sufficient = line.shortfall === 0
                  const pct = line.required > 0 ? Math.min(100, (line.available / line.required) * 100) : 100
                  return (
                    <div key={line.materialId} className="space-y-2 rounded-xl border border-border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-foreground">{line.name}</span>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {sufficient ? <CheckCircle2 className="size-3.5 text-success" /> : <AlertTriangle className="size-3.5 text-danger" />}
                          Need {formatNumber(Math.round(line.required * 10) / 10)} {line.unit} · Have {formatNumber(line.available)} {line.unit}
                        </span>
                      </div>
                      <ProgressBar value={pct} tone={sufficient ? 'success' : 'danger'} />
                      {!sufficient && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-xs text-muted-foreground">
                            Order {formatNumber(Math.ceil(line.shortfall))} {line.unit} from
                          </span>
                          <Select
                            options={vendors.map((v) => ({ label: v.name, value: v.id }))}
                            value={line.vendorId}
                            onChange={(e) => setVendorForMaterial(line.materialId, e.target.value)}
                            className="h-8 w-48 text-xs"
                          />
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="button"
              leftIcon={<ShoppingCart className="size-4" />}
              onClick={handleOrder}
              isLoading={isOrdering}
              disabled={lines.length === 0 || !warehouseId}
            >
              {materialsNeedingOrder.length === 0 ? 'Nothing to order' : `Order (${vendorCount} vendor${vendorCount === 1 ? '' : 's'})`}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
