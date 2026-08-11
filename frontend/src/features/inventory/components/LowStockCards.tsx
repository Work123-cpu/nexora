import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/Card'
import { Badge } from '@/shared/ui/Badge'
import { ProgressBar } from '@/shared/ui/ProgressBar'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useInventoryItems } from '../hooks/useInventory'
import { useWarehouses } from '@/features/warehouse/hooks/useWarehouses'

export function LowStockCards() {
  const { data: inventoryData } = useInventoryItems({ pageSize: 10000 })
  const { data: warehousesData } = useWarehouses({ pageSize: 10000 })
  const getWarehouseById = (id: string) => warehousesData?.items.find((w) => w.id === id)
  const items = (inventoryData?.items ?? []).filter((i) => i.quantityOnHand <= i.reorderPoint).slice(0, 6)

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle2 className="size-5" />}
        title="No low-stock items"
        description="Every tracked item is currently above its reorder point."
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const isCritical = item.quantityOnHand <= item.safetyStock
        const pct = (item.quantityOnHand / item.reorderPoint) * 100
        const warehouse = getWarehouseById(item.warehouseId)
        const linkTo = item.itemType === 'rawMaterial' ? `/app/raw-materials/${item.itemId}` : `/app/products/${item.itemId}`

        return (
          <Link key={item.id} to={linkTo}>
            <Card interactive tilt className="h-full">
              <CardContent>
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold text-foreground">{item.itemName}</p>
                  <Badge tone={isCritical ? 'danger' : 'warning'}>{isCritical ? 'Critical' : 'Low'}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{warehouse?.name}</p>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {item.quantityOnHand} / {item.reorderPoint} {item.unit}
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="size-3" /> {pct.toFixed(0)}%
                    </span>
                  </div>
                  <ProgressBar value={pct} tone={isCritical ? 'danger' : 'warning'} />
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
