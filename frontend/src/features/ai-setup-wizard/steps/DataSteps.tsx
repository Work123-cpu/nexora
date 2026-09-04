import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Boxes, ListTree, Package, Plus, Upload, Warehouse } from 'lucide-react'
import { StatCard } from '@/shared/ui/StatCard'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Button } from '@/shared/ui/Button'
import { BulkImportDialog } from '@/shared/ui/BulkImportDialog'
import { useToast } from '@/shared/ui/Toast'
import { PRODUCT_CATEGORIES } from '@/features/products/constants'
import { formatNumber } from '@/shared/lib/formatters'
import { useCreateProduct, useProducts } from '@/features/products/hooks/useProducts'
import type { ProductInput } from '@/features/products/services/productService'
import { mapProductCsvRow, PRODUCT_CSV_TEMPLATE } from '@/features/products/lib/csvMapper'
import { useCreateRawMaterial, useRawMaterials } from '@/features/raw-materials/hooks/useRawMaterials'
import { mapRawMaterialCsvRow, RAW_MATERIAL_CSV_TEMPLATE, type RawMaterialCsvInput } from '@/features/raw-materials/lib/csvMapper'
import { useVendors, useCreateVendor } from '@/features/vendors/hooks/useVendors'
import { useBOMs } from '@/features/bom/hooks/useBOM'
import { useWarehouses } from '@/features/warehouse/hooks/useWarehouses'
import { useBills } from '@/features/billing/hooks/useBills'
import { useInventoryItems, useCreateInventoryItem } from '@/features/inventory/hooks/useInventory'
import { mapInventoryCsvRow, INVENTORY_CSV_TEMPLATE, type InventoryCsvInput } from '@/features/inventory/lib/csvMapper'
import { computeDailySalesHistory, averageDailyUsage } from '@/lib/salesHistory/computeSalesHistory'
import { computeMaterialDailyUsage } from '@/lib/salesHistory/computeMaterialDailyUsage'
import { computeLeadTimeDays, computeReorderLevels } from '@/lib/salesHistory/computeReorderLevels'
import { useWizard } from '../context/WizardContext'
import { WizardStepLayout } from '../components/WizardStepLayout'

export function ProductsStep() {
  const { next, back } = useWizard()
  const { toast } = useToast()
  const [importOpen, setImportOpen] = useState(false)
  const createProduct = useCreateProduct()
  const { data } = useProducts({ pageSize: 10000 })
  const products = data?.items ?? []

  return (
    <WizardStepLayout
      title="Products"
      description={products.length > 0 ? 'Your product catalog is already configured.' : 'Add your product catalog — one at a time or in bulk via CSV.'}
      onNext={next}
      onBack={back}
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Products" value={formatNumber(products.length)} icon={<Package className="size-5" />} tone="primary" />
        <StatCard label="Categories" value={formatNumber(PRODUCT_CATEGORIES.length)} tone="info" />
        <StatCard label="Active" value={formatNumber(products.filter((p) => p.status === 'active').length)} tone="success" />
        <StatCard label="With BOM" value={formatNumber(products.filter((p) => p.hasBOM).length)} tone="warning" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/app/products/new">
          <Button type="button" variant="outline" size="sm" leftIcon={<Plus className="size-3.5" />}>
            Add a product manually
          </Button>
        </Link>
        <Button type="button" variant="outline" size="sm" leftIcon={<Upload className="size-3.5" />} onClick={() => setImportOpen(true)}>
          Bulk import CSV
        </Button>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Manage the full catalog anytime from the Products module.</p>

      <BulkImportDialog<ProductInput>
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Bulk Import Products"
        description="Upload a CSV to add many products at once."
        templateFilename={PRODUCT_CSV_TEMPLATE.filename}
        templateHeaders={PRODUCT_CSV_TEMPLATE.headers}
        templateExampleRow={PRODUCT_CSV_TEMPLATE.exampleRow(PRODUCT_CATEGORIES[0] ?? 'General')}
        mapRow={mapProductCsvRow}
        onImportRow={(input) => createProduct.mutateAsync(input)}
        onImported={(count) => toast({ title: 'Import complete', description: `${count} product(s) added.`, tone: 'success' })}
      />
    </WizardStepLayout>
  )
}

