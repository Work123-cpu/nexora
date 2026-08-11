import { Link } from 'react-router-dom'
import { ArrowRight, Warehouse as WarehouseIcon } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/Card'
import { ProgressBar } from '@/shared/ui/ProgressBar'
import { Badge } from '@/shared/ui/Badge'
import { useWarehouses } from '@/features/warehouse/hooks/useWarehouses'
import { formatNumber } from '@/shared/lib/formatters'

export function WarehouseCardsRow() {
  const { data } = useWarehouses({ pageSize: 10000 })
  const warehouses = data?.items ?? []

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {warehouses.map((wh) => {
        const pct = (wh.usedUnits / wh.capacityUnits) * 100
        return (
          <Card key={wh.id} interactive tilt>
            <CardContent>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <WarehouseIcon className="size-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{wh.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {wh.city}, {wh.state}
                    </p>
                  </div>
                </div>
                <Badge tone={wh.status === 'operational' ? 'success' : wh.status === 'at-capacity' ? 'danger' : 'warning'} className="capitalize">
                  {wh.status.replace('-', ' ')}
                </Badge>
              </div>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>{formatNumber(wh.usedUnits)} used</span>
                  <span>{formatNumber(wh.capacityUnits)} capacity</span>
                </div>
                <ProgressBar value={pct} tone={pct > 90 ? 'danger' : pct > 75 ? 'warning' : 'success'} />
              </div>
              <Link to={`/app/inventory/warehouses/${wh.id}`} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                View warehouse <ArrowRight className="size-3" />
              </Link>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
