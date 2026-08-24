import { useEffect, useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { Select } from '@/shared/ui/Select'
import { CategorySelect } from '@/shared/ui/CategorySelect'
import { Checkbox } from '@/shared/ui/Checkbox'
import { Button } from '@/shared/ui/Button'
import { Dialog } from '@/shared/ui/Dialog'
import { RAW_MATERIAL_CATEGORIES } from '../constants'
import { useVendors, useCreateVendor } from '@/features/vendors/hooks/useVendors'
import { VendorForm } from '@/features/vendors/components/VendorForm'
import type { RawMaterialInput } from '../services/rawMaterialService'
import type { RawMaterial } from '@/types/entities/rawMaterial'
import type { VendorInput } from '@/features/vendors/services/vendorService'

const UNIT_OPTIONS = ['kg', 'liter', 'unit', 'roll', 'pack', 'box'].map((u) => ({ label: u, value: u }))
const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]

type NumericField = 'unitCost' | 'leadTimeDays'
type FormState = Omit<RawMaterialInput, NumericField> & Record<NumericField, number | ''>

interface RawMaterialFormProps {
  initialValue?: RawMaterial
  onSubmit: (input: RawMaterialInput) => Promise<void>
  isSubmitting?: boolean
  submitLabel?: string
}

export function RawMaterialForm({ initialValue, onSubmit, isSubmitting, submitLabel = 'Save material' }: RawMaterialFormProps) {
  const { data: vendorsData } = useVendors({ pageSize: 10000 })
  const createVendor = useCreateVendor()
  const vendors = vendorsData?.items ?? []
  const VENDOR_OPTIONS = vendors.map((v) => ({ label: v.name, value: v.id }))
  const [isNewVendorOpen, setIsNewVendorOpen] = useState(false)
  const [form, setForm] = useState<FormState>({
    code: initialValue?.code ?? '',
    name: initialValue?.name ?? '',
    category: initialValue?.category ?? '',
    unit: initialValue?.unit ?? 'kg',
    unitCost: initialValue?.unitCost ?? '',
    leadTimeDays: initialValue?.leadTimeDays ?? '',
    isPerishable: initialValue?.isPerishable ?? false,
    primaryVendorId: initialValue?.primaryVendorId ?? '',
    status: initialValue?.status ?? 'active',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!form.primaryVendorId && vendors.length > 0) setForm((prev) => ({ ...prev, primaryVendorId: vendors[0]!.id }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendors])

  const unitCost = form.unitCost === '' ? 0 : form.unitCost
  const leadTimeDays = form.leadTimeDays === '' ? 0 : form.leadTimeDays

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!form.name.trim()) nextErrors.name = 'Material name is required.'
    if (!form.code.trim()) nextErrors.code = 'Material code is required.'
    if (!form.category.trim()) nextErrors.category = 'Category is required — type a new one to add it.'
    if (unitCost <= 0) nextErrors.unitCost = 'Unit cost must be greater than zero.'
    if (leadTimeDays < 0) nextErrors.leadTimeDays = 'Lead time cannot be negative.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    await onSubmit({ ...form, unitCost, leadTimeDays })
  }

  const handleNewVendorSubmit = async (input: VendorInput) => {
    const vendor = await createVendor.mutateAsync(input)
    setForm((prev) => ({ ...prev, primaryVendorId: vendor.id }))
    setIsNewVendorOpen(false)
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
              error={errors.category}
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
              placeholder="e.g. 450"
              value={form.unitCost}
              onChange={(e) => setForm({ ...form, unitCost: e.target.value === '' ? '' : Number(e.target.value) })}
              error={errors.unitCost}
            />
            <Input
              label="Lead time (days)"
              type="number"
              placeholder="e.g. 7"
              hint={!errors.leadTimeDays ? 'Typical days between placing an order with this vendor and receiving it — used to time reorders.' : undefined}
              value={form.leadTimeDays}
              onChange={(e) => setForm({ ...form, leadTimeDays: e.target.value === '' ? '' : Number(e.target.value) })}
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
            <div className="flex items-end gap-1.5">
              <div className="flex-1">
                <Select
                  label="Primary vendor"
                  options={VENDOR_OPTIONS}
                  value={form.primaryVendorId}
                  onChange={(e) => setForm({ ...form, primaryVendorId: e.target.value })}
                  placeholder={VENDOR_OPTIONS.length === 0 ? 'No vendors yet' : undefined}
                />
              </div>
              <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setIsNewVendorOpen(true)}>
                + New
              </Button>
            </div>
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

      <Dialog
        open={isNewVendorOpen}
        onClose={() => setIsNewVendorOpen(false)}
        title="New Vendor"
        description="Add a vendor that doesn't exist in your catalog yet — fill in more detail later from the Vendors page."
        className="max-w-2xl"
      >
        {/* Dialog portals to document.body, but React bubbles synthetic events through the
         * component tree regardless of DOM placement — without this, submitting the nested
         * VendorForm would also bubble up and submit the outer RawMaterialForm (and, when this
         * form is itself nested inside BomForm's own "+ New material" dialog, that one too). */}
        <div onSubmit={(e) => e.stopPropagation()}>
          <VendorForm onSubmit={handleNewVendorSubmit} isSubmitting={createVendor.isPending} submitLabel="Add vendor" />
        </div>
      </Dialog>
    </form>
  )
}
