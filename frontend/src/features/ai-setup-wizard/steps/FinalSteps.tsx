import { useNavigate } from 'react-router-dom'
import { CheckCircle2, PartyPopper, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useRawMaterials } from '@/features/raw-materials/hooks/useRawMaterials'
import { useBOMs } from '@/features/bom/hooks/useBOM'
import { useWarehouses } from '@/features/warehouse/hooks/useWarehouses'
import { useVendors } from '@/features/vendors/hooks/useVendors'
import { formatNumber } from '@/shared/lib/formatters'
import { useWizard } from '../context/WizardContext'
import { WizardStepLayout } from '../components/WizardStepLayout'

export function ReviewStep() {
  const { data, next, back } = useWizard()
  const { data: productsData } = useProducts({ pageSize: 10000 })
  const { data: materialsData } = useRawMaterials({ pageSize: 10000 })
  const { data: bomsData } = useBOMs({ pageSize: 10000 })
  const { data: warehousesData } = useWarehouses({ pageSize: 10000 })
  const { data: vendorsData } = useVendors({ pageSize: 10000 })
  const products = productsData?.items ?? []
  const rawMaterials = materialsData?.items ?? []
  const billsOfMaterials = bomsData?.items ?? []
  const warehouses = warehousesData?.items ?? []
  const vendors = vendorsData?.items ?? []

  const summaryItems = [
    { label: 'Company', value: data.companyName },
    { label: 'Industry', value: data.industry },
    { label: 'Company Size', value: data.companySize },
    { label: 'Warehouses', value: `${formatNumber(warehouses.length)} locations` },
    { label: 'Products', value: `${formatNumber(products.length)} SKUs` },
    { label: 'Raw Materials', value: `${formatNumber(rawMaterials.length)} materials` },
    { label: 'Bills of Materials', value: `${formatNumber(billsOfMaterials.length)} defined` },
    { label: 'Vendors', value: `${formatNumber(vendors.length)} suppliers` },
  ]

  return (
    <WizardStepLayout title="Review Your Setup" description="Confirm everything looks right before finishing." onNext={next} onBack={back} nextLabel="Finish Setup">
      <Card>
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {summaryItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0 sm:odd:border-r sm:odd:pr-4">
                <dt className="text-muted-foreground">{item.label}</dt>
                <dd className="font-medium text-foreground">{item.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </WizardStepLayout>
  )
}

export function CompletionStep() {
  const { updateData } = useWizard()
  const navigate = useNavigate()

  const handleFinish = () => {
    updateData({ completed: true })
    navigate('/app')
  }

  return (
    <div className="flex flex-col items-center py-10 text-center">
      <div className="flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-accent text-white">
        <PartyPopper className="size-10" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-foreground">You're all set!</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Nexora is now monitoring your inventory, suppliers, and market conditions. Head to the Command Center to see your first
        recommendations.
      </p>
      <div className="mt-6 flex items-center gap-2 rounded-xl bg-primary-soft px-4 py-2.5 text-sm text-primary">
        <Sparkles className="size-4" /> Try asking Nexora: "What should I reorder this week?"
      </div>
      <Button size="lg" className="mt-8" leftIcon={<CheckCircle2 className="size-4" />} onClick={handleFinish}>
        Go to Command Center
      </Button>
    </div>
  )
}
