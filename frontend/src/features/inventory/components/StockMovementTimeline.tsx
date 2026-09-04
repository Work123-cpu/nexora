import { Link } from 'react-router-dom'
import { ArrowRight, Lock, PackagePlus, PenLine, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Badge } from '@/shared/ui/Badge'
import { formatDateTime, formatNumber } from '@/shared/lib/formatters'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useAllStockMovements } from '../hooks/useInventory'

/** Recent-activity preview for the Inventory Dashboard — full history, charts, and export live at
 * /app/inventory/movements. Real data (StockMovement is logged for every PO receipt and manual
 * stock addition); this used to be a hardcoded "not tracked yet" placeholder left over from before
 * that backend support existed. */
export function StockMovementTimeline() {
  const { session } = useAuth()
  const isAdmin = session?.role === 'admin'
  const { data, isLoading } = useAllStockMovements(isAdmin)
  const movements = (data ?? []).slice(0, 6)

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Stock Movement Timeline</CardTitle>
        {isAdmin && movements.length > 0 && (
          <Link to="/app/inventory/movements" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            View all <ArrowRight className="size-3" />
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {!isAdmin ? (
          <EmptyState icon={<Lock className="size-5" />} title="Admins only" description="Stock movement history is visible to admins — see Reports if you need this." />
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">Loading movement history…</p>
        ) : movements.length === 0 ? (
          <EmptyState
            icon={<RefreshCw className="size-5" />}
            title="No stock movements yet"
            description="Receiving a purchase order or adding stock manually will show up here."
          />
        ) : (
          <ul className="space-y-3">
            {movements.map((m) => (
              <li key={m.id} className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  {m.source === 'po_receipt' ? <PackagePlus className="size-4" /> : <PenLine className="size-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{m.itemName}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(m.createdAt)}</p>
                </div>
                <Badge tone={m.source === 'po_receipt' ? 'info' : 'neutral'} className="shrink-0">
                  +{formatNumber(m.quantity)} {m.unit}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
