import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Plus, Upload } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Button } from '@/shared/ui/Button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/Tabs'
import { BulkImportDialog } from '@/shared/ui/BulkImportDialog'
import { useToast } from '@/shared/ui/Toast'
import { RoleGuard } from '@/app/router/RoleGuard'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useRawMaterials } from '@/features/raw-materials/hooks/useRawMaterials'
import { useWarehouses } from '@/features/warehouse/hooks/useWarehouses'
import { useBills } from '@/features/billing/hooks/useBills'
import { useBOMs } from '@/features/bom/hooks/useBOM'
import { computeDailySalesHistory, averageDailyUsage } from '@/lib/salesHistory/computeSalesHistory'
import { computeMaterialDailyUsage } from '@/lib/salesHistory/computeMaterialDailyUsage'
import { computeLeadTimeDays, computeReorderLevels } from '@/lib/salesHistory/computeReorderLevels'
import { InventoryStatCards } from '../components/InventoryStatCards'
import { LowStockCards } from '../components/LowStockCards'
import { WarehouseCardsRow } from '../components/WarehouseCardsRow'
import { StockMovementTimeline } from '../components/StockMovementTimeline'
import { InventoryTrendsChart } from '../components/InventoryTrendsChart'
import { InventoryItemsTable } from '../components/InventoryItemsTable'
import { useCreateInventoryItem } from '../hooks/useInventory'
import { mapInventoryCsvRow, INVENTORY_CSV_TEMPLATE, type InventoryCsvInput } from '../lib/csvMapper'

export function InventoryDashboardPage() {
  const { toast } = useToast()
  const [importOpen, setImportOpen] = useState(false)
  const createInventoryItem = useCreateInventoryItem()
  const { data: productsData } = useProducts({ pageSize: 10000 })
  const { data: rawMaterialsData } = useRawMaterials({ pageSize: 10000 })
  const { data: warehousesData } = useWarehouses({ pageSize: 10000 })
  const { data: billsData } = useBills({ pageSize: 10000 })
  const { data: bomsData } = useBOMs({ pageSize: 10000 })
  const products = productsData?.items ?? []
  const rawMaterials = rawMaterialsData?.items ?? []
  const warehouses = warehousesData?.items ?? []
  const bills = billsData?.items ?? []
  const boms = bomsData?.items ?? []

  const handleImportRow = async (input: InventoryCsvInput) => {
    const catalog = input.itemType === 'product' ? products : rawMaterials
    const item = catalog.find((i) => i.name.toLowerCase() === input.itemName.toLowerCase())
    if (!item) throw new Error(`No ${input.itemType === 'product' ? 'product' : 'raw material'} named "${input.itemName}" — add it to the catalog first.`)
    const warehouse = warehouses.find((w) => w.name.toLowerCase() === input.warehouseName.toLowerCase())
    if (!warehouse) throw new Error(`No warehouse named "${input.warehouseName}" — add it first.`)

    const computedUsage =
      input.itemType === 'product'
        ? (() => {
            const series = computeDailySalesHistory(bills, item.id)
            return series ? averageDailyUsage(series) : undefined
          })()
        : computeMaterialDailyUsage(bills, boms, item.id)
    const avgDailyUsage = input.avgDailyUsage ?? (computedUsage !== undefined ? Number(computedUsage.toFixed(1)) : 0)

    let reorderPoint = input.reorderPoint
    let reorderQuantity = input.reorderQuantity
    if (reorderPoint === undefined || reorderQuantity === undefined) {
      const leadTimeDays = computeLeadTimeDays(input.itemType, item.id, rawMaterials, boms)
      const levels = computeReorderLevels(computedUsage ?? avgDailyUsage, leadTimeDays, input.safetyStock)
      reorderPoint = reorderPoint ?? levels.reorderPoint
      reorderQuantity = reorderQuantity ?? levels.reorderQuantity
    }

    return createInventoryItem.mutateAsync({
      itemType: input.itemType,
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      unit: 'unitOfMeasure' in item ? item.unitOfMeasure : item.unit,
      warehouseId: warehouse.id,
      quantityOnHand: input.quantityOnHand,
      safetyStock: input.safetyStock,
      reorderPoint,
      reorderQuantity,
      avgDailyUsage,
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Dashboard"
        description="Monitor stock health, safety stock, and reorder points across every warehouse."
        actions={
          <RoleGuard resource="inventory" action="create">
            <div className="flex items-center gap-2">
              <Button variant="outline" leftIcon={<Upload className="size-4" />} onClick={() => setImportOpen(true)}>
                Import CSV
              </Button>
              <Link to="/app/inventory/add-stock">
                <Button leftIcon={<Plus className="size-4" />}>Add Stock</Button>
              </Link>
            </div>
          </RoleGuard>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trend">Trend</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
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

          <StockMovementTimeline />

          <div>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Product Stock</h2>
            <InventoryItemsTable itemType="product" />
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Raw Material Stock</h2>
            <InventoryItemsTable itemType="rawMaterial" />
          </div>
        </TabsContent>

        <TabsContent value="trend" className="mt-6">
          <InventoryTrendsChart />
        </TabsContent>
      </Tabs>

      <BulkImportDialog<InventoryCsvInput>
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Bulk Import Inventory"
        description="Upload a CSV to start tracking stock for many items at once. The product/raw material and warehouse must already exist. Leave reorder point, reorder quantity, or avg. daily usage blank to have them forecasted automatically from sales history."
        templateFilename={INVENTORY_CSV_TEMPLATE.filename}
        templateHeaders={INVENTORY_CSV_TEMPLATE.headers}
        templateExampleRow={INVENTORY_CSV_TEMPLATE.exampleRow(warehouses[0]?.name ?? 'Main Warehouse')}
        mapRow={mapInventoryCsvRow}
        onImportRow={handleImportRow}
        onImported={(count) => toast({ title: 'Import complete', description: `${count} inventory record(s) added.`, tone: 'success' })}
      />
    </div>
  )
}
