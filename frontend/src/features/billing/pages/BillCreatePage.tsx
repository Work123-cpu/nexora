import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Plus, Save, Trash2 } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Select } from '@/shared/ui/Select'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import { useToast } from '@/shared/ui/Toast'
import { formatCurrency } from '@/shared/lib/formatters'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useWarehouses } from '@/features/warehouse/hooks/useWarehouses'
import { useInventoryItems } from '@/features/inventory/hooks/useInventory'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useCreateBill } from '../hooks/useBills'

interface DraftLine {
  productId: string
  quantity: number | ''
  unitPrice: number | ''
}

export function BillCreatePage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { session } = useAuth()
  const createBill = useCreateBill()

  const { data: productsData } = useProducts({ pageSize: 10000 })
  const { data: warehousesData } = useWarehouses({ pageSize: 10000 })
  const { data: inventoryData } = useInventoryItems({ pageSize: 10000 })
  const products = productsData?.items ?? []
  const warehouses = warehousesData?.items ?? []
  const getStock = (productId: string) => inventoryData?.items.find((i) => i.itemType === 'product' && i.itemId === productId)

  const [warehouseId, setWarehouseId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [taxPct, setTaxPct] = useState<number | ''>('')
  const [discountPct, setDiscountPct] = useState<number | ''>('')
  const [lines, setLines] = useState<DraftLine[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!warehouseId && warehouses.length > 0) setWarehouseId(warehouses[0]!.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouses])

  useEffect(() => {
    if (lines.length === 0 && products.length > 0) {
      const first = products[0]!
      setLines([{ productId: first.id, quantity: 1, unitPrice: first.unitPrice }])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products])

  const productOptions = products.map((p) => ({ label: `${p.name} (${p.sku})`, value: p.id }))
  const warehouseOptions = warehouses.map((w) => ({ label: w.name, value: w.id }))

  const updateLine = (index: number, patch: Partial<DraftLine>) => setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)))

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId)
    updateLine(index, { productId, unitPrice: product?.unitPrice ?? 0 })
  }

  const addLine = () => {
    const first = products[0]
    if (!first) return
    setLines((prev) => [...prev, { productId: first.id, quantity: 1, unitPrice: first.unitPrice }])
  }
  const removeLine = (index: number) => setLines((prev) => prev.filter((_, i) => i !== index))

  const taxPctValue = taxPct === '' ? 0 : taxPct
  const discountPctValue = discountPct === '' ? 0 : discountPct
  const lineTotals = useMemo(() => lines.map((l) => (l.quantity === '' ? 0 : l.quantity) * (l.unitPrice === '' ? 0 : l.unitPrice)), [lines])
  const subtotal = lineTotals.reduce((sum, v) => sum + v, 0)
  const discountAmount = (subtotal * discountPctValue) / 100
  const taxAmount = ((subtotal - discountAmount) * taxPctValue) / 100
  const total = subtotal - discountAmount + taxAmount

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!customerName.trim()) {
      setError('Customer name is required.')
      return
    }
    if (lines.length === 0) {
      setError('Add at least one product.')
      return
    }
    try {
      const bill = await createBill.mutateAsync({
        warehouseId,
        customerName,
        customerEmail: customerEmail || undefined,
        customerPhone: customerPhone || undefined,
        items: lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity === '' ? 0 : l.quantity,
          unitPrice: l.unitPrice === '' ? 0 : l.unitPrice,
        })),
        taxPct: taxPctValue,
        discountPct: discountPctValue,
        createdBy: session?.user?.name ?? 'Unknown user',
      })
      toast({ title: 'Bill completed', description: `${bill.billNumber} saved — stock updated.`, tone: 'success' })
      navigate(`/app/billing/${bill.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete this bill.')
    }
  }

  return (
    <div>
      <PageHeader
        title="New Bill"
        breadcrumbs={<Breadcrumbs items={[{ label: 'Billing', to: '/app/billing' }, { label: 'New' }]} />}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer &amp; Warehouse</CardTitle>
            <CardDescription className="mt-1">Stock is deducted from the selected warehouse when this bill is completed.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Input label="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            <Select label="Warehouse" options={warehouseOptions} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} />
            <Input label="Customer email (optional)" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
            <Input label="Customer phone (optional)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lines.map((line, index) => {
                const stock = getStock(line.productId)
                const quantityValue = line.quantity === '' ? 0 : line.quantity
                const insufficient = stock !== undefined && stock.quantityOnHand < quantityValue
                return (
                  <div key={index}>
                    <div className="grid grid-cols-1 gap-2 rounded-xl border border-border p-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
                      <Select label="Product" options={productOptions} value={line.productId} onChange={(e) => handleProductChange(index, e.target.value)} />
                      <Input
                        label="Quantity"
                        type="number"
                        min={1}
                        step="1"
                        placeholder="e.g. 10"
                        value={line.quantity}
                        onChange={(e) => updateLine(index, { quantity: e.target.value === '' ? '' : Number(e.target.value) })}
                      />
                      <Input
                        label="Unit Price (₹)"
                        type="number"
                        step="0.01"
                        placeholder="e.g. 50"
                        value={line.unitPrice}
                        onChange={(e) => updateLine(index, { unitPrice: e.target.value === '' ? '' : Number(e.target.value) })}
                      />
                      <div className="space-y-1.5">
                        <p className="text-sm font-medium text-foreground">Line Total</p>
                        <div className="flex h-10 items-center px-2 text-sm font-medium text-foreground">{formatCurrency(lineTotals[index] ?? 0, true)}</div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-sm font-medium text-transparent select-none" aria-hidden="true">.</p>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(index)} aria-label="Remove product">
                          <Trash2 className="size-4 text-danger" />
                        </Button>
                      </div>
                    </div>
                    <p className={`mt-1 text-xs ${insufficient ? 'text-danger' : 'text-muted-foreground'}`}>
                      {stock ? `${stock.quantityOnHand} ${stock.unit} in stock` : 'No inventory tracked for this product'}
                      {insufficient && ' — not enough stock for this quantity'}
                    </p>
                  </div>
                )
              })}
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-3" leftIcon={<Plus className="size-3.5" />} onClick={addLine}>
              Add product
            </Button>

            <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
              <Input
                label="Tax (%)"
                type="number"
                step="0.1"
                min={0}
                placeholder="e.g. 5"
                value={taxPct}
                onChange={(e) => setTaxPct(e.target.value === '' ? '' : Number(e.target.value))}
              />
              <Input
                label="Discount (%)"
                type="number"
                step="0.1"
                min={0}
                placeholder="e.g. 10"
                value={discountPct}
                onChange={(e) => setDiscountPct(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>

            <div className="mt-5 space-y-1.5 border-t border-border pt-5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, true)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Discount</span>
                  <span>-{formatCurrency(discountAmount, true)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span>+{formatCurrency(taxAmount, true)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total, true)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
            <AlertTriangle className="size-4 shrink-0" /> {error}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" isLoading={createBill.isPending} leftIcon={<Save className="size-4" />}>
            Complete Bill
          </Button>
        </div>
      </form>
    </div>
  )
}