export function RawMaterialsStep() {
  const { next, back } = useWizard()
  const { toast } = useToast()
  const [importOpen, setImportOpen] = useState(false)
  const createRawMaterial = useCreateRawMaterial()
  const createVendor = useCreateVendor()
  const vendorCache = useRef<Map<string, string>>(new Map())
  const newVendorCount = useRef(0)
  const { data } = useRawMaterials({ pageSize: 10000 })
  const rawMaterials = data?.items ?? []
  const { data: vendorsData } = useVendors({ pageSize: 10000 })
  const vendors = vendorsData?.items ?? []
  const categories = Array.from(new Set(rawMaterials.map((rm) => rm.category)))

  const resolveOrCreateVendorId = async (vendorName: string): Promise<string> => {
    const key = vendorName.toLowerCase()
    const cached = vendorCache.current.get(key)
    if (cached) return cached
    const existing = vendors.find((v) => v.name.toLowerCase() === key)
    if (existing) {
      vendorCache.current.set(key, existing.id)
      return existing.id
    }
    const created = await createVendor.mutateAsync({
      name: vendorName,
      category: 'General',
      contactName: '',
      email: '',
      phone: '',
      city: '',
      country: '',
      rating: 0,
      onTimeDeliveryPct: 0,
      qualityScorePct: 0,
      leadTimeDays: 0,
      activeContracts: 0,
      materialsSupplied: [],
      status: 'active',
    })
    vendorCache.current.set(key, created.id)
    newVendorCount.current += 1
    return created.id
  }

  return (
    <WizardStepLayout
      title="Raw Materials"
      description={rawMaterials.length > 0 ? 'Materials used across your Bills of Materials.' : 'Add the raw materials your products are made from.'}
      onNext={next}
      onBack={back}
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Materials" value={formatNumber(rawMaterials.length)} icon={<Boxes className="size-5" />} tone="primary" />
        <StatCard label="Categories" value={formatNumber(categories.length)} tone="info" />
        <StatCard label="Perishable" value={formatNumber(rawMaterials.filter((rm) => rm.isPerishable).length)} tone="warning" />
        <StatCard label="Vendors Linked" value={formatNumber(new Set(rawMaterials.map((rm) => rm.primaryVendorId)).size)} tone="success" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/app/raw-materials/new">
          <Button type="button" variant="outline" size="sm" leftIcon={<Plus className="size-3.5" />}>
            Add a material manually
          </Button>
        </Link>
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<Upload className="size-3.5" />}
          onClick={() => {
            vendorCache.current.clear()
            newVendorCount.current = 0
            setImportOpen(true)
          }}
        >
          Bulk import CSV
        </Button>
      </div>

      <BulkImportDialog<RawMaterialCsvInput>
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Bulk Import Raw Materials"
        description="Upload a CSV to add many materials at once. A vendor name that doesn't exist yet is created automatically — fill in its contact details afterward from the Vendors page."
        templateFilename={RAW_MATERIAL_CSV_TEMPLATE.filename}
        templateHeaders={RAW_MATERIAL_CSV_TEMPLATE.headers}
        templateExampleRow={RAW_MATERIAL_CSV_TEMPLATE.exampleRow(vendors)}
        mapRow={mapRawMaterialCsvRow}
        onImportRow={async ({ vendorName, ...input }) => {
          const primaryVendorId = await resolveOrCreateVendorId(vendorName)
          return createRawMaterial.mutateAsync({ ...input, primaryVendorId })
        }}
        onImported={(count) => {
          const vendorNote = newVendorCount.current > 0 ? ` (${newVendorCount.current} new vendor${newVendorCount.current === 1 ? '' : 's'} created automatically)` : ''
          toast({ title: 'Import complete', description: `${count} raw material(s) added${vendorNote}.`, tone: 'success' })
        }}
      />
    </WizardStepLayout>
  )
}

