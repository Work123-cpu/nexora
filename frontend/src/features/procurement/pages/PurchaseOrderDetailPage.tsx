import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Ban, Check, Download, PackageX, Truck } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { LoadingScreen } from '@/shared/ui/LoadingScreen'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useToast } from '@/shared/ui/Toast'
import { formatCurrency, formatDate } from '@/shared/lib/formatters'
import { useVendor } from '@/features/vendors/hooks/useVendors'
import { usePurchaseOrder, useAdvancePurchaseOrder } from '../hooks/usePurchaseOrders'
import { purchaseOrderService } from '../services/purchaseOrderService'
import { POStatusBadge } from '../components/POStatusBadge'
import { POTimeline } from '../components/POTimeline'
import { useAuth } from '@/features/auth/context/AuthContext'
import { RoleGuard } from '@/app/router/RoleGuard'

const NEXT_ACTION_LABEL: Record<string, string> = {
  approved: 'Approve',
  ordered: 'Mark as Ordered',
  in_transit: 'Mark In Transit',
  received: 'Mark as Received',
}

export function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: po, isLoading } = usePurchaseOrder(id)
  const { data: vendor } = useVendor(po?.vendorId)
  const advance = useAdvancePurchaseOrder()
  const { toast } = useToast()
  const { session } = useAuth()

  if (isLoading) return <LoadingScreen label="Loading purchase order…" />
  if (!po) return <EmptyState icon={<PackageX className="size-5" />} title="Purchase order not found" />

  const nextStage = purchaseOrderService.getNextStage(po.status)
  const canAct = po.status !== 'received' && po.status !== 'cancelled'

  const handleAdvance = async () => {
    if (!nextStage) return
    await advance.mutateAsync({
      id: po.id,
      status: nextStage,
      approvedBy: nextStage === 'approved' ? session?.user.name : undefined,
    })
    toast({ title: `PO ${nextStage === 'approved' ? 'approved' : 'updated'}`, description: `${po.poNumber} is now ${nextStage.replace('_', ' ')}.`, tone: 'success' })
  }

  const handleCancel = async () => {
    await advance.mutateAsync({ id: po.id, status: 'cancelled', note: 'Cancelled by user' })
    toast({ title: 'Purchase order cancelled', tone: 'warning' })
  }

  const handleDownloadPdf = async () => {
    const rows = po.items.map((item) => ({
      material: item.rawMaterialName,
      quantity: `${item.quantity} ${item.unit}`,
      unitCost: formatCurrency(item.unitCost, true),
      subtotal: formatCurrency(item.quantity * item.unitCost, true),
    }))
    const { exportToPdf } = await import('@/shared/lib/exportPdf')
    exportToPdf(po.poNumber, rows, `Purchase Order ${po.poNumber} — ${vendor?.name ?? ''}`)
    toast({ title: 'PDF downloaded', description: `${po.poNumber}.pdf has been downloaded.`, tone: 'success' })
  }

  return (
    <div>
      <PageHeader
        title={po.poNumber}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Purchase Orders', to: '/app/procurement/purchase-orders' }, { label: po.poNumber }]} />}
        actions={
          <>
            <Button variant="outline" leftIcon={<Download className="size-4" />} onClick={handleDownloadPdf}>
              Download PDF
            </Button>
            {canAct && (
              <RoleGuard resource="purchase-orders" action="edit">
                <Button variant="outline" leftIcon={<Ban className="size-4" />} onClick={handleCancel} isLoading={advance.isPending}>
                  Cancel
                </Button>
                {nextStage && nextStage === 'approved' ? (
                  <RoleGuard resource="purchase-orders" action="approve">
                    <Button leftIcon={<Check className="size-4" />} onClick={handleAdvance} isLoading={advance.isPending}>
                      {NEXT_ACTION_LABEL[nextStage]}
                    </Button>
                  </RoleGuard>
                ) : (
                  nextStage && (
                    <Button leftIcon={<Truck className="size-4" />} onClick={handleAdvance} isLoading={advance.isPending}>
                      {NEXT_ACTION_LABEL[nextStage] ?? 'Advance'}
                    </Button>
                  )
                )}
              </RoleGuard>
            )}
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
                  <p className="text-xs text-muted-foreground">Vendor</p>
                  <Link to={`/app/vendors/${po.vendorId}`} className="font-medium text-primary hover:underline">
                    {vendor?.name ?? 'Unknown'}
                  </Link>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created by</p>
                  <p className="font-medium text-foreground">{po.createdBy}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expected delivery</p>
                  <p className="font-medium text-foreground">{formatDate(po.expectedDeliveryDate)}</p>
                </div>
                {po.approvedBy && (
                  <div>
                    <p className="text-xs text-muted-foreground">Approved by</p>
                    <p className="font-medium text-foreground">{po.approvedBy}</p>
                  </div>
                )}
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
