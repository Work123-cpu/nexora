import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AlertTriangle, PackageX, Save } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import { LoadingScreen } from '@/shared/ui/LoadingScreen'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useToast } from '@/shared/ui/Toast'
import { useWarehouses } from '@/features/warehouse/hooks/useWarehouses'
import { useBills } from '@/features/billing/hooks/useBills'
import { useBOMs } from '@/features/bom/hooks/useBOM'
import { computeDailySalesHistory, averageDailyUsage } from '@/lib/salesHistory/computeSalesHistory'
import { computeMaterialDailyUsage } from '@/lib/salesHistory/computeMaterialDailyUsage'
import { computeLeadTimeDays, computeReorderLevels } from '@/lib/salesHistory/computeReorderLevels'
import { useRawMaterials } from '@/features/raw-materials/hooks/useRawMaterials'
import { useInventoryItem, useAdjustInventoryItem } from '../hooks/useInventory'

export function InventoryEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: item, isLoading } = useInventoryItem(id)
  const adjustInventoryItem = useAdjustInventoryItem()
  const [searchParams] = useSearchParams()
  // ?add=N -- from a reorder/safety-stock recommendation's suggested quantity, so the field opens
  // already showing the replenished total (current + suggested) instead of just today's number.
  const addQuantity = Number(searchParams.get('add') ?? 0) || undefined

  const { data: warehousesData } = useWarehouses({ pageSize: 10000 })
  const { data: billsData } = useBills({ pageSize: 10000 })
  const { data: bomsData } = useBOMs({ pageSize: 10000 })
  const { data: rawMaterialsData } = useRawMaterials({ pageSize: 10000 })
  const warehouseName = warehousesData?.items.find((w) => w.id === item?.warehouseId)?.name

  const [quantityOnHand, setQuantityOnHand] = useState<number | ''>('')
  const [safetyStock, setSafetyStock] = useState<number | ''>('')
  const [reorderPoint, setReorderPoint] = useState<number | ''>('')
  const [reorderQuantity, setReorderQuantity] = useState<number | ''>('')
  const [avgDailyUsage, setAvgDailyUsage] = useState<number | ''>('')
  const [avgDailyUsageTouched, setAvgDailyUsageTouched] = useState(false)
  const [reorderPointTouched, setReorderPointTouched] = useState(false)
  const [reorderQuantityTouched, setReorderQuantityTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false)

  useEffect(() => {
    if (!item || hasLoadedInitial) return
    setQuantityOnHand(addQuantity ? item.quantityOnHand + addQuantity : item.quantityOnHand)
    setSafetyStock(item.safetyStock)
    setReorderPoint(item.reorderPoint)
    setReorderQuantity(item.reorderQuantity)
    setAvgDailyUsage(item.avgDailyUsage)
    setHasLoadedInitial(true)
  }, [item, hasLoadedInitial])

  /** Same real-history computation as Add Stock. */
  const computedAvgDailyUsage = useMemo(() => {
    if (!item) return undefined
    const bills = billsData?.items ?? []
    if (item.itemType === 'product') {
      const series = computeDailySalesHistory(bills, item.itemId)
      return series ? averageDailyUsage(series) : undefined
    }
    return computeMaterialDailyUsage(bills, bomsData?.items ?? [], item.itemId)
  }, [item, billsData, bomsData])

  const leadTimeDays = useMemo(
    () => (item ? computeLeadTimeDays(item.itemType, item.itemId, rawMaterialsData?.items ?? [], bomsData?.items ?? []) : undefined),
    [item, rawMaterialsData, bomsData],
  )

  // Demand forecast: once real history yields a usage rate, refresh avg daily usage and
  // reorder point/quantity from it — the field already holds a previously-entered number, but a
  // fresher forecast is more useful than a stale one, so it replaces it unless the user has
  // edited that field during this visit.
  useEffect(() => {
    if (!hasLoadedInitial || computedAvgDailyUsage === undefined || leadTimeDays === undefined) return
    if (!avgDailyUsageTouched) setAvgDailyUsage(Number(computedAvgDailyUsage.toFixed(1)))
    const safety = safetyStock === '' ? 0 : safetyStock
    const { reorderPoint: suggestedRP, reorderQuantity: suggestedRQ } = computeReorderLevels(computedAvgDailyUsage, leadTimeDays, safety)
    if (!reorderPointTouched) setReorderPoint(suggestedRP)
    if (!reorderQuantityTouched) setReorderQuantity(suggestedRQ)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLoadedInitial, computedAvgDailyUsage, leadTimeDays, safetyStock, avgDailyUsageTouched, reorderPointTouched, reorderQuantityTouched])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!id) return
    try {
      await adjustInventoryItem.mutateAsync({
        id,
        input: {
          quantityOnHand: quantityOnHand === '' ? 0 : quantityOnHand,
          safetyStock: safetyStock === '' ? 0 : safetyStock,
          reorderPoint: reorderPoint === '' ? 0 : reorderPoint,
          reorderQuantity: reorderQuantity === '' ? 0 : reorderQuantity,
          avgDailyUsage: avgDailyUsage === '' ? 0 : avgDailyUsage,
        },
      })
      toast({ title: 'Stock levels updated', description: `${item?.itemName ?? 'Item'} was updated.`, tone: 'success' })
      navigate('/app/inventory')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update this stock entry.')
    }
  }

  if (isLoading) return <LoadingScreen label="Loading inventory item…" />
  if (!item) return <EmptyState icon={<PackageX className="size-5" />} title="Inventory item not found" />

  return (
    <div>
      <PageHeader
        title={`Edit Stock — ${item.itemName}`}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Inventory', to: '/app/inventory' }, { label: `Edit ${item.itemName}` }]} />}
      />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Item &amp; Warehouse</CardTitle>
            <CardDescription className="mt-1">
              To track this item in a different warehouse, add it there separately from Add Stock — this only adjusts
              its levels here.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Item</p>
              <p className="mt-1 font-medium text-foreground">{item.itemName}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Warehouse</p>
              <p className="mt-1 font-medium text-foreground">{warehouseName ?? '—'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Levels</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Quantity on hand"
              type="number"
              min={0}
              step="1"
              placeholder="e.g. 250"
              hint={addQuantity ? `Pre-filled with the recommended restock: ${item?.quantityOnHand ?? 0} on hand + ${addQuantity} suggested.` : undefined}
              value={quantityOnHand}
              onChange={(e) => setQuantityOnHand(e.target.value === '' ? '' : Number(e.target.value))}
            />
            <Input
              label="Safety stock"
              type="number"
              min={0}
              step="1"
              placeholder="e.g. 50"
              hint="The minimum buffer you want on hand — dropping below this triggers a critical low-stock alert."
              value={safetyStock}
              onChange={(e) => setSafetyStock(e.target.value === '' ? '' : Number(e.target.value))}
            />
            <Input
              label="Reorder point"
              type="number"
              min={0}
              step="1"
              placeholder="e.g. 100"
              hint={
                computedAvgDailyUsage !== undefined
                  ? `Forecasted from usage × a ${leadTimeDays}-day lead time, plus your safety stock — you can override this.`
                  : 'The stock level that triggers a reorder recommendation, before you hit safety stock.'
              }
              value={reorderPoint}
              onChange={(e) => {
                setReorderPointTouched(true)
                setReorderPoint(e.target.value === '' ? '' : Number(e.target.value))
              }}
            />
            <Input
              label="Reorder quantity"
              type="number"
              min={0}
              step="1"
              placeholder="e.g. 200"
              hint={
                computedAvgDailyUsage !== undefined
                  ? 'Forecasted to cover 30 days of usage — you can override this.'
                  : 'How much to order each time you restock this item.'
              }
              value={reorderQuantity}
              onChange={(e) => {
                setReorderQuantityTouched(true)
                setReorderQuantity(e.target.value === '' ? '' : Number(e.target.value))
              }}
            />
            <Input
              label="Avg. daily usage"
              type="number"
              min={0}
              step="0.1"
              placeholder="e.g. 12.5"
              hint={
                computedAvgDailyUsage !== undefined
                  ? 'Computed from 10 days of real sales history — you can override this.'
                  : 'Average units sold per day — used to estimate days of stock remaining and demand forecasts.'
              }
              value={avgDailyUsage}
              onChange={(e) => {
                setAvgDailyUsageTouched(true)
                setAvgDailyUsage(e.target.value === '' ? '' : Number(e.target.value))
              }}
            />
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
            <AlertTriangle className="size-4 shrink-0" /> {error}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" isLoading={adjustInventoryItem.isPending} leftIcon={<Save className="size-4" />}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
