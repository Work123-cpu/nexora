import { Link, useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { Building2, Clock, Mail, PackageX, Pencil, Phone, Trash2 } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { StatCard } from '@/shared/ui/StatCard'
import { LoadingScreen } from '@/shared/ui/LoadingScreen'
import { EmptyState } from '@/shared/ui/EmptyState'
import { LineChartCard } from '@/shared/ui/charts/LineChartCard'
import { formatCompactCurrency, formatDate } from '@/shared/lib/formatters'
import { useVendor, useVendorPurchaseOrders } from '../hooks/useVendors'
import { VendorRatingStars } from '../components/VendorRatingStars'
import { getVendorPerformanceHistory } from '../lib/vendorPerformanceHistory'
import { DeleteVendorDialog } from '../components/DeleteVendorDialog'
import { useRawMaterials } from '@/features/raw-materials/hooks/useRawMaterials'
import { POStatusBadge } from '@/features/procurement/components/POStatusBadge'
import { RoleGuard } from '@/app/router/RoleGuard'

export function VendorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: vendor, isLoading } = useVendor(id)
  const { data: purchaseOrders } = useVendorPurchaseOrders(id)
  const { data: materialsData } = useRawMaterials({ pageSize: 10000 })
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (isLoading) return <LoadingScreen label="Loading vendor…" />
  if (!vendor) return <EmptyState icon={<PackageX className="size-5" />} title="Vendor not found" />

  // Reads each material's own primaryVendorId rather than vendor.materialsSupplied -- see
  // VendorForm.tsx for why that field is no longer the source of truth.
  const supplied = (materialsData?.items ?? []).filter((rm) => rm.primaryVendorId === vendor.id)
  const performanceHistory = getVendorPerformanceHistory(vendor)
  const totalSpend = purchaseOrders?.reduce((sum, po) => sum + po.totalAmount, 0) ?? 0

  return (
    <div>
      <PageHeader
        title={vendor.name}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Vendors', to: '/app/vendors' }, { label: vendor.name }]} />}
        actions={
          <>
            <Badge tone={vendor.status === 'active' ? 'success' : vendor.status === 'under-review' ? 'warning' : 'neutral'} className="capitalize">
              {vendor.status.replace('-', ' ')}
            </Badge>
            <RoleGuard resource="vendors" action="edit">
              <Button variant="outline" leftIcon={<Pencil className="size-4" />} onClick={() => navigate(`/app/vendors/${vendor.id}/edit`)}>
                Edit
              </Button>
            </RoleGuard>
            <RoleGuard resource="vendors" action="delete">
              <Button variant="danger" leftIcon={<Trash2 className="size-4" />} onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            </RoleGuard>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="On-Time Delivery" value={`${vendor.onTimeDeliveryPct}%`} icon={<Clock className="size-5" />} tone={vendor.onTimeDeliveryPct > 85 ? 'success' : 'warning'} />
        <StatCard label="Quality Score" value={`${vendor.qualityScorePct}%`} tone={vendor.qualityScorePct > 85 ? 'success' : 'warning'} />
        <StatCard label="Lead Time" value={`${vendor.leadTimeDays} days`} tone="primary" />
        <StatCard label="Total Spend" value={formatCompactCurrency(totalSpend)} tone="info" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card interactive className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-4" /> Vendor Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <Badge tone="neutral" className="mt-1">
                  {vendor.category}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rating</p>
                <div className="mt-1">
                  <VendorRatingStars rating={vendor.rating} />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Contracts</p>
                <p className="font-medium text-foreground">{vendor.activeContracts}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="font-medium text-foreground">
                  {vendor.city}, {vendor.country}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vendor since</p>
                <p className="font-medium text-foreground">{formatDate(vendor.createdAt)}</p>
              </div>
            </div>

            <div className="grid gap-3 rounded-xl border border-border bg-surface-elevated/50 p-4 sm:grid-cols-2">
              <p className="flex items-center gap-2 text-sm text-foreground">
                <Mail className="size-4 text-muted-foreground" /> {vendor.email}
              </p>
              <p className="flex items-center gap-2 text-sm text-foreground">
                <Phone className="size-4 text-muted-foreground" /> {vendor.phone}
              </p>
              <p className="text-sm text-muted-foreground">Contact: {vendor.contactName}</p>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Materials Supplied</p>
              {supplied.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {supplied.map((rm) => (
                    <Link key={rm.id} to={`/app/raw-materials/${rm.id}`}>
                      <Badge tone="primary">{rm.name}</Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No materials currently linked.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card interactive>
          <CardHeader>
            <CardTitle>Recent Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {purchaseOrders && purchaseOrders.length > 0 ? (
              <ul className="space-y-3">
                {purchaseOrders.slice(0, 6).map((po) => (
                  <li key={po.id}>
                    <Link to={`/app/procurement/purchase-orders/${po.id}`} className="flex items-center justify-between text-sm hover:underline">
                      <span className="font-medium text-foreground">{po.poNumber}</span>
                      <POStatusBadge status={po.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No purchase order history yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <LineChartCard
          title="Performance Analytics"
          description="On-time delivery and quality score over the last 6 months"
          data={performanceHistory}
          xKey="month"
          lines={[
            { key: 'onTimeDeliveryPct', label: 'On-Time Delivery %', colorIndex: 0 },
            { key: 'qualityScorePct', label: 'Quality Score %', colorIndex: 1 },
          ]}
        />
      </div>

      <DeleteVendorDialog vendor={confirmDelete ? vendor : null} onClose={() => setConfirmDelete(false)} onDeleted={() => navigate('/app/vendors')} />
    </div>
  )
}
