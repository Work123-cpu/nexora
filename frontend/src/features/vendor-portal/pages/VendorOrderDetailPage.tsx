import { useParams } from 'react-router-dom'
import { CheckCircle2, Download, PackageX, Truck } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { LoadingScreen } from '@/shared/ui/LoadingScreen'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useToast } from '@/shared/ui/Toast'
import { formatCurrency, formatDate } from '@/shared/lib/formatters'
import { exportToPdf } from '@/shared/lib/exportPdf'
import { usePurchaseOrder, useAdvancePurchaseOrder } from '@/features/procurement/hooks/usePurchaseOrders'
import { POStatusBadge } from '@/features/procurement/components/POStatusBadge'
import { POTimeline } from '@/features/procurement/components/POTimeline'
import { useVendorAuth } from '../context/VendorAuthContext'

export function VendorOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { vendor } = useVendorAuth()
  const { data: po, isLoading } = usePurchaseOrder(id)
  const advance = useAdvancePurchaseOrder()
  const { toast } = useToast()

  if (isLoading) return <LoadingScreen label="Loading order…" />
  if (!po || po.vendorId !== vendor?.id) {
    return <EmptyState icon={<PackageX className="size-5" />} title="Order not found" description="This order doesn't exist or isn't assigned to your company." />
  }

  const handleAcknowledge = async () => {
    await advance.mutateAsync({ id: po.id, status: 'ordered', note: `Acknowledged by ${vendor.name}` })
    toast({ title: 'Order acknowledged', description: `${po.poNumber} marked as ordered.`, tone: 'success' })
  }

  const handleMarkShipped = async () => {
    await advance.mutateAsync({ id: po.id, status: 'in_transit', note: `Shipped by ${vendor.name}` })
    toast({ title: 'Order marked shipped', description: `${po.poNumber} is now in transit.`, tone: 'success' })
  }

  const handleDownloadPdf = () => {
    const rows = po.items.map((item) => ({
      material: item.rawMaterialName,
      quantity: `${item.quantity} ${item.unit}`,
      unitCost: formatCurrency(item.unitCost, true),
      subtotal: formatCurrency(item.quantity * item.unitCost, true),
    }))
    exportToPdf(po.poNumber, rows, `Purchase Order ${po.poNumber}`)
    toast({ title: 'PDF downloaded', description: `${po.poNumber}.pdf has been downloaded.`, tone: 'success' })
  }

  return (
    <div>
      <PageHeader
        title={po.poNumber}
        breadcrumbs={<Breadcrumbs items={[{ label: 'My Orders', to: '/vendor-portal' }, { label: po.poNumber }]} />}
        actions={
          <>
            <Button variant="outline" leftIcon={<Download className="size-4" />} onClick={handleDownloadPdf}>
              Download PDF
            </Button>
            {po.status === 'approved' ? (
              <Button leftIcon={<CheckCircle2 className="size-4" />} onClick={handleAcknowledge} isLoading={advance.isPending}>
                Acknowledge Order
              </Button>
            ) : po.status === 'ordered' ? (
              <Button leftIcon={<Truck className="size-4" />} onClick={handleMarkShipped} isLoading={advance.isPending}>
                Mark Shipped
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
              <POStatusBadge status={po.status} />
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Expected delivery</p>
                  <p className="font-medium text-foreground">{formatDate(po.expectedDeliveryDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created on</p>
                  <p className="font-medium text-foreground">{formatDate(po.createdAt)}</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-surface-elevated/60 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Material</th>
                      <th className="px-4 py-2.5 text-right">Quantity</th>
                      <th className="px-4 py-2.5 text-right">Unit Cost</th>
                      <th className="px-4 py-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {po.items.map((item) => (
                      <tr key={item.rawMaterialId} className="border-t border-border">
                        <td className="px-4 py-2.5 text-foreground">{item.rawMaterialName}</td>
                        <td className="px-4 py-2.5 text-right text-foreground">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground">{formatCurrency(item.unitCost, true)}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-foreground">{formatCurrency(item.quantity * item.unitCost, true)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-surface-elevated/40">
                      <td colSpan={3} className="px-4 py-2.5 text-right text-sm font-semibold text-foreground">
                        Total
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm font-semibold text-primary">{formatCurrency(po.totalAmount, true)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Status Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <POTimeline timeline={po.timeline} currentStatus={po.status} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
