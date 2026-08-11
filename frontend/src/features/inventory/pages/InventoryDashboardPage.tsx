import { Link } from 'react-router-dom'
import { ArrowRight, Plus } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Button } from '@/shared/ui/Button'
import { RoleGuard } from '@/app/router/RoleGuard'
import { InventoryStatCards } from '../components/InventoryStatCards'
import { LowStockCards } from '../components/LowStockCards'
import { WarehouseCardsRow } from '../components/WarehouseCardsRow'
import { StockMovementTimeline } from '../components/StockMovementTimeline'
import { InventoryTrendsChart } from '../components/InventoryTrendsChart'
import { InventoryItemsTable } from '../components/InventoryItemsTable'

export function InventoryDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Dashboard"
        description="Monitor stock health, safety stock, and reorder points across every warehouse."
        actions={
          <RoleGuard resource="inventory" action="create">
            <Link to="/app/inventory/add-stock">
              <Button leftIcon={<Plus className="size-4" />}>Add Stock</Button>
            </Link>
          </RoleGuard>
        }
      />

      <InventoryStatCards />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Low Stock Items</h2>
          <Link to="/app/procurement/recommendations" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            View procurement recommendations <ArrowRight className="size-3" />
          </Link>
        </div>
        <LowStockCards />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Warehouses</h2>
        <WarehouseCardsRow />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <InventoryTrendsChart />
        <StockMovementTimeline />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">All Inventory Items</h2>
        <InventoryItemsTable />
      </div>
    </div>
  )
}
