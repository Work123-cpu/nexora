import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Save } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Select } from '@/shared/ui/Select'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import { useToast } from '@/shared/ui/Toast'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useRawMaterials } from '@/features/raw-materials/hooks/useRawMaterials'
import { useWarehouses } from '@/features/warehouse/hooks/useWarehouses'
import { useCreateInventoryItem } from '../hooks/useInventory'
import type { InventoryItemType } from '@/types/entities/inventory'

export function InventoryAddStockPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const createInventoryItem = useCreateInventoryItem()

  const { data: productsData } = useProducts({ pageSize: 10000 })
  const { data: rawMaterialsData } = useRawMaterials({ pageSize: 10000 })
  const { data: warehousesData } = useWarehouses({ pageSize: 10000 })
  const products = productsData?.items ?? []
  const rawMaterials = rawMaterialsData?.items ?? []
  const warehouses = warehousesData?.items ?? []

  const [itemType, setItemType] = useState<InventoryItemType>('product')
  const [itemId, setItemId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [quantityOnHand, setQuantityOnHand] = useState(0)
  const [safetyStock, setSafetyStock] = useState(0)
  const [reorderPoint, setReorderPoint] = useState(0)
  const [reorderQuantity, setReorderQuantity] = useState(0)
  const [avgDailyUsage, setAvgDailyUsage] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const itemOptions = useMemo(
    () =>
      itemType === 'product'
        ? products.map((p) => ({ label: `${p.name} (${p.sku})`, value: p.id }))
        : rawMaterials.map((m) => ({ label: m.name, value: m.id })),
    [itemType, products, rawMaterials],
  )

  useEffect(() => {
    setItemId(itemOptions[0]?.value ?? '')
  }, [itemOptions])

  useEffect(() => {
    if (!warehouseId && warehouses.length > 0) setWarehouseId(warehouses[0]!.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouses])

  const selectedItem = useMemo(
    () =>
      itemType === 'product'
        ? products.find((p) => p.id === itemId)
        : rawMaterials.find((m) => m.id === itemId),
    [itemType, itemId, products, rawMaterials],
  )

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!itemId) {
      setError('Choose a product or raw material to track.')
      return
    }
    if (!warehouseId) {
      setError('Choose a warehouse.')
      return
    }
    if (!selectedItem) {
      setError('Could not find the selected item.')
      return
    }
    try {
      const item = await createInventoryItem.mutateAsync({
        itemType,
        itemId,
        itemName: selectedItem.name,
        category: selectedItem.category,
        unit: 'unitOfMeasure' in selectedItem ? selectedItem.unitOfMeasure : selectedItem.unit,
        warehouseId,
        quantityOnHand,
        safetyStock,
        reorderPoint,
        reorderQuantity,
        avgDailyUsage,
      })
      toast({ title: 'Stock tracking started', description: `${item.itemName} is now tracked in this warehouse.`, tone: 'success' })
      navigate('/app/inventory')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add this stock entry.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Add Stock"
        breadcrumbs={<Breadcrumbs items={[{ label: 'Inventory', to: '/app/inventory' }, { label: 'Add Stock' }]} />}
      />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Item &amp; Warehouse</CardTitle>
            <CardDescription className="mt-1">
              Starts tracking this item's stock in the selected warehouse. Once tracked, billing and purchase orders
              will keep the quantity on hand up to date automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Item type"
              value={itemType}
              onChange={(e) => setItemType(e.target.value as InventoryItemType)}
              options={[
                { label: 'Product', value: 'product' },
                { label: 'Raw material', value: 'rawMaterial' },
              ]}
            />
            <Select label="Warehouse" options={warehouses.map((w) => ({ label: w.name, value: w.id }))} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} />
            <div className="sm:col-span-2">
              <Select
                label={itemType === 'product' ? 'Product' : 'Raw material'}
                options={itemOptions}
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                placeholder={itemOptions.length === 0 ? 'None available' : undefined}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Levels</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Input label="Quantity on hand" type="number" min={0} step="1" value={quantityOnHand} onChange={(e) => setQuantityOnHand(Number(e.target.value))} />
            <Input label="Safety stock" type="number" min={0} step="1" value={safetyStock} onChange={(e) => setSafetyStock(Number(e.target.value))} />
            <Input label="Reorder point" type="number" min={0} step="1" value={reorderPoint} onChange={(e) => setReorderPoint(Number(e.target.value))} />
            <Input label="Reorder quantity" type="number" min={0} step="1" value={reorderQuantity} onChange={(e) => setReorderQuantity(Number(e.target.value))} />
            <Input label="Avg. daily usage" type="number" min={0} step="0.1" value={avgDailyUsage} onChange={(e) => setAvgDailyUsage(Number(e.target.value))} />
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
            <AlertTriangle className="size-4 shrink-0" /> {error}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" isLoading={createInventoryItem.isPending} leftIcon={<Save className="size-4" />}>
            Start Tracking Stock
          </Button>
        </div>
      </form>
    </div>
  )
}
