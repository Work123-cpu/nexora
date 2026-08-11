import { useNavigate, useParams } from 'react-router-dom'
import { PackageX } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs'
import { LoadingScreen } from '@/shared/ui/LoadingScreen'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useToast } from '@/shared/ui/Toast'
import { VendorForm } from '../components/VendorForm'
import { useUpdateVendor, useVendor } from '../hooks/useVendors'
import type { VendorInput } from '../services/vendorService'

export function VendorEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: vendor, isLoading } = useVendor(id)
  const updateVendor = useUpdateVendor()

  if (isLoading) return <LoadingScreen label="Loading vendor…" />
  if (!vendor) return <EmptyState icon={<PackageX className="size-5" />} title="Vendor not found" />

  const handleSubmit = async (input: VendorInput) => {
    await updateVendor.mutateAsync({ id: vendor.id, input })
    toast({ title: 'Vendor updated', description: `"${input.name}" has been saved.`, tone: 'success' })
    navigate(`/app/vendors/${vendor.id}`)
  }

  return (
    <div>
      <PageHeader
        title={`Edit ${vendor.name}`}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Vendors', to: '/app/vendors' }, { label: vendor.name, to: `/app/vendors/${vendor.id}` }, { label: 'Edit' }]} />}
      />
      <VendorForm initialValue={vendor} onSubmit={handleSubmit} isSubmitting={updateVendor.isPending} submitLabel="Save changes" />
    </div>
  )
}
