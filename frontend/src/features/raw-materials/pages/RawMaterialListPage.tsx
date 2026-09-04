import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Boxes, Droplets, PackagePlus, PackageSearch, Snowflake, Upload } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { SearchInput } from '@/shared/ui/SearchInput'
import { FilterBar, FilterChip } from '@/shared/ui/FilterBar'
import { DataTable, type DataTableColumn } from '@/shared/ui/DataTable'
import { Pagination } from '@/shared/ui/Pagination'
import { StatCard } from '@/shared/ui/StatCard'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { BulkImportDialog } from '@/shared/ui/BulkImportDialog'
import { useToast } from '@/shared/ui/Toast'
import { RoleGuard } from '@/app/router/RoleGuard'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { usePagination } from '@/shared/hooks/usePagination'
import { formatCurrency, formatNumber } from '@/shared/lib/formatters'
import { useInventoryItems } from '@/features/inventory/hooks/useInventory'
import { useVendors, useCreateVendor } from '@/features/vendors/hooks/useVendors'
import type { RawMaterial } from '@/types/entities/rawMaterial'
import { useCreateRawMaterial, useRawMaterials } from '../hooks/useRawMaterials'
import { mapRawMaterialCsvRow, RAW_MATERIAL_CSV_TEMPLATE, type RawMaterialCsvInput } from '../lib/csvMapper'

export function RawMaterialListPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string | undefined>(undefined)
  const [importOpen, setImportOpen] = useState(false)
  const [sortBy, setSortBy] = useState<string | undefined>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const { page, pageSize, setPage } = usePagination(1, 10)
  const debouncedSearch = useDebounce(search)
  const createRawMaterial = useCreateRawMaterial()
  const createVendor = useCreateVendor()
  // Per-import-batch cache so 10 rows all naming "Local" create exactly one new vendor, not ten.
  const vendorCache = useRef<Map<string, string>>(new Map())
  const newVendorCount = useRef(0)

  const { data, isLoading } = useRawMaterials({ page, pageSize, search: debouncedSearch, category, sortBy, sortDir })

  const handleSort = (key: string) => {
    if (sortBy === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else {
      setSortBy(key)
      setSortDir('asc')
    }
  }
  // Stat cards summarize every material, not just the current page — a separate, unfiltered
  // fetch, since the paginated `data` above only has this page's 10 rows.
  const { data: allData } = useRawMaterials({ pageSize: 10000 })
  const allMaterials = allData?.items ?? []
  const { data: inventoryData } = useInventoryItems({ pageSize: 10000 })
  const { data: vendorsData } = useVendors({ pageSize: 10000 })
  const vendors = vendorsData?.items ?? []

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
      status: 'active',
    })
    vendorCache.current.set(key, created.id)
    newVendorCount.current += 1
    return created.id
  }
  const getInventoryByItemId = (id: string) => inventoryData?.items.find((i) => i.itemId === id)
  const getVendorById = (id: string) => vendors.find((v) => v.id === id)

  const CATEGORIES = Array.from(new Set(allMaterials.map((rm) => rm.category)))
  const UNITS = Array.from(new Set(allMaterials.map((rm) => rm.unit)))

  const perishableCount = allMaterials.filter((rm) => rm.isPerishable).length
  const totalValue = allMaterials.reduce((sum, rm) => {
    const inv = getInventoryByItemId(rm.id)
    return sum + (inv ? inv.quantityOnHand * rm.unitCost : 0)
  }, 0)

  const columns: DataTableColumn<RawMaterial>[] = [
    {
      key: 'name',
      header: 'Material',
      sortable: true,
      render: (rm) => (
        <div>
          <p className="font-medium text-foreground">{rm.name}</p>
          <p className="text-xs text-muted-foreground">{rm.code}</p>
        </div>
      ),
    },
    { key: 'category', header: 'Category', sortable: true, render: (rm) => <Badge tone="neutral">{rm.category}</Badge> },
    { key: 'unit', header: 'Unit', render: (rm) => rm.unit },
    { key: 'unitCost', header: 'Unit Cost', sortable: true, render: (rm) => formatCurrency(rm.unitCost, true) },
    { key: 'leadTimeDays', header: 'Lead Time', sortable: true, render: (rm) => `${rm.leadTimeDays} days` },
    { key: 'vendor', header: 'Primary Vendor', render: (rm) => getVendorById(rm.primaryVendorId)?.name ?? '—' },
    {
      key: 'stock',
      header: 'On Hand',
      render: (rm) => {
        const inv = getInventoryByItemId(rm.id)
        if (!inv) return '—'
        const isLow = inv.quantityOnHand <= inv.reorderPoint
        return (
          <span className={isLow ? 'font-medium text-warning' : 'text-foreground'}>
            {formatNumber(inv.quantityOnHand)} {inv.unit}
          </span>
        )
      },
    },
    {
      key: 'perishable',
      header: 'Perishable',
      render: (rm) =>
        rm.isPerishable ? (
          <Badge tone="info">
            <Snowflake className="size-3" /> Yes
          </Badge>
        ) : (
          <span className="text-muted-foreground">No</span>
        ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Raw Materials"
        description="Track material catalog, units, categories, and cost across your supply chain."
        actions={
          <RoleGuard resource="raw-materials" action="create">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                leftIcon={<Upload className="size-4" />}
                onClick={() => {
                  vendorCache.current.clear()
                  newVendorCount.current = 0
                  setImportOpen(true)
                }}
              >
                Import CSV
              </Button>
              <Button leftIcon={<PackagePlus className="size-4" />} onClick={() => navigate('/app/raw-materials/new')}>
                Add Material
              </Button>
            </div>
          </RoleGuard>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Materials" value={formatNumber(allMaterials.length)} icon={<Boxes className="size-5" />} tone="primary" />
        <StatCard label="Categories" value={formatNumber(CATEGORIES.length)} icon={<PackageSearch className="size-5" />} tone="info" />
        <StatCard label="Perishable Items" value={formatNumber(perishableCount)} icon={<Snowflake className="size-5" />} tone="warning" />
        <StatCard label="Inventory Value" value={formatCurrency(totalValue)} icon={<Droplets className="size-5" />} tone="success" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search materials by name or code…" className="sm:max-w-sm" />
        <FilterBar>
          <FilterChip active={!category} onClick={() => setCategory(undefined)}>
            All categories
          </FilterChip>
          {CATEGORIES.map((cat) => (
            <FilterChip key={cat} active={category === cat} onClick={() => setCategory(cat)}>
              {cat}
            </FilterChip>
          ))}
        </FilterBar>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">Units in use: {UNITS.join(', ')}</p>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        rowKey={(rm) => rm.id}
        onRowClick={(rm) => navigate(`/app/raw-materials/${rm.id}`)}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={handleSort}
        emptyTitle="No materials found"
        emptyDescription="Try a different search term or category filter."
      />

      {data && data.total > 0 && (
        <div className="mt-4">
          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} total={data.total} pageSize={data.pageSize} />
        </div>
      )}

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
    </div>
  )
}
