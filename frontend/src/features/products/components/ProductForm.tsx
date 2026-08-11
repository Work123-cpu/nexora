import { useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { Select } from '@/shared/ui/Select'
import { CategorySelect } from '@/shared/ui/CategorySelect'
import { Textarea } from '@/shared/ui/Textarea'
import { Button } from '@/shared/ui/Button'
import { PRODUCT_CATEGORIES } from '@/mocks/seed/products.seed'
import type { ProductInput } from '../services/productService'
import type { Product } from '@/types/entities/product'

const UNIT_OPTIONS = ['unit', 'pack', 'box', 'bottle', 'jar', 'can', 'bag', 'loaf'].map((u) => ({ label: u, value: u }))
const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Discontinued', value: 'discontinued' },
]

interface ProductFormProps {
  initialValue?: Product
  onSubmit: (input: ProductInput) => Promise<void>
  isSubmitting?: boolean
  submitLabel?: string
}

export function ProductForm({ initialValue, onSubmit, isSubmitting, submitLabel = 'Save product' }: ProductFormProps) {
  const [form, setForm] = useState<ProductInput>({
    name: initialValue?.name ?? '',
    category: initialValue?.category ?? PRODUCT_CATEGORIES[0] ?? 'Bakery',
    description: initialValue?.description ?? '',
    unitOfMeasure: initialValue?.unitOfMeasure ?? 'unit',
    unitPrice: initialValue?.unitPrice ?? 0,
    unitCost: initialValue?.unitCost ?? 0,
    status: initialValue?.status ?? 'active',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!form.name.trim()) nextErrors.name = 'Product name is required.'
    if (form.unitPrice <= 0) nextErrors.unitPrice = 'Unit price must be greater than zero.'
    if (form.unitCost < 0) nextErrors.unitCost = 'Unit cost cannot be negative.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    await onSubmit(form)
  }

  const margin = form.unitPrice > 0 ? (((form.unitPrice - form.unitCost) / form.unitPrice) * 100).toFixed(1) : '0.0'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <Input label="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <CategorySelect
              storageKey="product-categories"
              defaults={PRODUCT_CATEGORIES}
              value={form.category}
              onChange={(category) => setForm({ ...form, category })}
            />
            <Select
              label="Unit of measure"
              options={UNIT_OPTIONS}
              value={form.unitOfMeasure}
              onChange={(e) => setForm({ ...form, unitOfMeasure: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Unit price (₹)"
              type="number"
              step="0.01"
              value={form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
              error={errors.unitPrice}
            />
            <Input
              label="Unit cost (₹)"
              type="number"
              step="0.01"
              value={form.unitCost}
              onChange={(e) => setForm({ ...form, unitCost: Number(e.target.value) })}
              error={errors.unitCost}
            />
            <div>
              <p className="text-sm font-medium text-foreground">Gross margin</p>
              <p className="mt-2.5 text-2xl font-semibold text-success">{margin}%</p>
            </div>
          </div>
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as ProductInput['status'] })}
          />
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
