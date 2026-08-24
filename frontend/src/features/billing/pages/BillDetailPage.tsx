import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Ban, Download, Receipt } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { LoadingScreen } from '@/shared/ui/LoadingScreen'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useToast } from '@/shared/ui/Toast'
import { formatCurrency, formatDate } from '@/shared/lib/formatters'
import { useWarehouse } from '@/features/warehouse/hooks/useWarehouses'
import { useBill, useCancelBill } from '../hooks/useBills'
import { RoleGuard } from '@/app/router/RoleGuard'

export function BillDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: bill, isLoading } = useBill(id)
  const { data: warehouse } = useWarehouse(bill?.warehouseId)
  const cancelBill = useCancelBill()
  const { toast } = useToast()
  const [isDownloading, setIsDownloading] = useState(false)

  if (isLoading) return <LoadingScreen label="Loading bill…" />
  if (!bill) return <EmptyState icon={<Receipt className="size-5" />} title="Bill not found" />

  const handleCancel = async () => {
    await cancelBill.mutateAsync(bill.id)
    toast({ title: 'Bill cancelled', description: 'Stock has been restored.', tone: 'warning' })
  }

  const handleDownloadPdf = async () => {
    setIsDownloading(true)
    try {
      const { generateBillPdf } = await import('../lib/generateBillPdf')
      await generateBillPdf(bill, warehouse?.name)
      toast({ title: 'PDF downloaded', description: `${bill.billNumber}.pdf has been downloaded.`, tone: 'success' })
    } catch {
      toast({ title: 'Could not generate PDF', description: 'Please try again.', tone: 'error' })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={bill.billNumber}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Billing', to: '/app/billing' }, { label: bill.billNumber }]} />}
        actions={
          <>
            <Button variant="outline" leftIcon={<Download className="size-4" />} onClick={handleDownloadPdf} isLoading={isDownloading}>
              Download PDF
            </Button>
            {bill.status === 'completed' && (
              <RoleGuard resource="billing" action="delete">
                <Button variant="danger" leftIcon={<Ban className="size-4" />} onClick={handleCancel} isLoading={cancelBill.isPending}>
                  Cancel Bill
                </Button>
              </RoleGuard>
            )}
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Bill Details</CardTitle>
          <Badge tone={bill.status === 'completed' ? 'success' : 'neutral'} className="capitalize">
            {bill.status}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Customer</p>
              <p className="font-medium text-foreground">{bill.customerName}</p>
            </div>
            {bill.customerEmail && (
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{bill.customerEmail}</p>
              </div>
            )}
            {bill.customerPhone && (
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium text-foreground">{bill.customerPhone}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Billed by</p>
              <p className="font-medium text-foreground">{bill.createdBy ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium text-foreground">{formatDate(bill.createdAt)}</p>
            </div>
            {bill.cancelledAt && (
              <div>
                <p className="text-xs text-muted-foreground">Cancelled on</p>
                <p className="font-medium text-foreground">{formatDate(bill.cancelledAt)}</p>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-elevated/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-left">Product</th>
                  <th className="px-4 py-2.5 text-right">Quantity</th>
                  <th className="px-4 py-2.5 text-right">Unit Price</th>
                  <th className="px-4 py-2.5 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((item) => (
                  <tr key={item.productId} className="border-t border-border">
                    <td className="px-4 py-2.5 text-foreground">{item.productName}</td>
                    <td className="px-4 py-2.5 text-right text-foreground">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">{formatCurrency(item.unitPrice, true)}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-foreground">{formatCurrency(item.lineTotal, true)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border">
                  <td colSpan={3} className="px-4 py-2 text-right text-sm text-muted-foreground">Subtotal</td>
                  <td className="px-4 py-2 text-right text-sm text-foreground">{formatCurrency(bill.subtotal, true)}</td>
                </tr>
                {bill.discountAmount > 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-sm text-muted-foreground">Discount ({bill.discountPct}%)</td>
                    <td className="px-4 py-2 text-right text-sm text-foreground">-{formatCurrency(bill.discountAmount, true)}</td>
                  </tr>
                )}
                {bill.taxAmount > 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-sm text-muted-foreground">Tax ({bill.taxPct}%)</td>
                    <td className="px-4 py-2 text-right text-sm text-foreground">+{formatCurrency(bill.taxAmount, true)}</td>
                  </tr>
                )}
                <tr className="border-t border-border bg-surface-elevated/40">
                  <td colSpan={3} className="px-4 py-2.5 text-right text-sm font-semibold text-foreground">Total</td>
                  <td className="px-4 py-2.5 text-right text-sm font-semibold text-primary">{formatCurrency(bill.totalAmount, true)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
