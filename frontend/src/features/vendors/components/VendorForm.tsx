import { useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { Select } from '@/shared/ui/Select'
import { CategorySelect } from '@/shared/ui/CategorySelect'
import { Checkbox } from '@/shared/ui/Checkbox'
import { Button } from '@/shared/ui/Button'
import { vendors } from '@/mocks/seed/vendors.seed'
import { useRawMaterials } from '@/features/raw-materials/hooks/useRawMaterials'
import type { VendorInput } from '../services/vendorService'
import type { Vendor } from '@/types/entities/vendor'

const CATEGORY_OPTIONS = Array.from(new Set(vendors.map((v) => v.category)))
const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Under Review', value: 'under-review' },
  { label: 'Inactive', value: 'inactive' },
]

interface VendorFormProps {
  initialValue?: Vendor
  onSubmit: (input: VendorInput) => Promise<void>
  isSubmitting?: boolean
  submitLabel?: string
}

export function VendorForm({ initialValue, onSubmit, isSubmitting, submitLabel = 'Save vendor' }: VendorFormProps) {
  const { data: materialsData } = useRawMaterials({ pageSize: 10000 })
  const rawMaterials = materialsData?.items ?? []
  const [form, setForm] = useState<VendorInput>({
    name: initialValue?.name ?? '',
    category: initialValue?.category ?? CATEGORY_OPTIONS[0] ?? 'Grains',
    contactName: initialValue?.contactName ?? '',
    email: initialValue?.email ?? '',
    phone: initialValue?.phone ?? '',
    city: initialValue?.city ?? '',
    country: initialValue?.country ?? 'India',
    rating: initialValue?.rating ?? 4,
    onTimeDeliveryPct: initialValue?.onTimeDeliveryPct ?? 90,
    qualityScorePct: initialValue?.qualityScorePct ?? 90,
    leadTimeDays: initialValue?.leadTimeDays ?? 5,
    activeContracts: initialValue?.activeContracts ?? 0,
    materialsSupplied: initialValue?.materialsSupplied ?? [],
    status: initialValue?.status ?? 'active',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const toggleMaterial = (id: string) => {
    setForm((prev) => ({
      ...prev,
      materialsSupplied: prev.materialsSupplied.includes(id)
        ? prev.materialsSupplied.filter((m) => m !== id)
        : [...prev.materialsSupplied, id],
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!form.name.trim()) nextErrors.name = 'Vendor name is required.'
    if (!form.email.trim()) nextErrors.email = 'Contact email is required.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    await onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Vendor name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
            <CategorySelect
              storageKey="vendor-categories"
              defaults={CATEGORY_OPTIONS}
              value={form.category}
              onChange={(category) => setForm({ ...form, category })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Contact name" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="On-time delivery (%)"
              type="number"
              value={form.onTimeDeliveryPct}
              onChange={(e) => setForm({ ...form, onTimeDeliveryPct: Number(e.target.value) })}
            />
            <Input
              label="Quality score (%)"
              type="number"
              value={form.qualityScorePct}
              onChange={(e) => setForm({ ...form, qualityScorePct: Number(e.target.value) })}
            />
            <Input
              label="Lead time (days)"
              type="number"
              value={form.leadTimeDays}
              onChange={(e) => setForm({ ...form, leadTimeDays: Number(e.target.value) })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Rating (0-5)"
              type="number"
              step="0.1"
              min={0}
              max={5}
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
            />
            <Input
              label="Active contracts"
              type="number"
              value={form.activeContracts}
              onChange={(e) => setForm({ ...form, activeContracts: Number(e.target.value) })}
            />
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as VendorInput['status'] })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Materials Supplied</CardTitle>
            <CardDescription className="mt-1">Select which raw materials this vendor supplies.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto rounded-xl border border-border p-3 sm:grid-cols-2">
            {rawMaterials.map((rm) => (
              <Checkbox
                key={rm.id}
                label={`${rm.name} (${rm.code})`}
                checked={form.materialsSupplied.includes(rm.id)}
                onChange={() => toggleMaterial(rm.id)}
              />
            ))}
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