export function BOMStep() {
  const { next, back } = useWizard()
  const { data: bomsData } = useBOMs({ pageSize: 10000 })
  const { data: productsData } = useProducts({ pageSize: 10000 })
  const billsOfMaterials = bomsData?.items ?? []
  const products = productsData?.items ?? []

  return (
    <WizardStepLayout
      title="Bill of Materials"
      description="BOMs link products to the raw materials required to produce them."
      onNext={next}
      onBack={back}
    >
      {billsOfMaterials.length === 0 ? (
        <EmptyState
          icon={<ListTree className="size-5" />}
          title="No BOMs yet"
          description="You can create them later from the BOM module."
          action={
            <Link to="/app/bom/new">
              <Button type="button" variant="outline" size="sm" leftIcon={<Plus className="size-3.5" />}>
                Create a BOM
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="BOMs Defined" value={formatNumber(billsOfMaterials.length)} icon={<ListTree className="size-5" />} tone="primary" />
          <StatCard label="Products Covered" value={formatNumber(billsOfMaterials.length)} tone="info" />
          <StatCard label="Products Without BOM" value={formatNumber(Math.max(products.length - billsOfMaterials.length, 0))} tone="warning" />
        </div>
      )}
    </WizardStepLayout>
  )
}

export function InventoryStep() {
  const { next, back } = useWizard()
  const { toast } = useToast()
  const [importOpen, setImportOpen] = useState(false)
  const createInventoryItem = useCreateInventoryItem()
  const { data } = useInventoryItems({ pageSize: 10000 })
  const { data: productsData } = useProducts({ pageSize: 10000 })
  const { data: rawMaterialsData } = useRawMaterials({ pageSize: 10000 })
  const { data: warehousesData } = useWarehouses({ pageSize: 10000 })
  const { data: billsData } = useBills({ pageSize: 10000 })
  const { data: bomsData } = useBOMs({ pageSize: 10000 })
  const inventoryItems = data?.items ?? []
  const products = productsData?.items ?? []
  const rawMaterials = rawMaterialsData?.items ?? []
  const warehouses = warehousesData?.items ?? []
  const bills = billsData?.items ?? []
  const boms = bomsData?.items ?? []
  const lowStock = inventoryItems.filter((i) => i.quantityOnHand <= i.reorderPoint).length

  // Mirrors InventoryDashboardPage's own bulk-import handler exactly — same name/warehouse
  // resolution, same reorder-level forecasting fallback when a CSV row leaves them blank.
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
    <WizardStepLayout title="Inventory" description="Current stock levels across all tracked items." onNext={next} onBack={back}>
      {inventoryItems.length === 0 ? (
        <EmptyState
          icon={<Warehouse className="size-5" />}
          title="No inventory yet"
          description="Inventory tracking starts once your products and raw materials are added."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link to="/app/inventory/add-stock">
                <Button type="button" variant="outline" size="sm" leftIcon={<Plus className="size-3.5" />}>
                  Add stock
                </Button>
              </Link>
              <Button type="button" variant="outline" size="sm" leftIcon={<Upload className="size-3.5" />} onClick={() => setImportOpen(true)}>
                Bulk import CSV
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard label="Tracked SKUs" value={formatNumber(inventoryItems.length)} icon={<Warehouse className="size-5" />} tone="primary" />
            <StatCard label="Below Reorder Point" value={formatNumber(lowStock)} tone="warning" />
            <StatCard label="Healthy" value={formatNumber(inventoryItems.length - lowStock)} tone="success" />
          </div>
          <Button type="button" variant="outline" size="sm" className="mt-4" leftIcon={<Upload className="size-3.5" />} onClick={() => setImportOpen(true)}>
            Bulk import CSV
          </Button>
        </>
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        Nexora will start generating reorder recommendations automatically based on these levels.
      </p>

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
    </WizardStepLayout>
  )
}
