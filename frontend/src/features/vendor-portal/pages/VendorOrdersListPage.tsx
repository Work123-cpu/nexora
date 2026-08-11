import { Link } from 'react-router-dom'
import { PackageSearch } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Card, CardContent } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { LoadingScreen } from '@/shared/ui/LoadingScreen'
import { formatCurrency, formatDate } from '@/shared/lib/formatters'
import { usePurchaseOrders } from '@/features/procurement/hooks/usePurchaseOrders'
import { POStatusBadge } from '@/features/procurement/components/POStatusBadge'
import { useVendorAuth } from '../context/VendorAuthContext'

export function VendorOrdersListPage() {
  const { vendor } = useVendorAuth()
  const { data, isLoading } = usePurchaseOrders({ vendorId: vendor?.id, pageSize: 50, sortBy: 'createdAt', sortDir: 'desc' })

  if (isLoading) return <LoadingScreen label="Loading your orders…" />

  const orders = data?.items ?? []

  return (
    <div>
      <PageHeader title="My Orders" description={`Purchase orders raised against ${vendor?.name ?? 'your company'}.`} />

      {orders.length === 0 ? (
        <EmptyState icon={<PackageSearch className="size-5" />} title="No purchase orders yet" description="New orders raised against you will appear here." />
      ) : (
        <div className="space-y-3">
          {orders.map((po) => (
            <Link key={po.id} to={`/vendor-portal/orders/${po.id}`}>
              <Card interactive>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{po.poNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      Created {formatDate(po.createdAt)} · Expected {formatDate(po.expectedDeliveryDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(po.totalAmount, true)}</p>
                    <POStatusBadge status={po.status} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
