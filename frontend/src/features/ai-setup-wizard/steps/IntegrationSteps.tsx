import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, CheckCircle2, Plus, Truck } from 'lucide-react'
import { StatCard } from '@/shared/ui/StatCard'
import { Checkbox } from '@/shared/ui/Checkbox'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useVendors } from '@/features/vendors/hooks/useVendors'
import { useCalendarEvents } from '@/features/business-calendar/hooks/useCalendarEvents'
import { formatNumber } from '@/shared/lib/formatters'
import { getCompanyConfig, setCompanyConfig } from '@/shared/lib/companyConfig'
import { apiClient } from '@/shared/lib/apiClient'
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

/** Optional and skippable — Continue always proceeds whether or not a key was entered. Keys are
 * only saved (best-effort) when at least one field has a value, mirroring Settings' own save flow
 * so this step is just a shortcut to it, not a second source of truth. */
export function MarketIntelligenceStep() {
  const { next, back } = useWizard()
  const [company, setCompany] = useState(() => getCompanyConfig())
  const [isSaving, setIsSaving] = useState(false)
  const hasAKey = Boolean(company.alphaVantageApiKey || company.dataGovInApiKey)

  const handleNext = async () => {
    if (hasAKey) {
      setIsSaving(true)
      setCompanyConfig(company)
      try {
        await apiClient.put('/company/settings', { alphaVantageApiKey: company.alphaVantageApiKey, dataGovInApiKey: company.dataGovInApiKey })
      } catch {
        // Best-effort — don't block the wizard on a sync failure; Settings can retry later.
      } finally {
        setIsSaving(false)
      }
    }
    next()
  }

  return (
    <WizardStepLayout
      title="Market Intelligence"
      description="Optional — add free API keys to power automatic price tracking for your raw materials. Skip this and add them anytime from Settings."
      onNext={handleNext}
      onBack={back}
      nextLabel={hasAKey ? 'Save & continue' : 'Skip for now'}
      nextDisabled={isSaving}
    >
      <div className="space-y-4">
        <Input
          label="Alpha Vantage API key (optional)"
          type="password"
          value={company.alphaVantageApiKey}
          onChange={(e) => setCompany((prev) => ({ ...prev, alphaVantageApiKey: e.target.value }))}
          placeholder="Paste your free key here"
          autoComplete="off"
        />
        <Input
          label="data.gov.in API key (optional)"
          type="password"
          value={company.dataGovInApiKey}
          onChange={(e) => setCompany((prev) => ({ ...prev, dataGovInApiKey: e.target.value }))}
          placeholder="Paste your free key here"
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          Get a free Alpha Vantage key at{' '}
          <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noreferrer" className="text-primary hover:underline">
            alphavantage.co
          </a>
          , or a free data.gov.in key at{' '}
          <a href="https://data.gov.in/user/register" target="_blank" rel="noreferrer" className="text-primary hover:underline">
            data.gov.in
          </a>
          . Materials without a key still show an AI-estimated trend instead of no data at all.
        </p>
      </div>
    </WizardStepLayout>
  )
}
