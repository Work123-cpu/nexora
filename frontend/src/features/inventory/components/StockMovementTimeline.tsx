import { ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { formatRelativeTime } from '@/shared/lib/formatters'
import { stockMovements } from '@/mocks/seed/stockMovements.seed'
import { cn } from '@/shared/lib/cn'

const ICONS = { inbound: ArrowDownLeft, outbound: ArrowUpRight, adjustment: RefreshCw }
const TONE = {
  inbound: 'bg-success-soft text-success',
  outbound: 'bg-info-soft text-info',
  adjustment: 'bg-warning-soft text-warning',
}

/** Flip to "false" once the backend logs real stock movements — see inventoryService.ts. */
const USE_MOCK_BACKEND = import.meta.env.VITE_USE_MOCK_BACKEND !== 'false'

export function StockMovementTimeline({ limit = 10 }: { limit?: number }) {
  const movements = USE_MOCK_BACKEND ? stockMovements.slice(0, limit) : []

  if (!USE_MOCK_BACKEND) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock Movement Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<RefreshCw className="size-5" />}
            title="Movement history not tracked yet"
            description="Stock movement logging isn't modeled in the backend yet — inventory quantities update correctly, but a per-transaction history isn't recorded."
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Movement Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-5 border-l border-border pl-5">
          {movements.map((m) => {
            const Icon = ICONS[m.type]
            return (
              <li key={m.id} className="relative">
                <span className={cn('absolute -left-[29px] flex size-6 items-center justify-center rounded-full ring-4 ring-surface', TONE[m.type])}>
                  <Icon className="size-3" />
                </span>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.itemName}</p>
                    <p className="text-xs text-muted-foreground">{m.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-sm font-semibold', m.quantity < 0 ? 'text-danger' : 'text-success')}>
                      {m.quantity > 0 ? '+' : ''}
                      {m.quantity}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{formatRelativeTime(m.date)}</p>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}
