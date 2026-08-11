import { useEffect, useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { Select } from '@/shared/ui/Select'
import { CategorySelect } from '@/shared/ui/CategorySelect'
import { Checkbox } from '@/shared/ui/Checkbox'
import { Button } from '@/shared/ui/Button'
import { RAW_MATERIAL_CATEGORIES } from '@/mocks/seed/rawMaterials.seed'
import { useVendors } from '@/features/vendors/hooks/useVendors'
import type { RawMaterialInput } from '../services/rawMaterialService'
import type { RawMaterial } from '@/types/entities/rawMaterial'

const UNIT_OPTIONS = ['kg', 'liter', 'unit', 'roll', 'pack', 'box'].map((u) => ({ label: u, value: u }))
const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]

interface RawMaterialFormProps {
  initialValue?: RawMaterial
  onSubmit: (input: RawMaterialInput) => Promise<void>
  isSubmitting?: boolean
  submitLabel?: string
}

export function RawMaterialForm({ initialValue, onSubmit, isSubmitting, submitLabel = 'Save material' }: RawMaterialFormProps) {
  const { data: vendorsData } = useVendors({ pageSize: 10000 })
  const vendors = vendorsData?.items ?? []
  const VENDOR_OPTIONS = vendors.map((v) => ({ label: v.name, value: v.id }))
  const [form, setForm] = useState<RawMaterialInput>({
    code: initialValue?.code ?? '',
    name: initialValue?.name ?? '',
    category: initialValue?.category ?? RAW_MATERIAL_CATEGORIES[0] ?? 'Additives',
    unit: initialValue?.unit ?? 'kg',
    unitCost: initialValue?.unitCost ?? 0,
    leadTimeDays: initialValue?.leadTimeDays ?? 5,
    isPerishable: initialValue?.isPerishable ?? false,
    primaryVendorId: initialValue?.primaryVendorId ?? '',
    status: initialValue?.status ?? 'active',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!form.primaryVendorId && vendors.length > 0) setForm((prev) => ({ ...prev, primaryVendorId: vendors[0]!.id }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendors])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!form.name.trim()) nextErrors.name = 'Material name is required.'
    if (!form.code.trim()) nextErrors.code = 'Material code is required.'
    if (form.unitCost <= 0) nextErrors.unitCost = 'Unit cost must be greater than zero.'
    if (form.leadTimeDays < 0) nextErrors.leadTimeDays = 'Lead time cannot be negative.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    await onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Material name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
            <Input label="Material code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} error={errors.code} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <CategorySelect
              storageKey="raw-material-categories"
              defaults={RAW_MATERIAL_CATEGORIES}
              value={form.category}
              onChange={(category) => setForm({ ...form, category })}
            />
            <Select label="Unit" options={UNIT_OPTIONS} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Unit cost (₹)"
              type="number"
              step="0.01"
              value={form.unitCost}
              onChange={(e) => setForm({ ...form, unitCost: Number(e.target.value) })}
              error={errors.unitCost}
            />
            <Input
              label="Lead time (days)"
              type="number"
              value={form.leadTimeDays}
              onChange={(e) => setForm({ ...form, leadTimeDays: Number(e.target.value) })}
              error={errors.leadTimeDays}
            />
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as RawMaterialInput['status'] })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Primary vendor"
              options={VENDOR_OPTIONS}
              value={form.primaryVendorId}
              onChange={(e) => setForm({ ...form, primaryVendorId: e.target.value })}
            />
            <div className="flex items-end pb-2">
              <Checkbox
                label="Perishable"
                checked={form.isPerishable}
                onChange={(e) => setForm({ ...form, isPerishable: e.target.checked })}
              />
            </div>
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
