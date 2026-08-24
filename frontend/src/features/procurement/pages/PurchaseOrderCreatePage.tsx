import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Save, Trash2 } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Select } from '@/shared/ui/Select'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import { useToast } from '@/shared/ui/Toast'
import { formatCurrency } from '@/shared/lib/formatters'
import { useVendors } from '@/features/vendors/hooks/useVendors'
import { useRawMaterials } from '@/features/raw-materials/hooks/useRawMaterials'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useCreatePurchaseOrder } from '../hooks/usePurchaseOrders'
import type { PurchaseOrderLineItem } from '@/types/entities/purchaseOrder'

interface DraftLine {
  rawMaterialId: string
  quantity: number | ''
}

export function PurchaseOrderCreatePage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { session } = useAuth()
  const createPO = useCreatePurchaseOrder()
  const [searchParams] = useSearchParams()

  const { data: vendorsData } = useVendors({ pageSize: 10000 })
  const { data: materialsData } = useRawMaterials({ pageSize: 10000 })
  const vendors = vendorsData?.items ?? []
  const rawMaterials = materialsData?.items ?? []
  const getVendorById = (id: string) => vendors.find((v) => v.id === id)
  const getRawMaterialById = (id: string) => rawMaterials.find((rm) => rm.id === id)

  const prefillMaterialId = searchParams.get('materialId') ?? undefined
  const prefillQuantity = Number(searchParams.get('quantity') ?? 0) || undefined
  const prefillMaterial = prefillMaterialId ? getRawMaterialById(prefillMaterialId) : undefined

  const [vendorId, setVendorId] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([])
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date.toISOString().slice(0, 10)
  })

  useEffect(() => {
    if (vendorId || vendors.length === 0) return
    setVendorId(prefillMaterial?.primaryVendorId ?? vendors[0]!.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendors])

  useEffect(() => {
    if (lines.length > 0 || rawMaterials.length === 0) return
    setLines(prefillMaterial ? [{ rawMaterialId: prefillMaterial.id, quantity: prefillQuantity ?? '' }] : [{ rawMaterialId: rawMaterials[0]!.id, quantity: '' }])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawMaterials])

  const vendor = getVendorById(vendorId)
  const materialsForVendor = useMemo(() => rawMaterials.filter((rm) => rm.primaryVendorId === vendorId), [vendorId, rawMaterials])
  const materialOptions = (materialsForVendor.length > 0 ? materialsForVendor : rawMaterials).map((rm) => ({ label: `${rm.name} (${rm.unit})`, value: rm.id }))

  const updateLine = (index: number, patch: Partial<DraftLine>) => setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)))
  const addLine = () => setLines((prev) => [...prev, { rawMaterialId: materialOptions[0]!.value, quantity: '' }])
  const removeLine = (index: number) => setLines((prev) => prev.filter((_, i) => i !== index))

  const lineItems: PurchaseOrderLineItem[] = lines.map((line) => {
    const material = getRawMaterialById(line.rawMaterialId)
    return {
      rawMaterialId: line.rawMaterialId,
      rawMaterialName: material?.name ?? 'Unknown',
      quantity: line.quantity === '' ? 0 : line.quantity,
      unit: material?.unit ?? '',
      unitCost: material?.unitCost ?? 0,
    }
  })
  const total = lineItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const po = await createPO.mutateAsync({
      vendorId,
      items: lineItems,
      expectedDeliveryDate: new Date(expectedDeliveryDate).toISOString(),
      createdBy: session?.user.name ?? 'Unknown user',
      sourceRecommendationId: prefillMaterialId ? `rec-reorder-${prefillMaterialId}` : undefined,
    })
    toast({ title: 'Purchase order created', description: `${po.poNumber} has been submitted for approval.`, tone: 'success' })
    navigate(`/app/procurement/purchase-orders/${po.id}`)
  }

  return (
    <div>
      <PageHeader
        title="Create Purchase Order"
        breadcrumbs={<Breadcrumbs items={[{ label: 'Purchase Orders', to: '/app/procurement/purchase-orders' }, { label: 'Create' }]} />}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Supplier Selection</CardTitle>
              <CardDescription className="mt-1">Choose a vendor to purchase from. Materials are filtered to items they supply.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Select label="Vendor" options={vendors.map((v) => ({ label: v.name, value: v.id }))} value={vendorId} onChange={(e) => setVendorId(e.target.value)} />
            <Input label="Expected delivery date" type="date" value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} />
          </CardContent>
          {vendor && (
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-4 rounded-xl bg-surface-elevated/50 p-3 text-xs text-muted-foreground">
                <span>On-time delivery: <strong className="text-foreground">{vendor.onTimeDeliveryPct}%</strong></span>
                <span>Quality score: <strong className="text-foreground">{vendor.qualityScorePct}%</strong></span>
                <span>Lead time: <strong className="text-foreground">{vendor.leadTimeDays} days</strong></span>
              </div>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lines.map((line, index) => {
                const material = getRawMaterialById(line.rawMaterialId)
                const quantity = line.quantity === '' ? 0 : line.quantity
                const subtotal = quantity * (material?.unitCost ?? 0)
                return (
                  <div key={index} className="grid grid-cols-1 gap-2 rounded-xl border border-border p-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
                    <Select options={materialOptions} value={line.rawMaterialId} onChange={(e) => updateLine(index, { rawMaterialId: e.target.value })} />
                    <Input
                      type="number"
                      value={line.quantity}
                      onChange={(e) => updateLine(index, { quantity: e.target.value === '' ? '' : Number(e.target.value) })}
                      placeholder="e.g. 100"
                    />
                    <div className="flex items-center px-2 text-sm font-medium text-foreground">{formatCurrency(subtotal, true)}</div>
                    <Button type="button" variant="ghost" size="icon" aria-label="Remove line" onClick={() => removeLine(index)}>
                      <Trash2 className="size-4 text-danger" />
                    </Button>
                  </div>
                )
              })}
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-3" leftIcon={<Plus className="size-3.5" />} onClick={addLine}>
              Add material
            </Button>

            <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
              <p className="text-sm font-medium text-foreground">Order Total</p>
              <p className="text-2xl font-semibold text-primary">{formatCurrency(total, true)}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" isLoading={createPO.isPending} leftIcon={<Save className="size-4" />}>
            Submit for Approval
          </Button>
        </div>
      </form>
    </div>
  )
}
