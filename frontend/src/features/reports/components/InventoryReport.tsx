import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { StatCard } from '@/shared/ui/StatCard'
import { BarChartCard } from '@/shared/ui/charts/BarChartCard'
import { DataTable, type DataTableColumn } from '@/shared/ui/DataTable'
import { Badge } from '@/shared/ui/Badge'
import { formatCompactCurrency, formatNumber } from '@/shared/lib/formatters'
import { useInventoryItems } from '@/features/inventory/hooks/useInventory'
import { useRawMaterials } from '@/features/raw-materials/hooks/useRawMaterials'
import { useProducts } from '@/features/products/hooks/useProducts'
import type { InventoryItem } from '@/types/entities/inventory'
import type { RawMaterial } from '@/types/entities/rawMaterial'
import type { Product } from '@/types/entities/product'
import { ExportMenu } from './ExportMenu'

function unitCostOf(item: InventoryItem, rawMaterials: RawMaterial[], products: Product[]): number {
  return item.itemType === 'rawMaterial'
    ? rawMaterials.find((rm) => rm.id === item.itemId)?.unitCost ?? 0
    : products.find((p) => p.id === item.itemId)?.unitCost ?? 0
}

export function InventoryReport() {
  const { data: inventoryData } = useInventoryItems({ pageSize: 10000 })
  const { data: materialsData } = useRawMaterials({ pageSize: 10000 })
  const { data: productsData } = useProducts({ pageSize: 10000 })
  const inventoryItems = inventoryData?.items ?? []
  const rawMaterials = materialsData?.items ?? []
  const products = productsData?.items ?? []

  const totalValue = inventoryItems.reduce((sum, item) => sum + item.quantityOnHand * unitCostOf(item, rawMaterials, products), 0)
  const lowStock = inventoryItems.filter((i) => i.quantityOnHand <= i.reorderPoint)
  const critical = inventoryItems.filter((i) => i.quantityOnHand <= i.safetyStock)

  const categories = Array.from(new Set(inventoryItems.map((i) => i.category)))
  const valueByCategory = categories.map((cat) => ({
    category: cat,
    value: Math.round(inventoryItems.filter((i) => i.category === cat).reduce((sum, i) => sum + i.quantityOnHand * unitCostOf(i, rawMaterials, products), 0)),
  }))

  const columns: DataTableColumn<InventoryItem>[] = [
    { key: 'itemName', header: 'Item', render: (i) => i.itemName },
    { key: 'category', header: 'Category', render: (i) => <Badge tone="neutral">{i.category}</Badge> },
    { key: 'onHand', header: 'On Hand', render: (i) => `${formatNumber(i.quantityOnHand)} ${i.unit}` },
    { key: 'reorderPoint', header: 'Reorder Point', render: (i) => `${formatNumber(i.reorderPoint)} ${i.unit}` },
    { key: 'status', header: 'Status', render: (i) => (i.quantityOnHand <= i.safetyStock ? <Badge tone="danger">Critical</Badge> : <Badge tone="warning">Low</Badge>) },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Report"
        description="Stock value, category breakdown, and low-stock exposure across all warehouses."
        actions={
          <ExportMenu
            filename="inventory-report"
            rows={inventoryItems.map((i) => ({ item: i.itemName, category: i.category, onHand: i.quantityOnHand, unit: i.unit, reorderPoint: i.reorderPoint, safetyStock: i.safetyStock }))}
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Inventory Value" value={formatCompactCurrency(totalValue)} tone="primary" />
        <StatCard label="Low Stock Items" value={formatNumber(lowStock.length)} tone="warning" />
        <StatCard label="Critical Items" value={formatNumber(critical.length)} tone="danger" />
      </div>

      <BarChartCard title="Inventory Value by Category" data={valueByCategory} xKey="category" bars={[{ key: 'value', label: 'Value (₹)' }]} />

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Items Requiring Attention</h2>
        <DataTable columns={columns} data={lowStock} rowKey={(i) => i.id} emptyTitle="No low-stock items" />
      </div>
    </div>
  )
}
