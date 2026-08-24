import { useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { Select } from '@/shared/ui/Select'
import { Button } from '@/shared/ui/Button'
import type { WarehouseInput } from '../services/warehouseService'
import type { Warehouse } from '@/types/entities/warehouse'

const TYPE_OPTIONS = [
  { label: 'Raw Material', value: 'raw-material' },
  { label: 'Finished Goods', value: 'finished-goods' },
  { label: 'Mixed Use', value: 'mixed' },
  { label: 'Cold Storage', value: 'cold-storage' },
]
const STATUS_OPTIONS = [
  { label: 'Operational', value: 'operational' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'At Capacity', value: 'at-capacity' },
]

type NumericField = 'capacityUnits' | 'usedUnits'
type FormState = Omit<WarehouseInput, NumericField> & Record<NumericField, number | ''>

interface WarehouseFormProps {
  initialValue?: Warehouse
  onSubmit: (input: WarehouseInput) => Promise<void>
  isSubmitting?: boolean
  submitLabel?: string
}

export function WarehouseForm({ initialValue, onSubmit, isSubmitting, submitLabel = 'Save warehouse' }: WarehouseFormProps) {
  const [form, setForm] = useState<FormState>({
    name: initialValue?.name ?? '',
    code: initialValue?.code ?? '',
    type: initialValue?.type ?? 'mixed',
    city: initialValue?.city ?? '',
    state: initialValue?.state ?? '',
    country: initialValue?.country ?? 'India',
    managerName: initialValue?.managerName ?? '',
    capacityUnits: initialValue?.capacityUnits ?? '',
    usedUnits: initialValue?.usedUnits ?? '',
    status: initialValue?.status ?? 'operational',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const capacityUnits = form.capacityUnits === '' ? 0 : form.capacityUnits
  const usedUnits = form.usedUnits === '' ? 0 : form.usedUnits

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!form.name.trim()) nextErrors.name = 'Warehouse name is required.'
    if (!form.code.trim()) nextErrors.code = 'Warehouse code is required.'
    if (capacityUnits <= 0) nextErrors.capacityUnits = 'Capacity must be greater than zero.'
    if (usedUnits > capacityUnits) nextErrors.usedUnits = 'Used units cannot exceed capacity.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    await onSubmit({ ...form, capacityUnits, usedUnits })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Warehouse name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
            <Input label="Warehouse code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} error={errors.code} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Type"
              options={TYPE_OPTIONS}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as WarehouseInput['type'] })}
            />
            <Input label="Manager name" value={form.managerName} onChange={(e) => setForm({ ...form, managerName: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            <Input label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Capacity (units)"
              type="number"
              placeholder="e.g. 10000"
              value={form.capacityUnits}
              onChange={(e) => setForm({ ...form, capacityUnits: e.target.value === '' ? '' : Number(e.target.value) })}
              error={errors.capacityUnits}
            />
            <Input
              label="Used (units)"
              type="number"
              placeholder="e.g. 0"
              value={form.usedUnits}
              onChange={(e) => setForm({ ...form, usedUnits: e.target.value === '' ? '' : Number(e.target.value) })}
              error={errors.usedUnits}
            />
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as WarehouseInput['status'] })}
            />
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
