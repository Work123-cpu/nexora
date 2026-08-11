import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { AlertTriangle, CheckCircle2, Plus, Save, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Select } from '@/shared/ui/Select'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import { ProgressBar } from '@/shared/ui/ProgressBar'
import { formatCurrency } from '@/shared/lib/formatters'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useRawMaterials } from '@/features/raw-materials/hooks/useRawMaterials'
import { useInventoryItems } from '@/features/inventory/hooks/useInventory'
import { calculateMaterialLineCost } from '../lib/calculateBomCost'
import type { BillOfMaterials, BOMLineItem } from '@/types/entities/bom'
import type { RawMaterial } from '@/types/entities/rawMaterial'
import type { BomInput } from '../services/bomService'

interface BomFormProps {
  initialValue?: BillOfMaterials
  onSubmit: (input: BomInput) => Promise<void>
  isSubmitting?: boolean
  submitLabel?: string
  lockProduct?: boolean
}

function emptyLine(rawMaterials: RawMaterial[]): BOMLineItem {
  const first = rawMaterials[0]
  return { rawMaterialId: first?.id ?? '', quantityPerUnit: 1, unit: first?.unit ?? '', scrapPct: 2 }
}

export function BomForm({ initialValue, onSubmit, isSubmitting, submitLabel = 'Save BOM', lockProduct }: BomFormProps) {
  const { data: productsData } = useProducts({ pageSize: 10000 })
  const { data: materialsData } = useRawMaterials({ pageSize: 10000 })
  const { data: inventoryData } = useInventoryItems({ pageSize: 10000 })
  const products = productsData?.items ?? []
  const rawMaterials = materialsData?.items ?? []
  const getRawMaterialById = (id: string) => rawMaterials.find((rm) => rm.id === id)
  const getInventoryByItemId = (id: string) => inventoryData?.items.find((i) => i.itemId === id)
  const MATERIAL_OPTIONS = rawMaterials.map((rm) => ({ label: `${rm.name} (${rm.unit})`, value: rm.id }))

  const availableProducts = useMemo(() => products.filter((p) => !p.hasBOM || p.id === initialValue?.productId), [products, initialValue])

  const [productId, setProductId] = useState(initialValue?.productId ?? '')
  const [version, setVersion] = useState(initialValue?.version ?? 'v1.0')
  const [materials, setMaterials] = useState<BOMLineItem[]>(initialValue?.materials ?? [])
  const [laborCostPerUnit, setLaborCostPerUnit] = useState(initialValue?.laborCostPerUnit ?? 0.3)
  const [overheadCostPerUnit, setOverheadCostPerUnit] = useState(initialValue?.overheadCostPerUnit ?? 0.15)
  const [previewQuantity, setPreviewQuantity] = useState(500)

  useEffect(() => {
    if (!productId && availableProducts.length > 0) setProductId(availableProducts[0]!.id)
  }, [availableProducts, productId])

  useEffect(() => {
    if (materials.length === 0 && rawMaterials.length > 0) setMaterials([emptyLine(rawMaterials)])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawMaterials])

  const materialsCost = materials.reduce((sum, line) => sum + calculateMaterialLineCost(line), 0)
  const totalUnitCost = materialsCost + laborCostPerUnit + overheadCostPerUnit

  const updateLine = (index: number, patch: Partial<BOMLineItem>) => {
    setMaterials((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)))
  }

  const handleMaterialChange = (index: number, rawMaterialId: string) => {
    const material = getRawMaterialById(rawMaterialId)
    updateLine(index, { rawMaterialId, unit: material?.unit ?? '' })
  }

  const addLine = () => setMaterials((prev) => [...prev, emptyLine(rawMaterials)])
  const removeLine = (index: number) => setMaterials((prev) => prev.filter((_, i) => i !== index))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await onSubmit({ productId, version, materials, laborCostPerUnit, overheadCostPerUnit })
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
            <CardDescription className="mt-1">Add each raw material required to produce one unit of this product.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {materials.map((line, index) => {
              const lineCost = calculateMaterialLineCost(line)
              return (
                <div key={index} className="grid grid-cols-1 gap-2 rounded-xl border border-border p-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
                  <Select options={MATERIAL_OPTIONS} value={line.rawMaterialId} onChange={(e) => handleMaterialChange(index, e.target.value)} />
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
          <Button type="button" variant="outline" size="sm" className="mt-3" leftIcon={<Plus className="size-3.5" />} onClick={addLine}>
            Add material
          </Button>

          <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
            <Input
              label="Labor cost / unit (₹)"
              type="number"
              step="0.01"
              value={laborCostPerUnit}
              onChange={(e) => setLaborCostPerUnit(Number(e.target.value))}
            />
            <Input
              label="Overhead cost / unit (₹)"
              type="number"
              step="0.01"
              value={overheadCostPerUnit}
              onChange={(e) => setOverheadCostPerUnit(Number(e.target.value))}
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
          <Input
            type="number"
            value={previewQuantity}
            onChange={(e) => setPreviewQuantity(Number(e.target.value))}
            containerClassName="w-36"
            label="Units to produce"
          />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {materials.map((line, index) => {
              const material = getRawMaterialById(line.rawMaterialId)
              const inventory = material ? getInventoryByItemId(material.id) : undefined
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
    </form>
  )
}
