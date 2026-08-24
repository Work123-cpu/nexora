import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { AlertTriangle, CheckCircle2, Plus, Save, Sparkles, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Select } from '@/shared/ui/Select'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import { ProgressBar } from '@/shared/ui/ProgressBar'
import { Dialog } from '@/shared/ui/Dialog'
import { useToast } from '@/shared/ui/Toast'
import { formatCurrency } from '@/shared/lib/formatters'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useRawMaterials, useCreateRawMaterial } from '@/features/raw-materials/hooks/useRawMaterials'
import { RawMaterialForm } from '@/features/raw-materials/components/RawMaterialForm'
import { useInventoryItems } from '@/features/inventory/hooks/useInventory'
import { useWarehouses, useCreateWarehouse } from '@/features/warehouse/hooks/useWarehouses'
import { WarehouseForm } from '@/features/warehouse/components/WarehouseForm'
import { aiService } from '@/services/ai'
import { useBOMs } from '../hooks/useBOM'
import { calculateMaterialLineCost } from '../lib/calculateBomCost'
import type { BillOfMaterials, BOMLineItem } from '@/types/entities/bom'
import type { RawMaterial } from '@/types/entities/rawMaterial'
import type { RawMaterialInput } from '@/features/raw-materials/services/rawMaterialService'
import type { WarehouseInput } from '@/features/warehouse/services/warehouseService'
import type { BomInput } from '../services/bomService'

interface BomFormProps {
  initialValue?: BillOfMaterials
  /** Pre-selects a product for a brand-new BOM (e.g. arriving from a "define ingredients for
   * this product" suggestion) without needing a full existing BillOfMaterials to pass as
   * initialValue. Ignored once initialValue is set. */
  initialProductId?: string
  onSubmit: (input: BomInput) => Promise<void>
  isSubmitting?: boolean
  submitLabel?: string
  lockProduct?: boolean
}

function emptyLine(rawMaterials: RawMaterial[]): BOMLineItem {
  const first = rawMaterials[0]
  return { rawMaterialId: first?.id ?? '', quantityPerUnit: 1, unit: first?.unit ?? '', scrapPct: 2 }
}

