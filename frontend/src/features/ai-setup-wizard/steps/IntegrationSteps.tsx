import { Link } from 'react-router-dom'
import { CalendarDays, CheckCircle2, CreditCard, Plus, Truck } from 'lucide-react'
import { StatCard } from '@/shared/ui/StatCard'
import { RadioGroup } from '@/shared/ui/RadioGroup'
import { Checkbox } from '@/shared/ui/Checkbox'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useVendors } from '@/features/vendors/hooks/useVendors'
import { useCalendarEvents } from '@/features/business-calendar/hooks/useCalendarEvents'
import { formatNumber } from '@/shared/lib/formatters'
import { useWizard } from '../context/WizardContext'
import { WizardStepLayout } from '../components/WizardStepLayout'

export function SuppliersStep() {
  const { next, back } = useWizard()
  const { data } = useVendors({ pageSize: 10000 })
  const vendors = data?.items ?? []
  return (
    <WizardStepLayout
      title="Suppliers"
      description={vendors.length > 0 ? 'Vendor relationships already configured in your workspace.' : 'Add the vendors you buy raw materials from.'}
      onNext={next}
      onBack={back}
    >
      {vendors.length === 0 ? (
        <EmptyState
          icon={<Truck className="size-5" />}
          title="No suppliers yet"
          description="Add at least one vendor before raw materials can reference a primary supplier."
          action={
            <Link to="/app/vendors/new">
              <Button type="button" variant="outline" size="sm" leftIcon={<Plus className="size-3.5" />}>
                Add a vendor
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard label="Total Vendors" value={formatNumber(vendors.length)} icon={<Truck className="size-5" />} tone="primary" />
            <StatCard label="Active" value={formatNumber(vendors.filter((v) => v.status === 'active').length)} tone="success" />
            <StatCard label="Under Review" value={formatNumber(vendors.filter((v) => v.status === 'under-review').length)} tone="warning" />
          </div>
          <Link to="/app/vendors/new">
            <Button type="button" variant="outline" size="sm" className="mt-4" leftIcon={<Plus className="size-3.5" />}>
              Add another vendor
            </Button>
          </Link>
        </>
      )}
    </WizardStepLayout>
  )
}

const BILLING_OPTIONS = [
  { label: 'None — I\'ll set this up later', value: 'none', description: 'Skip billing integration for now.' },
  { label: 'Excel / CSV Import', value: 'excel', description: 'Import billing and sales data via spreadsheet.' },
  { label: 'REST API', value: 'api', description: 'Connect a billing system via API (Stripe, QuickBooks, etc.).' },
  { label: 'Database Connection', value: 'database', description: 'Connect directly to an existing billing database.' },
]

export function BillingStep() {
  const { data, updateData, next, back } = useWizard()
  return (
    <WizardStepLayout
      title="Billing Integration"
      description="Nexora supports universal billing integration — choose how you'd like to connect, or skip for now."
      onNext={next}
      onBack={back}
    >
      <div className="flex items-center gap-2 rounded-xl bg-info-soft p-3 text-xs text-foreground">
        <CreditCard className="size-4 text-info" />
        Billing integration is optional and does not block the rest of setup.
      </div>
      <div className="mt-4">
        <RadioGroup name="billing" value={data.billingProvider} onChange={(value) => updateData({ billingProvider: value })} options={BILLING_OPTIONS} />
      </div>
    </WizardStepLayout>
  )
}

export function CalendarStep() {
  const { data, updateData, next, back } = useWizard()
  const { data: calendarEventsData } = useCalendarEvents()
  const calendarEvents = calendarEventsData ?? []
  return (
    <WizardStepLayout title="Business Calendar" description="We've pre-loaded common holidays and maintenance windows." onNext={next} onBack={back}>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Events" value={formatNumber(calendarEvents.length)} icon={<CalendarDays className="size-5" />} tone="primary" />
      </div>
      <div className="mt-4">
        <Checkbox
          label="I've reviewed the business calendar and will add company-specific holidays later"
          checked={data.acknowledgedCalendar}
          onChange={(e) => updateData({ acknowledgedCalendar: e.target.checked })}
        />
      </div>
      {data.acknowledgedCalendar && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-success">
          <CheckCircle2 className="size-3.5" /> Noted — you can manage this anytime from Business Calendar.
        </p>
      )}
    </WizardStepLayout>
  )
}
