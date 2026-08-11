import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs'
import { useToast } from '@/shared/ui/Toast'
import { VendorForm } from '../components/VendorForm'
import { useCreateVendor } from '../hooks/useVendors'
import type { VendorInput } from '../services/vendorService'

export function VendorCreatePage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const createVendor = useCreateVendor()

  const handleSubmit = async (input: VendorInput) => {
    const vendor = await createVendor.mutateAsync(input)
    toast({ title: 'Vendor added', description: `"${vendor.name}" has been added.`, tone: 'success' })
    navigate(`/app/vendors/${vendor.id}`)
  }

  return (
    <div>
      <PageHeader title="Add Vendor" breadcrumbs={<Breadcrumbs items={[{ label: 'Vendors', to: '/app/vendors' }, { label: 'Add Vendor' }]} />} />
      <VendorForm onSubmit={handleSubmit} isSubmitting={createVendor.isPending} submitLabel="Add vendor" />
    </div>
  )
}