export function BomForm({ initialValue, initialProductId, onSubmit, isSubmitting, submitLabel = 'Save BOM', lockProduct }: BomFormProps) {
  const { data: productsData } = useProducts({ pageSize: 10000 })
  const { data: materialsData } = useRawMaterials({ pageSize: 10000 })
  const { data: inventoryData } = useInventoryItems({ pageSize: 10000 })
  const { data: bomsData } = useBOMs({ pageSize: 10000 })
  const { data: warehousesData } = useWarehouses({ pageSize: 10000 })
  const createRawMaterial = useCreateRawMaterial()
  const createWarehouse = useCreateWarehouse()
  const { toast } = useToast()
  const products = productsData?.items ?? []
  const rawMaterials = materialsData?.items ?? []
  const warehouses = warehousesData?.items ?? []
  const getRawMaterialById = (id: string) => rawMaterials.find((rm) => rm.id === id)
  const getInventoryForWarehouse = (materialId: string, warehouseId: string) =>
    inventoryData?.items.find((i) => i.itemId === materialId && i.warehouseId === warehouseId)
  const MATERIAL_OPTIONS = rawMaterials.map((rm) => ({ label: `${rm.name} (${rm.unit})`, value: rm.id }))
  const WAREHOUSE_OPTIONS = warehouses.map((w) => ({ label: w.name, value: w.id }))

  // product.hasBOM is not reliable against the real backend (always false there — see
  // bomService.ts) — cross-reference the live BOM list directly instead, same fix.
  const bomProductIds = useMemo(() => new Set((bomsData?.items ?? []).map((b) => b.productId)), [bomsData])
  const availableProducts = useMemo(
    () => products.filter((p) => !bomProductIds.has(p.id) || p.id === initialValue?.productId),
    [products, bomProductIds, initialValue],
  )

  const [productId, setProductId] = useState(initialValue?.productId ?? initialProductId ?? '')
  const [version, setVersion] = useState(initialValue?.version ?? 'v1.0')
  const [materials, setMaterials] = useState<BOMLineItem[]>(initialValue?.materials ?? [])
  const [laborCostPerUnit, setLaborCostPerUnit] = useState<number | ''>(initialValue?.laborCostPerUnit ?? '')
  const [overheadCostPerUnit, setOverheadCostPerUnit] = useState<number | ''>(initialValue?.overheadCostPerUnit ?? '')
  const [previewQuantity, setPreviewQuantity] = useState(500)
  const [newMaterialForIndex, setNewMaterialForIndex] = useState<number | null>(null)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [pendingSuggestion, setPendingSuggestion] = useState<BOMLineItem[] | null>(null)
  const [hasUserEditedMaterials, setHasUserEditedMaterials] = useState(false)
  const [previewWarehouseId, setPreviewWarehouseId] = useState('')
  const [isNewWarehouseOpen, setIsNewWarehouseOpen] = useState(false)

  useEffect(() => {
    if (!productId && availableProducts.length > 0) setProductId(availableProducts[0]!.id)
  }, [availableProducts, productId])

  useEffect(() => {
    if (!previewWarehouseId && warehouses.length > 0) setPreviewWarehouseId(warehouses[0]!.id)
  }, [warehouses, previewWarehouseId])

  useEffect(() => {
    if (materials.length === 0 && rawMaterials.length > 0) setMaterials([emptyLine(rawMaterials)])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawMaterials])

  const materialsCost = materials.reduce((sum, line) => sum + calculateMaterialLineCost(line, rawMaterials), 0)
  const laborCost = laborCostPerUnit === '' ? 0 : laborCostPerUnit
  const overheadCost = overheadCostPerUnit === '' ? 0 : overheadCostPerUnit
  const totalUnitCost = materialsCost + laborCost + overheadCost

  const updateLine = (index: number, patch: Partial<BOMLineItem>) => {
    setHasUserEditedMaterials(true)
    setMaterials((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)))
  }

  const handleMaterialChange = (index: number, rawMaterialId: string) => {
    const material = getRawMaterialById(rawMaterialId)
    updateLine(index, { rawMaterialId, unit: material?.unit ?? '' })
  }

  const addLine = () => {
    setHasUserEditedMaterials(true)
    setMaterials((prev) => [...prev, emptyLine(rawMaterials)])
  }
  const removeLine = (index: number) => {
    setHasUserEditedMaterials(true)
    setMaterials((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await onSubmit({ productId, version, materials, laborCostPerUnit: laborCost, overheadCostPerUnit: overheadCost })
  }

  const selectedProduct = products.find((p) => p.id === productId)

  const handleSuggestWithAI = async () => {
    if (!selectedProduct) return
    setIsSuggesting(true)
    try {
      const fewShotExamples = (bomsData?.items ?? [])
        .filter((b) => b.productId !== productId)
        .map((b) => ({ productName: b.productName, materials: b.materials }))
        .slice(0, 3)

      const res = await aiService.suggestBom({
        productName: selectedProduct.name,
        productCategory: selectedProduct.category,
        productDescription: selectedProduct.description,
        unitOfMeasure: selectedProduct.unitOfMeasure,
        availableRawMaterials: rawMaterials.map((rm) => ({ id: rm.id, name: rm.name, category: rm.category, unit: rm.unit })),
        fewShotExamples,
      })

      const lines: BOMLineItem[] = res.materials
        .map((m) => {
          const rm = getRawMaterialById(m.rawMaterialId)
          return rm ? { rawMaterialId: rm.id, quantityPerUnit: m.quantityPerUnit, unit: rm.unit, scrapPct: m.scrapPct } : null
        })
        .filter((line): line is BOMLineItem => line !== null)

      if (lines.length === 0) {
        toast({ title: 'No suggestions available', description: 'Try again shortly, or add materials manually.', tone: 'error' })
        return
      }

      if (hasUserEditedMaterials) {
        setPendingSuggestion(lines)
      } else {
        setMaterials(lines)
        toast({ title: 'Nexora suggested materials', description: `${lines.length} materials added — review before saving.`, tone: 'info' })
      }
    } catch {
      toast({ title: 'Could not reach the AI service', description: 'Try again in a moment.', tone: 'error' })
    } finally {
      setIsSuggesting(false)
    }
  }

  const handleNewMaterialSubmit = async (input: RawMaterialInput) => {
    const material = await createRawMaterial.mutateAsync(input)
    if (newMaterialForIndex !== null) updateLine(newMaterialForIndex, { rawMaterialId: material.id, unit: material.unit })
    setNewMaterialForIndex(null)
  }

  const handleNewWarehouseSubmit = async (input: WarehouseInput) => {
    const warehouse = await createWarehouse.mutateAsync(input)
    setPreviewWarehouseId(warehouse.id)
    setIsNewWarehouseOpen(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Product & Version</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Product"
            options={availableProducts.map((p) => ({ label: p.name, value: p.id }))}
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            disabled={lockProduct}
          />
          <Input label="BOM Version" value={version} onChange={(e) => setVersion(e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Materials & Calculator</CardTitle>
            <CardDescription className="mt-1">
              Add each raw material required to produce one unit of this product. Scrap % accounts for material
              typically lost or wasted during production — it's added on top of the quantity per unit when
              calculating real requirements.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {materials.map((line, index) => {
              const lineCost = calculateMaterialLineCost(line, rawMaterials)
              return (
                <div key={index} className="grid grid-cols-1 gap-2 rounded-xl border border-border p-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1">
                      <Select options={MATERIAL_OPTIONS} value={line.rawMaterialId} onChange={(e) => handleMaterialChange(index, e.target.value)} />
                    </div>
                    <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setNewMaterialForIndex(index)}>
                      + New
                    </Button>
                  </div>
                  <Input
                    type="number"
                    step="0.001"
                    value={line.quantityPerUnit}
                    onChange={(e) => updateLine(index, { quantityPerUnit: Number(e.target.value) })}
                    placeholder="Qty/unit"
                  />
                  <Input
                    type="number"
                    step="0.5"
                    value={line.scrapPct}
                    onChange={(e) => updateLine(index, { scrapPct: Number(e.target.value) })}
                    placeholder="Scrap %"
                  />
                  <div className="flex items-center px-2 text-sm font-medium text-foreground">{formatCurrency(lineCost, true)}</div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(index)} aria-label="Remove material">
                    <Trash2 className="size-4 text-danger" />
                  </Button>
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" leftIcon={<Plus className="size-3.5" />} onClick={addLine}>
              Add material
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Sparkles className="size-3.5" />}
              onClick={handleSuggestWithAI}
              isLoading={isSuggesting}
              disabled={!productId}
            >
              Suggest with AI
            </Button>
          </div>

          <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
            <Input
              label="Labor cost / unit (₹)"
              type="number"
              step="0.01"
              placeholder="e.g. 0.30"
              value={laborCostPerUnit}
              onChange={(e) => setLaborCostPerUnit(e.target.value === '' ? '' : Number(e.target.value))}
            />
            <Input
              label="Overhead cost / unit (₹)"
              type="number"
              step="0.01"
              placeholder="e.g. 0.15"
              value={overheadCostPerUnit}
              onChange={(e) => setOverheadCostPerUnit(e.target.value === '' ? '' : Number(e.target.value))}
            />
            <div>
              <p className="text-sm font-medium text-foreground">Total unit cost</p>
              <p className="mt-2.5 text-2xl font-semibold text-primary">{formatCurrency(totalUnitCost, true)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Material Requirement Preview</CardTitle>
            <CardDescription className="mt-1">Estimate raw material needs for a production run and check current stock coverage.</CardDescription>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Select
                label="Warehouse"
                options={WAREHOUSE_OPTIONS}
                value={previewWarehouseId}
                onChange={(e) => setPreviewWarehouseId(e.target.value)}
                placeholder={WAREHOUSE_OPTIONS.length === 0 ? 'No warehouses yet' : undefined}
              />
            </div>
            <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setIsNewWarehouseOpen(true)}>
              + New
            </Button>
            <Input
              type="number"
              value={previewQuantity}
              onChange={(e) => setPreviewQuantity(Number(e.target.value))}
              containerClassName="w-36"
              label="Units to produce"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {materials.map((line, index) => {
              const material = getRawMaterialById(line.rawMaterialId)
              const inventory = material ? getInventoryForWarehouse(material.id, previewWarehouseId) : undefined
              const required = line.quantityPerUnit * (1 + line.scrapPct / 100) * previewQuantity
              const available = inventory?.quantityOnHand ?? 0
              const sufficient = available >= required
              const pct = required > 0 ? Math.min(100, (available / required) * 100) : 100

              return (
                <div key={index}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{material?.name ?? 'Unknown material'}</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {sufficient ? <CheckCircle2 className="size-3.5 text-success" /> : <AlertTriangle className="size-3.5 text-danger" />}
                      Need {required.toFixed(1)} {line.unit} · Have {available.toFixed(0)} {line.unit}
                    </span>
                  </div>
                  <ProgressBar value={pct} tone={sufficient ? 'success' : 'danger'} />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit" isLoading={isSubmitting} leftIcon={<Save className="size-4" />}>
          {submitLabel}
        </Button>
      </div>

      <Dialog
        open={newMaterialForIndex !== null}
        onClose={() => setNewMaterialForIndex(null)}
        title="New Raw Material"
        description="Add a material that doesn't exist in your catalog yet — the price is your own assumed cost."
        className="max-w-2xl"
      >
        {/* Dialog portals to document.body, but React bubbles synthetic events through the
         * component tree regardless of DOM placement — without this, submitting the nested
         * RawMaterialForm would also bubble up and submit the outer BOM form. */}
        <div onSubmit={(e) => e.stopPropagation()}>
          <RawMaterialForm onSubmit={handleNewMaterialSubmit} isSubmitting={createRawMaterial.isPending} submitLabel="Add material" />
        </div>
      </Dialog>

      <Dialog
        open={isNewWarehouseOpen}
        onClose={() => setIsNewWarehouseOpen(false)}
        title="New Warehouse"
        description="Add a warehouse to check stock coverage against — you can add more detail later."
        className="max-w-2xl"
      >
        <div onSubmit={(e) => e.stopPropagation()}>
          <WarehouseForm onSubmit={handleNewWarehouseSubmit} isSubmitting={createWarehouse.isPending} submitLabel="Add warehouse" />
        </div>
      </Dialog>

      <Dialog
        open={pendingSuggestion !== null}
        onClose={() => setPendingSuggestion(null)}
        title="Replace current materials?"
        description={`This replaces your ${materials.length} current material line(s) with ${pendingSuggestion?.length ?? 0} AI-suggested line(s). Review before saving.`}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setPendingSuggestion(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (pendingSuggestion) {
                  setMaterials(pendingSuggestion)
                  toast({ title: 'Nexora suggested materials', description: `${pendingSuggestion.length} materials added — review before saving.`, tone: 'info' })
                }
                setPendingSuggestion(null)
              }}
            >
              Replace materials
            </Button>
          </>
        }
      >
        <ul className="space-y-1.5 text-sm text-foreground">
          {pendingSuggestion?.map((line, i) => {
            const rm = getRawMaterialById(line.rawMaterialId)
            return (
              <li key={i} className="flex items-center justify-between">
                <span>{rm?.name ?? 'Unknown material'}</span>
                <span className="text-muted-foreground">
                  {line.quantityPerUnit} {line.unit} · {line.scrapPct}% scrap
                </span>
              </li>
            )
          })}
        </ul>
      </Dialog>
    </form>
  )
}
