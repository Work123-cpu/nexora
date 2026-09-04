import { useState, type FormEvent } from 'react'
import { Check, Save } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { Select } from '@/shared/ui/Select'
import { CategorySelect } from '@/shared/ui/CategorySelect'
import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/lib/cn'
import { useRawMaterials } from '@/features/raw-materials/hooks/useRawMaterials'
import type { VendorInput } from '../services/vendorService'
import type { Vendor } from '@/types/entities/vendor'
import { VENDOR_CATEGORIES } from '../constants'

const CATEGORY_OPTIONS = VENDOR_CATEGORIES
const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Under Review', value: 'under-review' },
  { label: 'Inactive', value: 'inactive' },
]

type NumericField = 'rating' | 'onTimeDeliveryPct' | 'qualityScorePct' | 'leadTimeDays' | 'activeContracts'
type FormState = Omit<VendorInput, NumericField> & Record<NumericField, number | ''>

interface VendorFormProps {
  initialValue?: Vendor
  onSubmit: (input: VendorInput) => Promise<void>
  isSubmitting?: boolean
  submitLabel?: string
}

const PERFORMANCE_HINT = 'Starting estimate for a new vendor — adjust it later as you track their actual performance.'
const LEAD_TIME_HINT = 'Typical days between placing an order with this vendor and receiving it — used to time reorders.'

export function VendorForm({ initialValue, onSubmit, isSubmitting, submitLabel = 'Save vendor' }: VendorFormProps) {
  const { data: materialsData } = useRawMaterials({ pageSize: 10000 })
  const rawMaterials = materialsData?.items ?? []
  const [form, setForm] = useState<FormState>({
    name: initialValue?.name ?? '',
    category: initialValue?.category ?? '',
    contactName: initialValue?.contactName ?? '',
    email: initialValue?.email ?? '',
    phone: initialValue?.phone ?? '',
    city: initialValue?.city ?? '',
    country: initialValue?.country ?? 'India',
    rating: initialValue?.rating ?? '',
    onTimeDeliveryPct: initialValue?.onTimeDeliveryPct ?? '',
    qualityScorePct: initialValue?.qualityScorePct ?? '',
    leadTimeDays: initialValue?.leadTimeDays ?? '',
    activeContracts: initialValue?.activeContracts ?? '',
    status: initialValue?.status ?? 'active',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Which materials this vendor supplies is read straight from the materials themselves (each
  // one's own "Primary vendor" field) rather than a second, separately-editable list here that
  // could say something different from reality — set/change it on the raw material's own edit
  // page and this list updates on its own. Empty for a brand-new vendor since no material could
  // point at an id that doesn't exist yet.
  const suppliedMaterials = initialValue ? rawMaterials.filter((rm) => rm.primaryVendorId === initialValue.id) : []

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!form.name.trim()) nextErrors.name = 'Vendor name is required.'
    if (!form.category.trim()) nextErrors.category = 'Category is required — type a new one to add it.'
    if (!form.email.trim()) nextErrors.email = 'Contact email is required.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    await onSubmit({
      ...form,
      rating: form.rating === '' ? 0 : form.rating,
      onTimeDeliveryPct: form.onTimeDeliveryPct === '' ? 0 : form.onTimeDeliveryPct,
      qualityScorePct: form.qualityScorePct === '' ? 0 : form.qualityScorePct,
      leadTimeDays: form.leadTimeDays === '' ? 0 : form.leadTimeDays,
      activeContracts: form.activeContracts === '' ? 0 : form.activeContracts,
    })
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
              error={errors.category}
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
              placeholder="e.g. 95"
              hint={PERFORMANCE_HINT}
              value={form.onTimeDeliveryPct}
              onChange={(e) => setForm({ ...form, onTimeDeliveryPct: e.target.value === '' ? '' : Number(e.target.value) })}
            />
            <Input
              label="Quality score (%)"
              type="number"
              placeholder="e.g. 90"
              hint={PERFORMANCE_HINT}
              value={form.qualityScorePct}
              onChange={(e) => setForm({ ...form, qualityScorePct: e.target.value === '' ? '' : Number(e.target.value) })}
            />
            <Input
              label="Lead time (days)"
              type="number"
              placeholder="e.g. 7"
              hint={LEAD_TIME_HINT}
              value={form.leadTimeDays}
              onChange={(e) => setForm({ ...form, leadTimeDays: e.target.value === '' ? '' : Number(e.target.value) })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Rating (0-5)"
              type="number"
              step="0.1"
              min={0}
              max={5}
              placeholder="e.g. 4"
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: e.target.value === '' ? '' : Number(e.target.value) })}
            />
            <Input
              label="Active contracts"
              type="number"
              placeholder="e.g. 2"
              value={form.activeContracts}
              onChange={(e) => setForm({ ...form, activeContracts: e.target.value === '' ? '' : Number(e.target.value) })}
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
            <CardDescription className="mt-1">
              Automatic — reflects each material's own "Primary vendor" field. To add or remove one, set it from that
              material's edit page instead of here.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {rawMaterials.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">No raw materials in the catalog yet.</p>
          ) : (
            <>
              {initialValue && suppliedMaterials.length === 0 && (
                <p className="mb-2 text-xs text-muted-foreground">No raw materials list this vendor as their primary supplier yet.</p>
              )}
              <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto rounded-xl border border-border p-3 sm:grid-cols-2">
                {rawMaterials.map((rm) => {
                  const supplied = rm.primaryVendorId === initialValue?.id
                  return (
                    <div
                      key={rm.id}
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors',
                        supplied ? 'bg-primary-soft text-foreground' : 'text-muted-foreground opacity-50',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-4.5 shrink-0 items-center justify-center rounded-full border',
                          supplied ? 'border-primary bg-primary' : 'border-border-strong',
                        )}
                      >
                        {supplied && <Check className="size-3 text-primary-foreground" strokeWidth={3} />}
                      </span>
                      {rm.name} ({rm.code})
                    </div>
                  )
                })}
              </div>
            </>
          )}
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
