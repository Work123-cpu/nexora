import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Boxes, Plus, Sparkles, Warehouse } from 'lucide-react'
import { Input } from '@/shared/ui/Input'
import { Select } from '@/shared/ui/Select'
import { Card, CardContent } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { Dialog } from '@/shared/ui/Dialog'
import { useToast } from '@/shared/ui/Toast'
import { useWarehouses } from '@/features/warehouse/hooks/useWarehouses'
import { useAuth } from '@/features/auth/context/AuthContext'
import { formatNumber } from '@/shared/lib/formatters'
import { resetAllMockData } from '@/mocks/resetAllMockData'
import { useWizard } from '../context/WizardContext'
import { WizardStepLayout } from '../components/WizardStepLayout'

const INDUSTRY_OPTIONS = [
  'Food & Beverage Manufacturing',
  'Furniture Manufacturing',
  'Construction Materials',
  'Automobile Parts',
  'Chemical Industries',
  'Textiles',
  'Retail & Distribution',
  'Electronics',
].map((label) => ({ label, value: label }))

const SIZE_OPTIONS = ['1-10 employees', '11-50 employees', '51-200 employees', '201-1000 employees', '1000+ employees'].map((label) => ({ label, value: label }))

/** The "clear demo data" reset only clears the frontend mock arrays — meaningless (and would be
 * misleading) once the real backend is the data source, since a fresh company registration is
 * already a blank slate in MySQL. Only show it when running against mock data. */
const USE_MOCK_BACKEND = import.meta.env.VITE_USE_MOCK_BACKEND !== 'false'

export function WelcomeStep() {
  const { next } = useWizard()
  return (
    <WizardStepLayout
      title="Welcome to Nexora"
      description="Let's set up your business in a few guided steps. This takes about 3 minutes."
      onNext={next}
      hideBack
      nextLabel="Get Started"
    >
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-10 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white">
          <Sparkles className="size-8" />
        </div>
        <p className="max-w-sm text-sm text-muted-foreground">
          Nexora will guide you through configuring your company, warehouses, products, materials, suppliers, and calendar —
          everything needed to start generating relevant AI recommendations.
        </p>
      </div>
    </WizardStepLayout>
  )
}

export function CompanyStep() {
  const { data, updateData, next, back } = useWizard()
  const { session } = useAuth()
  const { toast } = useToast()
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    if (!data.companyName && session?.user.companyName) updateData({ companyName: session.user.companyName })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const handleReset = () => {
    resetAllMockData()
    setConfirmReset(false)
    toast({ title: 'Blank slate ready', description: 'Demo data cleared — the rest of this wizard now reflects your empty workspace.', tone: 'success' })
  }

  return (
    <WizardStepLayout title="Company Information" description="Tell us a bit about your business." onNext={next} onBack={back}>
      <div className="space-y-4">
        <Input label="Company name" value={data.companyName} onChange={(e) => updateData({ companyName: e.target.value })} />
        <Select label="Industry" options={INDUSTRY_OPTIONS} value={data.industry} onChange={(e) => updateData({ industry: e.target.value })} />
        <Select label="Company size" options={SIZE_OPTIONS} value={data.companySize} onChange={(e) => updateData({ companySize: e.target.value })} />
        <p className="text-xs text-muted-foreground">
          Nexora never assumes your business type from this field alone — recommendations are always derived from your actual
          products, materials, and inventory data.
        </p>

        {USE_MOCK_BACKEND && (
          <div className="rounded-xl border border-dashed border-border p-4">
            <p className="text-sm font-medium text-foreground">Not Annapurna Foods?</p>
            <p className="mt-1 text-xs text-muted-foreground">
              The demo comes pre-loaded with sample bakery data so the app doesn't feel empty. If you're setting this up for a real,
              different company, clear it first — the next few steps will let you add your own products, materials, and warehouses
              instead.
            </p>
            <Button type="button" variant="outline" size="sm" className="mt-3" leftIcon={<AlertTriangle className="size-3.5" />} onClick={() => setConfirmReset(true)}>
              Clear demo data & start fresh
            </Button>
          </div>
        )}
      </div>

      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Clear demo data?"
        description="This cannot be undone."
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReset}>
              Clear everything
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          This removes every demo product, raw material, BOM, warehouse, vendor, and purchase order from this browser, so the rest
          of the wizard reflects a truly empty workspace ready for your own data.
        </p>
      </Dialog>
    </WizardStepLayout>
  )
}

export function WarehouseStep() {
  const { next, back } = useWizard()
  const { data } = useWarehouses({ pageSize: 10000 })
  const warehouses = data?.items ?? []
  return (
    <WizardStepLayout
      title="Warehouse Setup"
      description={warehouses.length > 0 ? "We've detected the following warehouse locations from your existing setup." : 'Add at least one warehouse to start tracking inventory.'}
      onNext={next}
      onBack={back}
    >
      {warehouses.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {warehouses.map((wh) => (
            <Card key={wh.id}>
              <CardContent className="flex items-start gap-3 py-4">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Warehouse className="size-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{wh.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {wh.city}, {wh.state} · {formatNumber(wh.capacityUnits)} unit capacity
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border py-8 text-center">
          <Warehouse className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No warehouses yet.</p>
        </div>
      )}
      <Link to="/app/inventory/warehouses/new">
        <Button type="button" variant="outline" size="sm" className="mt-4" leftIcon={<Plus className="size-3.5" />}>
          Add a warehouse
        </Button>
      </Link>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Boxes className="size-3.5" /> You can add or edit warehouses anytime from the Warehouses module.
      </p>
    </WizardStepLayout>
  )
}
